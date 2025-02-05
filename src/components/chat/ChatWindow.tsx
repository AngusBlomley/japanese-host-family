import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { Message } from "../../types/user";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatWindowProps {
  conversationId: string;
  currentProfile: { id: string } | null;
}

const ChatWindow = ({ conversationId, currentProfile }: ChatWindowProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const initialLimit = 10;

  useEffect(() => {
    const fetchMessages = async () => {
      // Check if conversation is deleted
      const { data: conversation } = await supabase
        .from("conversations")
        .select("is_deleted")
        .eq("id", conversationId)
        .single();

      if (conversation?.is_deleted) {
        setIsDeleted(true);
        return;
      }

      // NOTE: Fetch the latest messages paginated (newest first) then reverse so they are in chronological order
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
        .order("created_at", { ascending: false })
        .limit(initialLimit);

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      if (data) {
        const messagesAsc = data.reverse();
        setMessages(messagesAsc);
        if (data.length < initialLimit) setHasMore(false);

        // Scroll to the bottom after initial load
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }, 100);
      }

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

    // Subscribe to changes for the conversation (e.g., deletion)
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

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Use a functional update so we don't capture stale state
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;

            (async () => {
              const { data: newMsgData, error } = await supabase
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
              setMessages((current) => [...current, newMsgData]);
              // Scroll to bottom when a new message arrives
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
              }, 50);
            })();
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      conversationChannel.unsubscribe();
      messageChannel.unsubscribe();
    };
  }, [conversationId, user]);

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

      // Insert the new message (the realtime subscription will update the UI)
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        content: newMessage.trim(),
      });

      if (error) {
        console.error("Error sending message:", error);
        return;
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error in sendMessage:", error);
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const grouped: { [date: string]: Message[] } = {};
    msgs.forEach((message) => {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    return grouped;
  };

  // When the user scrolls near the top, fetch older messages (if any)
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    // trigger if near the top (threshold < 50) and if there are older messages
    if (scrollTop < 50 && hasMore && !isLoadingOlderMessages) {
      setIsLoadingOlderMessages(true);
      try {
        const currentScrollHeight =
          messagesContainerRef.current?.scrollHeight || 0;
        const oldestMessage = messages[0];
        if (oldestMessage) {
          const { data: olderMessages, error } = await supabase
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
            .lt("created_at", oldestMessage.created_at)
            .order("created_at", { ascending: false })
            .limit(initialLimit);

          if (error) throw error;

          if (olderMessages && olderMessages.length > 0) {
            const olderMessagesAsc = olderMessages.reverse();
            setMessages((prev) => [...olderMessagesAsc, ...prev]);
            if (olderMessages.length < initialLimit) {
              setHasMore(false);
            }
            // Maintain scroll position by calculating the new scroll height offset
            setTimeout(() => {
              if (messagesContainerRef.current) {
                const newScrollHeight =
                  messagesContainerRef.current.scrollHeight;
                const scrollOffset = newScrollHeight - currentScrollHeight;
                messagesContainerRef.current.scrollTop = scrollOffset;
              }
            }, 0);
          } else {
            setHasMore(false);
          }
        }
      } catch (error) {
        console.error("Error loading older messages:", error);
      } finally {
        setIsLoadingOlderMessages(false);
      }
    }
  };

  const groupedMessages = groupMessagesByDate(messages);

  if (isDeleted) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        This conversation has been deleted
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <ScrollArea
        onScroll={handleScroll}
        viewportRef={messagesContainerRef}
        className="flex-1"
      >
        {isLoadingOlderMessages && (
          <div className="text-center text-sm text-gray-500 my-4">
            Loading older messages...
          </div>
        )}
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="text-center text-sm text-gray-500 my-4">
              {new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="space-y-2">
              {msgs.map((message) => {
                const isCurrentUser = message.sender_id === currentProfile?.id;
                return (
                  <div
                    key={`msg-${message.id}-${message.created_at}`}
                    className={`flex items-start gap-2 my-2 ${
                      isCurrentUser ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={message.sender.avatar_url} />
                      <AvatarFallback>
                        {message.sender.first_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[85%] md:max-w-[70%] rounded-lg p-2 md:p-3 ${
                        isCurrentUser ? "bg-blue-400 text-white" : "bg-muted"
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="break-words whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p className="text-[0.6rem] md:text-[0.65rem] opacity-70 whitespace-nowrap self-end">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>
      <form onSubmit={sendMessage} className="mt-auto p-2 md:p-4 border-t">
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
