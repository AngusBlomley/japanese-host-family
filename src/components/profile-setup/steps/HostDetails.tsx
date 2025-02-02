import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ProfileFormData } from "@/types/user";
import { useFormStorage } from "@/hooks/useFormStorage";

interface HostDetailsProps {
  formData: ProfileFormData;
  setFormData: (data: ProfileFormData) => void;
  onNext: () => void;
  onBack: () => void;
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

const HostDetails = ({
  formData,
  setFormData,
  onNext,
  onBack,
}: HostDetailsProps) => {
  const updateForm = useFormStorage(setFormData);

  const isValid = () => {
    return (
      formData.address &&
      formData.city &&
      formData.prefecture &&
      formData.postalCode &&
      formData.licenseNumber &&
      formData.licenseExpiry &&
      formData.availableFrom &&
      formData.availableTo &&
      formData.pricePerNight > 0
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => updateForm("address", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateForm("city", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="prefecture">Prefecture</Label>
          <Input
            id="prefecture"
            value={formData.prefecture}
            onChange={(e) => updateForm("prefecture", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            value={formData.postalCode}
            onChange={(e) => updateForm("postalCode", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="licenseNumber">Host License Number</Label>
          <Input
            id="licenseNumber"
            value={formData.licenseNumber}
            onChange={(e) => updateForm("licenseNumber", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="licenseExpiry">License Expiry Date</Label>
          <Input
            id="licenseExpiry"
            type="date"
            value={formData.licenseExpiry}
            onChange={(e) => updateForm("licenseExpiry", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="accommodationType">Accommodation Type</Label>
          <Select
            value={formData.accommodationType}
            onValueChange={(value) => updateForm("accommodationType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="roomType">Room Type</Label>
          <Select
            value={formData.roomType}
            onValueChange={(value) => updateForm("roomType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private Room</SelectItem>
              <SelectItem value="shared">Shared Room</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Amenities Available</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {amenities.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={formData.amenities.includes(amenity)}
                onCheckedChange={(checked) => {
                  const newAmenities = checked
                    ? [...formData.amenities, amenity]
                    : formData.amenities.filter((a: string) => a !== amenity);
                  updateForm("amenities", newAmenities);
                }}
              />
              <label htmlFor={amenity} className="text-sm">
                {amenity}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>House Rules</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {houseRules.map((rule) => (
            <div key={rule} className="flex items-center space-x-2">
              <Checkbox
                id={rule}
                checked={formData.houseRules.includes(rule)}
                onCheckedChange={(checked) => {
                  const newRules = checked
                    ? [...formData.houseRules, rule]
                    : formData.houseRules.filter((r: string) => r !== rule);
                  updateForm("houseRules", newRules);
                }}
              />
              <label htmlFor={rule} className="text-sm">
                {rule}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="maxGuests">Maximum Guests</Label>
          <Input
            id="maxGuests"
            type="number"
            min="1"
            value={formData.maxGuests}
            onChange={(e) => updateForm("maxGuests", parseInt(e.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="pricePerNight">Price per Night (¥)</Label>
          <Input
            id="pricePerNight"
            type="number"
            min="0"
            value={formData.pricePerNight}
            onChange={(e) =>
              updateForm("pricePerNight", parseInt(e.target.value))
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="availableFrom">Available From</Label>
          <Input
            id="availableFrom"
            type="date"
            value={formData.availableFrom}
            onChange={(e) => updateForm("availableFrom", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="availableTo">Available To</Label>
          <Input
            id="availableTo"
            type="date"
            value={formData.availableTo}
            onChange={(e) => updateForm("availableTo", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid()}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default HostDetails;
