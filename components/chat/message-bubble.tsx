"use client"

import { useState } from "react"
import { Heart, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLongPress } from "@/components/ui/long-press"

interface MessageBubbleProps {
  message: {
    id: string
    text: string
    sender: "me" | "partner"
    timestamp: string
    status: "sent" | "delivered" | "seen"
    reactions?: string[]
    isPinned?: boolean
  }
  onReaction: (messageId: string, reaction: string) => void
  onPin: (messageId: string) => void
}

const quickReactions = ["❤️", "😂", "👍", "😍", "🥰", "✨"]

export function MessageBubble({ message, onReaction, onPin }: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const longPressProps = useLongPress({
    onLongPress: () => setShowReactions(true),
    onClick: () => setShowMenu(!showMenu),
    threshold: 500,
  })

  const getStatusIcon = (status: typeof message.status) => {
    switch (status) {
      case "sent":
        return "✓"
      case "delivered":
        return "✓✓"
      case "seen":
        return <Heart className="h-3 w-3 text-primary fill-primary" />
      default:
        return ""
    }
  }

  return (
    <div className={cn("flex", message.sender === "me" ? "justify-end" : "justify-start")}>
      <div className="relative max-w-[80%]">
        {/* Message bubble */}
        <div
          {...longPressProps}
          className={cn(
            "rounded-2xl px-4 py-2 relative group cursor-pointer",
            message.sender === "me"
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border rounded-bl-md",
          )}
        >
          {message.isPinned && <Pin className="h-3 w-3 text-current absolute -top-1 -left-1" />}
          <p>{message.text}</p>
          <div className="flex items-center justify-between mt-1">
            <p className={cn("text-xs", message.sender === "me" ? "opacity-70" : "text-muted-foreground")}>
              {message.timestamp}
            </p>
            {message.sender === "me" && (
              <span className="text-xs opacity-70 ml-2">{getStatusIcon(message.status)}</span>
            )}
          </div>

          {/* Menu button */}
          {showMenu && (
            <div className="absolute -top-8 right-0 bg-background border rounded-lg shadow-lg p-1 z-20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onPin(message.id)
                  setShowMenu(false)
                }}
                className="text-xs"
              >
                {message.isPinned ? "Unpin" : "Pin"}
              </Button>
            </div>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 ml-2">
            {message.reactions.map((reaction, index) => (
              <span key={index} className="text-xs bg-background border rounded-full px-2 py-1 shadow-sm">
                {reaction}
              </span>
            ))}
          </div>
        )}

        {/* Quick reactions popup */}
        {showReactions && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowReactions(false)} />
            <div className="absolute -top-12 left-0 bg-background border rounded-full px-2 py-1 shadow-lg flex gap-1 z-20">
              {quickReactions.map((reaction) => (
                <button
                  key={reaction}
                  onClick={() => {
                    onReaction(message.id, reaction)
                    setShowReactions(false)
                  }}
                  className="hover:scale-110 transition-transform p-1"
                >
                  {reaction}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
