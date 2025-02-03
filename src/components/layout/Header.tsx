import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return cn(
      "text-sm font-medium transition-colors",
      isActive
        ? "text-primary bg-primary/10 px-3 py-2 rounded-md"
        : "text-gray-700 hover:text-gray-900 px-3 py-2"
    );
  };

  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className={getLinkClass("/")}>
              Japanese Host Family
            </Link>
          </div>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className={getLinkClass("/dashboard")}>
                  Dashboard
                </Link>
                <Link to="/profile" className={getLinkClass("/profile")}>
                  Profile
                </Link>
              </>
            ) : (
              <Link to="/auth" className={getLinkClass("/auth")}>
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
