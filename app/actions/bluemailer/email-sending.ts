'use server';

import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';
import { db } from '@/db';
import { 
  emailConfigurations, 
  emailSendHistory, 
  emailRecipients,
  emailAttachments,
  templateEmailSettings,
  emailTemplates,
  emailTemplateComponents
} from '@/db/schema/bluemailer';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { eq, and, or, sql, lte } from 'drizzle-orm';
import { saveUploadedFile } from '@/lib/file-upload';

export interface EmailSendData {
  templateId: string;
  subject: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  toEmails: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  personalizationData?: Record<string, any>;
  trackOpens?: boolean;
  trackClicks?: boolean;
  attachments?: File[];
}

export async function sendEmailWithAttachments(
  teamId: string,
  emailData: EmailSendData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  let emailHistoryId: string | null = null;
  let savedAttachments: any[] = [];

  try {
    const { user } = await requireTeamAccess(teamId);

    console.log('📧 Starting email send process:', {
      teamId,
      templateId: emailData.templateId,
      toCount: emailData.toEmails.length,
      attachmentCount: emailData.attachments?.length || 0
    });

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailData.toEmails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return { success: false, error: `Invalid email addresses: ${invalidEmails.join(', ')}` };
    }

    // Handle file attachments
    if (emailData.attachments && emailData.attachments.length > 0) {
      console.log('📎 Processing attachments...');
      for (const file of emailData.attachments) {
        const uploadedFile = await saveUploadedFile(file);
        savedAttachments.push(uploadedFile);
      }
      console.log(`📎 Saved ${savedAttachments.length} attachments`);
    }

    // Get template with components
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, emailData.templateId),
        eq(emailTemplates.teamId, teamId)
      ));

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Get email configuration for the team
    const [emailConfig] = await db
      .select()
      .from(emailConfigurations)
      .where(and(
        eq(emailConfigurations.teamId, teamId),
        eq(emailConfigurations.isActive, true),
        eq(emailConfigurations.isDefault, true)
      ));

    if (!emailConfig) {
      return { success: false, error: 'No email configuration found for this team. Please set up SMTP settings first.' };
    }

    console.log('📧 Using email config:', {
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      auth: emailConfig.smtpAuth
    });

    // Generate HTML content from template
    const htmlContent = await generateEmailHTML(emailData.templateId, emailData.personalizationData);
    const textContent = generateTextFromHTML(htmlContent);

    // Create email history record
    const [emailHistory] = await db.insert(emailSendHistory).values({
      templateId: emailData.templateId,
      emailConfigId: emailConfig.id,
      teamId: teamId,
      subject: emailData.subject,
      fromName: emailData.fromName || emailConfig.defaultFromName || 'Bluemailer',
      fromEmail: emailData.fromEmail || emailConfig.defaultFromEmail,
      replyTo: emailData.replyTo || emailConfig.defaultReplyTo,
      toEmails: emailData.toEmails,
      ccEmails: emailData.ccEmails || [],
      bccEmails: emailData.bccEmails || [],
      htmlContent: htmlContent,
      textContent: textContent,
      status: emailData.scheduledAt ? 'queued' : 'sending',
      priority: emailData.priority || 'normal',
      trackOpens: emailData.trackOpens || false,
      trackClicks: emailData.trackClicks || false,
      scheduledAt: emailData.scheduledAt,
      sentBy: user.user.email,
      sendAttempts: 0,
    }).returning();

    emailHistoryId = emailHistory.id;

    // Save attachment records to database
    if (savedAttachments.length > 0) {
      const attachmentRecords = savedAttachments.map(file => ({
        emailHistoryId: emailHistory.id,
        fileName: file.fileName,
        originalFileName: file.originalFileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        filePath: file.filePath,
        uploadedBy: user.user.email,
      }));

      await db.insert(emailAttachments).values(attachmentRecords);
      console.log('📎 Attachment records saved to database');
    }

    // If scheduled for later, don't send immediately
    if (emailData.scheduledAt && emailData.scheduledAt > new Date()) {
      console.log('📧 Email scheduled for:', emailData.scheduledAt);
      return { success: true, emailId: emailHistory.id };
    }

    // Update status to sending
    await db
      .update(emailSendHistory)
      .set({
        status: 'sending',
        sendAttempts: 1,
        lastAttemptAt: new Date(),
      })
      .where(eq(emailSendHistory.id, emailHistory.id));

    // Create SMTP transporter
    const transporter = createSMTPTransporter(emailConfig);

    // Test the connection first
    try {
      await transporter.verify();
      console.log('📧 SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('📧 SMTP verification failed:', verifyError);
      throw new Error(`SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`);
    }

    // Prepare email options
    const fromAddress = emailData.fromName 
      ? `"${emailData.fromName}" <${emailData.fromEmail || emailConfig.defaultFromEmail}>`
      : emailData.fromEmail || emailConfig.defaultFromEmail;

    // Prepare attachments for nodemailer
    const mailAttachments = savedAttachments.map(file => ({
      filename: file.originalFileName,
      content: file.buffer,
      contentType: file.mimeType,
    }));

    const mailOptions = {
      from: fromAddress,
      to: emailData.toEmails.join(', '),
      cc: emailData.ccEmails?.length ? emailData.ccEmails.join(', ') : undefined,
      bcc: emailData.bccEmails?.length ? emailData.bccEmails.join(', ') : undefined,
      replyTo: emailData.replyTo || emailConfig.defaultReplyTo,
      subject: emailData.subject,
      html: htmlContent,
      text: textContent,
      priority: emailData.priority === 'urgent' || emailData.priority === 'high' ? 'high' : 'normal',
      attachments: mailAttachments,
    };

    console.log('📧 Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      bcc: mailOptions.bcc,
      subject: mailOptions.subject,
      attachmentCount: mailAttachments.length
    });

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('📧 Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });

    // Update email history with send results
    await db
      .update(emailSendHistory)
      .set({
        status: 'sent',
        messageId: info.messageId,
        smtpResponse: info.response,
        sentAt: new Date(),
        lastAttemptAt: new Date(),
      })
      .where(eq(emailSendHistory.id, emailHistory.id));

    // Create recipient records
    const recipientRecords = [
      ...emailData.toEmails.map(email => ({
        emailHistoryId: emailHistory.id,
        emailAddress: email.trim(),
        recipientType: 'to' as const,
        status: 'sent' as const,
        personalizationData: emailData.personalizationData || {},
      })),
      ...(emailData.ccEmails || []).map(email => ({
        emailHistoryId: emailHistory.id,
        emailAddress: email.trim(),
        recipientType: 'cc' as const,
        status: 'sent' as const,
        personalizationData: emailData.personalizationData || {},
      })),
      ...(emailData.bccEmails || []).map(email => ({
        emailHistoryId: emailHistory.id,
        emailAddress: email.trim(),
        recipientType: 'bcc' as const,
        status: 'sent' as const,
        personalizationData: emailData.personalizationData || {},
      })),
    ];

    if (recipientRecords.length > 0) {
      await db.insert(emailRecipients).values(recipientRecords);
    }

    // Update template usage
    await db
      .update(emailTemplates)
      .set({
        usageCount: sql`${emailTemplates.usageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(emailTemplates.id, emailData.templateId));

    revalidatePath(`/tools/teams/${teamId}/bluemailer`);
    revalidatePath(`/tools/teams/${teamId}/bluemailer/emails`);

    return { success: true, emailId: emailHistory.id };

  } catch (error) {
    console.error('📧 Email send error:', error);
    
    // Update email history with error if we have the ID
    if (emailHistoryId) {
      try {
        await db
          .update(emailSendHistory)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            lastAttemptAt: new Date(),
          })
          .where(eq(emailSendHistory.id, emailHistoryId));
      } catch (updateError) {
        console.error('📧 Failed to update error status:', updateError);
      }
    }

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

// Keep existing sendEmail function for backward compatibility
export async function sendEmail(teamId: string, emailData: EmailSendData) {
  return sendEmailWithAttachments(teamId, emailData);
}

function createSMTPTransporter(emailConfig: any) {
  const transporterOptions = {
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort,
    secure: emailConfig.smtpSecure, // true for 465, false for other ports
    requireTLS: false, // Don't require TLS for port 25
    ignoreTLS: true,   // Ignore TLS for basic SMTP
  };

  // Add authentication if required
  if (emailConfig.smtpAuth && emailConfig.smtpUsername) {
    (transporterOptions as any).auth = {
      user: emailConfig.smtpUsername,
      pass: emailConfig.smtpPassword,
    };
  }

  // For your free SMTP server (no auth), this should work
  if (emailConfig.smtpHost === 'smtp.freesmtpservers.com') {
    transporterOptions.requireTLS = false;
    transporterOptions.ignoreTLS = true;
  }

  console.log('📧 Creating transporter with options:', {
    ...transporterOptions,
    auth: (transporterOptions as any).auth ? { user: (transporterOptions as any).auth.user, pass: '[HIDDEN]' } : undefined
  });

  return nodemailer.createTransport(transporterOptions);
}

async function generateEmailHTML(templateId: string, personalizationData?: Record<string, any>): Promise<string> {
  try {
    // Get template with components
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId));

    if (!template) {
      throw new Error('Template not found');
    }

    // Get template components
    const components = await db
      .select()
      .from(emailTemplateComponents)
      .where(eq(emailTemplateComponents.templateId, templateId))
      .orderBy(emailTemplateComponents.sortOrder);

    console.log('📧 Generating HTML from template:', {
      templateName: template.name,
      componentsCount: components.length
    });

    // Generate HTML from components
    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.name}</title>
        <style>
          body {
            font-family: ${template.canvasSettings?.fontFamily || 'Arial, sans-serif'};
            font-size: ${template.canvasSettings?.fontSize || '16px'};
            line-height: ${template.canvasSettings?.lineHeight || '1.5'};
            color: ${template.canvasSettings?.color || '#333333'};
            background-color: ${template.canvasSettings?.backgroundColor || '#f4f4f4'};
            margin: 0;
            padding: ${template.canvasSettings?.padding || '20px'};
          }
          .email-container {
            max-width: ${template.canvasSettings?.maxWidth || '600px'};
            width: ${template.canvasSettings?.contentWidth || '600px'};
            background-color: ${template.canvasSettings?.contentBackgroundColor || '#ffffff'};
            margin: 0 auto;
            padding: ${template.canvasSettings?.padding || '20px'};
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          img {
            max-width: 100%;
            height: auto;
          }
          a {
            color: #007bff;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
    `;

    // Render each component
    if (components.length > 0) {
      for (const component of components) {
        html += renderComponent(component.componentData, personalizationData);
      }
    } else {
      // Fallback if no components
      html += `
        <h1>Email from ${template.name}</h1>
        <p>This email was sent using Bluemailer.</p>
      `;
    }

    html += `
        </div>
      </body>
      </html>
    `;

    return html;

  } catch (error) {
    console.error('Error generating email HTML:', error);
    // Return a fallback HTML
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Email</title>
      </head>
      <body>
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1>Email Content</h1>
          <p>This email was generated from a template.</p>
        </div>
      </body>
      </html>
    `;
  }
}

function renderComponent(componentData: any, personalizationData?: Record<string, any>): string {
  if (!componentData || typeof componentData !== 'object') {
    return '';
  }

  const { type, ...data } = componentData;

  // Apply personalization if available
  let content = data.content || data.text || data.children || '';
  if (personalizationData && typeof content === 'string') {
    Object.entries(personalizationData).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });
  }

  const styles = data.styles || data.style || {};
  const inlineStyles = generateInlineStyles(styles);

  switch (type) {
    case 'heading':
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      const level = data.level || (type === 'heading' ? 1 : parseInt(type.charAt(1)) || 1);
      return `<h${level} style="${inlineStyles}">${content}</h${level}>`;
    
    case 'text':
    case 'paragraph':
    case 'p':
      return `<p style="${inlineStyles}">${content}</p>`;
    
    case 'image':
    case 'img':
      const src = data.src || data.url || '';
      const alt = data.alt || data.title || '';
      const width = data.width ? `width="${data.width}"` : '';
      const imgHeight = data.height ? `height="${data.height}"` : '';
      return `<img src="${src}" alt="${alt}" ${width} ${imgHeight} style="${inlineStyles}" />`;
    
    case 'button':
    case 'link':
      const href = data.href || data.url || '#';
      const buttonStyles = `display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; ${inlineStyles}`;
      return `<a href="${href}" style="${buttonStyles}">${content}</a>`;
    
    case 'divider':
    case 'hr':
      return `<hr style="border: none; height: 1px; background-color: #ddd; margin: 20px 0; ${inlineStyles}" />`;
    
    case 'spacer':
      const height = data.height || '20px';
      return `<div style="height: ${height};"></div>`;
    
    case 'list':
    case 'ul':
    case 'ol':
      const items = data.items || data.children || [];
      const listItems = Array.isArray(items) 
        ? items.map((item: any) => `<li>${typeof item === 'string' ? item : item.text || item.content || ''}</li>`).join('')
        : '';
      const listTag = data.listType === 'ordered' || type === 'ol' ? 'ol' : 'ul';
      return `<${listTag} style="${inlineStyles}">${listItems}</${listTag}>`;
    
    case 'container':
    case 'div':
      return `<div style="${inlineStyles}">${content}</div>`;
    
    default:
      // Generic fallback
      return `<div style="${inlineStyles}">${content}</div>`;
  }
}

function generateInlineStyles(styles?: Record<string, any>): string {
  if (!styles || typeof styles !== 'object') return '';
  
  return Object.entries(styles)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value}`;
    })
    .join('; ');
}

