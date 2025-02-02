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

interface GuestDetailsProps {
  formData: ProfileFormData;
  setFormData: (data: ProfileFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

const dietaryRestrictions = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Gluten-Free",
  "Dairy-Free",
  "Nut Allergy",
  "Seafood Allergy",
];

const preferredLocations = [
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

  const isValid = () => {
    return (
      formData.studyPurpose &&
      formData.plannedDuration &&
      formData.startDate &&
      formData.budgetMin >= 0 &&
      formData.budgetMax > formData.budgetMin
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="studyPurpose">Study Purpose</Label>
        <Textarea
          id="studyPurpose"
          value={formData.studyPurpose}
          onChange={(e) => updateForm("studyPurpose", e.target.value)}
          placeholder="What are your goals for studying in Japan?"
          className="h-32"
          required
        />
      </div>

      <div>
        <Label htmlFor="plannedDuration">Planned Duration of Stay</Label>
        <Select
          value={formData.plannedDuration}
          onValueChange={(value) => updateForm("plannedDuration", value)}
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
          {dietaryRestrictions.map((restriction) => (
            <div key={restriction} className="flex items-center space-x-2">
              <Checkbox
                id={restriction}
                checked={formData.dietaryRestrictions.includes(restriction)}
                onCheckedChange={(checked) => {
                  const newRestrictions = checked
                    ? [...formData.dietaryRestrictions, restriction]
                    : formData.dietaryRestrictions.filter(
                        (r: string) => r !== restriction
                      );
                  updateForm("dietaryRestrictions", newRestrictions);
                }}
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
          {preferredLocations.map((location) => (
            <div key={location} className="flex items-center space-x-2">
              <Checkbox
                id={location}
                checked={formData.preferredLocation.includes(location)}
                onCheckedChange={(checked) => {
                  const newLocations = checked
                    ? [...formData.preferredLocation, location]
                    : formData.preferredLocation.filter(
                        (l: string) => l !== location
                      );
                  updateForm("preferredLocation", newLocations);
                }}
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
          value={formData.startDate}
          onChange={(e) => updateForm("startDate", e.target.value)}
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
            value={formData.budgetMin}
            onChange={(e) => updateForm("budgetMin", parseInt(e.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="budgetMax">Maximum Budget (¥/month)</Label>
          <Input
            id="budgetMax"
            type="number"
            min="0"
            value={formData.budgetMax}
            onChange={(e) => updateForm("budgetMax", parseInt(e.target.value))}
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
