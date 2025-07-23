// lib/teamFormSchema.ts
import * as z from "zod"

export const teamFormSchema = z.object({
  teamName: z.string()
    .min(3, "Team name must be at least 3 characters")
    .max(50, "Team name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Invalid characters in team name"),
  userGroup: z.string()
    .min(3, "User group must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Group names should only contain letters, numbers, and underscores"),
  adminGroup: z.string()
    .min(3, "Admin group must be at least 3 characters") 
    .regex(/^[a-zA-Z0-9_]+$/, "Group names should only contain letters, numbers, and underscores"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters").max(100),
  contactEmail: z.string().email("Please enter a valid email address").max(255),
})

export type TeamFormValues = z.infer<typeof teamFormSchema>
