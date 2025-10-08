import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProgressProvider } from "@/contexts/progress-context";
import App from "./App";
import "./index.css";

function Root() {
  useEffect(() => {
    const loader = document.getElementById('initial-loader');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.remove();
        }, 300);
      }, 100);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ProgressProvider>
        <App />
        <Toaster />
      </ProgressProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
