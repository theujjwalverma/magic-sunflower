"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Embed } from "@/components/ui/embed";

interface HtmlContentProps {
  content: string;
  className?: string;
  globalMuted?: boolean;
}

export function HtmlContent({
  content,
  className,
  globalMuted,
}: HtmlContentProps) {
  // Try to parse as JSON first (new structured format)
  try {
    const parsedContent = JSON.parse(content);
    if (
      parsedContent &&
      typeof parsedContent === "object" &&
      (parsedContent.textContent || parsedContent.embedUrls)
    ) {
      return (
        <div className={cn("space-y-4", className)}>
          {/* Render text content */}
          {parsedContent.textContent && (
            <div
              className={cn(
                "prose prose-sm max-w-none",
                "prose-headings:font-semibold prose-headings:text-black",
                "prose-p:text-black prose-p:leading-relaxed prose-p:whitespace-pre-wrap",
                "prose-strong:text-black prose-strong:font-semibold",
                "prose-em:text-black",
                "prose-a:text-blue-600 prose-a:underline prose-a:cursor-pointer",
                "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700",
                "prose-ul:text-black prose-ol:text-black",
                "prose-li:text-black",
                "prose-hr:border-gray-300",
                "prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
                className
              )}
              dangerouslySetInnerHTML={{ __html: parsedContent.textContent }}
            />
          )}

          {/* Render embeds */}
          {parsedContent.embedUrls && parsedContent.embedUrls.length > 0 && (
            <div className="space-y-4">
              {parsedContent.embedUrls.map((url: string, index: number) => (
                <Embed key={index} url={url} globalMuted={globalMuted} />
              ))}
            </div>
          )}
        </div>
      );
    }
  } catch (e) {
    // Not JSON, continue with HTML processing
  }

  // If the content is empty or doesn't contain HTML, render as plain text
  if (!content || !content.includes("<")) {
    return (
      <div className={cn("whitespace-pre-wrap", className)}>{content}</div>
    );
  }

  // Ensure any iframes are properly styled after content loads
  useEffect(() => {
    // Ensure any iframes are properly styled after content loads
    if (content.includes("iframe") || content.includes("embed")) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Force reflow to ensure CSS is applied
        const container = document.querySelector(".prose") as HTMLElement;
        if (container) {
          container.style.display = "none";
          container.offsetHeight; // trigger reflow
          container.style.display = "";
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [content]);

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:font-semibold prose-headings:text-black",
        "prose-p:text-black prose-p:leading-relaxed",
        "prose-strong:text-black prose-strong:font-semibold",
        "prose-em:text-black",
        "prose-a:text-blue-600 prose-a:underline prose-a:cursor-pointer",
        "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700",
        "prose-ul:text-black prose-ol:text-black",
        "prose-li:text-black",
        "prose-hr:border-gray-300",
        "prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
        // Custom styles for embeds - ensure they work in feed
        "[&_.embed-container]:my-4 [&_.embed-container]:max-w-full [&_.embed-container]:relative [&_.embed-container]:overflow-hidden",
        "[&_.embed-container_iframe]:w-full [&_.embed-container_iframe]:h-full [&_.embed-container_iframe]:rounded-lg [&_.embed-container_iframe]:border-0",
        "[&_.embed-iframe]:w-full [&_.embed-iframe]:aspect-video [&_.embed-iframe]:rounded-lg [&_.embed-iframe]:border-0 [&_.embed-iframe]:pointer-events-auto",
        // Ensure all iframe variations work
        "[&_.embed-container>iframe]:w-full [&_.embed-container>iframe]:aspect-video [&_.embed-container>iframe]:rounded-lg [&_.embed-container>iframe]:border-0",
        // Fix any prose interference with iframes
        "[&_iframe]:pointer-events-auto [&_iframe]:border-0",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
