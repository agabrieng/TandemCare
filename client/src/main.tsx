import React from "react";
import { createRoot } from "react-dom/client";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProgressProvider } from "@/contexts/progress-context";
import App from "./App";
import "./index.css";

function Root() {
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
