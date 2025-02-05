import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";

export const useFormStorage = <T extends object>(key: string) => {
  const { watch, reset } = useFormContext();
  const [formData, setFormData] = useState<T>(() => {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : {};
  });

  const updateForm = (field: keyof T, value: T[keyof T]) => {
    const newData = { ...formData, [field]: value };
    localStorage.setItem(key, JSON.stringify(newData));
    setFormData(newData);
  };

  useEffect(() => {
    const storedData = localStorage.getItem(key);
    if (storedData) {
      setFormData(JSON.parse(storedData));
    }
  }, [key]);

  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [key, watch]);

  useEffect(() => {
    const storedData = localStorage.getItem(key);
    if (storedData) {
      reset(JSON.parse(storedData));
    }
  }, [reset, key]);

  return { formData, updateForm };
};
