import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, full_name, gender, dob, relationship, location } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update user profile with error handling
    let error = null
    try {
      // First get the user's email from auth.users
      const { data: userData } = await supabase.auth.getUser()
      const userEmail = userData.user?.email

      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: full_name || null,
          gender: gender || null,
          dob: dob || null,
          relationship: relationship || null,
          location: location || null,
          updated_at: new Date().toISOString(),
        })
        .select()

      // If the update was successful and we have an email, try to update it separately
      if (!updateError && userEmail) {
        try {
          await supabase
            .from('profiles')
            .update({ email: userEmail })
            .eq('id', userId)
        } catch (emailError) {
          console.warn('Could not update email field:', emailError)
          // Don't fail the entire operation if email update fails
        }
      }

      error = updateError
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database operation failed. Please try again.' },
        { status: 500 }
      )
    }

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
