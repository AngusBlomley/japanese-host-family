import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Listing } from "@/types/user";

const listingSchema = z.object({
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
  images: z
    .array(z.union([z.instanceof(File), z.string()]))
    .refine((files) => files && files.length >= 3 && files.length <= 8, {
      message: "You must upload between 3 and 8 images",
    })
    .default([]),
  student_requirements: z.object({
    min_age: z.number().min(16).max(100).optional(),
    max_age: z.number().min(16).max(100).optional(),
    language_level: z.string().optional(),
    minimum_stay_weeks: z.number().min(1).max(52).optional(),
  }),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  additional_fees: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        amount: z.number().min(0, "Amount must be positive"),
      })
    )
    .optional(),
});

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

interface ListingFormProps {
  initialData?: Listing | null;
}

const ListingForm = ({ initialData }: ListingFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    current: number;
    status: string;
  }>({ total: 0, current: 0, status: "" });

  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          images: initialData.images || [],
          available_from: initialData.available_from.split("T")[0],
          available_to: initialData.available_to.split("T")[0],
          additional_fees: initialData.additional_fees || [],
        }
      : {
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
          student_requirements: {
            min_age: undefined,
            max_age: undefined,
            language_level: "",
            minimum_stay_weeks: undefined,
          },
          images: [],
          additional_fees: [],
        },
    mode: "onChange", // Validate on change
  });

  useEffect(() => {
    if (initialData) {
      // Convert database format to form format
      const formData = {
        ...initialData,
        available_from: initialData.available_from.split("T")[0],
        available_to: initialData.available_to.split("T")[0],
        amenities: initialData.amenities || [],
        house_rules: initialData.house_rules || [],
        pricing: {
          ...initialData.pricing,
          includes: initialData.pricing.includes || {
            breakfast: false,
            lunch: false,
            dinner: false,
            utilities: false,
            wifi: false,
            laundry: false,
          },
        },
        additional_fees: initialData.additional_fees || [],
      };
      form.reset(formData);
    }
  }, [initialData, form]);

  useEffect(() => {
    if (initialData?.images) {
      setImages(
        initialData.images.map((url) => ({
          url,
          file: new File([], url.split("/").pop() || "image.jpg"),
        }))
      );
    }
  }, [initialData]);

  const validateDates = (values: z.infer<typeof listingSchema>) => {
    const errors: Record<string, string> = {};

    if (!values.available_from) {
      errors.available_from = "Available from date is required";
    } else if (isNaN(Date.parse(values.available_from))) {
      errors.available_from = "Invalid date format";
    }

    if (!values.available_to) {
      errors.available_to = "Available to date is required";
    } else if (isNaN(Date.parse(values.available_to))) {
      errors.available_to = "Invalid date format";
    }

    if (values.available_from && values.available_to) {
      const fromDate = new Date(values.available_from);
      const toDate = new Date(values.available_to);
      if (fromDate > toDate) {
        errors.available_to =
          "Available to date must be after available from date";
      }
    }

    return errors;
  };

  const handleSubmit = async (values: z.infer<typeof listingSchema>) => {
    try {
      setIsUploading(true);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (!user) {
        toast({ title: "Authentication required", variant: "destructive" });
        return;
      }

      // Get the list of images to delete
      const imagesToDelete =
        initialData?.images?.filter((url) => !values.images.includes(url)) ||
        [];

      // Delete images from storage
      if (initialData?.id && imagesToDelete.length > 0) {
        // Extract just the file names without query parameters
        const filePaths = imagesToDelete
          .map((url) => {
            const fileName = url.split("/").pop()?.split("?")[0];
            return `${initialData.id}/${fileName}`;
          })
          .filter(Boolean); // Remove any undefined values

        const { error: deleteError } = await supabase.storage
          .from("listings")
          .remove(filePaths);

        if (deleteError) throw deleteError;
      }

      // Handle new image uploads
      const uploadedImageUrls = [
        ...(values.images.filter((img) => typeof img === "string") || []),
        ...(await handleImageUpload(
          values.images?.filter((img) => img instanceof File) || [],
          initialData?.id || ""
        )),
      ];

      const listingData = {
        ...values,
        host_id: user.id,
        images: uploadedImageUrls,
        status: values.status || "published",
        additional_fees: values.additional_fees || [],
      };

      if (initialData) {
        // Update existing listing
        const { error } = await supabase
          .from("listings")
          .update(listingData)
          .eq("id", initialData.id);

        if (error) throw error;
        toast({
          title: "Success! 🎉",
          description: `Your listing "${values.title}" has been updated successfully`,
        });
      } else {
        // Create new listing
        const { error } = await supabase.from("listings").insert([listingData]);
        if (error) throw error;
        toast({
          title: "Congratulations!",
          description: `${values.title} has been created successfully`,
        });
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const [images, setImages] = useState<ImagePreview[]>([]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const validFiles = Array.from(files).filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Error",
          description: `${file.name} is too large. Maximum size is 10MB.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    const newImages = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    if (images.length + newImages.length > 8) {
      toast({
        title: "Error",
        description: "Maximum 8 images allowed",
        variant: "destructive",
      });
      return;
    }

    const currentImages = form.getValues("images") || [];
    form.setValue(
      "images",
      [...currentImages, ...newImages.map((img) => img.file)],
      { shouldValidate: true }
    );

    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = async (index: number) => {
    try {
      const imageToRemove = images[index];
      console.log("Image to remove:", imageToRemove);

      // If it's a stored image (has a URL but no file), delete from storage
      if (
        typeof imageToRemove.url === "string" &&
        !(imageToRemove.file instanceof File)
      ) {
        const fileName = imageToRemove.url.split("/").pop();
        console.log("File name to remove:", fileName);

        if (fileName && initialData?.id) {
          const filePath = `${initialData.id}/${fileName}`;
          console.log("Full file path to remove:", filePath);

          // Delete from Supabase storage
          const { data, error } = await supabase.storage
            .from("listings")
            .remove([filePath]);

          console.log("Storage removal result:", { data, error });

          if (error) throw error;

          // Update the listing in the database to remove the image URL
          const updatedImages =
            form.getValues("images")?.filter((_, i) => i !== index) || [];
          console.log("Updated images array:", updatedImages);

          const { error: updateError } = await supabase
            .from("listings")
            .update({ images: updatedImages })
            .eq("id", initialData.id);

          console.log("Database update result:", { updateError });

          if (updateError) throw updateError;
        }
      }

      // Update UI and form state
      setImages((prev) => {
        const newImages = [...prev];
        URL.revokeObjectURL(newImages[index].url);
        newImages.splice(index, 1);

        const currentImages = form.getValues("images") || [];
        currentImages.splice(index, 1);
        form.setValue("images", currentImages, { shouldValidate: true });

        return newImages;
      });
    } catch (error) {
      console.error("Error removing image:", error);
      toast({
        title: "Error",
        description: "Failed to remove image",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (files: File[], listingId: string) => {
    try {
      const uploadedUrls = [];

      for (const file of files) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${listingId}/${fileName}`;

        // Upload the file
        const { error } = await supabase.storage
          .from("listings")
          .upload(filePath, file);

        if (error) throw error;

        // Get the direct public URL without transformations
        const {
          data: { publicUrl },
        } = supabase.storage.from("listings").getPublicUrl(filePath);

        // Add the URL without any additional query parameters
        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  };

  const RequiredLabel = ({ label }: { label: string }) => (
    <span>
      {label} <span className="text-red-500">*</span>
    </span>
  );

  useEffect(() => {
    const subscription = form.watch(() => {});
    return () => subscription.unsubscribe();
  }, [form.watch]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          handleSubmit(values);
        })}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabel label="Title" />
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Cozy room in central Tokyo"
                  {...field}
                  className={
                    form.formState.errors.title ? "border-red-500" : ""
                  }
                />
              </FormControl>
              {form.formState.errors.title && (
                <FormMessage className="text-red-500 text-sm">
                  {form.formState.errors.title.message}
                </FormMessage>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabel label="Description" />
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your space..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              {form.formState.errors.description && (
                <FormMessage className="text-red-500 text-sm">
                  {form.formState.errors.description.message}
                </FormMessage>
              )}
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel label="Address" />
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                {form.formState.errors.address && (
                  <FormMessage className="text-red-500 text-sm">
                    {form.formState.errors.address.message}
                  </FormMessage>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel label="City" />
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                {form.formState.errors.city && (
                  <FormMessage className="text-red-500 text-sm">
                    {form.formState.errors.city.message}
                  </FormMessage>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prefecture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel label="Prefecture" />
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                {form.formState.errors.prefecture && (
                  <FormMessage className="text-red-500 text-sm">
                    {form.formState.errors.prefecture.message}
                  </FormMessage>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel label="Postal Code" />
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                {form.formState.errors.postal_code && (
                  <FormMessage className="text-red-500 text-sm">
                    {form.formState.errors.postal_code.message}
                  </FormMessage>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_guests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel label="Maximum Guests" />
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                {form.formState.errors.max_guests && (
                  <FormMessage className="text-red-500 text-sm">
                    {form.formState.errors.max_guests.message}
                  </FormMessage>
                )}
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
                  <FormLabel>
                    <RequiredLabel label="Payment Period" />
                  </FormLabel>
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
                  {form.formState.errors.pricing && (
                    <FormMessage className="text-red-500 text-sm">
                      {form.formState.errors.pricing.message}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricing.base_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <RequiredLabel
                      label={`Base Rate (per ${form.getValues(
                        "pricing.type"
                      )})`}
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  {form.formState.errors.pricing && (
                    <FormMessage className="text-red-500 text-sm">
                      {form.formState.errors.pricing.message}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="meal_plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel label="Meal Plan" />
                </FormLabel>
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
                {form.formState.errors.meal_plan && (
                  <FormMessage className="text-red-500 text-sm">
                    {form.formState.errors.meal_plan.message}
                  </FormMessage>
                )}
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormLabel>Included in Price</FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                "breakfast",
                "lunch",
                "dinner",
                "utilities",
                "wifi",
                "laundry",
              ].map((item) => (
                <FormField
                  key={item}
                  control={form.control}
                  name={
                    `pricing.includes.${item}` as
                      | "pricing.includes.breakfast"
                      | "pricing.includes.lunch"
                      | "pricing.includes.dinner"
                      | "pricing.includes.utilities"
                      | "pricing.includes.wifi"
                      | "pricing.includes.laundry"
                  }
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value as boolean}
                          onCheckedChange={(checked: boolean) =>
                            field.onChange(checked)
                          }
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

        <div>
          <Label>Property Images</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={`Listing image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  title="Remove image"
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
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
          <div className="mt-2 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Upload 3-8 images of your property (max 10MB each)
            </p>
            <span className="text-sm text-gray-500">
              {images.length} / 8 images
            </span>
          </div>
          {form.formState.errors.images && (
            <FormMessage className="text-red-500 text-sm">
              {form.formState.errors.images.message}
            </FormMessage>
          )}
        </div>

        <FormField
          control={form.control}
          name="room_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabel label="Room Type" />
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private Room</SelectItem>
                  <SelectItem value="shared">Shared Room</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.room_type && (
                <FormMessage className="text-red-500 text-sm">
                  {form.formState.errors.room_type.message}
                </FormMessage>
              )}
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="available_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel label="Available From" />
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-sm" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="available_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel label="Available To" />
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    min={
                      form.watch("available_from") ||
                      new Date().toISOString().split("T")[0]
                    }
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-sm" />
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
              {form.formState.errors.amenities && (
                <FormMessage className="text-red-500 text-sm">
                  {form.formState.errors.amenities.message}
                </FormMessage>
              )}
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
              {form.formState.errors.house_rules && (
                <FormMessage className="text-red-500 text-sm">
                  {form.formState.errors.house_rules.message}
                </FormMessage>
              )}
            </FormItem>
          )}
        />

        <div className="space-y-4 border rounded-lg p-6">
          <h3 className="text-lg font-semibold">Guest Requirements</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="student_requirements.min_age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <RequiredLabel label="Minimum Age" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  {form.formState.errors.student_requirements && (
                    <FormMessage className="text-red-500 text-sm">
                      {
                        form.formState.errors.student_requirements.min_age
                          ?.message
                      }
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="student_requirements.max_age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <RequiredLabel label="Maximum Age" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  {form.formState.errors.student_requirements && (
                    <FormMessage className="text-red-500 text-sm">
                      {
                        form.formState.errors.student_requirements.max_age
                          ?.message
                      }
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="student_requirements.language_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <RequiredLabel label="Required Language Level" />
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="fluent">Fluent</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.student_requirements && (
                    <FormMessage className="text-red-500 text-sm">
                      {
                        form.formState.errors.student_requirements
                          .language_level?.message
                      }
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="student_requirements.minimum_stay_weeks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <RequiredLabel label="Minimum Stay (weeks)" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  {form.formState.errors.student_requirements && (
                    <FormMessage className="text-red-500 text-sm">
                      {
                        form.formState.errors.student_requirements
                          .minimum_stay_weeks?.message
                      }
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4 border rounded-lg p-6">
          <h3 className="text-lg font-semibold">Additional Fees</h3>
          <div className="space-y-4">
            {form.watch("additional_fees")?.map((fee, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_auto] gap-4 items-start"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`additional_fees.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Cleaning fee" />
                        </FormControl>
                        {form.formState.errors.additional_fees?.[index]
                          ?.description && (
                          <FormMessage className="text-red-500 text-sm">
                            {
                              form.formState.errors.additional_fees[index]
                                ?.description?.message
                            }
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`additional_fees.${index}.amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              ¥
                            </span>
                            <Input
                              type="number"
                              {...field}
                              className="pl-8"
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              placeholder="0"
                            />
                          </div>
                        </FormControl>
                        {form.formState.errors.additional_fees?.[index]
                          ?.amount && (
                          <FormMessage className="text-red-500 text-sm">
                            {
                              form.formState.errors.additional_fees[index]
                                ?.amount?.message
                            }
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 mt-7"
                  onClick={() => {
                    const currentFees = form.getValues("additional_fees") || [];
                    form.setValue(
                      "additional_fees",
                      currentFees.filter((_, i) => i !== index)
                    );
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              form.setValue("additional_fees", [
                ...(form.getValues("additional_fees") || []),
                { description: "", amount: 0 },
              ]);
            }}
          >
            Add Additional Fee
          </Button>
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{uploadProgress.status}</span>
              {uploadProgress.total > 0 && (
                <span>
                  {uploadProgress.current} / {uploadProgress.total} images
                  uploaded
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (uploadProgress.current / uploadProgress.total) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {Object.keys(form.formState.errors).length > 0 && (
          <div className="text-red-500 text-sm">
            Please fix the following errors:
            <ul>
              {Object.entries(form.formState.errors).map(([field, error]) => (
                <li key={field}>
                  {field}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard")}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading}>
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploadProgress.status}
              </div>
            ) : initialData ? (
              "Update Listing"
            ) : (
              "Create Listing"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ListingForm;
