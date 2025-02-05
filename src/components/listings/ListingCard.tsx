import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ChevronLeft, ChevronRight, Trash2, Pencil } from "lucide-react";
import { formatPrice } from "@/lib/pricing";
import type { Listing } from "@/types/user";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const ImageCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsLoading(true);
  };

  const previousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsLoading(true);
  };

  return (
    <div className="relative w-full h-48 md:h-full">
      {isLoading && (
        <Skeleton className="absolute inset-0 rounded-t-lg md:rounded-l-lg md:rounded-t-none" />
      )}
      <img
        src={images[currentIndex]}
        alt={`Image ${currentIndex + 1}`}
        className={`w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setIsLoading(false)}
      />
      {images.length > 1 && (
        <>
          <button
            onClick={previousImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full ${
                  index === currentIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface ListingCardProps {
  listing: Listing;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  showSaveButton?: boolean;
}

const ListingCard = ({
  listing,
  onDelete,
  onEdit,
  showSaveButton = true,
}: ListingCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Check if listing is saved when component mounts
  useEffect(() => {
    const checkIfSaved = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("saved_listings")
        .select("*")
        .eq("user_id", user.id)
        .eq("listing_id", listing.id)
        .single();

      setIsSaved(!!data);
    };

    if (showSaveButton) {
      checkIfSaved();
    }
  }, [listing.id, showSaveButton]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      if (isSaved) {
        const { error } = await supabase
          .from("saved_listings")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listing.id);

        if (error) throw error;

        setIsSaved(false);
        toast({
          title: "Success",
          description: "Removed from favorites",
        });
      } else {
        const { error } = await supabase.from("saved_listings").insert({
          user_id: user.id,
          listing_id: listing.id,
        });

        if (error) throw error;

        setIsSaved(true);
        toast({
          title: "Success",
          description: "Added to favorites",
        });
      }
    } catch (error) {
      console.error("Error saving listing:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 flex gap-2">
        {onEdit && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onEdit(listing.id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(listing.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Card
        className="flex flex-col md:flex-row w-full hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate(`/listings/${listing.id}`)}
      >
        <div className="md:w-1/3 relative">
          {listing.images && listing.images.length > 0 && (
            <ImageCarousel images={listing.images} />
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
              {showSaveButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-gray-100 hover:bg-gray-200"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Star
                    className={`${isSaved ? "fill-yellow-400" : "fill-none"}`}
                  />
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600 line-clamp-2">
              {listing.description}
            </p>
            <div className="flex items-center gap-4">
              <p className="text-lg font-semibold">
                {formatPrice(listing.pricing.base_rate)}
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
    </div>
  );
};

export default ListingCard;
