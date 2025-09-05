"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface EmbedProps {
  url: string;
  className?: string;
  globalMuted?: boolean;
}

interface YouTubeEmbedProps extends EmbedProps {
  videoId: string;
}

function YouTubeEmbed({
  videoId,
  className,
  globalMuted,
}: Omit<YouTubeEmbedProps, "url">) {
  const [useFallback, setUseFallback] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(null);

  // Autoplay URL with muted autoplay (works in all browsers)
  const autoplayUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&fs=1&cc_load_policy=1&autohide=1&enablejsapi=1&autoplay=1&mute=1&origin=${
    typeof window !== "undefined" ? window.location.origin : ""
  }`;

  // Fallback URL without origin for compatibility
  const fallbackUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&fs=1&cc_load_policy=1&autohide=1&enablejsapi=1&autoplay=1&mute=1`;

  // Manual play URL (when user clicks play)
  const manualUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&fs=1&cc_load_policy=1&autohide=1&enablejsapi=1&origin=${
    typeof window !== "undefined" ? window.location.origin : ""
  }`;

  // Error handling
  const handleError = () => {
    if (!useFallback) {
      setUseFallback(true);
    }
  };

  // Intersection Observer for autoplay when video enters viewport
  useEffect(() => {
    if (!iframeRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isPlaying) {
            // Video is visible, start autoplay
            setIsPlaying(true);
          } else if (!entry.isIntersecting && isPlaying) {
            // Video is not visible, pause
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of video is visible
        rootMargin: "50px", // Start autoplay 50px before video enters view
      }
    );

    const container = iframeRef.parentElement;
    if (container) {
      observer.observe(container);
    }

    return () => {
      observer.disconnect();
    };
  }, [iframeRef, isPlaying]);

  // Handle mute/unmute
  const toggleMute = () => {
    if (iframeRef?.contentWindow) {
      // Send command to YouTube iframe
      iframeRef.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: isMuted ? "unMute" : "mute",
          args: "",
        }),
        "*"
      );
      setIsMuted(!isMuted);
    }
  };

  // Handle manual play
  const handlePlay = () => {
    setIsPlaying(true);
  };

  // Effect to handle global mute changes
  useEffect(() => {
    if (globalMuted !== undefined && iframeRef?.contentWindow) {
      // Send command to YouTube iframe based on global mute state
      const command = globalMuted ? "mute" : "unMute";
      iframeRef.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: command,
          args: "",
        }),
        "*"
      );
      setIsMuted(globalMuted);
    }
  }, [globalMuted, iframeRef]);

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto", className)}>
      <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg bg-gray-100">
        <iframe
          ref={setIframeRef}
          src={useFallback ? fallbackUrl : autoplayUrl}
          className="absolute top-0 left-0 w-full h-full border-0 rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          title="YouTube video"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-same-origin allow-scripts allow-presentation"
          onError={handleError}
        />
      </div>

      {useFallback && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Using fallback embed method
        </div>
      )}
    </div>
  );
}

export function Embed({ url, className, globalMuted }: EmbedProps) {
  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    // Try to extract from URL parameters as fallback
    try {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      if (videoId && videoId.length === 11) {
        return videoId;
      }
    } catch (e) {
      // Ignore URL parsing errors
    }

    return null;
  };

  const youtubeVideoId = getYouTubeVideoId(url);

  if (youtubeVideoId) {
    return (
      <YouTubeEmbed
        videoId={youtubeVideoId}
        className={className}
        globalMuted={globalMuted}
      />
    );
  }

  return (
    <div className={cn("p-4 bg-gray-50 rounded-lg border", className)}>
      <p className="text-sm text-gray-600">Unsupported embed URL</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline text-sm"
      >
        {url}
      </a>
    </div>
  );
}

// Utility function to validate URLs
export function isValidEmbedUrl(url: string): boolean {
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];

  // Check YouTube patterns only
  for (const pattern of youtubePatterns) {
    if (pattern.test(url)) return true;
  }

  return false;
}

// Utility function to get embed type
export function getEmbedType(url: string): "youtube" | null {
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];

  // Check YouTube patterns only
  for (const pattern of youtubePatterns) {
    if (pattern.test(url)) return "youtube";
  }

  return null;
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    YT?: any;
  }
}
