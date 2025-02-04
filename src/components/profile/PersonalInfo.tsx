import { useState } from "react";
import { Profile } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

interface PersonalInfoProps {
  profile: Profile;
}

export const PersonalInfo = ({ profile }: PersonalInfoProps) => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.user_id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      setAvatarUrl(publicUrl);
      toast({
        title: "Success",
        description: "Profile photo updated",
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Error",
        description: "Failed to update profile photo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b">
        <div className="flex items-center gap-2">
          <User className="h-8 w-8 text-gray-600" />
          <h2 className="text-2xl font-bold">Personal Information</h2>
        </div>
        <p className="mt-2 text-gray-600">
          Manage your personal details and profile information
        </p>
      </div>

      {/* Profile Photo & Basic Info */}
      <Card
        className={cn(
          "p-6",
          theme === "dark"
            ? "bg-gray-700 border-gray-600"
            : "bg-white border-gray-200"
        )}
      >
        <div className="flex items-start gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl || ""} />
              <AvatarFallback>
                {profile.first_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div
              className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => document.getElementById("photo-upload")?.click()}
            >
              <Pencil className="h-6 w-6 text-white" />
            </div>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              aria-label="Upload profile photo"
            />
          </div>
          <div className="flex-1">
            <div>
              <h3 className="text-lg font-semibold">
                {profile.first_name} {profile.last_name}
              </h3>
              <Badge className="mt-1">{profile.role.toUpperCase()}</Badge>
            </div>
            <p className="mt-4 text-gray-600">{profile.bio}</p>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card
        className={cn(
          "p-6",
          theme === "dark"
            ? "bg-gray-700 border-gray-600"
            : "bg-white border-gray-200"
        )}
      >
        <h3
          className={cn(
            "text-lg font-semibold mb-4",
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          )}
        >
          Contact Information
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Phone</h4>
            <p>{profile.phone_number}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Nationality</h4>
            <p>{profile.nationality}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Languages</h4>
            <p>{profile.languages.join(", ")}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Date of Birth</h4>
            <p>{new Date(profile.date_of_birth).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* Role Specific Information */}
      {profile.role === "host" ? (
        <Card
          className={cn(
            "p-6",
            theme === "dark"
              ? "bg-gray-700 border-gray-600"
              : "bg-white border-gray-200"
          )}
        >
          <h3
            className={cn(
              "text-lg font-semibold mb-4",
              theme === "dark" ? "text-gray-100" : "text-gray-900"
            )}
          >
            Host Information
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Location</h4>
              <p>{profile.address}</p>
              <p>
                {profile.city}, {profile.prefecture}
              </p>
              <p>{profile.postal_code}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Accommodation Details
              </h4>
              <p>Type: {profile.accommodation_type}</p>
              <p>Room Type: {profile.room_type}</p>
              <p>Max Guests: {profile.max_guests}</p>
            </div>
            {profile.amenities && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Amenities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.house_rules && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  House Rules
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.house_rules.map((rule) => (
                    <Badge key={rule} variant="outline">
                      {rule}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card
          className={cn(
            "p-6",
            theme === "dark"
              ? "bg-gray-700 border-gray-600"
              : "bg-white border-gray-200"
          )}
        >
          <h3
            className={cn(
              "text-lg font-semibold mb-4",
              theme === "dark" ? "text-gray-100" : "text-gray-900"
            )}
          >
            Student Information
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Study Purpose
              </h4>
              <p>{profile.study_purpose}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Planned Duration
              </h4>
              <p>{profile.planned_duration} months</p>
            </div>
            {profile.dietary_restrictions && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Dietary Restrictions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.dietary_restrictions.map((restriction) => (
                    <Badge key={restriction} variant="secondary">
                      {restriction}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="col-span-2">
              <h4 className="text-sm font-medium text-gray-500">Budget</h4>
              <p>
                {profile.budget_min?.toLocaleString()} -{" "}
                {profile.budget_max?.toLocaleString()} yen per{" "}
                {profile.budget_period}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
