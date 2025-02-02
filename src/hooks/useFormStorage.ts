import { Dispatch, SetStateAction, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants/storage";
import { ProfileFormData } from "@/types/user";

export const useFormStorage = (
  setFormData: Dispatch<SetStateAction<ProfileFormData>>
) => {
  const updateForm = useCallback(
    (field: keyof ProfileFormData, value: unknown) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };
        localStorage.setItem(
          STORAGE_KEYS.PROFILE_SETUP.FORM_DATA,
          JSON.stringify(newData)
        );
        return newData;
      });
    },
    [setFormData]
  );

  return updateForm;
};
