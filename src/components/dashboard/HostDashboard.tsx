import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Profile, Listing } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import ListingCard from "../listings/ListingCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HostDashboardProps {
  profile: Profile;
}

const HostDashboard = ({ profile }: HostDashboardProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);

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

  const handleDeleteListing = (listingId: string) => {
    setListings((prev) => prev.filter((listing) => listing.id !== listingId));
  };

  const handleDelete = () => {
    if (listingToDelete) {
      handleDeleteListing(listingToDelete);
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
              onDelete={handleDeleteListing}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Delete Listing
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Are you sure you want to delete this listing? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setListingToDelete(null)}
              className="hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostDashboard;
