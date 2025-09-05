"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered successfully:", registration);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New content is available, show update prompt
                  if (
                    confirm(
                      "New content is available! Reload to get the latest version?"
                    )
                  ) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });

      // Handle PWA install prompt
      let deferredPrompt: Event | null = null;

      window.addEventListener("beforeinstallprompt", (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;

        // Show custom install button or prompt
        console.log("PWA install prompt available");
      });

      window.addEventListener("appinstalled", () => {
        console.log("PWA was installed");
        deferredPrompt = null;
      });
    }
  }, []);

  return null; // This component doesn't render anything
}

// Function to trigger PWA install (can be called from UI)
export function installPWA() {
  const deferredPrompt = (window as any).deferredPrompt;

  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      console.log("User choice:", choiceResult.outcome);
      (window as any).deferredPrompt = null;
    });
  }
}

// Hook to check if PWA is installed
export function useIsPWAInstalled() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

// Hook to check if PWA install is available
export function useCanInstallPWA() {
  if (typeof window === "undefined") return false;

  return "beforeinstallprompt" in window && !(window as any).deferredPrompt;
}
