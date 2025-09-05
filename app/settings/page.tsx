import { SettingsTab } from "@/components/tabs/settings-tab";
import { BottomTabs } from "@/components/navigation/bottom-tabs";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pb-20">
        <SettingsTab />
      </div>
      <BottomTabs />
    </div>
  );
}
