import { Dispatch, SetStateAction, useCallback } from "react";
import { PROFILE_SETUP,  } from "@/constants/storage";
import { Profile } from "@/types/user";


export const useFormStorage = (
  setFormData: Dispatch<SetStateAction<Profile>>
) => {
  const updateForm = useCallback(
    (field: keyof Profile, value: unknown) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };
        localStorage.setItem(
          PROFILE_SETUP.FORM_DATA,
          JSON.stringify(newData)
        );
        return newData;
      });
    },
    [setFormData]
  );

  return updateForm;
};
