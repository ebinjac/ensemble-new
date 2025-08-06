// app/teams/actions/team-actions.ts
'use server';

import { db } from '@/db';
import { teams, applications } from '@/db/schema/teams';
import { eq, and, not } from 'drizzle-orm';
import { requireAuth, requireTeamAccess } from '@/app/(auth)/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Reverted validation schema - back to using tla with 12 character limit
const addApplicationSchema = z.object({
  teamId: z.string().uuid(),
  assetId: z.number().int().positive(),
  applicationName: z.string().min(1).max(255),
  tla: z.string().min(1).max(12), // Back to tla field name, but with 12 char limit
  escalationEmail: z.string().email().max(255).optional().or(z.literal('')),
  contactEmail: z.string().email().max(255).optional().or(z.literal('')),
  teamEmail: z.string().email().max(255).optional().or(z.literal('')),
  snowGroup: z.string().max(255).optional(),
  slackChannel: z.string().max(100).optional(),
  description: z.string().optional(),
});

const updateApplicationSchema = addApplicationSchema.extend({
  id: z.string().uuid(),
});

// Types for central API response (unchanged)
interface CentralAPIResponse {
  data: {
    application: {
      name: string;
      assetId: number;
      lifeCycleStatus: string;
      risk: {
        bia: string;
      };
      ownershipInfo: {
        applicationOwner?: {
          email: string;
          fullName: string;
          band: string;
        };
        applicationManager?: {
          email: string;
          fullName: string;
          band: string;
        };
        applicationOwnerLeader1?: {
          email: string;
          fullName: string;
          band: string;
        };
        applicationOwnerLeader2?: {
          email: string;
          fullName: string;
          band: string;
        };
        ownerSVP?: {
          email: string;
          fullName: string;
          band: string;
        };
        businessOwner?: {
          email: string;
          fullName: string;
          band: string;
        };
        businessOwnerLeader1?: {
          email: string;
          fullName: string;
          band: string;
        };
        productionSupportOwner?: {
          email: string;
          fullName: string;
          band: string;
        };
        productionSupportOwnerLeader1?: {
          email: string;
          fullName: string;
          band: string;
        };
        pmo?: {
          email: string;
          fullName: string;
          band: string;
        };
        unitCIo?: {
          fullName: string;
          email?: string;
          band?: string;
        };
      };
    };
  };
}

// Get team details with applications (unchanged)
export async function getTeamDetails(teamId: string) {
  try {
    const { user } = await requireTeamAccess(teamId, { admin: false });

    // Get team info
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team.length) {
      throw new Error('Team not found');
    }

    // Get team applications
    const teamApplications = await db
      .select()
      .from(applications)
      .where(eq(applications.teamId, teamId))
      .orderBy(applications.createdAt);

    return {
      success: true,
      data: {
        team: team[0],
        applications: teamApplications,
        userRole: user.teams.find(t => t.teamId === teamId)?.role || 'user',
      },
    };
  } catch (error) {
    console.error('Failed to get team details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get team details',
    };
  }
}

