import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

interface ChatWindowProps {
  conversationId: string;
}

const ChatWindow = ({ conversationId }: ChatWindowProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentProfile, setCurrentProfile] = useState<{ id: string } | null>(
    null
  );
  const [isDeleted, setIsDeleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      setCurrentProfile(data);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      // First check if conversation is deleted
      const { data: conversation } = await supabase
        .from("conversations")
        .select("is_deleted")
        .eq("id", conversationId)
        .single();

      if (conversation?.is_deleted) {
        setIsDeleted(true);
        return;
      }

      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      console.log("Fetched messages:", data);
      setMessages(data);
      scrollToBottom();

      // Mark messages as read
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("conversation_id", conversationId)
            .neq("sender_id", profile.id)
            .is("read_at", null);
        }
      }
    };

    fetchMessages();

    // Subscribe to conversation changes
    const conversationChannel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload: { new: { is_deleted?: boolean } }) => {
          if (payload.new?.is_deleted) {
            setIsDeleted(true);
            setMessages([]);
          }
        }
      )
      .subscribe();

    // Subscribe to new messages with proper payload handling
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log("New message received:", payload);

          // Fetch the complete message with sender info
          const { data: newMessage, error } = await supabase
            .from("messages")
            .select(
              `
              *,
              sender:profiles(
                id,
                first_name,
                last_name,
                avatar_url
              )
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (error) {
            console.error("Error fetching new message:", error);
            return;
          }

          setMessages((current) => [...current, newMessage]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      conversationChannel.unsubscribe();
      channel.unsubscribe();
    };
  }, [conversationId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        console.error("Profile not found");
        return;
      }

      // First insert the message
      const { data: insertedMessage, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: profile.id,
          content: newMessage.trim(),
        })
        .select(
          `
          *,
          sender:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `
        )
        .single();

      if (error) {
        console.error("Error sending message:", error);
        return;
      }

      // Immediately update the UI with the new message
      setMessages((current) => [...current, insertedMessage]);
      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Error in sendMessage:", error);
    }
  };

  if (isDeleted) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        This conversation has been deleted
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isCurrentUser = message.sender_id === currentProfile?.id;

          return (
            <div
              key={message.id}
              className={`flex items-start gap-2 ${
                isCurrentUser ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={message.sender.avatar_url} />
                <AvatarFallback>{message.sender.first_name[0]}</AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isCurrentUser
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted"
                }`}
              >
                <p>{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
