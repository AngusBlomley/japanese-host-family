import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Listing } from "@/types/user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePlus, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const listingSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    postal_code: z.string().min(1, "Postal code is required"),
    prefecture: z.string().min(1, "Prefecture is required"),
    pricing: z.object({
      type: z.enum(["weekly", "monthly"]),
      base_rate: z.number().min(1, "Base rate is required"),
      includes: z.object({
        breakfast: z.boolean(),
        lunch: z.boolean(),
        dinner: z.boolean(),
        utilities: z.boolean(),
        wifi: z.boolean(),
        laundry: z.boolean(),
      }),
    }),
    room_type: z.enum(["private", "shared"]),
    meal_plan: z.enum(["none", "breakfast_only", "half_board", "full_board"]),
    max_guests: z.number().min(1, "Maximum guests is required"),
    amenities: z.array(z.string()),
    house_rules: z.array(z.string()),
    available_from: z.string(),
    available_to: z.string(),
    images: z.array(z.string()).optional(),
    location: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
      })
      .optional(),
    student_requirements: z
      .object({
        min_age: z.number().optional(),
        max_age: z.number().optional(),
        language_level: z.string().optional(),
        minimum_stay_weeks: z.number().optional(),
      })
      .optional(),
    status: z.enum(["draft", "published", "archived"]).default("published"),
  })
  .refine(
    (data) => {
      if (data.images && data.images.length > 8) {
        return false;
      }
      return true;
    },
    {
      message: "Maximum 8 images allowed",
      path: ["images"],
    }
  );

interface ImagePreview {
  file: File;
  url: string;
}

const amenities = [
  "Wi-Fi",
  "Private Bathroom",
  "Air Conditioning",
  "Heating",
  "Desk",
  "Washing Machine",
  "Kitchen Access",
  "Bicycle Available",
];

const houseRules = [
  "No Smoking",
  "No Pets",
  "No Overnight Guests",
  "Quiet Hours",
  "No Alcohol",
  "Fixed Curfew",
  "Shared Cleaning Duties",
];

const ListingForm = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      description: "",
      address: "",
      city: "",
      prefecture: "",
      postal_code: "",
      amenities: [],
      house_rules: [],
      available_from: "",
      available_to: "",
      pricing: {
        type: "monthly" as const,
        base_rate: 0,
        includes: {
          breakfast: false,
          lunch: false,
          dinner: false,
          utilities: false,
          wifi: false,
          laundry: false,
        },
      },
      room_type: "private" as const,
      meal_plan: "none" as const,
      max_guests: 1,
      status: "published" as const,
      location: {
        latitude: 0,
        longitude: 0,
      },
      student_requirements: {
        min_age: undefined,
        max_age: undefined,
        language_level: "",
        minimum_stay_weeks: undefined,
      },
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].url); // Clean up object URL
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const onSubmit = async (values: z.infer<typeof listingSchema>) => {
    try {
      console.log("Starting form submission with values:", values);
      setIsUploading(true);

      // Get current user's profile for host_id
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Current user:", user);
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      console.log("User profile:", profile);
      if (!profile) throw new Error("Profile not found");

      // Upload images first
      console.log("Starting image upload, images:", images);
      const imageUrls = await Promise.all(
        images.map(async ({ file }) => {
          try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            const filePath = `${profile.id}/${fileName}`;

            console.log("Uploading file:", filePath);
            const { error: uploadError, data } = await supabase.storage
              .from("listings")
              .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
              });

            if (uploadError) {
              console.error("Error uploading file:", uploadError);
              throw uploadError;
            }

            const {
              data: { publicUrl },
            } = supabase.storage.from("listings").getPublicUrl(filePath);

            console.log("File uploaded, public URL:", publicUrl);
            return publicUrl;
          } catch (error) {
            console.error("Error processing image:", error);
            throw error;
          }
        })
      );

      console.log("All images uploaded, URLs:", imageUrls);

      // Then create the listing
      const listingData = {
        ...values,
        host_id: profile.id,
        images: imageUrls,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log("Creating listing with data:", listingData);

      const { error } = await supabase.from("listings").insert(listingData);

      if (error) {
        console.error("Error inserting listing:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Listing created successfully",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating listing:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create listing",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Cozy room in central Tokyo"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your space..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prefecture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prefecture</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_guests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Guests</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Pricing & Inclusions</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pricing.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Period</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricing.base_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Rate (¥)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="meal_plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meal Plan</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Room Only (No Meals)</SelectItem>
                    <SelectItem value="breakfast_only">
                      Breakfast Only
                    </SelectItem>
                    <SelectItem value="half_board">
                      Half Board (Breakfast & Dinner)
                    </SelectItem>
                    <SelectItem value="full_board">
                      Full Board (All Meals)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormLabel>Included in Price</FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {["utilities", "wifi", "laundry"].map((item) => (
                <FormField
                  key={item}
                  control={form.control}
                  name={`pricing.includes.${item}`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="capitalize">
                        {item.replace("_", " ")}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Property Images</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-32 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
              <ImagePlus className="h-8 w-8 text-gray-400" />
              <span className="mt-2 text-sm text-gray-500">Add Images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm text-gray-500">
            Upload up to 8 images of your property
          </p>
        </div>

        <FormField
          control={form.control}
          name="room_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private Room</SelectItem>
                  <SelectItem value="shared">Shared Room</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="available_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Available From</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="available_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Available To</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="amenities"
          render={() => (
            <FormItem>
              <FormLabel>Amenities</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {amenities.map((amenity) => (
                  <FormField
                    key={amenity}
                    control={form.control}
                    name="amenities"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={amenity}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(amenity)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, amenity])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== amenity
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {amenity}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="house_rules"
          render={() => (
            <FormItem>
              <FormLabel>House Rules</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {houseRules.map((rule) => (
                  <FormField
                    key={rule}
                    control={form.control}
                    name="house_rules"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={rule}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(rule)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, rule])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== rule
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{rule}</FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading}>
            {isUploading ? "Creating..." : "Create Listing"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ListingForm;
