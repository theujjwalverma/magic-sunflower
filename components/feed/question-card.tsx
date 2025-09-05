"use client"

import { useState } from "react"
import { Heart, MessageCircle, Send, X, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Reply {
  id: string
  author: "me" | "partner"
  authorName: string
  content: string
  timestamp: string
}

interface QuestionCardProps {
  question: {
    id: string
    question: string
    author: "me" | "partner"
    authorName: string
    timestamp: string
    replies: Reply[]
    likes: number
    isLiked: boolean
  }
  onLike: (questionId: string) => void
  onReply: (questionId: string, content: string) => void
}

export function QuestionCard({ question, onLike, onReply }: QuestionCardProps) {
  const [replyText, setReplyText] = useState("")
  const [showReplyInput, setShowReplyInput] = useState(false)

  const handleReply = () => {
    if (!replyText.trim()) return
    onReply(question.id, replyText)
    setReplyText("")
    setShowReplyInput(false)
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium">{question.authorName[0]}</span>
            </div>
            <div>
              <p className="font-medium text-sm">{question.authorName}</p>
              <p className="text-xs text-muted-foreground">{question.timestamp}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(question.id)}
              className={cn("rounded-full", question.isLiked && "text-primary")}
            >
              <Heart className={cn("h-4 w-4 mr-1", question.isLiked && "fill-current")} />
              {question.likes}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question */}
        <div className="bg-accent/30 rounded-xl p-4">
          <p className="font-medium text-foreground">{question.question}</p>
        </div>

        {/* Replies */}
        {question.replies.length > 0 && (
          <div className="space-y-3">
            {question.replies.map((reply) => (
              <div
                key={reply.id}
                className={cn(
                  "rounded-xl p-3 border",
                  reply.author === "me" ? "bg-primary/10 border-primary/20 ml-4" : "bg-card",
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">{reply.authorName[0]}</span>
                  </div>
                  <span className="text-sm font-medium">{reply.authorName}</span>
                  <span className="text-xs text-muted-foreground">{reply.timestamp}</span>
                </div>
                <p className="text-sm text-foreground">{reply.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Reply input */}
        {showReplyInput ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleReply()}
                className="rounded-xl"
              />
              <Button
                size="icon"
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="rounded-full bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowReplyInput(false)} className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowReplyInput(true)}
            className="w-full rounded-xl bg-transparent"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Reply ❤️
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
