import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { coupleId, username, userId } = await request.json()

    if (!coupleId || !username || !userId) {
      return NextResponse.json({ 
        error: "Couple ID, username, and user ID are required" 
      }, { status: 400 })
    }

    // Validate username format
    const validationResult = validateUsername(username)
    if (!validationResult.isValid) {
      return NextResponse.json({ 
        error: validationResult.error 
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
        error: "You are not authorized to update this couple's username" 
      }, { status: 403 })
    }

    // Check if username is already taken
    const { data: existingCouple, error: checkError } = await supabase
      .from('couples')
      .select('id')
      .eq('couple_username', username)
      .neq('id', coupleId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error checking username:", checkError)
      return NextResponse.json({ 
        error: "Failed to check username availability" 
      }, { status: 500 })
    }

    if (existingCouple) {
      return NextResponse.json({ 
        error: "Username is already taken" 
      }, { status: 409 })
    }

    // Update the username
    const { data: updatedCouple, error: updateError } = await supabase
      .from('couples')
      .update({ couple_username: username })
      .eq('id', coupleId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating username:", updateError)
      return NextResponse.json({ 
        error: "Failed to update username", 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      couple: updatedCouple,
      message: "Username updated successfully!"
    })

  } catch (error) {
    console.error("Error updating couple username:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

function validateUsername(username: string): { isValid: boolean; error?: string } {
  // Check length
  if (username.length < 3 || username.length > 20) {
    return { 
      isValid: false, 
      error: "Username must be between 3 and 20 characters" 
    }
  }

  // Check for spaces
  if (username.includes(' ')) {
    return { 
      isValid: false, 
      error: "Username cannot contain spaces" 
    }
  }

  // Check for leading/trailing underscores
  if (username.startsWith('_') || username.endsWith('_')) {
    return { 
      isValid: false, 
      error: "Username cannot start or end with an underscore" 
    }
  }

  // Check for double underscores
  if (username.includes('__')) {
    return { 
      isValid: false, 
      error: "Username cannot contain consecutive underscores" 
    }
  }

  // Check character set - only alphanumeric and underscores
  const validRegex = /^[a-zA-Z0-9_]+$/
  if (!validRegex.test(username)) {
    return { 
      isValid: false, 
      error: "Username can only contain letters, numbers, and underscores" 
    }
  }

  return { isValid: true }
}
