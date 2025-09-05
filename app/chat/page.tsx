import { ChatTab } from "@/components/tabs/chat-tab";
import { BottomTabs } from "@/components/navigation/bottom-tabs";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pb-20">
        <ChatTab />
      </div>
      <BottomTabs />
    </div>
  );
}
