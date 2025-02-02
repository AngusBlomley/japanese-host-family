export type UserRole = "host" | "guest";

export interface BaseProfile {
  id: string;
  userId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  dateOfBirth: string | null; // date stored as ISO string
  nationality: string | null;
  languages: string[];
  bio: string | null;
  profileComplete: boolean;
  createdAt: string; // timestamp stored as ISO string
}

export interface HostProfile extends BaseProfile {
  role: "host";
  address: string | null;
  city: string | null;
  prefecture: string | null;
  postalCode: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null; // date stored as ISO string
  accommodationType: "house" | "apartment" | null;
  roomType: "private" | "shared" | null;
  maxGuests: number | null;
  amenities: string[];
  houseRules: string[];
  availableFrom: string | null; // date stored as ISO string
  availableTo: string | null; // date stored as ISO string
  pricePerNight: number | null;
  verified: boolean;
}

export interface GuestProfile extends BaseProfile {
  role: "guest";
  studyPurpose: string | null;
  plannedDuration: "1-3" | "3-6" | "6-12" | "12+" | null;
  dietaryRestrictions: string[];
  preferredLocation: string[];
  startDate: string | null; // date stored as ISO string
  budgetMin: number | null;
  budgetMax: number | null;
}

// Form-specific types
export type ProfileFormData = {
  // Basic Info
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationality: string;
  languages: string[];
  bio: string;

  // Host Specific
  address: string;
  city: string;
  prefecture: string;
  postalCode: string;
  licenseNumber: string;
  licenseExpiry: string;
  accommodationType: "house" | "apartment";
  roomType: "private" | "shared";
  maxGuests: number;
  amenities: string[];
  houseRules: string[];
  availableFrom: string;
  availableTo: string;
  pricePerNight: number;

  // Guest Specific
  studyPurpose: string;
  plannedDuration: "1-3" | "3-6" | "6-12" | "12+";
  dietaryRestrictions: string[];
  preferredLocation: string[];
  startDate: string;
  budgetMin: number;
  budgetMax: number;
};
