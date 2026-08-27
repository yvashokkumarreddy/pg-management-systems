import { z } from "zod";

export const pgProfileSchema = z.object({
  pgName: z.string().min(1),
  description: z.string().optional(),
  address: z.string().optional(),
  contactNumber: z.string().optional(),
  isPublished: z.boolean().optional()
});
