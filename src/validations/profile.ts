import { z } from "zod";

// Common base schema
const baseSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  nationality: z.string().min(1, "Nationality is required"),
  languages: z.array(z.string()).min(1, "At least one language is required"),
  bio: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
});

// Add nullable date transformer
const optionalDateSchema = z
  .string()
  .nullable()
  .transform((val) => (val === "" ? null : val))
  .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: "Invalid date format (YYYY-MM-DD) or empty",
  });

// Host-specific schema
const hostSchema = baseSchema.extend({
  role: z.literal("host"),
  license_number: z.string().min(1, "License number is required"),
  license_expiry: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional(),
});

// Guest-specific schema
const guestSchema = baseSchema.extend({
  role: z.literal("guest"),
  stay_purpose: z.string().min(1, "Stay purpose is required"),
  dietary_restrictions: z.array(z.string()).optional(),
});

// Combined schema
export const profileSchema = z.discriminatedUnion("role", [
  hostSchema,
  guestSchema,
]);

export type Profile = z.infer<typeof profileSchema>;
