import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('Login successful - Session:', {
      access_token: data.session?.access_token?.slice(0, 10) + '...',
      expires_at: data.session?.expires_at,
      user_id: data.user.id
    });

    // Get couple information if user has one
    const { data: coupleData } = await supabase
      .from('couples')
      .select(`
        id,
        created_at,
        couple_username,
        partner1:users!partner1_id(name, email),
        partner2:users!partner2_id(name, email)
      `)
      .or(`partner1_id.eq.${data.user.id},partner2_id.eq.${data.user.id}`)
      .single()

    return NextResponse.json({
      user: data.user,
      couple: coupleData,
      session: data.session,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
