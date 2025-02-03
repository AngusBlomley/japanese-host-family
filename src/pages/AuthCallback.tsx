import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { PasswordInput } from "@/components/ui/password-input";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const isReset = searchParams.get("reset") === "true";

  useEffect(() => {
    if (!isReset) {
      const handleAuthCallback = async () => {
        try {
          // Get user from auth
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            navigate("/auth");
            return;
          }

          // Check if user has a complete profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("profile_complete")
            .eq("user_id", user.id)
            .single();

          if (!profile || !profile.profile_complete) {
            navigate("/profile-setup");
          } else {
            navigate("/dashboard");
          }
        } catch (error) {
          console.error("Error in auth callback:", error);
          navigate("/auth");
        }
      };

      handleAuthCallback();
    }
  }, [navigate, isReset]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Reset Password</h2>
            <p className="mt-2 text-gray-600">Enter your new password</p>
          </div>

          <form onSubmit={handlePasswordReset} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Completing sign in...</h2>
      </div>
    </div>
  );
};

export default AuthCallback;
