import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import RoleSelection from "@/components/profile-setup/steps/RoleSelection";
import BasicInfo from "@/components/profile-setup/steps/BasicInfo";
import HostDetails from "@/components/profile-setup/steps/HostDetails";
import GuestDetails from "@/components/profile-setup/steps/GuestDetails";
import ReviewSubmit from "@/components/profile-setup/steps/ReviewSubmit";
import { PROFILE_SETUP } from "@/constants/storage";
import type { Profile } from "@/types/user";
import Header from "@/components/layout/Header";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/validations/profile";

const steps = {
  host: ["Role", "Basic Info", "Host Details", "Review"],
  guest: ["Role", "Basic Info", "Guest Details", "Review"],
};

const ProfileSetup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [role, setRole] = useState<Profile["role"] | null>(() => {
    try {
      const storedRole = localStorage.getItem(PROFILE_SETUP.ROLE);
      return storedRole ? JSON.parse(storedRole) : null;
    } catch (error) {
      console.error("Error parsing stored role:", error);
      return null;
    }
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const formMethods = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role: undefined,
      first_name: "",
      last_name: "",
      phone_number: "",
      date_of_birth: "",
      nationality: "",
      languages: [],
      bio: "",
      avatar_url: null,
      // Host defaults
      license_number: "",
      license_expiry: "",
      // Guest defaults
      dietary_restrictions: [],
      stay_purpose: "",
    },
  });

  useEffect(() => {
    if (role) {
      formMethods.setValue("role", role);
    }
  }, [role, formMethods]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PROFILE_SETUP.FORM_DATA && e.newValue) {
        formMethods.reset(JSON.parse(e.newValue));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [formMethods]);

  const totalSteps = role ? steps[role].length : steps.host.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = async () => {
    console.log("Current step:", currentStep, "Role:", role);

    if (currentStep === 0) {
      console.log("Handling role selection step");
      if (!role) {
        console.log("No role selected, showing error");
        toast({ title: "Please select a role" });
        return;
      }
      console.log("Proceeding to step 1");
      setCurrentStep(1);
      return;
    }

    // Validate only current step's fields
    let fieldsToValidate: (keyof Profile)[] = [];
    if (currentStep === 1) {
      console.log("Validating basic info step");
      fieldsToValidate = [
        "first_name",
        "last_name",
        "phone_number",
        "date_of_birth",
        "nationality",
        "languages",
      ];
    } else if (currentStep === 2) {
      console.log("Validating role-specific step for", role);
      fieldsToValidate =
        role === "host"
          ? ["license_number"]
          : ["stay_purpose", "dietary_restrictions"];
    }

    console.log("Fields to validate:", fieldsToValidate);
    const isValid = await formMethods.trigger(fieldsToValidate);
    console.log("Validation result:", isValid);

    if (isValid) {
      console.log("Validation passed, moving to step", currentStep + 1);
      setCurrentStep((prev) => {
        console.log("Updating step from", prev, "to", prev + 1);
        return prev + 1;
      });
    } else {
      console.log("Validation failed, showing error");
      console.log("Form errors:", formMethods.formState.errors);
      toast({
        title: "Please fix the highlighted fields",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFinalSubmit = async (data: Profile) => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check for existing profile first
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select()
        .eq("user_id", user.id)
        .single();

      // Clean date fields before submission
      const cleanedData = {
        ...data,
        profile_complete: true,
        license_expiry: data.license_expiry || null,
        stay_purpose: data.stay_purpose || null,
        dietary_restrictions: data.dietary_restrictions || null,
      };

      const { error } = existingProfile
        ? await supabase
            .from("profiles")
            .update(cleanedData)
            .eq("user_id", user.id)
        : await supabase.from("profiles").insert(cleanedData);

      if (error) throw error;

      // Refresh auth session to get updated claims
      await supabase.auth.refreshSession();

      toast({
        title: "Profile Created Successfully!",
        description: "Your host profile is now active",
        variant: "default",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Submission error:", error);
      toast({ variant: "destructive", title: "Submission failed" });
    }
  };

  useEffect(() => {
    return () => {
      if (formMethods.formState.isSubmitSuccessful) {
        localStorage.removeItem(PROFILE_SETUP.FORM_DATA);
        localStorage.removeItem(PROFILE_SETUP.ROLE);
      }
    };
  }, [formMethods.formState.isSubmitSuccessful]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <RoleSelection
            setRole={setRole}
            onNext={(selectedRole) => {
              setRole(selectedRole);
              localStorage.setItem(
                PROFILE_SETUP.ROLE,
                JSON.stringify(selectedRole)
              );
              handleNext();
            }}
            role={role}
          />
        );
      case 1:
        return <BasicInfo onNext={handleNext} onBack={handleBack} />;
      case 2:
        return (
          <FormProvider {...formMethods}>
            {role === "host" ? (
              <HostDetails onNext={handleNext} onBack={handleBack} />
            ) : (
              <GuestDetails onNext={handleNext} onBack={handleBack} />
            )}
          </FormProvider>
        );
      case 3:
        return (
          <ReviewSubmit
            role={role}
            onSubmit={handleFinalSubmit}
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold dark:text-white">
                  Profile Setup
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Step {currentStep + 1} of {totalSteps}
                </span>
              </div>
              <Progress value={progress} className="h-2 dark:bg-gray-700" />
            </div>
            <FormProvider {...formMethods}>{renderStep()}</FormProvider>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSetup;
