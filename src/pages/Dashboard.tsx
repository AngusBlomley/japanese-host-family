import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import HostDashboard from "@/components/dashboard/HostDashboard";
import GuestDashboard from "@/components/dashboard/GuestDashboard";
import type { Profile } from "@/types/user";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        console.error("Profile fetch error:", error);
        navigate("/profile-setup");
      } else {
        setProfile(data);
      }
    };

    checkProfile();
  }, [navigate]);

  if (!profile)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <>
      <Header />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {profile.role === "host" ? (
            <HostDashboard profile={profile} />
          ) : (
            <GuestDashboard profile={profile} />
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
