import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, partnerEmail } = await request.json()

    if (!email || !password || !name || !partnerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create or update user profile with the provided name and email
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: name,
        email: email,
        username: email.split('@')[0], // Use email prefix as username
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      console.error('Error creating profile:', upsertError)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Check if partner exists using a different approach
    // First try to get the partner's profile from the profiles table
    const { data: partnerProfile, error: partnerProfileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', partnerEmail)
      .single()

    if (partnerProfileError && partnerProfileError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" error, which is expected if partner doesn't exist
      return NextResponse.json(
        { error: 'Failed to check partner' },
        { status: 500 }
      )
    }

    // For now, just create the user and profile
    // Partner linking will be handled separately through the new endpoint
    return NextResponse.json({
      user: authData.user,
      message: 'Registration successful. Please link with your partner.',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
