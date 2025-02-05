import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Profile, Listing } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ListingCard from "@/components/listings/ListingCard";

interface HostDashboardProps {
  profile: Profile;
}

const HostDashboard = ({ profile }: HostDashboardProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchListings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("host_id", user.id)
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

  const handleDelete = async () => {
    if (!listingToDelete) return;

    try {
      const { error } = await supabase.rpc("delete_listing_with_saves", {
        listing_id_param: listingToDelete,
      });

      if (error) throw error;

      setListings((prev) =>
        prev.filter((listing) => listing.id !== listingToDelete)
      );
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
    } finally {
      setListingToDelete(null);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [profile.user_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
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
              onDelete={(id) => setListingToDelete(id)}
              onEdit={(id) => navigate(`/listings/edit/${id}`)}
              showSaveButton={false}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!listingToDelete}
        onOpenChange={() => setListingToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this listing? This action cannot
              be undone. Any saved references to this listing will also be
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListingToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostDashboard;
