import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentProfile, setCurrentProfile] = useState<{ id: string } | null>(
    null
  );

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      setCurrentProfile(data);
    };

    fetchProfile();
  }, [user?.id]);

  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchUnreadCount = async () => {
      // Get all conversations for the current user
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .or(`host_id.eq.${currentProfile.id},guest_id.eq.${currentProfile.id}`);

      if (convError) {
        console.error("Error fetching conversations:", convError);
        return;
      }

      if (!conversations?.length) {
        setUnreadCount(0);
        return;
      }

      // Get unread messages count
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in(
          "conversation_id",
          conversations.map((c) => c.id)
        )
        .neq("sender_id", currentProfile.id)
        .is("read_at", null);

      if (error) {
        console.error("Error fetching unread count:", error);
        return;
      }

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to message changes
    const channel = supabase
      .channel("unread_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentProfile?.id]);

  return unreadCount;
};
