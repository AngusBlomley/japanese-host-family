import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Listing } from "@/types/user";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatPrice } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft, MessageCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import ImageLightbox from "@/components/ui/image-lightbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchListing = async () => {
      try {
        // Get listing with host profile in a single query
        const { data: listing, error: listingError } = await supabase
          .from("listings")
          .select(
            `
            *,
            host:profiles!listings_host_id_fkey(
              id,
              first_name,
              last_name,
              avatar_url,
              bio,
              languages,
              nationality
            )
          `
          )
          .eq("id", id)
          .single();

        if (listingError) {
          console.error("Supabase query error:", listingError);
          throw listingError;
        }

        console.log("Fetched listing data:", listing);
        console.log("Host data:", listing?.host);

        setListing(listing);

        // Check if listing is saved
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: savedListing, error: savedError } = await supabase
            .from("saved_listings")
            .select("*")
            .eq("user_id", user.id)
            .eq("listing_id", id)
            .maybeSingle();

          if (savedError && savedError.code !== "PGRST116") {
            console.error("Error checking saved status:", savedError);
          }

          setIsSaved(!!savedListing);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        toast({
          title: "Error",
          description: "Failed to fetch listing details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleSave = async () => {
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
          .eq("listing_id", id);

        if (error) throw error;
        setIsSaved(false);
        toast({
          title: "Success",
          description: "Removed from favorites",
        });
      } else {
        const { error } = await supabase.from("saved_listings").insert({
          user_id: user.id,
          listing_id: id,
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

  const handleContactHost = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Here you would typically send the message to your backend
      // For now, we'll just show a success toast
      toast({
        title: "Success",
        description: "Message sent to host",
      });
      setMessage("");
      setIsContactDialogOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!listing) {
    return <div>Listing not found</div>;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Images Section */}
            <div className="space-y-4">
              {listing.images && listing.images.length > 0 && (
                <div
                  className="aspect-video rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImageIndex(0)}
                >
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  />
                </div>
              )}
              {/* Additional images grid */}
              <div className="grid grid-cols-4 gap-2">
                {listing.images?.slice(1).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => setSelectedImageIndex(index + 1)}
                  >
                    <img
                      src={image}
                      alt={`${listing.title} ${index + 2}`}
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold">{listing.title}</h1>
                  <p className="text-gray-500">
                    {listing.city}, {listing.prefecture}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Star
                      className={`${isSaved ? "fill-yellow-400" : "fill-none"}`}
                    />
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => setIsContactDialogOpen(true)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact {listing.host.first_name}
                  </Button>
                </div>
              </div>

              <div className="prose max-w-none">
                <p>{listing.description}</p>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Pricing</h2>
                <p className="text-2xl font-bold">
                  {formatPrice(listing.pricing.base_rate, listing.pricing.type)}
                </p>
                <div className="mt-2 space-y-2">
                  {Object.entries(listing.pricing.includes)
                    .filter(([_, included]) => included)
                    .map(([service]) => (
                      <Badge key={service} variant="outline">
                        {service.replace(/_/g, " ")}
                      </Badge>
                    ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Room Type</h3>
                    <p className="capitalize">
                      {listing.room_type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Max Guests</h3>
                    <p>{listing.max_guests}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Meal Plan</h3>
                    <p className="capitalize">
                      {listing.meal_plan?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Availability</h3>
                    <p>
                      {new Date(listing.available_from).toLocaleDateString()} -{" "}
                      {new Date(listing.available_to).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {listing.student_requirements && (
                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Student Requirements
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {listing.student_requirements.min_age && (
                      <div>
                        <h3 className="font-medium">Minimum Age</h3>
                        <p>{listing.student_requirements.min_age}</p>
                      </div>
                    )}
                    {listing.student_requirements.max_age && (
                      <div>
                        <h3 className="font-medium">Maximum Age</h3>
                        <p>{listing.student_requirements.max_age}</p>
                      </div>
                    )}
                    {listing.student_requirements.language_level && (
                      <div>
                        <h3 className="font-medium">Language Level</h3>
                        <p>{listing.student_requirements.language_level}</p>
                      </div>
                    )}
                    {listing.student_requirements.minimum_stay_weeks && (
                      <div>
                        <h3 className="font-medium">Minimum Stay</h3>
                        <p>
                          {listing.student_requirements.minimum_stay_weeks}{" "}
                          weeks
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">House Rules</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.house_rules.map((rule) => (
                    <Badge key={rule} variant="outline">
                      {rule}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Host section */}
          {listing.host && (
            <div className="mt-8 p-6 border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">About Your Host</h2>

              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={listing.host.avatar_url}
                    alt={`${listing.host.first_name} ${listing.host.last_name}`}
                  />
                  <AvatarFallback>{listing.host.first_name[0]}</AvatarFallback>
                </Avatar>

                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="text-xl font-medium">
                      {listing.host.first_name} {listing.host.last_name}
                    </h3>
                    {listing.host.rating !== undefined && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 font-medium">
                            {listing.host.rating?.toFixed(1) || "New"}
                          </span>
                        </div>
                        {listing.host.total_ratings > 0 && (
                          <span className="text-gray-600">
                            ({listing.host.total_ratings} reviews)
                          </span>
                        )}
                      </div>
                    )}
                    {listing.host.bio && (
                      <p className="mt-2 text-gray-600">{listing.host.bio}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-500">
                        From
                      </h4>
                      <p>{listing.host.nationality}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-500">
                        Languages
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {listing.host.languages?.map((language) => (
                          <Badge key={language} variant="secondary">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Host Dialog */}
          <Dialog
            open={isContactDialogOpen}
            onOpenChange={setIsContactDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contact Host</DialogTitle>
                <DialogDescription>
                  Send a message to the host of this listing. They will respond
                  to you directly.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="Write your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsContactDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleContactHost}>Send Message</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Image Lightbox */}
      {listing.images && (
        <ImageLightbox
          images={listing.images}
          currentIndex={selectedImageIndex}
          isOpen={selectedImageIndex !== -1}
          onClose={() => setSelectedImageIndex(-1)}
          onNavigate={setSelectedImageIndex}
        />
      )}
    </>
  );
};

export default ListingDetail;
