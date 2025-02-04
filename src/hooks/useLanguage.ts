import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import i18n from "@/lib/i18n";

export const useLanguage = () => {
  const { user } = useAuth();

  // Load user's language preference
  const loadLanguage = async () => {
    if (!user) {
      // If no user, use browser language or default to 'en'
      const browserLanguage = navigator.language.split("-")[0];
      const supportedLanguages = ["en", "ja"];
      const language = supportedLanguages.includes(browserLanguage)
        ? browserLanguage
        : "en";
      i18n.changeLanguage(language);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("language")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      const language = profile?.language || "en";
      i18n.changeLanguage(language);
    } catch (error) {
      console.error("Error loading language:", error);
      i18n.changeLanguage("en");
    }
  };

  // Update user's language preference
  const updateLanguage = async (language: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ language })
        .eq("user_id", user.id);

      if (error) throw error;

      i18n.changeLanguage(language);
    } catch (error) {
      console.error("Error updating language:", error);
      throw error;
    }
  };

  // Load language on mount
  useEffect(() => {
    loadLanguage();
  }, [user]);

  return { updateLanguage, loadLanguage };
};
