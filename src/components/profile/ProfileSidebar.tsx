import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Shield, Bell, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const ProfileSidebar = () => {
  return (
    <div className="space-y-8">
      <TabsList className="flex flex-col h-auto">
        <TabsTrigger value="personal" className="w-full justify-start">
          <User className="mr-2 h-4 w-4" />
          Personal Info
        </TabsTrigger>
        <TabsTrigger value="settings" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </TabsTrigger>
        <TabsTrigger value="security" className="w-full justify-start">
          <Shield className="mr-2 h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="notifications" className="w-full justify-start">
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </TabsTrigger>
      </TabsList>

      <Button
        variant="outline"
        className="w-full rounded-none justify-start text-red-600 hover:text-red-700"
        onClick={() => supabase.auth.signOut()}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
};
