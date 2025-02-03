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
import { useFormStorage } from "@/hooks/useFormStorage";
import { Profile } from "@/types/user";
import { useToast } from "@/components/ui/use-toast";

interface BasicInfoProps {
  formData: Profile;
  setFormData: (data: Profile) => void;
  onNext: () => void;
  onBack: () => void;
}

const languages = [
  "Japanese",
  "English",
  "Chinese",
  "Korean",
  "Spanish",
  "French",
  "German",
];

const nationalities = [
  "Japanese",
  "American",
  "Chinese",
  "Korean",
  "British",
  "Australian",
  "Canadian",
  // Add more as needed
];

const BasicInfo = ({
  formData,
  setFormData,
  onNext,
  onBack,
}: BasicInfoProps) => {
  const updateForm = useFormStorage(setFormData);
  const { toast } = useToast();

  const validateBasicInfo = () => {
    const errors: string[] = [];

    if (!formData.first_name?.trim()) {
      errors.push("First name is required");
    }
    if (!formData.last_name?.trim()) {
      errors.push("Last name is required");
    }
    if (!formData.phone_number?.trim()) {
      errors.push("Phone number is required");
    }
    if (!formData.date_of_birth) {
      errors.push("Date of birth is required");
    }
    if (!formData.nationality?.trim()) {
      errors.push("Nationality is required");
    }
    if (!formData.languages?.length) {
      errors.push("At least one language is required");
    }
    if (!formData.bio?.trim()) {
      errors.push("Bio is required");
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateBasicInfo();
    if (errors.length > 0) {
      toast({
        title: "Please fix the following errors:",
        description: (
          <ul className="list-disc pl-4">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        ),
        variant: "destructive",
      });
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.first_name}
            onChange={(e) => updateForm("first_name", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.last_name}
            onChange={(e) => updateForm("last_name", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={formData.phone_number}
          onChange={(e) => updateForm("phone_number", e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => updateForm("date_of_birth", e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="nationality">Nationality</Label>
        <Select
          value={formData.nationality}
          onValueChange={(value) => updateForm("nationality", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your nationality" />
          </SelectTrigger>
          <SelectContent>
            {nationalities.map((nationality) => (
              <SelectItem key={nationality} value={nationality}>
                {nationality}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Languages Spoken</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {languages.map((language) => (
            <Button
              key={language}
              type="button"
              variant={
                formData.languages.includes(language) ? "default" : "outline"
              }
              onClick={() => {
                const newLanguages = formData.languages.includes(language)
                  ? formData.languages.filter((l: string) => l !== language)
                  : [...formData.languages, language];
                updateForm("languages", newLanguages);
              }}
            >
              {language}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => updateForm("bio", e.target.value)}
          placeholder="Tell us about yourself..."
          className="h-32"
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
};

export default BasicInfo;
