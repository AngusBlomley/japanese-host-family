import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import ProfileGuard from "@/components/guards/ProfileGuard";
import ProfileSetup from "@/pages/ProfileSetup";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Header from "@/components/layout/Header";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <>
          <Routes>
            <Route path="/auth" element={null} />
            <Route path="/auth/callback" element={null} />
            <Route path="*" element={<Header />} />
          </Routes>

          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/dashboard"
              element={
                <ProfileGuard>
                  <Dashboard />
                </ProfileGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
