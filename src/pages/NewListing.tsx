import ListingForm from "@/components/listings/ListingForm";
import Header from "@/components/layout/Header";

const NewListing = () => {
  return (
    <>
      <Header />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Create New Listing</h1>
          <ListingForm />
        </div>
      </div>
    </>
  );
};

export default NewListing;
