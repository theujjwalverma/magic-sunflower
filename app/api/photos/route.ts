import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coupleId = searchParams.get("coupleId")

    if (!coupleId) {
      return NextResponse.json({ error: "Couple ID is required" }, { status: 400 })
    }

    const photos = await sql`
      SELECT 
        sp.*,
        u.name as uploaded_by_name
      FROM shared_photos sp
      LEFT JOIN users u ON sp.uploaded_by = u.neon_auth_id
      WHERE sp.couple_id = ${coupleId}
      ORDER BY sp.created_at DESC
    `

    return NextResponse.json({ photos })
  } catch (error) {
    console.error("Error fetching photos:", error)
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { coupleId, uploadedBy, photoUrl, caption, isHighlighted = false } = await request.json()

    if (!coupleId || !uploadedBy || !photoUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [photo] = await sql`
      INSERT INTO shared_photos (couple_id, uploaded_by, photo_url, caption, is_highlighted, created_at)
      VALUES (${coupleId}, ${uploadedBy}, ${photoUrl}, ${caption}, ${isHighlighted}, NOW())
      RETURNING *
    `

    return NextResponse.json({ photo })
  } catch (error) {
    console.error("Error creating photo:", error)
    return NextResponse.json({ error: "Failed to create photo" }, { status: 500 })
  }
}
