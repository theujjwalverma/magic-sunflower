"use client";
import { Home, Bolt, User, Bell, BadgePlus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "feed", label: "Home", icon: Home, path: "/feed" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
  { id: "new-thread", label: "New", icon: BadgePlus, path: "/new-thread" },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    path: "/notifications",
  },
  { id: "settings", label: "Settings", icon: Bolt, path: "/settings" },
];

export function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabClick = (tab: (typeof tabs)[0]) => {
    console.log("Tab clicked:", tab.id, tab.path);

    if (tab.path) {
      console.log("Navigating to:", tab.path);
      router.push(tab.path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.path ? pathname === tab.path : false;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "flex flex-col items-center justify-center p-3 transition-colors min-w-[60px]",
                isActive ? "text-black" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "stroke-2")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
