'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { emailConfigurations } from '@/db/schema/bluemailer';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { eq, and } from 'drizzle-orm';

export interface EmailConfigurationData {
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
  isDefault?: boolean;
}

export async function getTeamEmailConfigurations(teamId: string) {
  try {
    await requireTeamAccess(teamId);

    const configurations = await db
      .select({
        id: emailConfigurations.id,
        configName: emailConfigurations.configName,
        smtpHost: emailConfigurations.smtpHost,
        smtpPort: emailConfigurations.smtpPort,
        smtpSecure: emailConfigurations.smtpSecure,
        smtpAuth: emailConfigurations.smtpAuth,
        smtpUsername: emailConfigurations.smtpUsername,
        defaultFromName: emailConfigurations.defaultFromName,
        defaultFromEmail: emailConfigurations.defaultFromEmail,
        defaultReplyTo: emailConfigurations.defaultReplyTo,
        isActive: emailConfigurations.isActive,
        isDefault: emailConfigurations.isDefault,
        createdAt: emailConfigurations.createdAt,
        createdBy: emailConfigurations.createdBy,
      })
      .from(emailConfigurations)
      .where(eq(emailConfigurations.teamId, teamId))
      .orderBy(emailConfigurations.isDefault, emailConfigurations.createdAt);

    return configurations;

  } catch (error) {
    console.error('Get email configurations error:', error);
    throw new Error('Failed to fetch email configurations');
  }
}

export async function createEmailConfiguration(
  teamId: string,
  data: EmailConfigurationData
): Promise<{ success: boolean; configId?: string; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId);

    // If this is being set as default, update existing defaults
    if (data.isDefault) {
      await db
        .update(emailConfigurations)
        .set({ isDefault: false })
        .where(eq(emailConfigurations.teamId, teamId));
    }

    const [emailConfig] = await db.insert(emailConfigurations).values({
      teamId: teamId,
      configName: data.configName,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpSecure: data.smtpSecure,
      smtpAuth: data.smtpAuth,
      smtpUsername: data.smtpUsername,
      smtpPassword: data.smtpPassword, // In production, encrypt this
      defaultFromName: data.defaultFromName,
      defaultFromEmail: data.defaultFromEmail,
      defaultReplyTo: data.defaultReplyTo,
      isActive: true,
      isDefault: data.isDefault || false,
      createdBy: user.user.email,
      updatedBy: user.user.email,
    }).returning();

    revalidatePath(`/tools/teams/${teamId}/bluemailer/emails/settings`);
    return { success: true, configId: emailConfig.id };

  } catch (error) {
    console.error('Create email configuration error:', error);
    return { success: false, error: 'Failed to create email configuration' };
  }
}

export async function updateEmailConfiguration(
  teamId: string,
  configId: string,
  data: Partial<EmailConfigurationData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId);

    // Verify configuration ownership
    const [config] = await db
      .select()
      .from(emailConfigurations)
      .where(and(
        eq(emailConfigurations.id, configId),
        eq(emailConfigurations.teamId, teamId)
      ));

    if (!config) {
      return { success: false, error: 'Configuration not found' };
    }

    // If this is being set as default, update existing defaults
    if (data.isDefault) {
      await db
        .update(emailConfigurations)
        .set({ isDefault: false })
        .where(eq(emailConfigurations.teamId, teamId));
    }

    await db
      .update(emailConfigurations)
      .set({
        ...data,
        updatedBy: user.user.email,
        updatedAt: new Date(),
      })
      .where(eq(emailConfigurations.id, configId));

    revalidatePath(`/tools/teams/${teamId}/bluemailer/emails/settings`);
    return { success: true };

  } catch (error) {
    console.error('Update email configuration error:', error);
    return { success: false, error: 'Failed to update email configuration' };
  }
}

export async function deleteEmailConfiguration(
  teamId: string,
  configId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireTeamAccess(teamId);

    // Verify configuration ownership
    const [config] = await db
      .select()
      .from(emailConfigurations)
      .where(and(
        eq(emailConfigurations.id, configId),
        eq(emailConfigurations.teamId, teamId)
      ));

    if (!config) {
      return { success: false, error: 'Configuration not found' };
    }

    // Don't allow deletion of default configuration if it's the only one
    if (config.isDefault) {
      const otherConfigs = await db
        .select()
        .from(emailConfigurations)
        .where(and(
          eq(emailConfigurations.teamId, teamId),
          eq(emailConfigurations.isActive, true)
        ));

      if (otherConfigs.length <= 1) {
        return { success: false, error: 'Cannot delete the only email configuration' };
      }

      // Set another configuration as default
      const nextConfig = otherConfigs.find(c => c.id !== configId);
      if (nextConfig) {
        await db
          .update(emailConfigurations)
          .set({ isDefault: true })
          .where(eq(emailConfigurations.id, nextConfig.id));
      }
    }

    await db
      .update(emailConfigurations)
      .set({ isActive: false })
      .where(eq(emailConfigurations.id, configId));

    revalidatePath(`/tools/teams/${teamId}/bluemailer/emails/settings`);
    return { success: true };

  } catch (error) {
    console.error('Delete email configuration error:', error);
    return { success: false, error: 'Failed to delete email configuration' };
  }
}

export async function setDefaultConfiguration(
  teamId: string,
  configId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireTeamAccess(teamId);

    // Verify configuration ownership
    const [config] = await db
      .select()
      .from(emailConfigurations)
      .where(and(
        eq(emailConfigurations.id, configId),
        eq(emailConfigurations.teamId, teamId),
        eq(emailConfigurations.isActive, true)
      ));

    if (!config) {
      return { success: false, error: 'Configuration not found' };
    }

    // Update all configurations to not be default
    await db
      .update(emailConfigurations)
      .set({ isDefault: false })
      .where(eq(emailConfigurations.teamId, teamId));

    // Set this one as default
    await db
      .update(emailConfigurations)
      .set({ isDefault: true })
      .where(eq(emailConfigurations.id, configId));

    revalidatePath(`/tools/teams/${teamId}/bluemailer/emails/settings`);
    return { success: true };

  } catch (error) {
    console.error('Set default configuration error:', error);
    return { success: false, error: 'Failed to set default configuration' };
  }
}
