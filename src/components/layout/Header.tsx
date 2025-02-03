import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, User, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import type { Profile } from "@/types/user";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const unreadCount = useUnreadMessages();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setProfile(data);
    };

    fetchProfile();
  }, [user]);

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return cn(
      "text-sm font-medium transition-colors relative",
      isActive
        ? "text-primary bg-primary/10 px-3 py-2 rounded-md hover:bg-gray-100 px-3 py-2 rounded-md"
        : "text-gray-700 hover:text-gray-900 px-3 py-2 hover:bg-gray-100 px-3 py-2 rounded-md"
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className={getLinkClass("/")}>
              Japanese Host Family
            </Link>
          </div>

          <nav className="flex items-center">
            {user ? (
              <>
                <Link to="/dashboard" className={getLinkClass("/dashboard")}>
                  Dashboard
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center">
                  <Link to="/profile" className={getLinkClass("/profile")}>
                    Profile
                  </Link>
                  <Link to="/chat" className={getLinkClass("/chat")}>
                    Messages
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Logout
                  </Button>
                </div>

                {/* Mobile Icons */}
                <div className="flex md:hidden items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/profile")}
                    className="text-gray-700"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-gray-700"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>

                {/* Avatar - always visible */}
                <Link to="/profile">
                  <Avatar className="h-8 w-8 ml-2">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={
                        profile
                          ? `${profile.first_name} ${profile.last_name}`
                          : "User avatar"
                      }
                    />
                    <AvatarFallback>
                      {profile?.first_name?.[0] ||
                        user?.email?.[0]?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
