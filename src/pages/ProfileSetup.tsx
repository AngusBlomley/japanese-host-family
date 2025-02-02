import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/user";
import RoleSelection from "@/components/profile-setup/steps/RoleSelection";
import BasicInfo from "@/components/profile-setup/steps/BasicInfo";
import HostDetails from "@/components/profile-setup/steps/HostDetails";
import GuestDetails from "@/components/profile-setup/steps/GuestDetails";
import ReviewSubmit from "@/components/profile-setup/steps/ReviewSubmit";
import { STORAGE_KEYS } from "@/constants/storage";

const steps = {
  host: ["Role", "Basic Info", "Host Details", "Review & Submit"],
  guest: ["Role", "Basic Info", "Guest Details", "Review & Submit"],
};

// Common form fields that should be required
type RequiredFormFields = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationality: string;
  bio: string;
  languages: string[];
};

// Host-specific required fields
type RequiredHostFields = {
  address: string;
  city: string;
  prefecture: string;
  postalCode: string;
  licenseNumber: string;
  licenseExpiry: string;
  accommodationType: "house" | "apartment";
  roomType: "private" | "shared";
  maxGuests: number;
  pricePerNight: number;
  amenities: string[];
  houseRules: string[];
  availableFrom: string;
  availableTo: string;
};

// Guest-specific required fields
type RequiredGuestFields = {
  studyPurpose: string;
  plannedDuration: "1-3" | "3-6" | "6-12" | "12+";
  startDate: string;
  budgetMin: number;
  budgetMax: number;
  dietaryRestrictions: string[];
  preferredLocation: string[];
};

type ProfileFormData = RequiredFormFields &
  RequiredHostFields &
  RequiredGuestFields;

const ProfileSetup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [role, setRole] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE_SETUP.ROLE);
    return saved ? JSON.parse(saved) : null;
  });

  const [formData, setFormData] = useState<ProfileFormData>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE_SETUP.FORM_DATA);
    return saved
      ? JSON.parse(saved)
      : {
          // Basic Info
          firstName: "",
          lastName: "",
          phoneNumber: "",
          dateOfBirth: "",
          nationality: "",
          languages: [],
          bio: "",

          // Host Specific
          address: "",
          city: "",
          prefecture: "",
          postalCode: "",
          licenseNumber: "",
          licenseExpiry: "",
          accommodationType: "house",
          roomType: "private",
          maxGuests: 1,
          amenities: [],
          houseRules: [],
          availableFrom: "",
          availableTo: "",
          pricePerNight: 0,

          // Guest Specific
          studyPurpose: "",
          plannedDuration: "1-3",
          dietaryRestrictions: [],
          preferredLocation: [],
          startDate: "",
          budgetMin: 0,
          budgetMax: 0,
        };
  });

  // Update localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.PROFILE_SETUP.FORM_DATA,
      JSON.stringify(formData)
    );
  }, [formData]);

  // Update localStorage whenever role changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE_SETUP.ROLE, JSON.stringify(role));
  }, [role]);

  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = role ? steps[role].length : 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const profile = {
        user_id: user.id,
        role,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber,
        date_of_birth: formData.dateOfBirth,
        nationality: formData.nationality,
        languages: formData.languages,
        bio: formData.bio,
        profile_complete: true,
        // Add other fields with snake_case for database
        ...(role === "host"
          ? {
              address: formData.address,
              city: formData.city,
              prefecture: formData.prefecture,
              postal_code: formData.postalCode,
              license_number: formData.licenseNumber,
              license_expiry: formData.licenseExpiry,
              accommodation_type: formData.accommodationType,
              room_type: formData.roomType,
              max_guests: formData.maxGuests,
              amenities: formData.amenities,
              house_rules: formData.houseRules,
              available_from: formData.availableFrom,
              available_to: formData.availableTo,
              price_per_night: formData.pricePerNight,
              verified: false,
            }
          : {
              study_purpose: formData.studyPurpose,
              planned_duration: formData.plannedDuration,
              dietary_restrictions: formData.dietaryRestrictions,
              preferred_location: formData.preferredLocation,
              start_date: formData.startDate,
              budget_min: formData.budgetMin,
              budget_max: formData.budgetMax,
            }),
      };

      const { error } = await supabase
        .from(role === "host" ? "host_profiles" : "guest_profiles")
        .insert([profile]);

      if (error) throw error;

      toast({
        title: "Profile Created!",
        description: "Your profile has been successfully set up.",
      });

      // Clear stored data after successful submission
      localStorage.removeItem(STORAGE_KEYS.PROFILE_SETUP.FORM_DATA);
      localStorage.removeItem(STORAGE_KEYS.PROFILE_SETUP.ROLE);
      navigate("/dashboard");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unknown error occurred",
          variant: "destructive",
        });
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <RoleSelection role={role} setRole={setRole} onNext={handleNext} />
        );
      case 1:
        return (
          <BasicInfo
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return role === "host" ? (
          <HostDetails
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        ) : (
          <GuestDetails
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <ReviewSubmit
            formData={formData}
            role={role!}
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Profile Setup</h2>
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {totalSteps}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
