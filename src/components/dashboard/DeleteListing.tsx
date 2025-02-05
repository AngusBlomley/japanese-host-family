import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

export const deleteListing = async (listingId: string) => {
  try {
    // 1. Delete all files in the listing's storage folder
    const { data: files, error: listError } = await supabase.storage
      .from("listings")
      .list(listingId);

    if (listError) throw listError;

    if (files.length > 0) {
      const filePaths = files.map((file) => `${listingId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from("listings")
        .remove(filePaths);

      if (deleteError) throw deleteError;
    }

    // 2. Delete the listing from the database
    const { error: deleteListingError } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (deleteListingError) throw deleteListingError;

    return true;
  } catch (error) {
    console.error("Error deleting listing:", error);
    throw error;
  }
};

// Usage example in a component
const DeleteListingButton = ({ listingId }: { listingId: string }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this listing? This action cannot be undone."
      );
      if (!confirmed) return;

      await deleteListing(listingId);

      toast({
        title: "Success",
        description: "Listing deleted successfully",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    }
  };

  return (
    <Button variant="destructive" onClick={handleDelete}>
      Delete Listing
    </Button>
  );
};

export default DeleteListingButton;
