import { Button } from "@/components/ui/button";
import { UserRole, Profile } from "@/types/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReviewSubmitProps {
  formData: Profile;
  role: UserRole;
  onSubmit: () => void;
  onBack: () => void;
}

const ReviewSubmit = ({
  formData,
  role,
  onSubmit,
  onBack,
}: ReviewSubmitProps) => {
  const renderValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (value === null || value === undefined) {
      return "Not specified";
    }
    return String(value);
  };

  const renderSection = (title: string, data: Record<string, unknown>) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <dt className="font-medium text-gray-500 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </dt>
              <dd className="mt-1 text-gray-900">{renderValue(value)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );

  const basicInfo = {
    first_name: formData.first_name,
    last_name: formData.last_name,
    phone_number: formData.phone_number,
    date_of_birth: formData.date_of_birth,
    nationality: formData.nationality,
    languages: formData.languages,
    bio: formData.bio,
  };

  const roleSpecificInfo =
    role === "host"
      ? {
          address: formData.address,
          city: formData.city,
          prefecture: formData.prefecture,
          postal_code: formData.postal_code,
          license_number: formData.license_number,
          license_expiry: formData.license_expiry,
          accommodation_type: formData.accommodation_type,
          room_type: formData.room_type,
          max_guests: formData.max_guests,
          amenities: formData.amenities,
          house_rules: formData.house_rules,
          available_from: formData.available_from,
          available_to: formData.available_to,
          pricing: formData.pricing,
          meal_plan: formData.meal_plan,
        }
      : {
          study_purpose: formData.study_purpose,
          planned_duration: formData.planned_duration,
          dietary_restrictions: formData.dietary_restrictions,
          preferred_location: formData.preferred_location,
          start_date: formData.start_date,
          budget_min: formData.budget_min,
          budget_max: formData.budget_max,
        };

  return (
    <div className="space-y-6">
      <CardDescription className="text-center mb-6">
        Please review your information before submitting
      </CardDescription>

      {renderSection("Basic Information", basicInfo)}
      {renderSection(
        role === "host" ? "Host Details" : "Student Details",
        roleSpecificInfo
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit}>Submit Profile</Button>
      </div>
    </div>
  );
};

export default ReviewSubmit;
