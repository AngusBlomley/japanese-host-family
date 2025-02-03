export type UserRole = "host" | "guest";

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;

  // Common fields
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  nationality: string;
  languages: string[];
  bio: string;
  avatar_url: string | null;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;

  // Host-specific fields (nullable)
  address?: string | null;
  city?: string | null;
  prefecture?: string | null;
  postal_code?: string | null;
  accommodation_type?: "house" | "apartment" | null;
  room_type?: "private" | "shared" | null;
  max_guests?: number | null;
  amenities?: string[] | null;
  house_rules?: string[] | null;
  available_from?: string | null;
  available_to?: string | null;
  price_per_night?: number | null;
  license_number?: string | null;
  license_expiry?: string | null;

  // Guest-specific fields (nullable)
  study_purpose?: string | null;
  planned_duration?: "1-3" | "3-6" | "6-12" | "12+" | null;
  dietary_restrictions?: string[] | null;
  preferred_location?: string[] | null;
  start_date?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
}

// Type guards to check role-specific fields
export function isHostProfile(profile: Profile): boolean {
  return profile.role === "host";
}

export function isGuestProfile(profile: Profile): boolean {
  return profile.role === "guest";
}
