import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await request.json()

    if (!token || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if the token already exists for this user
    const { data: existingToken, error: checkError } = await supabase
      .from('user_fcm_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('fcm_token', token)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error("Error checking existing token:", checkError)
    }

    // If token doesn't exist, insert it
    if (!existingToken) {
      const { error: insertError } = await supabase
        .from('user_fcm_tokens')
        .insert({
          user_id: userId,
          fcm_token: token
        })

      if (insertError) {
        console.error("Error storing FCM token:", insertError)
        return NextResponse.json({ error: "Failed to store token" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "Token stored successfully" })
  } catch (error) {
    console.error("Error storing FCM token:", error)
    return NextResponse.json({ error: "Failed to store token" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('user_fcm_tokens')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error("Error deleting FCM tokens:", error)
      return NextResponse.json({ error: "Failed to delete tokens" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Tokens deleted successfully" })
  } catch (error) {
    console.error("Error deleting FCM tokens:", error)
    return NextResponse.json({ error: "Failed to delete tokens" }, { status: 500 })
  }
}
