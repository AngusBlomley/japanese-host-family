export type UserRole = "host" | "guest";

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  is_host_family: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface HostProfile {
  id: string;
  user_id: string;
  role: "host";
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  nationality: string;
  languages: string[];
  bio: string;
  profile_complete: boolean;
  address: string;
  city: string;
  prefecture: string;
  postal_code: string;
  license_number: string;
  license_expiry: string;
  accommodation_type: "house" | "apartment";
  room_type: "private" | "shared";
  max_guests: number;
  amenities: string[];
  house_rules: string[];
  available_from: string;
  available_to: string;
  price_per_night: number;
  verified: boolean;
  created_at: string;
}

export interface GuestProfile {
  id: string;
  user_id: string;
  role: "guest";
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  nationality: string;
  languages: string[];
  bio: string;
  profile_complete: boolean;
  study_purpose: string;
  planned_duration: "1-3" | "3-6" | "6-12" | "12+";
  dietary_restrictions: string[];
  preferred_location: string[];
  start_date: string;
  budget_min: number;
  budget_max: number;
  created_at: string;
}

// Form-specific types
export type ProfileFormData = {
  // Basic Info
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  nationality: string;
  languages: string[];
  bio: string;

  // Host Specific
  address: string;
  city: string;
  prefecture: string;
  postal_code: string;
  license_number: string;
  license_expiry: string;
  accommodation_type: "house" | "apartment";
  room_type: "private" | "shared";
  max_guests: number;
  amenities: string[];
  house_rules: string[];
  available_from: string;
  available_to: string;
  price_per_night: number;

  // Guest Specific
  study_purpose: string;
  planned_duration: "1-3" | "3-6" | "6-12" | "12+";
  dietary_restrictions: string[];
  preferred_location: string[];
  start_date: string;
  budget_min: number;
  budget_max: number;
};
export type CombinedHostProfile = Profile & HostProfile;
export type CombinedGuestProfile = Profile & GuestProfile;
