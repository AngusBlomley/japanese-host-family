import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Profile } from "@/types/user";
import { Form, useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useFormStorage } from "@/hooks/useFormStorage";
import { PROFILE_SETUP } from "@/constants/storage";

interface GuestDetailsProps {
  onNext: () => void;
  onBack: () => void;
}

const GuestDetails = ({ onNext, onBack }: GuestDetailsProps) => {
  const form = useFormContext<Profile>();
  useFormStorage(PROFILE_SETUP.FORM_DATA);

  console.log("GuestDetails - Form values:", form.watch());
  console.log("GuestDetails - Form errors:", form.formState.errors);

  const handleSubmit = (data: Profile) => {
    console.log("GuestDetails - Form submitted with data:", data);
    onNext();
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormField
        control={form.control}
        name="stay_purpose"
        render={({ field }) => {
          console.log(
            "Stay purpose field state:",
            form.getFieldState("stay_purpose")
          );
          return (
            <FormItem>
              <FormLabel>Purpose of Stay</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="What brings you to Japan?"
                  className="h-32"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={form.control}
        name="dietary_restrictions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dietary Restrictions</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value?.join(", ") || ""}
                onChange={(e) => field.onChange(e.target.value.split(/,\s*/))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="submit"
          onClick={() => console.log("Continue button clicked")}
        >
          Continue
        </Button>
      </div>
    </form>
  );
};

export default GuestDetails;
