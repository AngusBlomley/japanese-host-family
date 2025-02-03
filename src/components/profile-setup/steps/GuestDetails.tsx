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
import { Profile } from "@/types/user";
import { useFormStorage } from "@/hooks/useFormStorage";

interface GuestDetailsProps {
  formData: Profile;
  setFormData: (data: Profile) => void;
  onNext: () => void;
  onBack: () => void;
}

// Rename these to DIETARY_OPTIONS and LOCATION_OPTIONS
const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Gluten-Free",
  "Dairy-Free",
  "Nut Allergy",
  "Seafood Allergy",
];

const LOCATION_OPTIONS = [
  "Tokyo",
  "Osaka",
  "Kyoto",
  "Fukuoka",
  "Sapporo",
  "Nagoya",
  "Yokohama",
  "Kobe",
];

const GuestDetails = ({
  formData,
  setFormData,
  onNext,
  onBack,
}: GuestDetailsProps) => {
  const updateForm = useFormStorage(setFormData);

  // Initialize arrays if they don't exist
  const dietaryRestrictions = formData.dietary_restrictions || [];
  const preferredLocations = formData.preferred_location || [];

  const handleDietaryChange = (value: string) => {
    const newDietary = dietaryRestrictions.includes(value)
      ? dietaryRestrictions.filter((item) => item !== value)
      : [...dietaryRestrictions, value];

    updateForm("dietary_restrictions", newDietary);
  };

  const handleLocationChange = (value: string) => {
    const newLocation = preferredLocations.includes(value)
      ? preferredLocations.filter((item) => item !== value)
      : [...preferredLocations, value];

    updateForm("preferred_location", newLocation);
  };

  const isValid = () => {
    return (
      formData.study_purpose &&
      formData.planned_duration &&
      formData.start_date &&
      formData.budget_min >= 0 &&
      formData.budget_max > formData.budget_min
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="studyPurpose">Study Purpose</Label>
        <Textarea
          id="studyPurpose"
          value={formData.study_purpose}
          onChange={(e) => updateForm("study_purpose", e.target.value)}
          placeholder="What are your goals for studying in Japan?"
          className="h-32"
          required
        />
      </div>

      <div>
        <Label htmlFor="plannedDuration">Planned Duration of Stay</Label>
        <Select
          value={formData.planned_duration}
          onValueChange={(value) => updateForm("planned_duration", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-3">1-3 months</SelectItem>
            <SelectItem value="3-6">3-6 months</SelectItem>
            <SelectItem value="6-12">6-12 months</SelectItem>
            <SelectItem value="12+">More than 1 year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Dietary Restrictions</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {DIETARY_OPTIONS.map((restriction) => (
            <div key={restriction} className="flex items-center space-x-2">
              <Checkbox
                id={restriction}
                checked={dietaryRestrictions.includes(restriction)}
                onCheckedChange={() => handleDietaryChange(restriction)}
              />
              <label htmlFor={restriction} className="text-sm">
                {restriction}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Preferred Locations</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {LOCATION_OPTIONS.map((location) => (
            <div key={location} className="flex items-center space-x-2">
              <Checkbox
                id={location}
                checked={preferredLocations.includes(location)}
                onCheckedChange={() => handleLocationChange(location)}
              />
              <label htmlFor={location} className="text-sm">
                {location}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="startDate">Preferred Start Date</Label>
        <Input
          id="startDate"
          type="date"
          value={formData.start_date}
          onChange={(e) => updateForm("start_date", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="budgetMin">Minimum Budget (¥/month)</Label>
          <Input
            id="budgetMin"
            type="number"
            min="0"
            value={formData.budget_min}
            onChange={(e) => updateForm("budget_min", parseInt(e.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="budgetMax">Maximum Budget (¥/month)</Label>
          <Input
            id="budgetMax"
            type="number"
            min="0"
            value={formData.budget_max}
            onChange={(e) => updateForm("budget_max", parseInt(e.target.value))}
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

export default GuestDetails;
