import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProfileGuardProps {
  children: React.ReactNode;
}

const ProfileGuard = ({ children }: ProfileGuardProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check both profile tables
      const { data: hostProfile } = await supabase
        .from("host_profiles")
        .select("profileComplete")
        .eq("userId", user.id)
        .single();

      const { data: guestProfile } = await supabase
        .from("guest_profiles")
        .select("profileComplete")
        .eq("userId", user.id)
        .single();

      const isComplete = (hostProfile?.profileComplete || guestProfile?.profileComplete) ?? false;

      if (!isComplete) {
        navigate("/profile-setup");
        return;
      }

      setIsChecking(false);
    };

    checkProfile();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProfileGuard; 