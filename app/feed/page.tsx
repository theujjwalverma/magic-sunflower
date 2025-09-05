import { FeedTab } from "@/components/tabs/feed-tab";
import { BottomTabs } from "@/components/navigation/bottom-tabs";

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pb-20">
        <FeedTab />
      </div>
      <BottomTabs />
    </div>
  );
}
