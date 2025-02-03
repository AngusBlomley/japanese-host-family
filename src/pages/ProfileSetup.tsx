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
import type { Profile } from "@/types/user";

const steps = {
  host: ["Role", "Basic Info", "Host Details", "Review & Submit"],
  guest: ["Role", "Basic Info", "Guest Details", "Review & Submit"],
};

// Common form fields that should be required
type RequiredFormFields = {
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  nationality: string;
  bio: string;
  languages: string[];
};

// Host-specific required fields
type RequiredHostFields = {
  address: string;
  city: string;
  prefecture: string;
  postal_code: string;
  license_number: string;
  license_expiry: string;
  accommodation_type: "house" | "apartment";
  room_type: "private" | "shared";
  max_guests: number;
  price_per_night: number;
  amenities: string[];
  house_rules: string[];
  available_from: string;
  available_to: string;
};

// Guest-specific required fields
type RequiredGuestFields = {
  study_purpose: string;
  planned_duration: "1-3" | "3-6" | "6-12" | "12+";
  start_date: string;
  budget_min: number;
  budget_max: number;
  dietary_restrictions: string[];
  preferred_location: string[];
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

  const [formData, setFormData] = useState<Profile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE_SETUP.FORM_DATA);
    return saved
      ? JSON.parse(saved)
      : {
          // Basic Info
          first_name: "",
          last_name: "",
          phone_number: "",
          date_of_birth: "",
          nationality: "",
          languages: [],
          bio: "",

          // Host Specific
          address: "",
          city: "",
          prefecture: "",
          postalCode: "",
          license_number: "",
          license_expiry: "",
          accommodation_type: "house",
          room_type: "private",
          max_guests: 1,
          amenities: [],
          house_rules: [],
          available_from: "",
          available_to: "",
          price_per_night: 0,

          // Guest Specific
          study_purpose: "",
          planned_duration: "1-3",
          dietary_restrictions: [],
          preferred_location: [],
          start_date: "",
          budget_min: 0,
          budget_max: 0,
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
        ...formData,
        profile_complete: true,
      };

      // Insert into unified profiles table
      const { error } = await supabase.from("profiles").insert([profile]);

      if (error) throw error;

      toast({
        title: "Profile Created!",
        description: "Your profile has been successfully set up.",
      });

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
