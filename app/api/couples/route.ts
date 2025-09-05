import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get couples where the user is either partner1 or partner2
    const { data: couples, error } = await supabase
      .from('couples')
      .select('*')
      .or(`partner1_id.eq.${userId},partner2_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching couples:", error)
      return NextResponse.json({ error: "Failed to fetch couples" }, { status: 500 })
    }

    // Get partner information from auth.users for each couple
    const formattedCouples = await Promise.all(
      couples.map(async (couple) => {
        const partnerId = couple.partner1_id === userId ? couple.partner2_id : couple.partner1_id
        
        // Get partner info from auth.users
        const { data: { users: partnerUsers } } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000 // Get all users to find our specific partner
        })
        
        const partnerUser = partnerUsers?.find(user => user.id === partnerId)
        
        return {
          ...couple,
          partner1_name: couple.partner1_id === userId ? 'You' : partnerUser?.user_metadata?.full_name || partnerUser?.email?.split('@')[0] || 'Partner',
          partner2_name: couple.partner2_id === userId ? 'You' : partnerUser?.user_metadata?.full_name || partnerUser?.email?.split('@')[0] || 'Partner',
          partner1_email: couple.partner1_id === userId ? 'You' : partnerUser?.email,
          partner2_email: couple.partner2_id === userId ? 'You' : partnerUser?.email
        }
      })
    )

    return NextResponse.json({ couples: formattedCouples })
  } catch (error) {
    console.error("Error fetching couples:", error)
    return NextResponse.json({ error: "Failed to fetch couples" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { partner1Id, partner2Id, coupleUsername } = await request.json()

    if (!partner1Id || !partner2Id || !coupleUsername) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if couple already exists
    const { data: existingCouple } = await supabase
      .from('couples')
      .select('id')
      .or(`(partner1_id.eq.${partner1Id},partner2_id.eq.${partner2Id}),(partner1_id.eq.${partner2Id},partner2_id.eq.${partner1Id})`)
      .single()

    if (existingCouple) {
      return NextResponse.json(
        { error: "Couple already exists", coupleId: existingCouple.id },
        { status: 400 }
      )
    }

    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert({
        partner1_id: partner1Id,
        partner2_id: partner2Id,
        couple_username: coupleUsername
      })
      .select()
      .single()

    if (coupleError) {
      return NextResponse.json({ 
        error: "Failed to create couple", 
        details: coupleError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ couple })
  } catch (error) {
    console.error("Error creating couple:", error)
    return NextResponse.json({ error: "Failed to create couple" }, { status: 500 })
  }
}
