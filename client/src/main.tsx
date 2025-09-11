import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  registerServiceWorker();
}
