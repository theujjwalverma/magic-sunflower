import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { coupleId, relationshipStatus, userId } = await request.json()

    if (!coupleId || !relationshipStatus || !userId) {
      return NextResponse.json({ 
        error: "Couple ID, relationship status, and user ID are required" 
      }, { status: 400 })
    }

    // Validate relationship status
    const validStatuses = ['Talking', 'Complicated', 'Long Distance', 'Dating', 'Live in', 'Engaged', 'Married']
    if (!validStatuses.includes(relationshipStatus)) {
      return NextResponse.json({ 
        error: "Invalid relationship status" 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user is part of the couple
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('partner1_id, partner2_id')
      .eq('id', coupleId)
      .single()

    if (coupleError) {
      return NextResponse.json({ 
        error: "Couple not found" 
      }, { status: 404 })
    }

    if (couple.partner1_id !== userId && couple.partner2_id !== userId) {
      return NextResponse.json({ 
        error: "You are not authorized to update this couple's relationship status" 
      }, { status: 403 })
    }

    // Update the relationship status
    const { data: updatedCouple, error: updateError } = await supabase
      .from('couples')
      .update({ relationship_status: relationshipStatus })
      .eq('id', coupleId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating relationship status:", updateError)
      return NextResponse.json({ 
        error: "Failed to update relationship status", 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      couple: updatedCouple,
      message: "Relationship status updated successfully!"
    })

  } catch (error) {
    console.error("Error updating couple relationship status:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
