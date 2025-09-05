"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { EmbedCreator } from "@/components/ui/embed-creator";
import { ThreadPreview } from "@/components/ui/thread-preview";
import { useNewThread } from "@/app/new-thread-context";
import { useAuth } from "@/lib/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export function GlobalNewThreadDrawer() {
  const { isNewThreadDrawerOpen, closeNewThreadDrawer } = useNewThread();
  const { user } = useAuth();
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [embedPreviews, setEmbedPreviews] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [coupleInfo, setCoupleInfo] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCoupleId();
    }
  }, [user?.id, isNewThreadDrawerOpen]);

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
    )
      return;

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
        // Reset form and close drawer
        setNewQuestion("");
        setEmbedPreviews([]);
        setShowPreview(false);
        closeNewThreadDrawer();
      } else {
        console.error("Failed to create question");
      }
    } catch (error) {
      console.error("Error creating question:", error);
    }
  };

  // Always render something to test if component is working
  if (!isNewThreadDrawerOpen) {
    return (
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          background: "red",
          color: "white",
          padding: "5px",
          zIndex: 9999,
        }}
      >
        Drawer Hidden - State: {isNewThreadDrawerOpen ? "OPEN" : "CLOSED"}
      </div>
    );
  }

  return (
    <Drawer open={isNewThreadDrawerOpen} onOpenChange={closeNewThreadDrawer}>
      <DrawerContent className="max-h-[90vh] max-w-md mx-auto w-full bg-white border-t border-gray-200">
        {/* Removed debug header */}
        <DrawerHeader className="flex flex-row items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeNewThreadDrawer}
              className="h-8 w-8"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
            <DrawerTitle>New thread</DrawerTitle>
          </div>
          <Button
            onClick={handleCreateQuestion}
            className="bg-black hover:bg-gray-800 text-white px-4"
            disabled={!newQuestion.trim() && embedPreviews.length === 0}
          >
            Post
          </Button>
        </DrawerHeader>
        <div className="space-y-4 px-4 flex-1">
          <RichTextEditor
            content={newQuestion}
            onChange={setNewQuestion}
            placeholder="What's new"
            className="min-h-[200px]"
          />
        </div>
        <div className="px-4 pb-4">
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
        </div>
        <ThreadPreview
          content={newQuestion}
          embeds={embedPreviews}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview(!showPreview)}
          onRemoveEmbed={(index) => {
            setEmbedPreviews((prev) => prev.filter((_, i) => i !== index));
          }}
        />
      </DrawerContent>
    </Drawer>
  );
}
