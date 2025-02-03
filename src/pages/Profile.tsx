import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatWindow from "@/components/chat/ChatWindow";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchProfile();
    fetchConversations();
  }, [user]);

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

  const fetchConversations = async () => {
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

    setConversations(conversationsWithLastMessage);

    // Auto-select first conversation only if we have conversations and none selected
    if (conversationsWithLastMessage.length > 0 && !selectedConversation) {
      setSelectedConversation(conversationsWithLastMessage[0].id);
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg border shadow-sm">
          <Tabs
            defaultValue="personal"
            className="flex w-full min-h-[calc(100vh-12rem)]"
          >
            {/* Sidebar */}
            <div className="w-64 border-r bg-gray-50/40 rounded-l-lg">
              <div className="p-4 sticky top-0">
                <ProfileSidebar />
              </div>
            </div>

            {/* Main Content */}
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

              <TabsContent value="messages" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Conversations List */}
                  <div className="border rounded-lg overflow-y-auto">
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        className={`w-full p-4 text-left border-b last:border-b-0 hover:bg-gray-50 ${
                          selectedConversation === conversation.id
                            ? "bg-gray-50"
                            : ""
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarImage
                              src={
                                conversation.guest_id === user?.id
                                  ? conversation.host.avatar_url
                                  : conversation.guest.avatar_url
                              }
                            />
                            <AvatarFallback>
                              {conversation.guest_id === user?.id
                                ? conversation.host.first_name[0]
                                : conversation.guest.first_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">
                              {conversation.guest_id === user?.id
                                ? `${conversation.host.first_name} ${conversation.host.last_name}`
                                : `${conversation.guest.first_name} ${conversation.guest.last_name}`}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.listing.title}
                            </p>
                            {conversation.last_message && (
                              <p className="text-sm text-gray-600 mt-1 truncate">
                                {conversation.last_message.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Chat Window */}
                  <div className="md:col-span-2 border rounded-lg">
                    {selectedConversation ? (
                      <ChatWindow conversationId={selectedConversation} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        Select a conversation to start chatting
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
