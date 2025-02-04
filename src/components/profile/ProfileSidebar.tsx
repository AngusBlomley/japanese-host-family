import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Shield, Bell, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export const ProfileSidebar = () => {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        "space-y-8",
        theme === "dark" ? "text-gray-100" : "text-gray-900"
      )}
    >
      <TabsList
        className={cn(
          "flex flex-col h-auto",
          theme === "dark" ? "bg-gray-800" : "bg-gray-50"
        )}
      >
        <TabsTrigger
          value="personal"
          className={cn(
            "w-full justify-start",
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
          )}
        >
          <User className="mr-2 h-4 w-4" />
          Personal Info
        </TabsTrigger>
        <TabsTrigger
          value="settings"
          className={cn(
            "w-full justify-start",
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
          )}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className={cn(
            "w-full justify-start",
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
          )}
        >
          <Shield className="mr-2 h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className={cn(
            "w-full justify-start",
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
          )}
        >
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </TabsTrigger>
      </TabsList>

      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-red-600 hover:text-red-700",
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        )}
        onClick={() => supabase.auth.signOut()}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
};
