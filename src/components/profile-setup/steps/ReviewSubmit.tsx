import { Button } from "@/components/ui/button";
import { UserRole, ProfileFormData } from "@/types/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReviewSubmitProps {
  formData: ProfileFormData;
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
    firstName: formData.firstName,
    lastName: formData.lastName,
    phoneNumber: formData.phoneNumber,
    dateOfBirth: formData.dateOfBirth,
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
          postalCode: formData.postalCode,
          licenseNumber: formData.licenseNumber,
          licenseExpiry: formData.licenseExpiry,
          accommodationType: formData.accommodationType,
          roomType: formData.roomType,
          maxGuests: formData.maxGuests,
          amenities: formData.amenities,
          houseRules: formData.houseRules,
          availableFrom: formData.availableFrom,
          availableTo: formData.availableTo,
          pricePerNight: formData.pricePerNight,
        }
      : {
          studyPurpose: formData.studyPurpose,
          plannedDuration: formData.plannedDuration,
          dietaryRestrictions: formData.dietaryRestrictions,
          preferredLocation: formData.preferredLocation,
          startDate: formData.startDate,
          budgetMin: formData.budgetMin,
          budgetMax: formData.budgetMax,
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
