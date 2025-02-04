import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
import { Trash2, KeyRound, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Profile } from "@/types/user";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface SecuritySettingsProps {
  profile: Profile;
}

// Add password schema
const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export const SecuritySettings = ({ profile }: SecuritySettingsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const checkPasswordReset = async () => {
      // Check URL hash for password reset flag
      if (window.location.hash === "#password-reset") {
        setShowPasswordForm(true);
        toast({
          title: "Reset your password",
          description: "Please enter a new password for your account",
        });

        // Clear the hash from the URL
        window.history.replaceState(null, "", window.location.pathname);
      }
    };

    checkPasswordReset();
  }, []);

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      // Delete profile first
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // Then delete auth user
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

  const handlePasswordReset = async (data: PasswordForm) => {
    try {
      setIsResettingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setShowPasswordForm(false);
      reset();
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-gray-600" />
          <h2 className="text-2xl font-bold">Security Settings</h2>
        </div>
        <p className="mt-2 text-gray-600">
          Manage your account security and preferences
        </p>
      </div>

      {/* Security Options */}
      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">Password</h3>
              <p className="text-sm text-gray-500 mt-1">
                Change your account password
              </p>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              <KeyRound className="h-4 w-4" />
              {showPasswordForm ? "Cancel" : "Change Password"}
            </Button>
          </div>

          {showPasswordForm && (
            <form
              onSubmit={handleSubmit(handlePasswordReset)}
              className="mt-4 space-y-4"
            >
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...register("newPassword")}
                />
                {errors.newPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isResettingPassword}
                className="w-full"
              >
                {isResettingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-600">
                Delete Account
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Permanently delete your account and all data
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
    </div>
  );
};
