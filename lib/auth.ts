import { createClient, createServiceRoleClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Get user profile with couple information
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      couples (
        id,
        created_at,
        partner1_id,
        partner2_id
      )
    `)
    .eq('id', user.id)
    .single()

  return {
    ...user,
    profile,
  }
})

export const requireAuth = async () => {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

export const requireCouple = async () => {
  const user = await requireAuth()
  
  // Check if user is in a couple by looking at couples table
  const supabase = await createClient()
  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
    .single()

  if (!couple) {
    redirect('/app/setup')
  }
  
  return user
}

export const getCouplePartner = async () => {
  const user = await requireCouple()
  
  const supabase = await createClient()
  
  // Get the couple data
  const { data: couple } = await supabase
    .from('couples')
    .select('id, partner1_id, partner2_id')
    .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
    .single()

  if (!couple) {
    return null
  }

  // Get the partner ID (the one that's not the current user)
  const partnerId = couple.partner1_id === user.id ? couple.partner2_id : couple.partner1_id
  
  // Get partner info from auth.users using service role client
  const serviceRoleSupabase = await createServiceRoleClient()
  const { data: { users: allUsers } } = await serviceRoleSupabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000 // Get all users to find our specific partner
  })
  
  // Filter the users to find our specific partner
  const partnerUser = allUsers?.find(user => user.id === partnerId)
  
  if (!partnerUser) {
    return null
  }

  return {
    id: partnerUser.id,
    name: partnerUser.user_metadata?.full_name || partnerUser.email?.split('@')[0] || 'Partner',
    email: partnerUser.email
  }
}

// Client-side auth hook
export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  return { user, loading }
}
