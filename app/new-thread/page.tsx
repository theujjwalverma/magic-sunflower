"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { EmbedCreator } from "@/components/ui/embed-creator";
import { ThreadPreview } from "@/components/ui/thread-preview";
import { useAuth } from "@/lib/auth";
import { BottomTabs } from "@/components/navigation/bottom-tabs";
import { Loader } from "@/components/ui/loader";

export default function NewThreadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [newQuestion, setNewQuestion] = useState("");
  const [embedPreviews, setEmbedPreviews] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCoupleId();
    }
  }, [user?.id]);

  const fetchCoupleId = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/couples?userId=${user.id}`);
      const data = await response.json();

      if (response.ok && data.couples && data.couples.length > 0) {
        const couple = data.couples[0];
        setCoupleId(couple.id);
      } else {
        // Create a new couple if none exists
        const createResponse = await fetch("/api/couples", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partner1Id: user.id,
            partner2Id: "partner-placeholder",
            coupleUsername: `${user.displayName || "user"}-partner`,
          }),
        });

        const createData = await createResponse.json();
        if (createResponse.ok) {
          setCoupleId(createData.couple.id);
        }
      }
    } catch (error) {
      console.error("Error fetching couple ID:", error);
    }
  };

  const handleCreateQuestion = async () => {
    if (
      (!newQuestion.trim() && embedPreviews.length === 0) ||
      !coupleId ||
      !user
    ) {
      return;
    }

    setIsLoading(true);

    const postData = {
      textContent: newQuestion.trim(),
      embedUrls: embedPreviews,
      createdBy: user.id,
      coupleId,
    };

    try {
      const response = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        // Reset form and navigate back to feed
        setNewQuestion("");
        setEmbedPreviews([]);
        setShowPreview(false);
        router.push("/feed");
      } else {
        console.error("Failed to create question");
      }
    } catch (error) {
      console.error("Error creating question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-black">New Thread</h1>
            </div>
            <Button
              onClick={handleCreateQuestion}
              disabled={
                (!newQuestion.trim() && embedPreviews.length === 0) || isLoading
              }
              className="bg-black hover:bg-gray-800 text-white px-4"
            >
              {isLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="space-y-4">
            <RichTextEditor
              content={newQuestion}
              onChange={setNewQuestion}
              placeholder="What's new?"
              className="min-h-[300px]"
            />

            <EmbedCreator
              onPreviewEmbed={(url, type) => {
                setEmbedPreviews((prev) => [...prev, url]);
                if (!showPreview) setShowPreview(true);
              }}
              previewEmbeds={embedPreviews}
              onRemoveEmbed={(index) => {
                setEmbedPreviews((prev) => prev.filter((_, i) => i !== index));
              }}
            />

            <ThreadPreview
              content={newQuestion}
              embeds={embedPreviews}
              showPreview={showPreview}
              onTogglePreview={() => setShowPreview(!showPreview)}
              onRemoveEmbed={(index) => {
                setEmbedPreviews((prev) => prev.filter((_, i) => i !== index));
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Tabs */}
      <BottomTabs />
    </div>
  );
}
