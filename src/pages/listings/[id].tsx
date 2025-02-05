import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Listing } from "@/types/user";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatPrice } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import ImageLightbox from "@/components/ui/image-lightbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

const checkIfSaved = async (userId: string, listingId: string) => {
  try {
    const { data, error } = await supabase
      .from("saved_listings")
      .select("id")
      .eq("user_id", userId)
      .eq("listing_id", listingId)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned, not an error
        return false;
      }
      console.error("Error checking saved status:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error in checkIfSaved:", error);
    return false;
  }
};

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const { user } = useAuth();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data: listing, error: listingError } = await supabase
          .from("listings")
          .select(
            `
            *,
            host:profiles!host_id(
              id,
              first_name,
              last_name,
              avatar_url,
              bio,
              nationality,
              languages,
              rating,
              total_ratings
            )
          `
          )
          .eq("id", id)
          .single();

        if (listingError) throw listingError;

        setListing(listing);

        // Check if listing is saved
        if (user) {
          const saved = await checkIfSaved(user.id, id);
          setIsSaved(saved);
        }
      } catch (error) {
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
  }, [id, user]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
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
    try {
      if (!user) {
        navigate("/auth");
        return;
      }

      if (!listing.host) {
        toast({
          title: "Error",
          description: "Host information not available",
          variant: "destructive",
        });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        toast({
          title: "Error",
          description: "Please complete your profile first",
          variant: "destructive",
        });
        return;
      }

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("guest_id", profile.id)
        .eq("host_id", listing.host.id)
        .single();

      if (existingConversation) {
        // If conversation exists, navigate to it
        navigate(`/chat?conversation=${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const { data: newConversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          listing_id: listing.id,
          guest_id: profile.id,
          host_id: listing.host.id,
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Navigate to the chat page with the new conversation
      navigate(`/chat?conversation=${newConversation.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
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
            {/* Left Column */}
            <div className="space-y-4">
              {/* Images Section */}
              <div className="space-y-4">
                {/* Main image */}
                <div
                  className="aspect-[4/3] relative cursor-pointer"
                  onClick={() => setSelectedImageIndex(0)}
                >
                  {listing.images[0] && (
                    <>
                      <img
                        src={listing.images[0].split("?")[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) =>
                          console.error("Error loading main image:", e)
                        }
                      />
                    </>
                  )}
                </div>

                {/* Thumbnail grid */}
                <div className="grid grid-cols-4 gap-2">
                  {listing.images.slice(1).map((image, index) => {
                    return (
                      <div
                        key={index}
                        className="aspect-[4/3] cursor-pointer"
                        onClick={() => setSelectedImageIndex(index + 1)}
                      >
                        <img
                          src={image.split("?")[0]}
                          alt={`${listing.title} ${index + 2}`}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) =>
                            console.error(
                              `Error loading thumbnail ${index + 1}:`,
                              e
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Host section - Moved here */}
              {listing.host && (
                <div className="p-6 border rounded-lg">
                  <h2 className="text-2xl font-semibold mb-4">
                    About Your Host
                  </h2>
                  <div className="flex items-start gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={listing.host.avatar_url}
                        alt={`${listing.host.first_name} ${listing.host.last_name}`}
                      />
                      <AvatarFallback>
                        {listing.host.first_name[0]}
                      </AvatarFallback>
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
                          <p className="mt-2 text-gray-600">
                            {listing.host.bio}
                          </p>
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
            </div>

            {/* Right Column - Details Section */}
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
                  <Button variant="default" onClick={handleContactHost}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact {listing.host?.first_name || "Host"}
                  </Button>
                </div>
              </div>

              <div className="prose max-w-none">
                <p>{listing.description}</p>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Pricing</h2>
                <p className="text-2xl font-bold">
                  {formatPrice(listing.pricing.base_rate)}/
                  {listing.pricing.type === "weekly" ? "week" : "month"}
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
                    Guest Requirements
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
