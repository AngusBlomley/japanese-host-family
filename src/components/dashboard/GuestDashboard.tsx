import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Profile, Listing } from "@/types/user";
import { formatPrice } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Loader2 } from "lucide-react";

interface GuestDashboardProps {
  profile: Profile;
}

const SavedListingCard = ({
  listing,
  onUnsave,
}: {
  listing: Listing;
  onUnsave: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <Card
      className="flex flex-col md:flex-row w-full hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/listings/${listing.id}`)}
    >
      <div className="md:w-1/3 relative">
        {listing.images && listing.images.length > 0 && (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-48 md:h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
          />
        )}
      </div>
      <div className="flex-1 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold">{listing.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {listing.city}, {listing.prefecture}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="bg-gray-100 hover:bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/listings/${listing.id}`);
              }}
            >
              View Details
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-gray-100 hover:bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                onUnsave();
              }}
            >
              <Star className="fill-yellow-400" />
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-600 line-clamp-2">
            {listing.description}
          </p>
          <div className="flex items-center gap-4">
            <p className="text-lg font-semibold">
              {formatPrice(listing.pricing.base_rate, listing.pricing.type)}
            </p>
            <span className="text-sm text-gray-500">•</span>
            <p className="text-sm">
              {listing.room_type === "private" ? "Private Room" : "Shared Room"}
            </p>
            <span className="text-sm text-gray-500">•</span>
            <p className="text-sm">Max {listing.max_guests} guests</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {listing.amenities.slice(0, 3).map((amenity) => (
            <Badge key={amenity} variant="secondary">
              {amenity}
            </Badge>
          ))}
          {listing.amenities.length > 3 && (
            <Badge variant="secondary">
              +{listing.amenities.length - 3} more
            </Badge>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Meal Plan:{" "}
              <span className="capitalize">
                {listing.meal_plan?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Available from:{" "}
              {new Date(listing.available_from).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

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

  const handleUnsave = async (listingId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);

      if (error) throw error;

      setSavedListings((prev) =>
        prev.filter((listing) => listing.id !== listingId)
      );
      toast({
        title: "Success",
        description: "Listing removed from favorites",
      });
    } catch (error) {
      console.error("Error removing listing:", error);
      toast({
        title: "Error",
        description: "Failed to remove listing from favorites",
        variant: "destructive",
      });
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
              <SavedListingCard
                key={listing.id}
                listing={listing}
                onUnsave={() => handleUnsave(listing.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestDashboard;
