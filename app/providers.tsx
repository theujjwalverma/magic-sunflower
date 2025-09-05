"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { PWARegister } from "@/components/pwa-register";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { ThemeProvider } from "@/components/theme-provider";
import { NewThreadProvider } from "@/app/new-thread-context";
import { Toaster } from "@/components/ui/sonner";
import { LoaderRing } from "@/components/ui/loader";
import { checkVersion } from "@/lib/version-utils";
import { useFirebaseNotifications } from "@/lib/useFirebaseNotifications";

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  // Initialize Firebase notifications
  useFirebaseNotifications();

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    setSupabaseClient(client);

    // Check app version on initial load
    checkVersion();
  }, []);

  if (!supabaseClient) {
    // Show ring loader during initialization
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoaderRing size="lg" />
      </div>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <NewThreadProvider>
        <PWARegister />
        <PWAInstallPrompt />
        {children}
      </NewThreadProvider>
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}