// Fetch application data from central API (unchanged)
export async function fetchFromCentralAPI(assetId: number) {
  try {
    const response = await fetch(`http://localhost:8008/api/central`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Central API error: ${response.status}`);
    }

    const data: CentralAPIResponse = await response.json();
    
    return {
      success: true,
      data: data.data.application,
    };
  } catch (error) {
    console.error('Central API fetch failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch from central API',
    };
  }
}

// Reverted add application function - back to using tla
export async function addApplicationToTeam(formData: FormData) {
  try {
    const { user, role } = await requireTeamAccess(
      formData.get('teamId') as string,
      { admin: true }
    );

    if (role !== 'admin') {
      throw new Error('Admin access required to add applications');
    }

    // Parse and validate form data
    const rawData = {
      teamId: formData.get('teamId') as string,
      assetId: parseInt(formData.get('assetId') as string),
      applicationName: formData.get('applicationName') as string,
      tla: formData.get('tla') as string, // Back to tla
      escalationEmail: formData.get('escalationEmail') as string || undefined,
      contactEmail: formData.get('contactEmail') as string || undefined,
      teamEmail: formData.get('teamEmail') as string || undefined,
      snowGroup: formData.get('snowGroup') as string || undefined,
      slackChannel: formData.get('slackChannel') as string || undefined,
      description: formData.get('description') as string || undefined,
    };

    const validatedData = addApplicationSchema.parse(rawData);

    // Check if application already exists (by Asset ID since Asset ID = CAR ID)
    const existingApp = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.assetId, validatedData.assetId),
          eq(applications.teamId, validatedData.teamId)
        )
      )
      .limit(1);

    if (existingApp.length > 0) {
      throw new Error('Application with this Asset ID already exists in this team');
    }

    // Fetch data from central API (required)
    const centralData = await fetchFromCentralAPI(validatedData.assetId);
    
    if (!centralData.success || !centralData.data) {
      throw new Error('Failed to fetch data from Central API. Asset ID is required and must be valid.');
    }

    const app = centralData.data;
    
    // Map Central API data with correct VP/Director mapping
    const centralApiData = {
      lifeCycleStatus: app.lifeCycleStatus,
      tier: app.risk.bia, // Tier is BIA tier
      
      // VP = ProductionSupportOwnerLeader1, Director = ProductionSupportOwner
      vpName: app.ownershipInfo.productionSupportOwnerLeader1?.fullName,
      vpEmail: app.ownershipInfo.productionSupportOwnerLeader1?.email,
      directorName: app.ownershipInfo.productionSupportOwner?.fullName,
      directorEmail: app.ownershipInfo.productionSupportOwner?.email,
      
      // All ownership data from Central API
      applicationOwnerName: app.ownershipInfo.applicationOwner?.fullName,
      applicationOwnerEmail: app.ownershipInfo.applicationOwner?.email,
      applicationOwnerBand: app.ownershipInfo.applicationOwner?.band,
      applicationManagerName: app.ownershipInfo.applicationManager?.fullName,
      applicationManagerEmail: app.ownershipInfo.applicationManager?.email,
      applicationManagerBand: app.ownershipInfo.applicationManager?.band,
      applicationOwnerLeader1Name: app.ownershipInfo.applicationOwnerLeader1?.fullName,
      applicationOwnerLeader1Email: app.ownershipInfo.applicationOwnerLeader1?.email,
      applicationOwnerLeader1Band: app.ownershipInfo.applicationOwnerLeader1?.band,
      applicationOwnerLeader2Name: app.ownershipInfo.applicationOwnerLeader2?.fullName,
      applicationOwnerLeader2Email: app.ownershipInfo.applicationOwnerLeader2?.email,
      applicationOwnerLeader2Band: app.ownershipInfo.applicationOwnerLeader2?.band,
      ownerSvpName: app.ownershipInfo.ownerSVP?.fullName,
      ownerSvpEmail: app.ownershipInfo.ownerSVP?.email,
      ownerSvpBand: app.ownershipInfo.ownerSVP?.band,
      businessOwnerName: app.ownershipInfo.businessOwner?.fullName,
      businessOwnerEmail: app.ownershipInfo.businessOwner?.email,
      businessOwnerBand: app.ownershipInfo.businessOwner?.band,
      businessOwnerLeader1Name: app.ownershipInfo.businessOwnerLeader1?.fullName,
      businessOwnerLeader1Email: app.ownershipInfo.businessOwnerLeader1?.email,
      businessOwnerLeader1Band: app.ownershipInfo.businessOwnerLeader1?.band,
      productionSupportOwnerName: app.ownershipInfo.productionSupportOwner?.fullName,
      productionSupportOwnerEmail: app.ownershipInfo.productionSupportOwner?.email,
      productionSupportOwnerBand: app.ownershipInfo.productionSupportOwner?.band,
      productionSupportOwnerLeader1Name: app.ownershipInfo.productionSupportOwnerLeader1?.fullName,
      productionSupportOwnerLeader1Email: app.ownershipInfo.productionSupportOwnerLeader1?.email,
      productionSupportOwnerLeader1Band: app.ownershipInfo.productionSupportOwnerLeader1?.band,
      pmoName: app.ownershipInfo.pmo?.fullName,
      pmoEmail: app.ownershipInfo.pmo?.email,
      pmoBand: app.ownershipInfo.pmo?.band,
      unitCioName: app.ownershipInfo.unitCIo?.fullName,
      unitCioEmail: app.ownershipInfo.unitCIo?.email,
      unitCioBand: app.ownershipInfo.unitCIo?.band,
      lastCentralApiSync: new Date(),
      centralApiSyncStatus: 'success',
    };

    // Insert application
    await db.insert(applications).values({
      ...validatedData,
      ...centralApiData,
      // Convert empty strings to null for optional email fields
      escalationEmail: validatedData.escalationEmail || null,
      contactEmail: validatedData.contactEmail || null,
      teamEmail: validatedData.teamEmail || null,
      status: 'active',
      createdBy: user.user.email,
      updatedBy: user.user.email,
    });

    revalidatePath(`/teams/${validatedData.teamId}`);

    return {
      success: true,
      message: 'Application added successfully',
    };
  } catch (error) {
    console.error('Failed to add application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add application',
    };
  }
}

// Reverted update application function - back to using tla
export async function updateApplication(formData: FormData) {
  try {
    const applicationId = formData.get('id') as string;
    const teamId = formData.get('teamId') as string;

    const { user, role } = await requireTeamAccess(teamId, { admin: true });

    if (role !== 'admin') {
      throw new Error('Admin access required to update applications');
    }

    // Parse and validate form data
    const rawData = {
      id: applicationId,
      teamId,
      assetId: parseInt(formData.get('assetId') as string),
      applicationName: formData.get('applicationName') as string,
      tla: formData.get('tla') as string, // Back to tla
      escalationEmail: formData.get('escalationEmail') as string || undefined,
      contactEmail: formData.get('contactEmail') as string || undefined,
      teamEmail: formData.get('teamEmail') as string || undefined,
      snowGroup: formData.get('snowGroup') as string || undefined,
      slackChannel: formData.get('slackChannel') as string || undefined,
      description: formData.get('description') as string || undefined,
    };

    const validatedData = updateApplicationSchema.parse(rawData);

    // Update application (only user-editable fields, Central API data stays the same)
    await db
      .update(applications)
      .set({
        applicationName: validatedData.applicationName,
        tla: validatedData.tla, // Back to tla
        escalationEmail: validatedData.escalationEmail || null,
        contactEmail: validatedData.contactEmail || null,
        teamEmail: validatedData.teamEmail || null,
        snowGroup: validatedData.snowGroup || null,
        slackChannel: validatedData.slackChannel || null,
        description: validatedData.description || null,
        updatedBy: user.user.email,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId));

    revalidatePath(`/teams/${teamId}`);

    return {
      success: true,
      message: 'Application updated successfully',
    };
  } catch (error) {
    console.error('Failed to update application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update application',
    };
  }
}

// Other functions remain unchanged (just using tla field name internally)...
export async function syncApplicationWithCentralAPI(applicationId: string, teamId: string) {
  try {
    const { user, role } = await requireTeamAccess(teamId, { admin: true });

    if (role !== 'admin') {
      throw new Error('Admin access required to sync applications');
    }

    // Get current application
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!app.length) {
      throw new Error('Application not found');
    }

    const currentApp = app[0];

    // Fetch from central API
    const centralData = await fetchFromCentralAPI(currentApp.assetId);

    if (!centralData.success) {
      throw new Error(centralData.error || 'Failed to fetch from central API');
    }

    // Update application with central API data
    const apiApp = centralData.data;
    await db
      .update(applications)
      .set({
        // Update all Central API fields including corrected VP/Director mapping
        lifeCycleStatus: apiApp?.lifeCycleStatus,
        tier: apiApp?.risk.bia, // Tier is BIA tier
        
        // VP = ProductionSupportOwnerLeader1, Director = ProductionSupportOwner
        vpName: apiApp?.ownershipInfo.productionSupportOwnerLeader1?.fullName,
        vpEmail: apiApp?.ownershipInfo.productionSupportOwnerLeader1?.email,
        directorName: apiApp?.ownershipInfo.productionSupportOwner?.fullName,
        directorEmail: apiApp?.ownershipInfo.productionSupportOwner?.email,
        
        // All other ownership data
        applicationOwnerName: apiApp?.ownershipInfo.applicationOwner?.fullName,
        applicationOwnerEmail: apiApp?.ownershipInfo.applicationOwner?.email,
        applicationOwnerBand: apiApp?.ownershipInfo.applicationOwner?.band,
        applicationManagerName: apiApp?.ownershipInfo.applicationManager?.fullName,
        applicationManagerEmail: apiApp?.ownershipInfo.applicationManager?.email,
        applicationManagerBand: apiApp?.ownershipInfo.applicationManager?.band,
        applicationOwnerLeader1Name: apiApp?.ownershipInfo.applicationOwnerLeader1?.fullName,
        applicationOwnerLeader1Email: apiApp?.ownershipInfo.applicationOwnerLeader1?.email,
        applicationOwnerLeader1Band: apiApp?.ownershipInfo.applicationOwnerLeader1?.band,
        applicationOwnerLeader2Name: apiApp?.ownershipInfo.applicationOwnerLeader2?.fullName,
        applicationOwnerLeader2Email: apiApp?.ownershipInfo.applicationOwnerLeader2?.email,
        applicationOwnerLeader2Band: apiApp?.ownershipInfo.applicationOwnerLeader2?.band,
        ownerSvpName: apiApp?.ownershipInfo.ownerSVP?.fullName,
        ownerSvpEmail: apiApp?.ownershipInfo.ownerSVP?.email,
        ownerSvpBand: apiApp?.ownershipInfo.ownerSVP?.band,
        businessOwnerName: apiApp?.ownershipInfo.businessOwner?.fullName,
            businessOwnerEmail: apiApp?.ownershipInfo.businessOwner?.email,
        businessOwnerBand: apiApp?.ownershipInfo.businessOwner?.band,
        businessOwnerLeader1Name: apiApp?.ownershipInfo.businessOwnerLeader1?.fullName,
        businessOwnerLeader1Email: apiApp?.ownershipInfo.businessOwnerLeader1?.email,
        businessOwnerLeader1Band: apiApp?.ownershipInfo.businessOwnerLeader1?.band,
        productionSupportOwnerName: apiApp?.ownershipInfo.productionSupportOwner?.fullName,
        productionSupportOwnerEmail: apiApp?.ownershipInfo.productionSupportOwner?.email,
        productionSupportOwnerBand: apiApp?.ownershipInfo.productionSupportOwner?.band,
        productionSupportOwnerLeader1Name: apiApp?.ownershipInfo.productionSupportOwnerLeader1?.fullName,
        productionSupportOwnerLeader1Email: apiApp?.ownershipInfo.productionSupportOwnerLeader1?.email,
        productionSupportOwnerLeader1Band: apiApp?.ownershipInfo.productionSupportOwnerLeader1?.band,
        pmoName: apiApp?.ownershipInfo.pmo?.fullName,
        pmoEmail: apiApp?.ownershipInfo.pmo?.email,
        pmoBand: apiApp?.ownershipInfo.pmo?.band,
        unitCioName: apiApp?.ownershipInfo.unitCIo?.fullName,
        unitCioEmail: apiApp?.ownershipInfo.unitCIo?.email,
        unitCioBand: apiApp?.ownershipInfo.unitCIo?.band,
        
        lastCentralApiSync: new Date(),
        centralApiSyncStatus: 'success',
        updatedBy: user.user.email,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId));

    revalidatePath(`/teams/${teamId}`);

    return {
      success: true,
      message: 'Application synced successfully',
    };
  } catch (error) {
    console.error('Failed to sync application:', error);
    
    // Update sync status to failed
    if (applicationId) {
      await db
        .update(applications)
        .set({
          centralApiSyncStatus: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(applications.id, applicationId));
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync application',
    };
  }
}

export async function deleteApplication(applicationId: string, teamId: string) {
  try {
    const { user, role } = await requireTeamAccess(teamId, { admin: true });

    if (role !== 'admin') {
      throw new Error('Admin access required to delete applications');
    }

    await db
      .delete(applications)
      .where(eq(applications.id, applicationId));

    revalidatePath(`/teams/${teamId}`);

    return {
      success: true,
      message: 'Application deleted successfully',
    };
  } catch (error) {
    console.error('Failed to delete application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete application',
    };
  }
}


const updateTeamSchema = z.object({
  teamId: z.string().uuid(),
  teamName: z.string().min(1).max(100),
  contactName: z.string().min(1).max(100),
  contactEmail: z.string().email().max(255),
  userGroup: z.string().min(1).max(100),
  adminGroup: z.string().min(1).max(100),
});

// Update team settings
export async function updateTeamSettings(formData: FormData) {
  try {
    const { user, role } = await requireTeamAccess(
      formData.get('teamId') as string,
      { admin: true }
    );

    if (role !== 'admin') {
      throw new Error('Admin access required to update team settings');
    }

    const rawData = {
      teamId: formData.get('teamId') as string,
      teamName: formData.get('teamName') as string,
      contactName: formData.get('contactName') as string,
      contactEmail: formData.get('contactEmail') as string,
      userGroup: formData.get('userGroup') as string,
      adminGroup: formData.get('adminGroup') as string,
    };

    const validatedData = updateTeamSchema.parse(rawData);

    // Check if team name is unique (excluding current team)
    const existingTeam = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.teamName, validatedData.teamName),
          not(eq(teams.id, validatedData.teamId))
        )
      )
      .limit(1);

    if (existingTeam.length > 0) {
      throw new Error('Team name already exists');
    }

    // Update team
    await db
      .update(teams)
      .set({
        teamName: validatedData.teamName,
        contactName: validatedData.contactName,
        contactEmail: validatedData.contactEmail,
        userGroup: validatedData.userGroup,
        adminGroup: validatedData.adminGroup,
        updatedBy: user.user.email,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, validatedData.teamId));

    revalidatePath(`/teams/${validatedData.teamId}`);

    return {
      success: true,
      message: 'Team settings updated successfully',
    };
  } catch (error) {
    console.error('Failed to update team settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update team settings',
    };
  }
}

export async function getApplicationDetails(applicationId: string, teamId: string) {
  try {
    const { user } = await requireTeamAccess(teamId, { admin: false });

    // Get application details
    const application = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.id, applicationId),
          eq(applications.teamId, teamId)
        )
      )
      .limit(1);

    if (!application.length) {
      throw new Error('Application not found');
    }

    return {
      success: true,
      data: application[0],
    };
  } catch (error) {
    console.error('Failed to get application details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get application details',
    };
  }
}
