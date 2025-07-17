'use server';

import { db } from "@/db";
import { applications } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import {
  applicationSchema,
  type ApplicationFormData,
} from "@/app/types/application";

// Function to generate TLA from application name
function generateTLA(appName: string): string {
  // Remove special characters and split into words
  const words = appName.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/);
  
  if (words.length >= 3) {
    // If we have 3 or more words, take first letter of first three words
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  } else if (words.length === 2) {
    // If we have 2 words, take first letter of first word and first two letters of second word
    return (words[0][0] + words[1].slice(0, 2)).toUpperCase();
  } else {
    // If we have 1 word, take first three letters
    return words[0].slice(0, 3).toUpperCase();
  }
}

// Function to ensure TLA uniqueness within a team
async function ensureUniqueTLA(teamId: string, baseTLA: string): Promise<string> {
  let finalTLA = baseTLA;
  let counter = 1;
  
  while (true) {
    // Check if TLA exists for this team
    const existing = await db.select()
      .from(applications)
      .where(
        and(
          eq(applications.teamId, teamId),
          eq(applications.tla, finalTLA)
        )
      )
      .execute();

    if (existing.length === 0) {
      return finalTLA;
    }

    // If TLA exists, append number and try again
    finalTLA = `${baseTLA.slice(0, 2)}${counter}`;
    counter++;

    // Prevent infinite loop
    if (counter > 99) {
      throw new Error("Unable to generate unique TLA");
    }
  }
}

export async function createApplication(data: ApplicationFormData) {
  try {
    const user = await requireAuth();
    
    // Validate team access
    const hasTeamAccess = user.teams?.some(team => team.teamId === data.teamId);
    if (!hasTeamAccess) {
      throw new Error("You don't have access to this team");
    }

    // Check if application already exists for this team
    const existingApp = await db.select()
      .from(applications)
      .where(
        and(
          eq(applications.teamId, data.teamId),
          eq(applications.carId, data.carId)
        )
      )
      .execute();

    if (existingApp.length > 0) {
      throw new Error("An application with this CAR ID already exists in this team");
    }

    // Validate input data
    const validatedData = applicationSchema.parse(data);

    // Generate and ensure unique TLA
    const baseTLA = generateTLA(validatedData.applicationName);
    const uniqueTLA = await ensureUniqueTLA(validatedData.teamId, baseTLA);

    // Create new application with generated TLA
    const newApplication = await db.insert(applications).values({
      ...validatedData,
      tla: uniqueTLA,
      createdBy: user.user.email,
      updatedBy: user.user.email,
    });

    revalidatePath(`/teams/${data.teamId}`);
    return { success: true, data: newApplication };
  } catch (error) {
    console.error("Failed to create application:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create application" 
    };
  }
}

export async function searchCarId(carId: string) {
  try {
    await requireAuth();

    if (!carId) {
      throw new Error("CAR ID is required");
    }

    // Call the central service API
    const response = await fetch(`http://localhost:8008/api/central`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CAR ID data: ${response.statusText}`);
    }

    const carData = await response.json();

    // Transform the API response to match our application's format
    // Adjust this mapping based on the actual API response structure
    const transformedData = {
      applicationName: carData.applicationName || carData.name,
      tla: carData.tla || '',
      vpName: carData.vpName || '',
      vpEmail: carData.vpEmail || '',
      directorName: carData.directorName || '',
      directorEmail: carData.directorEmail || '',
      tier: carData.tier || 1,
      description: carData.description || '',
    };

    return { success: true, data: transformedData };
  } catch (error) {
    console.error("Failed to search CAR ID:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to search CAR ID" 
    };
  }
}