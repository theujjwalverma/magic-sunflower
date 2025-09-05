import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, partnerEmail } = await request.json()

    if (!userId || !partnerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user already has a couple
    const { data: existingCouple } = await supabase
      .from('couples')
      .select('id, partner1_id, partner2_id')
      .or(`partner1_id.eq.${userId},partner2_id.eq.${userId}`)
      .single()

    if (existingCouple) {
      return NextResponse.json(
        { error: 'You are already in a couple relationship' },
        { status: 400 }
      )
    }

    // Check if partner exists by trying to get their profile
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', partnerEmail)
      .single()

    if (!partnerProfile) {
      return NextResponse.json(
        { error: 'Partner not found. Please make sure your partner has registered first.' },
        { status: 404 }
      )
    }

    // Check if partner is already in a couple
    const { data: partnerCouple } = await supabase
      .from('couples')
      .select('id, partner1_id, partner2_id')
      .or(`partner1_id.eq.${partnerProfile.id},partner2_id.eq.${partnerProfile.id}`)
      .single()

    if (partnerCouple) {
      return NextResponse.json(
        { error: 'This partner is already in a couple relationship' },
        { status: 400 }
      )
    }

    // Create couple relationship
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert({})
      .select()
      .single()

    if (coupleError) {
      return NextResponse.json(
        { error: 'Failed to create couple relationship' },
        { status: 500 }
      )
    }

    // Get both user profiles for username generation
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    // Generate a meaningful couple username
    const userPart = userProfile?.full_name?.toLowerCase().replace(/\s+/g, '') || userId.substring(0, 6)
    const partnerPart = partnerProfile.full_name?.toLowerCase().replace(/\s+/g, '') || partnerProfile.id.substring(0, 6)
    const coupleUsername = `${userPart}-${partnerPart}`

    // Update couple with both partners
    const { error: updateError } = await supabase
      .from('couples')
      .update({ 
        partner1_id: userId,
        partner2_id: partnerProfile.id,
        couple_username: coupleUsername
      })
      .eq('id', couple.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to link partners' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      coupleId: couple.id,
      message: 'Couple relationship created successfully',
    })
  } catch (error) {
    console.error('Couple linking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