function generateTextFromHTML(html: string): string {
  // Basic HTML to text conversion
  return html
    .replace(/<style[^>]*>.*?<\/style>/g, '')
    .replace(/<script[^>]*>.*?<\/script>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

// Create default email configuration for team
export async function createDefaultEmailConfig(
  teamId: string,
  configData: {
    configName: string;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpAuth: boolean;
    smtpUsername?: string;
    smtpPassword?: string;
    defaultFromName: string;
    defaultFromEmail: string;
    defaultReplyTo?: string;
  }
): Promise<{ success: boolean; configId?: string; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId);

    // Set existing configs as non-default
    await db
      .update(emailConfigurations)
      .set({ isDefault: false })
      .where(eq(emailConfigurations.teamId, teamId));

    // Create email configuration
    const [emailConfig] = await db.insert(emailConfigurations).values({
      teamId: teamId,
      configName: configData.configName,
      smtpHost: configData.smtpHost,
      smtpPort: configData.smtpPort,
      smtpSecure: configData.smtpSecure,
      smtpAuth: configData.smtpAuth,
      smtpUsername: configData.smtpUsername,
      smtpPassword: configData.smtpPassword, // In production, encrypt this
      defaultFromName: configData.defaultFromName,
      defaultFromEmail: configData.defaultFromEmail,
      defaultReplyTo: configData.defaultReplyTo,
      isActive: true,
      isDefault: true, // Make this the default config
      createdBy: user.user.email,
      updatedBy: user.user.email,
    }).returning();

    console.log('📧 Email configuration created:', {
      id: emailConfig.id,
      name: emailConfig.configName,
      host: emailConfig.smtpHost
    });

    return { success: true, configId: emailConfig.id };

  } catch (error) {
    console.error('Create email config error:', error);
    return { success: false, error: 'Failed to create email configuration' };
  }
}

