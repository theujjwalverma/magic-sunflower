"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { BottomTabs } from "@/components/navigation/bottom-tabs";
import { ChatTab } from "@/components/tabs/chat-tab";
import { FeedTab } from "@/components/tabs/feed-tab";
import { ProfileTab } from "@/components/tabs/profile-tab";
import { SettingsTab } from "@/components/tabs/settings-tab";
import { GlobalNewThreadDrawer } from "@/components/ui/global-new-thread-drawer";

export function AppLayout() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect to feed if we're on the root path
    if (pathname === "/") {
      router.push("/feed");
    }
  }, [pathname, router]);

  const renderActiveTab = () => {
    switch (pathname) {
      case "/chat":
        return <ChatTab />;
      case "/feed":
        return <FeedTab />;
      case "/profile":
        return <ProfileTab />;
      case "/settings":
        return <SettingsTab />;
      default:
        return <FeedTab />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main content area */}
      <div className="pb-20">{renderActiveTab()}</div>

      {/* Debug: Check if GlobalNewThreadDrawer is rendering */}
      <div
        style={{
          position: "fixed",
          top: "50px",
          right: "10px",
          background: "blue",
          color: "white",
          padding: "5px",
          zIndex: 9999,
        }}
      >
        App Layout Rendered - Drawer Component Included
      </div>

      {/* Global New Thread Drawer */}
      <GlobalNewThreadDrawer />

      {/* Bottom navigation */}
      <BottomTabs />
    </div>
  );
}
