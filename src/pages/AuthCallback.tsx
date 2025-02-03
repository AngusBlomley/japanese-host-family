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

  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const isReset = type === "recovery" && token;

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // If it's a password reset flow
        if (type === "recovery") {
          if (!token) {
            console.error("No reset token found");
            navigate("/auth");
            return;
          }
          // Show the password reset form instead of auto-redirecting
          return;
        }

        // Normal OAuth callback flow
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Check if profile exists
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("profile_complete")
          .eq("user_id", user.id)
          .single();

        if (fetchError && fetchError.code === "PGRST116") {
          // Profile doesn't exist, create it
          const { error: createError } = await supabase
            .from("profiles")
            .insert([
              {
                user_id: user.id,
                role: "guest",
                first_name: user.user_metadata?.full_name?.split(" ")[0] || "",
                last_name:
                  user.user_metadata?.full_name
                    ?.split(" ")
                    .slice(1)
                    .join(" ") || "",
                profile_complete: false,
                languages: [],
                avatar_url: user.user_metadata?.avatar_url || null,
              },
            ]);

          if (createError) {
            console.error("Error creating profile:", createError);
            throw createError;
          }
          navigate("/profile-setup");
          return;
        }

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
  }, [navigate, token, type]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!token) {
        throw new Error("No reset token found");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Use the token from the URL to update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      });

      navigate("/auth");
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