// Get email send history for a team
export async function getEmailSendHistory(teamId: string) {
  try {
    await requireTeamAccess(teamId);

    const history = await db
      .select({
        id: emailSendHistory.id,
        subject: emailSendHistory.subject,
        fromEmail: emailSendHistory.fromEmail,
        toEmails: emailSendHistory.toEmails,
        status: emailSendHistory.status,
        sentAt: emailSendHistory.sentAt,
        scheduledAt: emailSendHistory.scheduledAt,
        createdAt: emailSendHistory.createdAt,
        templateName: emailTemplates.name,
        openCount: emailSendHistory.openCount,
        clickCount: emailSendHistory.clickCount,
        errorMessage: emailSendHistory.errorMessage,
        attachmentCount: sql<number>`(
          SELECT COUNT(*) FROM ${emailAttachments} 
          WHERE ${emailAttachments.emailHistoryId} = ${emailSendHistory.id}
        )`.as('attachmentCount'),
      })
      .from(emailSendHistory)
      .leftJoin(emailTemplates, eq(emailSendHistory.templateId, emailTemplates.id))
      .where(eq(emailSendHistory.teamId, teamId))
      .orderBy(sql`${emailSendHistory.createdAt} DESC`);

    return history;

  } catch (error) {
    console.error('Get email history error:', error);
    throw new Error('Failed to fetch email history');
  }
}

