import { z } from "zod";

/**
 * Validation for anonymous incident report submission.
 * Required vs optional fields per PRD §6 "Anonymous Reporting".
 */
export const incidentCategorySchema = z.enum([
  "catcalling",
  "verbal_harassment",
  "following_stalking",
  "groping",
  "sexual_harassment",
  "suspicious_individuals",
  "poor_lighting",
  "theft",
  "unsafe_transport",
  "other",
]);

export const severitySchema = z.enum(["low", "moderate", "high", "severe"]);

export const reportFormSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  categories: z
    .array(incidentCategorySchema)
    .min(1, "Select at least one incident category"),
  severity: severitySchema,
  incidentDate: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), "Enter a valid date")
    .refine((val) => new Date(val) <= new Date(), "Date cannot be in the future"),
  incidentTime: z.string().optional(),
  description: z
    .string()
    .max(1000, "Description must be under 1000 characters")
    .optional(),
  // Files are validated client-side separately (type/size) before
  // upload; this just carries references through the form state.
  photos: z.array(z.instanceof(File)).max(5, "Up to 5 photos").optional(),
  // Anti-abuse honeypot — real users never fill this in. Deliberately
  // NOT constrained to empty-string here: the goal is to let a filled
  // honeypot reach the API route, which silently returns a fake
  // success rather than revealing detection via a validation error.
  website: z.string().optional(),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;

export const confirmationSchema = z.object({
  reportId: z.string().uuid(),
  confirmationType: z.enum([
    "experienced_similar",
    "still_unsafe",
    "conditions_improved",
  ]),
});

export const editReportSchema = z.object({
  code: z.string().min(1, "Enter your report code"),
  description: z.string().max(1000).optional(),
  severity: severitySchema.optional(),
});
