"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CreateQuestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateQuestion: (question: string) => void
}

const questionPrompts = [
  "What's your favorite memory of us?",
  "What are you most grateful for today?",
  "What's one thing you want to do together this month?",
  "How did I make you smile today?",
  "What's something new you learned about me recently?",
  "What are you looking forward to most?",
]

export function CreateQuestionDialog({ open, onOpenChange, onCreateQuestion }: CreateQuestionDialogProps) {
  const [question, setQuestion] = useState("")
  const [selectedPrompt, setSelectedPrompt] = useState("")

  const handleCreate = () => {
    if (!question.trim()) return
    onCreateQuestion(question)
    setQuestion("")
    onOpenChange(false)
  }

  const usePrompt = (prompt: string) => {
    setSelectedPrompt(prompt)
    setQuestion(prompt)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ask a Question</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="What would you like to ask your partner?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[100px] rounded-xl"
          />

          {/* Question prompts */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Or try one of these:</p>
            <div className="grid grid-cols-1 gap-2">
              {questionPrompts.slice(0, 3).map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => usePrompt(prompt)}
                  className={`text-left justify-start h-auto p-2 rounded-lg text-xs ${selectedPrompt === prompt ? "bg-primary text-white" : ""}`}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!question.trim()}
              className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
            >
              Post Question
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
