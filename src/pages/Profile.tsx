import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile as ProfileType } from "@/types/user";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PersonalInfo } from "@/components/profile/PersonalInfo";
import { SecuritySettings } from "@/components/profile/SecuritySettings";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import Header from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import { Settings } from "@/components/profile/Settings";

const Profile = () => {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex">
        <Tabs defaultValue="personal" className="flex w-full">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50/40 min-h-screen p-2">
            <ProfileSidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <TabsContent value="personal">
              <PersonalInfo profile={profile} />
            </TabsContent>

            <TabsContent value="security">
              <SecuritySettings profile={profile} />
            </TabsContent>

            <TabsContent value="settings">
              <Settings profile={profile} />
            </TabsContent>

            <TabsContent value="notifications">
              <h2 className="text-2xl font-bold">Notifications</h2>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
};

export default Profile;
