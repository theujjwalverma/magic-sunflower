import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coupleId = searchParams.get("coupleId")

    if (!coupleId) {
      return NextResponse.json({ error: "Couple ID is required" }, { status: 400 })
    }

    // Get messages with reactions and pin status
    const messages = await sql`
      SELECT 
        m.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', mr.id,
              'emoji', mr.emoji,
              'user_id', mr.user_id
            )
          ) FILTER (WHERE mr.id IS NOT NULL), 
          '[]'
        ) as reactions,
        CASE WHEN pm.id IS NOT NULL THEN true ELSE false END as is_pinned
      FROM messages m
      LEFT JOIN message_reactions mr ON m.id = mr.message_id
      LEFT JOIN pinned_messages pm ON m.id = pm.message_id
      WHERE m.couple_id = ${coupleId}
      GROUP BY m.id, pm.id
      ORDER BY m.created_at ASC
    `

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { coupleId, senderId, content, messageType = "text" } = await request.json()

    if (!coupleId || !senderId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [message] = await sql`
      INSERT INTO messages (couple_id, sender_id, content, message_type, created_at, updated_at)
      VALUES (${coupleId}, ${senderId}, ${content}, ${messageType}, NOW(), NOW())
      RETURNING *
    `

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
