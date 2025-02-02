import { UserRole } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, User } from "lucide-react";

interface RoleSelectionProps {
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  onNext: () => void;
}

const RoleSelection = ({ role, setRole, onNext }: RoleSelectionProps) => {
  return (
    <div className="space-y-6">
      <p className="text-center text-gray-600">
        Please select your role in the homestay program
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={`p-6 cursor-pointer hover:border-primary transition-colors ${
            role === "host" ? "border-primary" : ""
          }`}
          onClick={() => setRole("host")}
        >
          <div className="text-center space-y-4">
            <Home className="w-12 h-12 mx-auto text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Host Family</h3>
              <p className="text-sm text-gray-600">
                I want to host international students
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={`p-6 cursor-pointer hover:border-primary transition-colors ${
            role === "guest" ? "border-primary" : ""
          }`}
          onClick={() => setRole("guest")}
        >
          <div className="text-center space-y-4">
            <User className="w-12 h-12 mx-auto text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Student</h3>
              <p className="text-sm text-gray-600">
                I'm looking for a host family
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!role}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default RoleSelection;
