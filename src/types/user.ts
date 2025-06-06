export type UserRole = "host" | "guest";

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;

  // Common fields
  first_name: string;
  last_name: string;
  phone_number: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  languages: string[];
  bio: string | null;
  avatar_url: string | null;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;

  // Host-specific fields (nullable for guests)
  prefecture?: string | null;
  house_rules?: string[] | null;
  meal_plan?: "none" | "breakfast_only" | "half_board" | "full_board" | null;
  license_number?: string | null;
  license_expiry?: string | null;

  // Guest-specific fields (nullable for hosts)
  stay_purpose?: string | null;
  dietary_restrictions?: string[] | null;

  // Common optional fields
  rating?: number | null;
  total_ratings?: number;
  language?: string | null;
}

export interface Listing {
  id: string;
  host_id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  prefecture: string;
  pricing: {
    type: "weekly" | "monthly";
    base_rate: number;
    includes: {
      breakfast: boolean;
      lunch: boolean;
      dinner: boolean;
      utilities: boolean;
      wifi: boolean;
      laundry: boolean;
    };
    additional_fees?: {
      description: string;
      amount: number;
    }[];
  };
  room_type: "private" | "shared";
  max_guests: number;
  amenities: string[];
  house_rules: string[];
  images: string[];
  available_from: string;
  available_to: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "published" | "archived";
  meal_plan: "none" | "breakfast_only" | "half_board" | "full_board";
  student_requirements?: {
    min_age?: number;
    max_age?: number;
    language_level?: string;
    minimum_stay_weeks?: number;
  };
  host: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    bio: string;
    rating: number | null;
    total_ratings: number;
    nationality: string;
    languages: string[];
  };
  additional_fees: {
    description: string;
    amount: number;
  }[];
}

// Type guards to check role-specific fields
export function isHostProfile(profile: Profile): boolean {
  return profile.role === "host";
}

export function isGuestProfile(profile: Profile): boolean {
  return profile.role === "guest";
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  listing_id: string;
  guest_id: string;
  host_id: string;
  created_at: string;
  updated_at: string;
  status: "active" | "archived";
  listing: Listing;
  guest: Profile;
  host: Profile;
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count: number;
  is_read: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  is_pinned: boolean;
  is_muted: boolean;
  is_blocked: boolean;
  is_favorite: boolean;
  is_starred: boolean;
}

export interface SavedListing {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}
