import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Pin, Star, Heart, BellOff } from "lucide-react";
import ChatWindow from "@/components/chat/ChatWindow";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { ConversationMenu } from "@/components/chat/ConversationMenu";
import { Badge } from "@/components/ui/badge";
import type { Conversation } from "@/types/user";
import { useTheme } from "@/context/ThemeContext";

const ChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId = searchParams.get("conversation");
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const { theme } = useTheme();
  const [currentProfile, setCurrentProfile] = useState<{ id: string } | null>(
    null
  );

  useEffect(() => {
    if (conversationId) {
      setSelectedConversation(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        setIsLoading(false);
        return;
      }

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
            created_at,
            read_at
          ),
          unread_count,
          is_read,
          is_archived,
          is_deleted,
          is_pinned,
          is_muted,
          is_blocked,
          is_favorite,
          is_starred
        `
        )
        .eq("is_deleted", false)
        .or(`guest_id.eq.${profile.id},host_id.eq.${profile.id}`)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        setIsLoading(false);
        return;
      }

      const conversationsWithLastMessage = data.map((conv) => ({
        ...conv,
        last_message: conv.messages?.[0],
      }));

      setConversations(conversationsWithLastMessage);
      setIsLoading(false);

      if (
        !selectedConversation &&
        !conversationId &&
        conversationsWithLastMessage.length > 0
      ) {
        const firstConversation = conversationsWithLastMessage[0];
        setSelectedConversation(firstConversation.id);
        setSearchParams({ conversation: firstConversation.id });
      }
    };

    fetchConversations();
  }, [conversationId, selectedConversation, setSearchParams, user]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      setCurrentProfile(data);
    };
    fetchProfile();
  }, [user]);

  const updateConversationState = (
    conversationId: string,
    updates: Partial<Conversation>
  ) => {
    setConversations((current) =>
      current.map((conv) =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      )
    );
  };

  const sortedConversations = conversations.sort((a, b) => {
    if (a.is_starred === b.is_starred) {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }
    return a.is_starred ? -1 : 1;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="border rounded-lg">
            {sortedConversations.map((conversation) => (
              <button
                key={conversation.id}
                className={cn(
                  "w-full p-4 text-left border-b last:border-b-0 relative transition-colors",
                  selectedConversation === conversation.id
                    ? theme === "light"
                      ? "bg-gray-100"
                      : "bg-gray-800"
                    : theme === "light"
                    ? "hover:bg-gray-50"
                    : "hover:bg-gray-700"
                )}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="absolute top-2 right-2 flex gap-1">
                  {conversation.is_pinned && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      <Pin className="h-3 w-3 mr-1" /> Pinned
                    </Badge>
                  )}
                  {conversation.is_favorite && (
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-700"
                    >
                      <Heart className="h-3 w-3 mr-1" /> Favorite
                    </Badge>
                  )}
                  {conversation.is_muted && (
                    <Badge variant="secondary" className="bg-gray-100">
                      <BellOff className="h-3 w-3 mr-1" /> Muted
                    </Badge>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar
                      className={cn(conversation.is_blocked && "grayscale")}
                    >
                      <AvatarImage
                        src={
                          conversation.host_id === currentProfile?.id
                            ? conversation.guest.avatar_url
                            : conversation.host.avatar_url
                        }
                      />
                      <AvatarFallback>
                        {conversation.host_id === currentProfile?.id
                          ? conversation.guest.first_name[0]
                          : conversation.host.first_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.is_starred && (
                      <div className="absolute -top-1 -right-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "font-medium",
                          conversation.is_blocked && "line-through"
                        )}
                      >
                        {conversation.host_id === user?.id
                          ? `${conversation.guest.first_name} ${conversation.guest.last_name}`
                          : `${conversation.host.first_name} ${conversation.host.last_name}`}
                      </p>
                      <ConversationMenu
                        conversation={conversation}
                        onStateChange={(updates) =>
                          updateConversationState(conversation.id, updates)
                        }
                      />
                    </div>

                    <p className="text-sm text-gray-500 truncate">
                      {conversation.listing.title}
                    </p>

                    {conversation.last_message && (
                      <div className="flex items-center justify-between mt-1">
                        <p
                          className={cn(
                            "text-sm text-gray-600 truncate",
                            conversation.is_blocked && "italic text-gray-400"
                          )}
                        >
                          {conversation.is_blocked
                            ? "Message blocked"
                            : conversation.last_message.content}
                        </p>
                        {conversation.is_muted && (
                          <BellOff className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedConversation ? (
            <div className="md:col-span-2 border rounded-lg">
              <ChatWindow
                key={selectedConversation}
                conversationId={selectedConversation}
                currentProfile={currentProfile}
              />
            </div>
          ) : (
            <div className="md:col-span-2 border rounded-lg p-8 text-center text-gray-500">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatPage;
