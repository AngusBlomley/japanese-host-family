import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Profile, Listing } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";

interface GuestDashboardProps {
  profile: Profile;
}

const GuestDashboard = ({ profile }: GuestDashboardProps) => {
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchSavedListings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("saved_listings")
        .select(
          `
          listings!inner (
            id, host_id, title, description, address, city, prefecture,
            postal_code, pricing, room_type, meal_plan, max_guests,
            amenities, house_rules, available_from, available_to,
            images, status, created_at, updated_at, student_requirements,
            location
          )
        `
        )
        .eq("user_id", user.id);

      if (error) throw error;
      setSavedListings(
        data.map((item) => item.listings) as unknown as Listing[]
      );
    } catch (error) {
      console.error("Error fetching saved listings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch saved listings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedListings();
  }, [profile.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {profile.first_name}!
        </h2>
        <p className="text-gray-600">
          Manage your saved listings and homestay preferences.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Saved Listings</h3>
          <Button variant="outline" onClick={() => navigate("/")}>
            Browse More Listings
          </Button>
        </div>

        {savedListings.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">
              No saved listings yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Browse listings and save the ones you're interested in
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                showSaveButton={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestDashboard;
