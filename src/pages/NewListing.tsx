import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Listing } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";
import ListingForm from "@/components/listings/ListingForm";
import Header from "@/components/layout/Header";
import { Loader2 } from "lucide-react";

const NewListing = () => {
  const { id } = useParams();
  const [initialData, setInitialData] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching listing:", error);
        return;
      }

      setInitialData(data);
      setIsLoading(false);
    };

    fetchListing();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">
            {id ? "Edit Listing" : "Create New Listing"}
          </h1>
          <ListingForm initialData={initialData} />
        </div>
      </div>
    </>
  );
};

export default NewListing;
