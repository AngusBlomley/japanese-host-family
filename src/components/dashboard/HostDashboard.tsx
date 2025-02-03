import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Profile, Listing } from "@/types/user";
import { formatPrice } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HostDashboardProps {
  profile: Profile;
}

const ListingCard = ({
  listing,
  onDelete,
}: {
  listing: Listing;
  onDelete: () => void;
}) => {
  return (
    <Card className="flex flex-col md:flex-row w-full">
      {listing.images && listing.images.length > 0 && (
        <div className="md:w-1/3">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-48 md:h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
          />
        </div>
      )}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold">{listing.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {listing.city}, {listing.prefecture}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
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
              Status: <span className="capitalize">{listing.status}</span>
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

const HostDashboard = ({ profile }: HostDashboardProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("host_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch listings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId);

      if (error) throw error;

      setListings((prev) => prev.filter((listing) => listing.id !== listingId));
      toast({
        title: "Success",
        description: "Listing deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchListings();
  }, [profile.id]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Listings</h2>
        <Button
          onClick={() => navigate("/listings/new")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Listing
        </Button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-lg font-medium text-muted-foreground">
            No listings yet
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first listing to start hosting guests
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onDelete={() => handleDelete(listing.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HostDashboard;
