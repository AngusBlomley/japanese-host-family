import { useState } from "react";
import { Profile } from "@/types/user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Settings as SettingsIcon, Globe, Bell, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

interface SettingsProps {
  profile: Profile;
}

export const Settings = ({ profile }: SettingsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { updateLanguage } = useLanguage();

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profile.id);

      if (profileError) throw profileError;

      const { error: userError } = await supabase.auth.admin.deleteUser(
        profile.user_id
      );

      if (userError) throw userError;

      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLanguageChange = async (language: string) => {
    try {
      await updateLanguage(language);
      i18n.changeLanguage(language);
      toast({
        title: t("success"),
        description: t("language Updated"),
      });
    } catch (error) {
      console.error("Error updating language:", error);
      toast({
        title: t("error"),
        description: t("language Update Failed"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-gray-600" />
          <h2 className="text-2xl font-bold">{t("settings", "Settings")}</h2>
        </div>
        <p className="mt-2 text-gray-600">
          {t(
            "settingsDescription",
            "Manage your account preferences and settings"
          )}
        </p>
      </div>

      {/* Appearance */}
      <Card
        className={cn(
          "p-6",
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        )}
      >
        <h3
          className={cn(
            "text-lg font-semibold mb-4",
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          )}
        >
          Appearance
        </h3>
        <div className="flex items-start justify-between">
          <div>
            <p
              className={cn(
                "text-sm",
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              )}
            >
              Customize how the app looks on your device
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="theme-toggle"
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
            <Label htmlFor="theme-toggle">Dark Mode</Label>
          </div>
        </div>
      </Card>

      {/* Language */}
      <Card
        className={cn(
          "p-6",
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        )}
      >
        <h3
          className={cn(
            "text-lg font-semibold mb-4",
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          )}
        >
          {t("language")}
        </h3>
        <div className="flex items-start justify-between">
          <div>
            <p
              className={cn(
                "text-sm",
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              )}
            >
              {t("choose Language", "Choose your preferred language")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <select
              title="Language"
              className={cn(
                "form-select text-sm",
                theme === "dark"
                  ? "bg-gray-700 text-gray-100"
                  : "bg-white text-gray-900"
              )}
              value={i18n.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card
        className={cn(
          "p-6",
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        )}
      >
        <h3
          className={cn(
            "text-lg font-semibold mb-4",
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          )}
        >
          Notifications
        </h3>
        <div className="flex items-start justify-between">
          <div>
            <p
              className={cn(
                "text-sm",
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              )}
            >
              Configure your notification preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <Label
              htmlFor="notifications"
              className={cn(
                theme === "dark" ? "text-gray-100" : "text-gray-900"
              )}
            >
              Email Notifications
            </Label>
            <Switch
              id="notifications"
              className={cn(
                theme === "dark"
                  ? "data-[state=checked]:bg-gray-700 data-[state=unchecked]:bg-gray-600"
                  : "data-[state=checked]:bg-gray-200 data-[state=unchecked]:bg-gray-100"
              )}
            />
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card
        className={cn(
          "p-6 border-red-200",
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3
              className={cn(
                "text-lg font-semibold text-red-600",
                theme === "dark" ? "text-gray-100" : "text-gray-900"
              )}
            >
              Danger Zone
            </h3>
            <p
              className={cn(
                "text-sm",
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              )}
            >
              Permanently delete your account and all associated data
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </div>
  );
};
