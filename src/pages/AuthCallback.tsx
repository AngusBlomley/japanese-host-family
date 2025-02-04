import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { PasswordInput } from "@/components/ui/password-input";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();

  const reset = searchParams.get("reset");
  const token = searchParams.get("token");
  const isReset = reset === "true" && token;

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (reset === "true") {
          if (!token) {
            console.error("No reset token found");
            navigate("/auth");
          }
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("profile_complete")
          .eq("user_id", user.id)
          .single();

        if (fetchError && fetchError.code === "PGRST116") {
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
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Error in auth callback:", errorMessage);
        navigate("/auth");
      }
    };

    handleAuthCallback();
  }, [navigate, token, reset]);

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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isReset) {
    return (
      <div
        className={cn(
          "min-h-screen",
          theme === "dark" ? "bg-gray-900" : "bg-gray-50"
        )}
      >
        <div
          className={cn(
            "container max-w-7xl mx-auto px-4 py-6",
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          )}
        >
          <Card
            className={cn(
              "max-w-md mx-auto p-6",
              theme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            )}
          >
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
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      )}
    >
      <div
        className={cn(
          "container max-w-7xl mx-auto px-4 py-6",
          theme === "dark" ? "text-gray-100" : "text-gray-900"
        )}
      >
        <Card
          className={cn(
            "max-w-md mx-auto p-6",
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          )}
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold">Completing sign in...</h2>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthCallback;
