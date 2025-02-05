import { Button } from "@/components/ui/button";
import { UserRole, Profile } from "@/types/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFormContext } from "react-hook-form";

interface ReviewSubmitProps {
  role: UserRole;
  onSubmit: (values: Profile) => Promise<void>;
  onBack: () => void;
}

const ReviewSubmit = ({ role, onSubmit, onBack }: ReviewSubmitProps) => {
  const { getValues, formState } = useFormContext<Profile>();
  const formData = getValues();

  const renderValue = (
    value: unknown,
    key?: string,
    parentKey?: string
  ): string => {
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) return value.join(", ");
      return JSON.stringify(value, null, 2);
    }
    if (key === "meal_plan") {
      return (
        {
          none: "No Meals",
          breakfast_only: "Breakfast Only",
          half_board: "Half Board (Breakfast & Dinner)",
          full_board: "Full Board (All Meals)",
        }[value as string] || String(value)
      );
    }
    if (key === "type" && parentKey === "pricing") {
      return value === "weekly" ? "Weekly" : "Monthly";
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
              <dd className="mt-1 text-gray-900">{renderValue(value, key)}</dd>
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
    avatar_url: formData.avatar_url,
  };

  const roleSpecificInfo =
    role === "host"
      ? {
          license_number: formData.license_number,
          license_expiry: formData.license_expiry,
        }
      : {
          dietary_restrictions: formData.dietary_restrictions,
        };

  const handleSubmit = () => {
    console.log("ReviewSubmit - Submitting profile data");
    onSubmit(formData as Profile);
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
        <Button
          onClick={() => {
            console.log("Submit button clicked");
            handleSubmit();
          }}
          disabled={formState.isSubmitting}
        >
          {formState.isSubmitting ? "Submitting..." : "Submit Profile"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewSubmit;
