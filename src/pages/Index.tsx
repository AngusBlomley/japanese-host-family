/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { User } from "@supabase/supabase-js";
import Header from "@/components/layout/Header";
import type { Listing } from "@/types/user";
import { formatPrice } from "@/lib/pricing";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Star, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchFilters {
  location: string;
  priceRange: string;
  mealPlan: string;
  roomType: string;
  keyword: string;
}

const ImageCarousel = ({
  images,
  onImageError,
}: {
  images: string[];
  onImageError: (index: number) => void;
}) => {
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
        onError={(e) => onImageError(currentIndex)}
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

const ListingCard = ({ listing }: { listing: Listing }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { theme } = useTheme();

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
        .maybeSingle();

      setIsSaved(!!data);
    };

    checkIfSaved();
  }, [listing.id]);

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
        // Remove from saved listings
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
        // Add to saved listings
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
    <Card
      className="flex flex-col md:flex-row w-full hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/listings/${listing.id}`)}
    >
      <div className="md:w-1/3 relative">
        {listing.images && listing.images.length > 0 && (
          <>
            <ImageCarousel
              images={listing.images.map((img) => img.split("?")[0])}
              onImageError={(index) =>
                console.error(`Error loading image ${index}`)
              }
            />
          </>
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
              className={cn(
                theme === "dark"
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-gray-100 hover:bg-gray-200"
              )}
              onClick={() => navigate(`/listings/${listing.id}`)}
            >
              View Details
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                theme === "dark"
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-gray-100 hover:bg-gray-200"
              )}
              onClick={handleSave}
              disabled={isSaving}
            >
              <Star
                className={`${isSaved ? "fill-yellow-400" : "fill-none"}`}
              />
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-600 line-clamp-2">
            {listing.description}
          </p>

          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold">
              {formatPrice(listing.pricing.base_rate)}/
              {listing.pricing.type === "weekly" ? "week" : "month"}
            </span>
            <span className="text-sm text-gray-500">•</span>
            <p className="text-sm">
              {listing.room_type === "private" ? "Private Room" : "Shared Room"}
            </p>
            <span className="text-sm text-gray-500">•</span>
            <p className="text-sm">Max {listing.max_guests} guests</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              Included in Price
            </h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {Object.entries(listing.pricing.includes)
                .filter(([_, included]) => included)
                .map(([service]) => (
                  <Badge key={service} variant="outline">
                    {service.replace(/_/g, " ")}
                  </Badge>
                ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Meal Plan</h4>
            <p className="mt-1 text-sm capitalize">
              {listing.meal_plan?.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {listing.amenities.map((amenity) => (
            <Badge key={amenity} variant="secondary">
              {amenity}
            </Badge>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">House Rules</h4>
              <div className="mt-1 flex flex-wrap gap-2">
                {listing.house_rules.map((rule) => (
                  <Badge key={rule} variant="outline">
                    {rule}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Availability
              </h4>
              <p className="mt-1 text-sm">
                From: {new Date(listing.available_from).toLocaleDateString()}
                <br />
                To: {new Date(listing.available_to).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {listing.student_requirements && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-500">
              Guest Requirements
            </h4>
            <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
              {listing.student_requirements.min_age && (
                <p>Min Age: {listing.student_requirements.min_age}</p>
              )}
              {listing.student_requirements.max_age && (
                <p>Max Age: {listing.student_requirements.max_age}</p>
              )}
              {listing.student_requirements.language_level && (
                <p>
                  Language Level: {listing.student_requirements.language_level}
                </p>
              )}
              {listing.student_requirements.minimum_stay_weeks && (
                <p>
                  Minimum Stay:{" "}
                  {listing.student_requirements.minimum_stay_weeks} weeks
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    priceRange: "all",
    mealPlan: "all",
    roomType: "all",
    keyword: "",
  });

  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        if (!user) return;

        // Check profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setProfileComplete(profile.profile_complete ?? false);
        } else {
          setProfileComplete(false);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        setProfileComplete(false);
      }
    };

    checkUserProfile();
  }, []);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "published")
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

  useEffect(() => {
    fetchListings();
  }, []);

  const filterListings = (listings: Listing[]) => {
    return listings.filter((listing) => {
      // Location filter
      if (
        filters.location &&
        !`${listing.city} ${listing.prefecture}`
          .toLowerCase()
          .includes(filters.location.toLowerCase())
      ) {
        return false;
      }

      // Price range filter
      if (filters.priceRange && filters.priceRange !== "all") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        if (
          listing.pricing.base_rate < min ||
          listing.pricing.base_rate > max
        ) {
          return false;
        }
      }

      // Meal plan filter
      if (
        filters.mealPlan &&
        filters.mealPlan !== "all" &&
        listing.meal_plan !== filters.mealPlan
      ) {
        return false;
      }

      // Room type filter
      if (
        filters.roomType &&
        filters.roomType !== "all" &&
        listing.room_type !== filters.roomType
      ) {
        return false;
      }

      // Keyword search across multiple fields
      if (filters.keyword) {
        const searchText = `
          ${listing.title} 
          ${listing.description} 
          ${listing.amenities.join(" ")}
          ${listing.house_rules.join(" ")}
        `.toLowerCase();
        return searchText.includes(filters.keyword.toLowerCase());
      }

      return true;
    });
  };

  const filteredListings = filterListings(listings);

  <div className="flex items-center justify-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>;

  return (
    <>
      <Header />
      <div className="min-h-screen p-8">
        {!user && (
          <div className="container mx-auto py-8 border rounded-lg mb-8">
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-4xl font-bold">
                Welcome to Japanese Host Family Finder
              </h1>
              <p className="text-xl text-gray-600">
                Connect with Japanese families for an authentic experience
              </p>
              <Button
                onClick={() =>
                  navigate("/auth", { state: { showSignUp: true } })
                }
                size="lg"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}

        {user && profileComplete === false && (
          <div className="max-w-4xl mx-auto mb-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Incomplete Profile</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Please complete your profile to access all features.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/profile-setup")}
                >
                  Complete Profile
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="container mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Find Your Perfect Homestay
              </h1>
              <p className="text-gray-600">
                Browse through our curated selection of homestays in Japan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search location..."
                className="pl-10"
                value={filters.location}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </div>

            <Select
              value={filters.priceRange}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, priceRange: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Price</SelectItem>
                <SelectItem value="0-50000">Under ¥50,000</SelectItem>
                <SelectItem value="50000-100000">¥50,000 - ¥100,000</SelectItem>
                <SelectItem value="100000-150000">
                  ¥100,000 - ¥150,000
                </SelectItem>
                <SelectItem value="150000-200000">
                  ¥150,000 - ¥200,000
                </SelectItem>
                <SelectItem value="200000-999999999">¥200,000+</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.mealPlan}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, mealPlan: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Meal Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Meal Plan</SelectItem>
                <SelectItem value="none">No Meals</SelectItem>
                <SelectItem value="breakfast_only">Breakfast Only</SelectItem>
                <SelectItem value="half_board">Half Board</SelectItem>
                <SelectItem value="full_board">Full Board</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.roomType}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, roomType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Room Type</SelectItem>
                <SelectItem value="private">Private Room</SelectItem>
                <SelectItem value="shared">Shared Room</SelectItem>
              </SelectContent>
            </Select>

            <div className="md:col-span-4">
              <Input
                placeholder="Search by keyword (amenities, features, etc.)..."
                value={filters.keyword}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, keyword: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredListings.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <h3 className="text-lg font-medium text-muted-foreground">
                  No listings found
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search terms
                </p>
              </div>
            ) : (
              filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
