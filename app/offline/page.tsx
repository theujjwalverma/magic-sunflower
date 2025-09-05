"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wifi, WifiOff } from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit">
            <WifiOff className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold">You're Offline</CardTitle>
          <CardDescription>
            No internet connection detected. Some features may not be available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't worry! Your Couple Connect app is still partially
              functional:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• View previously loaded messages</li>
              <li>• Access cached photos</li>
              <li>• Browse your feed history</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full">
              <Wifi className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Any new messages and photos will be sent when you're back online.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
