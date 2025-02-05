import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Profile } from "@/validations/profile";
import { languages, nationalities } from "../constants";

interface BasicInfoProps {
  onNext: () => void;
  onBack: () => void;
}

const BasicInfo = ({ onNext, onBack }: BasicInfoProps) => {
  const form = useFormContext<Profile>();
  const { handleSubmit } = form;

  const topLanguages = languages.slice(0, 5);
  const otherLanguages = languages.slice(5);

  const isValid = () => {
    const valid = !!(
      form.getValues().first_name &&
      form.getValues().last_name &&
      form.getValues().phone_number &&
      form.getValues().date_of_birth &&
      form.getValues().nationality
    );
    return valid;
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onNext)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div>
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nationality</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {nationalities.map((nationality) => (
                      <SelectItem key={nationality} value={nationality}>
                        {nationality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="languages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Languages Spoken</FormLabel>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {topLanguages.map((language) => (
                    <Button
                      key={language}
                      type="button"
                      variant={
                        field.value?.includes(language) ? "default" : "outline"
                      }
                      className="dark:border-gray-600 dark:text-white"
                      onClick={() => {
                        const newLanguages = field.value?.includes(language)
                          ? field.value.filter((l: string) => l !== language)
                          : [...(field.value || []), language];
                        field.onChange(newLanguages);
                      }}
                    >
                      {language}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !field.value?.includes(value)) {
                        field.onChange([...(field.value || []), value]);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select other languages" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherLanguages.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap gap-2">
                    {field.value
                      ?.filter((l) => !topLanguages.includes(l))
                      .map((language) => (
                        <Button
                          key={language}
                          type="button"
                          variant="outline"
                          className="dark:border-gray-600 dark:text-white"
                          onClick={() => {
                            field.onChange(
                              field.value.filter((l) => l !== language)
                            );
                          }}
                        >
                          {language} ×
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="h-32 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="Tell us about yourself..."
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
            onClick={() => {
              onNext();
            }}
            disabled={!isValid()}
          >
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BasicInfo;
