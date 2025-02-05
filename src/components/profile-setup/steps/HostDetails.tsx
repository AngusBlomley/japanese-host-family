import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Profile } from "@/validations/profile";
import { FieldErrors, useFormContext } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFormStorage } from "@/hooks/useFormStorage";
import { PROFILE_SETUP } from "@/constants/storage";
import { useEffect } from "react";

interface HostDetailsProps {
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

const HostDetails = ({ onNext, onBack }: HostDetailsProps) => {
  const form = useFormContext<Profile>();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="license_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Host License Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="license_expiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Host License Expiry Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </Form>
  );
};

export default HostDetails;
