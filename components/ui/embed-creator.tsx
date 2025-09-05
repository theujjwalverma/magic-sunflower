"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Youtube } from "lucide-react";
import { isValidEmbedUrl, getEmbedType } from "./embed";
import { cn } from "@/lib/utils";

interface EmbedCreatorProps {
  onEmbed?: (url: string, type: "youtube") => void;
  onPreviewEmbed?: (url: string, type: "youtube") => void;
  onRemoveEmbed?: (index: number) => void;
  previewEmbeds?: string[];
  className?: string;
}

export function EmbedCreator({
  onEmbed,
  onPreviewEmbed,
  onRemoveEmbed,
  previewEmbeds = [],
  className,
}: EmbedCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [embedType, setEmbedType] = useState<"youtube" | null>(null);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setError("");

    if (value.trim()) {
      const type = getEmbedType(value);
      setEmbedType(type);

      if (!type) {
        setError("Please enter a valid YouTube URL");
      }
    } else {
      setEmbedType(null);
    }
  };

  const handleEmbed = () => {
    if (!url.trim() || !embedType) return;

    // Add to preview if preview handler is provided
    onPreviewEmbed?.(url.trim(), embedType);

    // Also call the regular embed handler if provided
    onEmbed?.(url.trim(), embedType);

    setUrl("");
    setError("");
    setEmbedType(null);
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && url.trim() && embedType) {
      handleEmbed();
    }
  };

  return (
    <div className={cn("flex items-center gap-2 mt-4", className)}>
      {/* YouTube Embed Button */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="secondary"
            size="default"
            className="w-full hover:bg-red-50 hover:text-red-600"
            title="Add YouTube video"
            disabled={previewEmbeds.length > 0}
          >
            <Youtube className="h-4 w-4 mr-2" />
            {previewEmbeds.length > 0 ? "Video Added" : "Add YouTube Video"}
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-w-md mx-auto">
          <DrawerHeader>
            <DrawerTitle>Add YouTube Video</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="embed-url">YouTube URL</Label>
              <Input
                id="embed-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleUrlChange(e.target.value)
                }
                onKeyPress={handleKeyPress}
                className={cn(
                  error && "border-red-500 focus:border-red-500",
                  embedType === "youtube" &&
                    "border-red-300 focus:border-red-500"
                )}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              {embedType && (
                <p className="text-sm text-green-600">✓ Valid YouTube URL</p>
              )}
            </div>
          </div>
          <DrawerFooter>
            <div className="flex justify-end gap-2">
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUrl("");
                    setError("");
                    setEmbedType(null);
                  }}
                >
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                onClick={handleEmbed}
                disabled={!url.trim() || !embedType}
                className="bg-red-600 hover:bg-red-700"
              >
                Add YouTube Video
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
