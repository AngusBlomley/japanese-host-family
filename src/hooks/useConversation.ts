import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export const useConversation = (conversationId: string) => {
  const [state, setState] = useState({
    is_pinned: false,
    is_starred: false,
    is_favorite: false,
    is_muted: false,
    is_blocked: false,
    is_archived: false,
    is_deleted: false,
  });

  // Fetch initial state
  useEffect(() => {
    const fetchConversationState = async () => {
      const { data } = await supabase
        .from("conversations")
        .select(
          "is_pinned, is_starred, is_favorite, is_muted, is_blocked, is_archived, is_deleted"
        )
        .eq("id", conversationId)
        .single();

      if (data) {
        setState(data);
      }
    };

    fetchConversationState();
  }, [conversationId]);

  const updateState = async (field: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ [field]: value })
        .eq("id", conversationId);

      if (!error) {
        setState((prev) => ({ ...prev, [field]: value }));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      return false;
    }
  };

  const togglePin = async () => {
    await updateState("is_pinned", !state.is_pinned);
  };

  const toggleStar = async () => {
    await updateState("is_starred", !state.is_starred);
  };

  const toggleMute = async () => {
    await updateState("is_muted", !state.is_muted);
  };

  const toggleBlock = async () => {
    await updateState("is_blocked", !state.is_blocked);
  };

  const toggleFavorite = async () => {
    await updateState("is_favorite", !state.is_favorite);
  };

  const archive = () => updateState("is_archived", true);
  const unarchive = () => updateState("is_archived", false);

  const deleteConversation = async () => {
    const success = await updateState("is_deleted", true);
    if (success) {
      // Navigate to chat page without conversation parameter
      window.location.href = "/chat";
    }
  };

  const markAsRead = async () => {
    const { error } = await supabase
      .from("conversations")
      .update({
        is_read: true,
        unread_count: 0,
      })
      .eq("id", conversationId);

    if (error) console.error("Error marking as read:", error);
  };

  return {
    ...state,
    togglePin,
    toggleStar,
    toggleMute,
    toggleBlock,
    toggleFavorite,
    markAsRead,
    archive,
    unarchive,
    deleteConversation,
  };
};
