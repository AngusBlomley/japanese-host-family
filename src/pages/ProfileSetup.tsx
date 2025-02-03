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
import Header from "@/components/layout/Header";

const steps = {
  host: ["Role", "Basic Info", "Host Details", "Review & Submit"],
  guest: ["Role", "Basic Info", "Guest Details", "Review & Submit"],
};

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
          first_name: "",
          last_name: "",
          phone_number: "",
          date_of_birth: "",
          nationality: "",
          languages: [],
          bio: "",
          dietary_restrictions: [],
          preferred_location: [],
          study_purpose: "",
          planned_duration: "1-3",
          start_date: "",
          budget_min: 0,
          budget_max: 0,
          amenities: [],
          house_rules: [],
          address: "",
          city: "",
          prefecture: "",
          postalCode: "",
          license_number: "",
          license_expiry: "",
          accommodation_type: "house",
          room_type: "private",
          max_guests: 1,
          price_per_night: 0,
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

      // Clean up the profile data before sending
      const cleanProfile = {
        role,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        date_of_birth: formData.date_of_birth || null,
        nationality: formData.nationality,
        languages: formData.languages,
        bio: formData.bio,
        profile_complete: true,

        // Host fields - only include if they have values
        ...(formData.address && { address: formData.address }),
        ...(formData.city && { city: formData.city }),
        ...(formData.prefecture && { prefecture: formData.prefecture }),
        ...(formData.postal_code && { postal_code: formData.postal_code }),
        ...(formData.accommodation_type && {
          accommodation_type: formData.accommodation_type,
        }),
        ...(formData.room_type && { room_type: formData.room_type }),
        ...(formData.max_guests && { max_guests: formData.max_guests }),
        ...(formData.amenities?.length && { amenities: formData.amenities }),
        ...(formData.house_rules?.length && {
          house_rules: formData.house_rules,
        }),
        ...(formData.available_from && {
          available_from: formData.available_from,
        }),
        ...(formData.available_to && { available_to: formData.available_to }),
        ...(formData.pricing && {
          pricing: formData.pricing,
        }),
        ...(formData.meal_plan && {
          meal_plan: formData.meal_plan,
        }),
        ...(formData.license_number && {
          license_number: formData.license_number,
        }),
        ...(formData.license_expiry && {
          license_expiry: formData.license_expiry,
        }),

        // Guest fields - only include if they have values
        ...(formData.study_purpose && {
          study_purpose: formData.study_purpose,
        }),
        ...(formData.planned_duration && {
          planned_duration: formData.planned_duration,
        }),
        ...(formData.dietary_restrictions?.length && {
          dietary_restrictions: formData.dietary_restrictions,
        }),
        ...(formData.preferred_location?.length && {
          preferred_location: formData.preferred_location,
        }),
        ...(formData.start_date && { start_date: formData.start_date }),
        ...(formData.budget_min && { budget_min: formData.budget_min }),
        ...(formData.budget_max && { budget_max: formData.budget_max }),
      };

      console.log("Updating profile with:", cleanProfile);

      const { data, error } = await supabase
        .from("profiles")
        .update(cleanProfile)
        .eq("user_id", user.id)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Update response:", data);

      toast({
        title: "Profile Created!",
        description: "Your profile has been successfully set up.",
      });

      localStorage.removeItem(STORAGE_KEYS.PROFILE_SETUP.FORM_DATA);
      localStorage.removeItem(STORAGE_KEYS.PROFILE_SETUP.ROLE);
      navigate("/dashboard");
    } catch (error: unknown) {
      console.error("Full error:", error);

      if (error instanceof Error) {
        toast({
          title: "Error",
          description: `Failed to update profile: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unknown error occurred while updating profile",
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
    <>
      <Header />
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
    </>
  );
};

export default ProfileSetup;
