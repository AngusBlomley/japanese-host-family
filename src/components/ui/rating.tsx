import { Star } from "lucide-react";

interface RatingProps {
  value: number;
  max?: number;
  readonly?: boolean;
  onChange?: (value: number) => void;
}

export const Rating = ({
  value,
  max = 5,
  readonly = false,
  onChange,
}: RatingProps) => {
  return (
    <div className="flex items-center space-x-1">
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          className={`w-5 h-5 ${
            i < value
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          } ${!readonly && "cursor-pointer hover:text-yellow-400"}`}
          onClick={() => !readonly && onChange?.(i + 1)}
        />
      ))}
    </div>
  );
};
