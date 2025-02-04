import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation, Profile as ProfileType } from "@/types/user";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PersonalInfo } from "@/components/profile/PersonalInfo";
import { SecuritySettings } from "@/components/profile/SecuritySettings";
import { Settings } from "@/components/profile/Settings";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import Header from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const { theme } = useTheme();

  const fetchProfile = useCallback(async () => {
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
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;

    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        listing:listings(title),
        guest:profiles!conversations_guest_id_fkey(
          id, first_name, last_name, avatar_url
        ),
        host:profiles!conversations_host_id_fkey(
          id, first_name, last_name, avatar_url
        ),
        messages:messages(
          content,
          created_at
        )
      `
      )
      .or(`guest_id.eq.${profile.id},host_id.eq.${profile.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return;
    }

    const conversationsWithLastMessage = data.map((conv) => ({
      ...conv,
      last_message: conv.messages?.[0],
    }));

    // Auto-select first conversation only if we have conversations and none selected
    if (conversationsWithLastMessage.length > 0 && !selectedConversation) {
      setSelectedConversation(conversationsWithLastMessage[0].id);
    }
  }, [user, selectedConversation]);

  useEffect(() => {
    fetchProfile();
    fetchConversations();
  }, [fetchProfile, fetchConversations]);

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
    <div
      className={cn(
        "min-h-screen",
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      )}
    >
      <Header />
      <main
        className={cn(
          "container max-w-7xl mx-auto px-4 py-6",
          theme === "dark" ? "text-gray-100" : "text-gray-900"
        )}
      >
        <div
          className={cn(
            "rounded-lg border shadow-sm",
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          )}
        >
          <Tabs
            defaultValue="personal"
            className="flex w-full min-h-[calc(100vh-12rem)]"
          >
            <div className="w-64 border-r bg-gray-50/40 rounded-l-lg">
              <div className="p-4 sticky top-0">
                <ProfileSidebar />
              </div>
            </div>

            <div className="flex-1 p-8">
              <TabsContent value="personal" className="mt-0">
                <PersonalInfo profile={profile} />
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <SecuritySettings profile={profile} />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <Settings profile={profile} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
