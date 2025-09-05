import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get couple information if user has one
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select(`
        id,
        created_at,
        couple_username,
        partner1:users!partner1_id(name, email),
        partner2:users!partner2_id(name, email)
      `)
      .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
      .single()

    if (coupleError && coupleError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json(
        { error: 'Failed to fetch couple information' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user,
      couple: coupleData,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
