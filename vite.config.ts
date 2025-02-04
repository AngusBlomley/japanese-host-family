import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env": {
      VITE_PROD_BASE_URL: JSON.stringify(process.env.VITE_PROD_BASE_URL),
      VITE_DEV_BASE_URL: JSON.stringify(process.env.VITE_DEV_BASE_URL),
      VITE_SUPABASE_URL: JSON.stringify(process.env.VITE_SUPABASE_URL),
      VITE_SUPABASE_PUBLISHABLE_KEY: JSON.stringify(
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY
      ),
      VITE_GOOGLE_RECAPTCHA_SITE_KEY: JSON.stringify(
        process.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY
      ),
    },
  },
}));
