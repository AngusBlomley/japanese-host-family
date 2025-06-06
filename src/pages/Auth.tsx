import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { PasswordInput } from "@/components/ui/password-input";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}

// Use environment variable instead
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY;

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();

  const location = useLocation();

  useEffect(() => {
    if (location.state?.showSignUp) {
      setIsLogin(false);
    }
  }, [location]);

  const verifyRecaptcha = async () => {
    try {
      return await new Promise<string>((resolve, reject) => {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
              action: "signup",
            });
            resolve(token);
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error("reCAPTCHA error:", error);
      throw new Error("Failed to verify reCAPTCHA");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isResetPassword) {
        const baseUrl = import.meta.env.DEV
          ? import.meta.env.VITE_DEV_BASE_URL
          : import.meta.env.VITE_PROD_BASE_URL;

        // Generate a password reset link directly
        const token = await verifyRecaptcha();
        const redirectUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(
          token
        )}&type=recovery&email=${encodeURIComponent(email)}`;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });

        if (error) throw error;

        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
        setIsResetPassword(false);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const recaptchaToken = await verifyRecaptcha();

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              captchaToken: recaptchaToken,
            },
          },
        });

        if (signUpError) {
          console.error("Signup error:", signUpError);
          throw signUpError;
        }

        toast({
          title: "Success!",
          description: "Please check your email to verify your account.",
        });
      }
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

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center",
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      )}
    >
      <Card
        className={cn(
          "w-full max-w-md p-8",
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        )}
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold">
            {isResetPassword
              ? "Reset Password"
              : isLogin
              ? "Welcome Back"
              : "Create Account"}
          </h2>
          <p
            className={cn(
              "mt-2",
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            )}
          >
            {isResetPassword
              ? "Enter your email to receive a reset link"
              : "Connect with Japanese host families"}
          </p>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 mt-8"
          variant="outline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24"
            viewBox="0 0 24 24"
            width="24"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Sign in with Google
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span
              className={cn(
                "w-full border-t",
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              )}
            />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span
              className={cn(
                "px-2",
                theme === "dark"
                  ? "text-gray-300 bg-gray-800"
                  : "text-gray-500 bg-white"
              )}
            >
              Or continue with
            </span>
          </div>
        </div>

        <form onSubmit={handleAuth} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!isResetPassword && (
              <div>
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {!isLogin && !isResetPassword && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Loading..."
              : isResetPassword
              ? "Send Reset Link"
              : isLogin
              ? "Sign In"
              : "Create Account"}
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setIsResetPassword(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {isLogin
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </button>

            {isLogin && !isResetPassword && (
              <div>
                <button
                  type="button"
                  onClick={() => setIsResetPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {isResetPassword && (
              <div>
                <button
                  type="button"
                  onClick={() => setIsResetPassword(false)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Back to login
                </button>
              </div>
            )}
          </div>
        </form>

        {!isLogin && (
          <p className="text-xs text-gray-500 mt-4 text-center">
            This site is protected by reCAPTCHA and the Google{" "}
            <a
              href="https://policies.google.com/privacy"
              className="text-blue-500 hover:text-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="https://policies.google.com/terms"
              className="text-blue-500 hover:text-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>{" "}
            apply.
          </p>
        )}
      </Card>
    </div>
  );
};

export default Auth;
