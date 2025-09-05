"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HtmlContent } from "@/components/ui/html-content";
import { Embed } from "@/components/ui/embed";
import { X, Eye, EyeOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreadPreviewProps {
  content: string;
  embeds: string[];
  onRemoveEmbed?: (index: number) => void;
  onTogglePreview?: () => void;
  showPreview?: boolean;
  className?: string;
}

export function ThreadPreview({
  content,
  embeds,
  onRemoveEmbed,
  onTogglePreview,
  showPreview = false,
  className,
}: ThreadPreviewProps) {
  // Show preview if explicitly requested OR if there are embeds
  if (!showPreview && embeds.length === 0) {
    return null;
  }

  return (
    <div className={cn("border-t border-gray-100", className)}>
      {/* Preview Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePreview}
            className="flex items-center gap-2 text-sm"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Preview ({embeds.length} embed
                {embeds.length !== 1 ? "s" : ""})
              </>
            )}
          </Button>
        </div>
        {embeds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Remove all embeds
              embeds.forEach((_, index) => onRemoveEmbed?.(index));
              // Hide the preview
              onTogglePreview?.();
            }}
            className="flex items-center gap-2 text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Remove All
          </Button>
        )}
      </div>

      {/* Preview Content */}
      {showPreview && (
        <div className="p-4 bg-gray-50">
          <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200">
            {/* Thread Content Preview */}
            <div className="space-y-3">
              {/* Text Content */}
              {content && (
                <HtmlContent content={content} className="text-sm text-black" />
              )}

              {/* Embed Previews */}
              {embeds.map((embedUrl, index) => (
                <div key={index} className="relative group">
                  <div className="relative">
                    <Embed url={embedUrl} />
                    {/* Remove button */}
                    {onRemoveEmbed && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onRemoveEmbed(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Embed List */}
      {!showPreview && embeds.length > 0 && (
        <div className="p-4 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Eye className="h-4 w-4" />
            <span>
              {embeds.length} embed{embeds.length !== 1 ? "s" : ""} ready to
              preview
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
