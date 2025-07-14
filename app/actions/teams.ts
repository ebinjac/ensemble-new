'use server';

import { db } from '@/db';
import { teams, teamRegistrationRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

export type TeamRegistrationData = {
  teamName: string;
  userGroup: string;
  adminGroup: string;
  contactName: string;
  contactEmail: string;
};

export async function checkTeamNameAvailability(teamName: string): Promise<boolean> {
  try {
    // Check if team name exists in teams table
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.teamName, teamName))
      .limit(1);

    // Check if team name exists in pending requests
    const pendingRequest = await db
      .select()
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.teamName, teamName))
      .limit(1);

    return existingTeam.length === 0 && pendingRequest.length === 0;
  } catch (error) {
    console.error('Failed to check team name availability:', error);
    throw error;
  }
}

export async function registerTeam(data: TeamRegistrationData) {
  try {
    // Get the authenticated user
    const user = await requireAuth();
    const requestedBy = user.user.email;

    // Validate requestedBy
    if (!requestedBy) {
      throw new Error("Requester email is required");
    }

    // First check if team name is available
    const isAvailable = await checkTeamNameAvailability(data.teamName);
    if (!isAvailable) {
      throw new Error("Team name is already taken");
    }

    // Create registration request with explicit field mapping
    const insertData = {
      teamName: data.teamName,
      userGroup: data.userGroup,
      adminGroup: data.adminGroup,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      requestedBy: requestedBy,
      status: 'pending' as const,
      requestedAt: new Date(),
      reviewedBy: null,
      reviewedAt: null,
      comments: null
    };

    const result = await db.insert(teamRegistrationRequests).values(insertData).returning();
    const requestId = result[0].id;

    revalidatePath('/teams');
    return { success: true, requestId };
  } catch (error) {
    console.error('Failed to submit team registration request:', error);
    throw error;
  }
}

// Add a new function to get registration request details
export async function getRegistrationRequestById(requestId: string) {
  try {
    const request = await db
      .select()
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.id, requestId))
      .limit(1);

    return request[0] || null;
  } catch (error) {
    console.error('Failed to get registration request:', error);
    throw error;
  }
}

export async function getTeamRegistrationStatus(teamName: string) {
  try {
    const request = await db
      .select()
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.teamName, teamName))
      .limit(1);

    return request[0]?.status || null;
  } catch (error) {
    console.error('Failed to get team registration status:', error);
    throw error;
  }
}

export async function getTeamRegistrationRequests() {
  try {
    const requests = await db
      .select()
      .from(teamRegistrationRequests)
      .orderBy(teamRegistrationRequests.requestedAt);

    return requests;
  } catch (error) {
    console.error('Failed to get team registration requests:', error);
    throw error;
  }
}

export async function getPendingTeamRegistrationRequests() {
  try {
    const requests = await db
      .select()
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.status, 'pending'))
      .orderBy(teamRegistrationRequests.requestedAt);

    return requests;
  } catch (error) {
    console.error('Failed to get pending team registration requests:', error);
    throw error;
  }
}

// Admin actions for handling registration requests
export async function approveTeamRegistration(
  requestId: string,
  reviewedBy: string,
  comments?: string
) {
  try {
    // Get the request first
    const requests = await db
      .select()
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.id, requestId))
      .limit(1);

    const request = requests[0];
    if (!request) {
      throw new Error("Registration request not found");
    }

    // Start a transaction to update both tables
    await db.transaction(async (tx) => {
      // Update request status
      await tx
        .update(teamRegistrationRequests)
        .set({
          status: 'approved',
          reviewedBy,
          reviewedAt: new Date(),
          comments,
        })
        .where(eq(teamRegistrationRequests.id, requestId));

      // Create the team
      await tx.insert(teams).values({
        teamName: request.teamName,
        userGroup: request.userGroup,
        adminGroup: request.adminGroup,
        contactName: request.contactName,
        contactEmail: request.contactEmail,
      });
    });

    revalidatePath('/teams');
    return { success: true };
  } catch (error) {
    console.error('Failed to approve team registration:', error);
    throw error;
  }
}

export async function rejectTeamRegistration(
  requestId: string,
  reviewedBy: string,
  comments: string
) {
  try {
    await db
      .update(teamRegistrationRequests)
      .set({
        status: 'rejected',
        reviewedBy,
        reviewedAt: new Date(),
        comments,
      })
      .where(eq(teamRegistrationRequests.id, requestId));

    revalidatePath('/teams');
    return { success: true };
  } catch (error) {
    console.error('Failed to reject team registration:', error);
    throw error;
  }
}

export async function getTeamById(teamId: string) {
  try {
    const result = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Failed to get team by ID:', error);
    throw error;
  }
}

export async function getAllTeams() {
  try {
    const allTeams = await db
      .select()
      .from(teams)
      .orderBy(teams.teamName);

    return allTeams;
  } catch (error) {
    console.error('Failed to get all teams:', error);
    throw error;
  }
} 