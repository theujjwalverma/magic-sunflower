import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { messageId, userId, emoji } = await request.json()

    if (!messageId || !userId || !emoji) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if reaction already exists
    const existingReaction = await sql`
      SELECT * FROM message_reactions 
      WHERE message_id = ${messageId} AND user_id = ${userId}
    `

    if (existingReaction.length > 0) {
      // Update existing reaction
      const [reaction] = await sql`
        UPDATE message_reactions 
        SET emoji = ${emoji}
        WHERE message_id = ${messageId} AND user_id = ${userId}
        RETURNING *
      `
      return NextResponse.json({ reaction })
    } else {
      // Create new reaction
      const [reaction] = await sql`
        INSERT INTO message_reactions (message_id, user_id, emoji)
        VALUES (${messageId}, ${userId}, ${emoji})
        RETURNING *
      `
      return NextResponse.json({ reaction })
    }
  } catch (error) {
    console.error("Error managing reaction:", error)
    return NextResponse.json({ error: "Failed to manage reaction" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get("messageId")
    const userId = searchParams.get("userId")

    if (!messageId || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    await sql`
      DELETE FROM message_reactions 
      WHERE message_id = ${messageId} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing reaction:", error)
    return NextResponse.json({ error: "Failed to remove reaction" }, { status: 500 })
  }
}
