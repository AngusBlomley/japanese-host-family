import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { User } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);


  useEffect(() => {
    const checkUserProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      // Check both profile tables
      const { data: hostProfile } = await supabase
        .from("host_profiles")
        .select("profileComplete")
        .eq("userId", user.id)
        .single();

      const { data: guestProfile } = await supabase
        .from("guest_profiles")
        .select("profileComplete")
        .eq("userId", user.id)
        .single();

      // User has a complete profile if either profile exists and is complete
      const isComplete =
        (hostProfile?.profileComplete || guestProfile?.profileComplete) ??
        false;
      setProfileComplete(isComplete);
    };

    checkUserProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to Japanese Host Family Finder
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect with Japanese families for an authentic experience
          </p>
          <Button onClick={() => navigate("/auth")} size="lg">
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {profileComplete === false && (
        <div className="max-w-4xl mx-auto mb-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Incomplete Profile</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Please complete your profile to access all features.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/profile-setup")}
              >
                Complete Profile
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <p className="text-gray-600">
          Start exploring Japanese host families here...
        </p>
      </div>
    </div>
  );
};

export default Index;
