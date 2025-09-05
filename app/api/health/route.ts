import { NextResponse } from 'next/server'
import { createBrowserSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createBrowserSupabaseClient()
  const realtimeClient = supabase.realtime
  const channels = Array.from(realtimeClient.channels)
  
  return NextResponse.json({
    realtime: {
      connected: realtimeClient.isConnected(),
      channels: channels.length,
      channelNames: channels.map(c => c.topic)
    },
    timestamp: new Date().toISOString()
  })
}
