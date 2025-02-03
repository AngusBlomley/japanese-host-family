import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import HostDashboard from "@/components/dashboard/HostDashboard";
import GuestDashboard from "@/components/dashboard/GuestDashboard";
import type { Profile } from "@/types/user";

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) setProfile(data);
    };

    fetchProfile();
  }, []);

  if (!profile) return <div>Loading...</div>;

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
