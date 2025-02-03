import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProfileGuardProps {
  children: React.ReactNode;
}

const ProfileGuard = ({ children }: ProfileGuardProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_complete")
        .eq("user_id", user.id)
        .single();

      if (!profile || !profile.profile_complete) {
        navigate("/profile-setup");
        return;
      }

      setLoading(false);
    };

    checkProfile();
  }, [navigate]);

  if (loading) return null;

  return <>{children}</>;
};

export default ProfileGuard;
