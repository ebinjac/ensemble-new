import { z } from "zod";

export const applicationSchema = z.object({
  teamId: z.string().uuid(),
  carId: z.string().min(1, "CAR ID is required"),
  applicationName: z.string().min(1, "Application name is required"),
  tla: z.string().length(3, "TLA must be exactly 3 characters").optional(), // Make TLA optional as we'll generate it
  description: z.string().optional(),
  tier: z.number().int().min(1).max(5),
  vpName: z.string().min(1, "VP name is required"),
  vpEmail: z.string().email("Invalid VP email"),
  directorName: z.string().min(1, "Director name is required"),
  directorEmail: z.string().email("Invalid director email"),
  slackChannel: z.string().optional(),
  snowGroup: z.string().optional(),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>; 