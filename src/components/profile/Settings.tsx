import { useState } from "react";
import { Profile } from "@/types/user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Settings as SettingsIcon,
  Moon,
  Globe,
  Bell,
  Trash2,
} from "lucide-react";
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

interface SettingsProps {
  profile: Profile;
}

export const Settings = ({ profile }: SettingsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-gray-600" />
          <h2 className="text-2xl font-bold">Settings</h2>
        </div>
        <p className="mt-2 text-gray-600">
          Manage your account preferences and settings
        </p>
      </div>

      {/* Appearance */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Appearance</h3>
            <p className="text-sm text-gray-500 mt-1">
              Customize how the app looks on your device
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <Label htmlFor="dark-mode">Dark Mode</Label>
            <Switch id="dark-mode" />
          </div>
        </div>
      </Card>

      {/* Language */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Language</h3>
            <p className="text-sm text-gray-500 mt-1">
              Choose your preferred language
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <select
              className="form-select text-sm"
              aria-label="Select language"
            >
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Notifications</h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure your notification preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <Label htmlFor="notifications">Email Notifications</Label>
            <Switch id="notifications" />
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
            <p className="text-sm text-gray-500 mt-1">
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
