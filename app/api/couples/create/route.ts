import { type NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient, executeRawSql } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { partnerEmail, userId, coupleUsername, relationshipStatus } = await request.json()

    if (!userId || !partnerEmail) {
      return NextResponse.json({ 
        error: "User ID and partner email are required" 
      }, { status: 400 })
    }

    if (!coupleUsername) {
      return NextResponse.json({ 
        error: "Couple username is required" 
      }, { status: 400 })
    }

    // Validate relationship status
    if (!relationshipStatus) {
      return NextResponse.json({ 
        error: "Relationship status is required" 
      }, { status: 400 })
    }

    const validStatuses = ['Talking', 'Complicated', 'Long Distance', 'Dating', 'Live in', 'Engaged', 'Married']
    if (!validStatuses.includes(relationshipStatus)) {
      return NextResponse.json({ 
        error: "Invalid relationship status" 
      }, { status: 400 })
    }

    if (userId === partnerEmail) {
      return NextResponse.json({ 
        error: "You cannot create a couple with yourself" 
      }, { status: 400 })
    }

    const supabase = await createClient()
    let serviceRoleSupabase
    
    try {
      serviceRoleSupabase = await createServiceRoleClient()
    } catch (error) {
      console.error("Service role client creation error:", error)
      return NextResponse.json({ 
        error: "Server configuration error", 
        details: "Unable to create admin client. Please check environment configuration." 
      }, { status: 500 })
    }

    // Check if user already has a couple using separate queries
    const { data: userAsPartner1 } = await supabase
      .from('couples')
      .select('id')
      .eq('partner1_id', userId)
      .single()

    const { data: userAsPartner2 } = await supabase
      .from('couples')
      .select('id')
      .eq('partner2_id', userId)
      .single()

    if (userAsPartner1 || userAsPartner2) {
      return NextResponse.json({ 
        error: "You are already in a couple" 
      }, { status: 400 })
    }

    // Check if partner exists using auth.users table with service role client
    const { data: partnerList, error: partnerError } = await serviceRoleSupabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    if (partnerError) {
      return NextResponse.json({ 
        error: "Failed to check partner", 
        details: partnerError.message 
      }, { status: 500 })
    }

    const partner = partnerList?.users.find(user => user.email === partnerEmail)

    if (!partner) {
      return NextResponse.json({ 
        error: "Partner with this email does not exist" 
      }, { status: 404 })
    }

    // Check if partner is already in a couple using separate queries
    const { data: partnerAsPartner1 } = await supabase
      .from('couples')
      .select('id')
      .eq('partner1_id', partner.id)
      .single()

    const { data: partnerAsPartner2 } = await supabase
      .from('couples')
      .select('id')
      .eq('partner2_id', partner.id)
      .single()

    if (partnerAsPartner1 || partnerAsPartner2) {
      return NextResponse.json({ 
        error: "Partner is already in a couple" 
      }, { status: 400 })
    }

    // Validate username format using the same validation as update endpoint
    const validationResult = validateUsername(coupleUsername)
    if (!validationResult.isValid) {
      return NextResponse.json({ 
        error: validationResult.error 
      }, { status: 400 })
    }

    // Check if username is already taken
    const { data: existingCouple, error: checkError } = await supabase
      .from('couples')
      .select('id')
      .eq('couple_username', coupleUsername)
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

    // Create couple using Supabase insert with UUID handling
    let couple
    
    try {
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .insert({
          couple_username: coupleUsername,
          partner1_id: userId,
          partner2_id: partner.id,
          relationship_status: relationshipStatus
        })
        .select()
        .single()

      if (coupleError) {
        throw new Error(`Failed to create couple: ${coupleError.message}`)
      }
      
      couple = coupleData
    } catch (error) {
      console.error("Couple creation error:", error)
      return NextResponse.json({ 
        error: "Failed to create couple", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      couple,
      message: "Couple created successfully!",
      partner: {
        id: partner.id,
        name: partner.user_metadata?.full_name || partner.email?.split('@')[0] || 'Partner',
        email: partner.email
      }
    })

  } catch (error) {
    console.error("Error creating couple:", error)
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
