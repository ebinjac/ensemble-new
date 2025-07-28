// lib/email-queue-processor.ts
import { db } from '@/db';
import { emailSendHistory, emailConfigurations } from '@/db/schema/bluemailer';
import { eq, and, lte } from 'drizzle-orm';
import nodemailer from 'nodemailer';

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
        // Update status to sending with detailed logging
        console.log(`🔄 [QUEUE] Updating email ${email.id} status to 'sending'`);
        await db
          .update(emailSendHistory)
          .set({ 
            status: 'sending',
            lastAttemptAt: new Date(),
            sendAttempts: email.sendAttempts + 1
          })
          .where(eq(emailSendHistory.id, email.id));

        // Get email configuration with validation
        console.log(`🔄 [QUEUE] Fetching email config ID: ${email.emailConfigId}`);
        const [emailConfig] = await db
          .select()
          .from(emailConfigurations)
          .where(eq(emailConfigurations.id, email.emailConfigId!));

        if (!emailConfig) {
          throw new Error(`Email configuration not found for ID: ${email.emailConfigId}`);
        }

        console.log(`✅ [QUEUE] Email config found: ${emailConfig.configName} (${emailConfig.smtpHost}:${emailConfig.smtpPort})`);

        // Create transporter with detailed config logging
        console.log(`🔄 [QUEUE] Creating SMTP transporter...`);
        const transporter = createSMTPTransporter(emailConfig);

        // Test SMTP connection
        console.log(`🔄 [QUEUE] Testing SMTP connection...`);
        await transporter.verify();
        console.log(`✅ [QUEUE] SMTP connection verified`);

        // Prepare mail options with logging
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
        };

        console.log(`🔄 [QUEUE] Sending email to: ${mailOptions.to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [QUEUE] Email sent successfully. Message ID: ${info.messageId}`);

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

        console.log(`✅ [QUEUE] Email ${email.id} marked as sent`);

      } catch (emailError) {
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
        console.error(`❌ [QUEUE] Failed to send email ${email.id}:`, {
          error: errorMessage,
          stack: emailError instanceof Error ? emailError.stack : undefined,
          emailId: email.id,
          subject: email.subject,
          configId: email.emailConfigId
        });
        
        // Update as failed with detailed error
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
    console.error('❌ [QUEUE] Queue processing error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}

// Enhanced SMTP transporter with detailed logging
function createSMTPTransporter(emailConfig: any) {
  console.log('🔄 [SMTP] Creating transporter with config:', {
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort,
    secure: emailConfig.smtpSecure,
    auth: emailConfig.smtpAuth,
    username: emailConfig.smtpUsername ? '[PRESENT]' : '[NOT SET]'
  });

  const transporterOptions = {
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort,
    secure: emailConfig.smtpSecure,
    requireTLS: false,
    ignoreTLS: true,
  };

  if (emailConfig.smtpAuth && emailConfig.smtpUsername) {
    (transporterOptions as any).auth = {
      user: emailConfig.smtpUsername,
      pass: emailConfig.smtpPassword,
    };
  }

  // Special handling for your free SMTP server
  if (emailConfig.smtpHost === 'smtp.freesmtpservers.com') {
    transporterOptions.requireTLS = false;
    transporterOptions.ignoreTLS = true;
    console.log('🔄 [SMTP] Applied free SMTP server settings');
  }

  return nodemailer.createTransport(transporterOptions);
}
