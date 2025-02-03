import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/user";
import type { Profile } from "@/types/user";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [rating, setRating] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile?.avatar_url) {
      fetch(profile.avatar_url).catch((error) => {
        console.error("Avatar fetch error:", error);
      });
    }
  }, [profile?.avatar_url]);

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get the profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    if (profile) {
      setProfile(profile);
      setRole(profile.role);
    }
  };

  const handleUpdate = async () => {
    if (!editedProfile || !role) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from("profiles")
        .update(editedProfile)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Fetch the latest profile data
      await fetchProfile();
      setIsEditing(false);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `public/images/avatars/${Date.now()}.jpg`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      // Get a signed URL that will work for 1 week
      const {
        data: { signedUrl },
      } = await supabase.storage
        .from("avatars")
        .createSignedUrl(fileName, 604800); // 7 days in seconds

      if (!signedUrl) throw new Error("Failed to get signed URL");

      // Update the profile with the signed URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: signedUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          avatar_url: signedUrl,
        };
      });

      toast({
        title: "Success",
        description: "Photo updated successfully",
      });
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Error",
        description: error.message || "Error uploading photo",
        variant: "destructive",
      });
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center space-x-4 mb-8">
        <div className="relative group">
          <Avatar className="h-24 w-24 overflow-hidden">
            <AvatarImage
              src={profile?.avatar_url || ""}
              alt={profile?.first_name || "Profile"}
              onLoad={() => {}}
              onError={(e) => {
                console.error("Error loading avatar:", e);
              }}
              className="object-cover w-full h-full rounded-full"
            />
            <AvatarFallback className="bg-muted">
              {profile?.first_name?.[0]?.toUpperCase() ?? "U"}
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
            accept="image/jpeg,image/jpg"
            className="hidden"
            onChange={handlePhotoUpload}
            title="Upload Photo"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {profile?.first_name} {profile?.last_name}
          </h1>
          <Badge className="mt-2 mb-2">
            {profile?.role === "host" ? "HOST" : "GUEST"}
          </Badge>
          <div className="flex items-center space-x-2">
            <Rating value={rating} readonly />
            <span className="text-sm text-gray-500">(4.5 average)</span>
          </div>
        </div>
      </div>
    );
  };

  const renderBasicInfo = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Basic Information</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <p className="text-lg">{`${profile?.first_name} ${profile?.last_name}`}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <p className="text-lg">{profile?.phone_number}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Nationality</label>
          <p className="text-lg">{profile?.nationality}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Languages</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {profile?.languages?.map((lang: string) => (
              <Badge key={lang} variant="secondary">
                {lang}
              </Badge>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Bio</label>
          <p className="text-lg whitespace-pre-wrap">{profile?.bio}</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderHostSpecificInfo = () => {
    // Type guard to ensure we're working with a host profile
    if (!profile || !("address" in profile)) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Host Details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Address</label>
            <p className="text-lg">{profile.address}</p>
            <p className="text-lg">{`${profile?.city}, ${profile?.prefecture} ${profile?.postal_code}`}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Accommodation</label>
            <p className="text-lg">{`${profile?.accommodation_type} - ${profile?.room_type}`}</p>
            <p className="text-lg">{`Max Guests: ${profile?.max_guests}`}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Availability</label>
            <p className="text-lg">{`From: ${new Date(
              profile?.available_from
            ).toLocaleDateString()}`}</p>
            <p className="text-lg">{`To: ${new Date(
              profile?.available_to
            ).toLocaleDateString()}`}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Price</label>
            <p className="text-lg">{`¥${profile?.price_per_night.toLocaleString()} per night`}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Amenities</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile?.amenities?.map((amenity: string) => (
                <Badge key={amenity} variant="outline">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">House Rules</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile?.house_rules?.map((rule: string) => (
                <Badge key={rule} variant="outline">
                  {rule}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGuestSpecificInfo = () => {
    // Type guard to ensure we're working with a guest profile
    if (!profile || !("study_purpose" in profile)) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Study Purpose</label>
            <p className="text-lg whitespace-pre-wrap">
              {profile?.study_purpose || "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Planned Duration</label>
            <p className="text-lg">
              {profile?.planned_duration || "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <p className="text-lg">
              {profile?.start_date
                ? new Date(profile.start_date).toLocaleDateString()
                : "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Budget Range</label>
            <p className="text-lg">
              {profile?.budget_min != null && profile?.budget_max != null
                ? `¥${profile.budget_min.toLocaleString()} - ¥${profile.budget_max.toLocaleString()}`
                : "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Dietary Restrictions</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile?.dietary_restrictions?.length > 0
                ? profile.dietary_restrictions.map((restriction: string) => (
                    <Badge key={restriction} variant="secondary">
                      {restriction}
                    </Badge>
                  ))
                : "None specified"}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Preferred Locations</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile?.preferred_location?.length > 0
                ? profile.preferred_location.map((location: string) => (
                    <Badge key={location} variant="secondary">
                      {location}
                    </Badge>
                  ))
                : "None specified"}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EditProfileForm = ({
    profile,
    role,
    onSave,
    onCancel,
  }: {
    profile: Profile;
    role: UserRole;
    onSave: (editedProfile: Profile) => void;
    onCancel: () => void;
  }) => {
    const [editedProfile, setEditedProfile] = useState(profile);

    const updateField = (field: string, value: any) => {
      setEditedProfile((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={editedProfile.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={editedProfile.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={editedProfile.phone_number}
                    onChange={(e) =>
                      updateField("phone_number", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={editedProfile.date_of_birth}
                    onChange={(e) =>
                      updateField("date_of_birth", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Role-specific fields */}
            {role === "host" ? (
              <HostFields
                profile={editedProfile as Profile}
                updateField={updateField}
              />
            ) : (
              <GuestFields
                profile={editedProfile as Profile}
                updateField={updateField}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onSave(editedProfile)}>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  const HostFields = ({
    profile,
    updateField,
  }: {
    profile: Profile;
    updateField: (field: string, value: string) => void;
  }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Host Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={profile.address}
            onChange={(e) => updateField("address", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={profile.city}
            onChange={(e) => updateField("city", e.target.value)}
          />
        </div>
        {/* Add other host-specific fields */}
      </div>
    </div>
  );

  const GuestFields = ({
    profile,
    updateField,
  }: {
    profile: Profile;
    updateField: (field: string, value: string) => void;
  }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Student Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="study_purpose">Study Purpose</Label>
          <Textarea
            id="study_purpose"
            value={profile.study_purpose}
            onChange={(e) => updateField("study_purpose", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="planned_duration">Planned Duration</Label>
          <Select
            value={profile.planned_duration}
            onValueChange={(value) => updateField("planned_duration", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-3">1-3 months</SelectItem>
              <SelectItem value="3-6">3-6 months</SelectItem>
              <SelectItem value="6-12">6-12 months</SelectItem>
              <SelectItem value="12+">More than 1 year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Add other guest-specific fields */}
      </div>
    </div>
  );

  if (!profile) {
    return <div className="text-center flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderHeader()}
      {renderBasicInfo()}
      {role === "host" ? renderHostSpecificInfo() : renderGuestSpecificInfo()}

      {isEditing && (
        <EditProfileForm
          profile={profile}
          role={role}
          onSave={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};

export default Profile;
