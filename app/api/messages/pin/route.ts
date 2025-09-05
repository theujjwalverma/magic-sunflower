import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { messageId, coupleId, pinnedBy } = await request.json()

    if (!messageId || !coupleId || !pinnedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if message is already pinned
    const existingPin = await sql`
      SELECT * FROM pinned_messages WHERE message_id = ${messageId}
    `

    if (existingPin.length > 0) {
      return NextResponse.json({ error: "Message is already pinned" }, { status: 400 })
    }

    const [pinnedMessage] = await sql`
      INSERT INTO pinned_messages (message_id, couple_id, pinned_by)
      VALUES (${messageId}, ${coupleId}, ${pinnedBy})
      RETURNING *
    `

    return NextResponse.json({ pinnedMessage })
  } catch (error) {
    console.error("Error pinning message:", error)
    return NextResponse.json({ error: "Failed to pin message" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get("messageId")

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 })
    }

    await sql`DELETE FROM pinned_messages WHERE message_id = ${messageId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error unpinning message:", error)
    return NextResponse.json({ error: "Failed to unpin message" }, { status: 500 })
  }
}
