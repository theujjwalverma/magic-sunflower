"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function VersionChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch("/version.json", { cache: "no-store" });
        const { version } = await res.json();
        const storedVersion = localStorage.getItem("appVersion");

        if (
          version !== storedVersion &&
          !sessionStorage.getItem("versionUpdate")
        ) {
          setUpdateAvailable(true);
        }
      } catch (error) {
        console.error("Version check failed:", error);
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    sessionStorage.setItem("versionUpdate", "true");

    // Clear caches
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    // Clear localStorage except auth keys
    Object.keys(localStorage).forEach((key) => {
      if (!["authToken", "refreshToken", "userSession"].includes(key)) {
        localStorage.removeItem(key);
      }
    });

    sessionStorage.removeItem("versionUpdate");
    window.location.reload();
  };

  return (
    <Dialog open={updateAvailable}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Version Available</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center gap-4 mt-4">
          <Button onClick={handleRefresh} variant="default">
            Refresh Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
