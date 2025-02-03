import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessages = () => {
  const { user, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user?.id) return;

    const fetchUnreadCount = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!profile?.id) return;

        const { count } = await supabase.rpc("get_unread_messages_count", {
          profile_id: profile.id,
        });

        setUnreadCount(count ?? 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    const channel = supabase
      .channel("unread_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        fetchUnreadCount
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, loading]);

  return unreadCount;
};
