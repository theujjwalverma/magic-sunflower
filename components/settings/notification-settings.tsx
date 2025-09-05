"use client"

import { Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface NotificationSettings {
  messages: boolean
  questions: boolean
  memories: boolean
  reminders: boolean
}

interface NotificationSettingsProps {
  settings: NotificationSettings
  onSettingsChange: (key: string, value: boolean) => void
}

export function NotificationSettingsCard({ settings, onSettingsChange }: NotificationSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>New Messages</Label>
            <p className="text-sm text-muted-foreground">Get notified when your partner sends a message</p>
          </div>
          <Switch checked={settings.messages} onCheckedChange={(value) => onSettingsChange("messages", value)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>New Questions</Label>
            <p className="text-sm text-muted-foreground">Get notified about new questions in your feed</p>
          </div>
          <Switch checked={settings.questions} onCheckedChange={(value) => onSettingsChange("questions", value)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Memory Reminders</Label>
            <p className="text-sm text-muted-foreground">Get reminded of special dates and memories</p>
          </div>
          <Switch checked={settings.reminders} onCheckedChange={(value) => onSettingsChange("reminders", value)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Photo Memories</Label>
            <p className="text-sm text-muted-foreground">Get notified when your partner adds new photos</p>
          </div>
          <Switch checked={settings.memories} onCheckedChange={(value) => onSettingsChange("memories", value)} />
        </div>
      </CardContent>
    </Card>
  )
}
