import ReactDOM from "react-dom/client";
import App from "./App";
import "@/lib/i18n"; // Ensure i18n is initialized
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>
);