// Test email configuration
export async function testEmailConfig(
  teamId: string,
  testEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId);

    const [emailConfig] = await db
      .select()
      .from(emailConfigurations)
      .where(and(
        eq(emailConfigurations.teamId, teamId),
        eq(emailConfigurations.isActive, true),
        eq(emailConfigurations.isDefault, true)
      ));

    if (!emailConfig) {
      return { success: false, error: 'No email configuration found' };
    }

    const transporter = createSMTPTransporter(emailConfig);

    // Test connection
    await transporter.verify();

    // Send test email
    const testMailOptions = {
      from: emailConfig.defaultFromEmail,
      to: testEmail,
      subject: 'Bluemailer SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>SMTP Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>Host: ${emailConfig.smtpHost}</li>
            <li>Port: ${emailConfig.smtpPort}</li>
            <li>Secure: ${emailConfig.smtpSecure ? 'Yes' : 'No'}</li>
            <li>Auth: ${emailConfig.smtpAuth ? 'Yes' : 'No'}</li>
          </ul>
          <p>If you received this email, your configuration is working properly!</p>
        </div>
      `,
      text: 'This is a test email to verify your SMTP configuration is working correctly.'
    };

    await transporter.sendMail(testMailOptions);

    return { success: true };

  } catch (error) {
    console.error('Test email config error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to test email configuration'
    };
  }
}

// Process email queue for background worker
export async function processEmailQueue() {
  const startTime = new Date();
  console.log('🔄 [QUEUE] Starting email queue processing at:', startTime.toISOString());
  
  try {
    // Test database connection first
    console.log('🔄 [QUEUE] Testing database connection...');
    const testQuery = await db.select().from(emailSendHistory).limit(1);
    console.log('✅ [QUEUE] Database connection successful');

    // Get all queued emails that should be sent now
    const queuedEmails = await db
      .select()
      .from(emailSendHistory)
      .where(and(
        eq(emailSendHistory.status, 'queued'),
        lte(emailSendHistory.scheduledAt, new Date())
      ));

    console.log(`📧 [QUEUE] Found ${queuedEmails.length} emails to process`);

    if (queuedEmails.length === 0) {
      console.log('✅ [QUEUE] No emails to process');
      return;
    }

    for (const email of queuedEmails) {
      console.log(`🔄 [QUEUE] Processing email ID: ${email.id}, Subject: "${email.subject}"`);
      
      try {
        // Update status to sending
        await db
          .update(emailSendHistory)
          .set({ 
            status: 'sending',
            lastAttemptAt: new Date(),
            sendAttempts: email.sendAttempts + 1
          })
          .where(eq(emailSendHistory.id, email.id));

        // Get email configuration
        const [emailConfig] = await db
          .select()
          .from(emailConfigurations)
          .where(eq(emailConfigurations.id, email.emailConfigId!));

        if (!emailConfig) {
          throw new Error(`Email configuration not found for ID: ${email.emailConfigId}`);
        }

        // Get attachments
        const attachments = await db
          .select()
          .from(emailAttachments)
          .where(eq(emailAttachments.emailHistoryId, email.id));

        // Create transporter
        const transporter = createSMTPTransporter(emailConfig);
        await transporter.verify();

        // Prepare mail options
        const mailOptions = {
          from: email.fromName 
            ? `"${email.fromName}" <${email.fromEmail}>`
            : email.fromEmail,
          to: email.toEmails.join(', '),
          cc: email.ccEmails?.length ? email.ccEmails.join(', ') : undefined,
          bcc: email.bccEmails?.length ? email.bccEmails.join(', ') : undefined,
          subject: email.subject,
          html: email.htmlContent,
          text: email.textContent,
          attachments: attachments.map(att => ({
            filename: att.originalFileName,
            path: att.filePath,
          })),
        };

        const info = await transporter.sendMail(mailOptions);

        // Update as sent
        await db
          .update(emailSendHistory)
          .set({
            status: 'sent',
            messageId: info.messageId,
            smtpResponse: info.response,
            sentAt: new Date(),
          })
          .where(eq(emailSendHistory.id, email.id));

        console.log(`✅ [QUEUE] Email ${email.id} sent successfully`);

      } catch (emailError) {
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
        console.error(`❌ [QUEUE] Failed to send email ${email.id}:`, errorMessage);
        
        // Update as failed
        await db
          .update(emailSendHistory)
          .set({
            status: 'failed',
            errorMessage: errorMessage,
            lastAttemptAt: new Date(),
          })
          .where(eq(emailSendHistory.id, email.id));
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    console.log(`✅ [QUEUE] Queue processing completed in ${duration}ms`);

  } catch (error) {
    console.error('❌ [QUEUE] Queue processing error:', error);
  }
}
