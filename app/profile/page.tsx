import { ProfileTab } from "@/components/tabs/profile-tab";
import { BottomTabs } from "@/components/navigation/bottom-tabs";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pb-20">
        <ProfileTab />
      </div>
      <BottomTabs />
    </div>
  );
}
