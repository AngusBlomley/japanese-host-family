import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const ImageLightbox = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: ImageLightboxProps) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowLeft" && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      }
      if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
        onNavigate(currentIndex + 1);
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length, onNavigate, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[80vw] max-h-[80vh] w-full h-full p-0 border-0 bg-transparent shadow-none focus-visible:ring-0 focus:outline-none focus-visible:outline-none">
        <div className="relative w-full h-full flex items-center justify-center">
          <Button
            className="absolute top-4 right-4 z-50 text-white h-20 w-20 bg-transparent hover:bg-transparent"
            onClick={onClose}
          >
            <span className="text-7xl font-thin bg-transparent">×</span>
          </Button>

          {currentIndex > 0 && (
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:cursor-pointer"
              onClick={() => onNavigate(currentIndex - 1)}
            >
              <ChevronLeft size={80} strokeWidth={1} />
            </div>
          )}

          {currentIndex < images.length - 1 && (
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:cursor-pointer"
              onClick={() => onNavigate(currentIndex + 1)}
            >
              <ChevronRight size={80} strokeWidth={1} />
            </div>
          )}

          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
