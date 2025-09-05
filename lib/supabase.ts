import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client
import { createServerClient } from '@supabase/ssr'

export async function createClient() {
  // Since this is being imported by a Client Component, we need to handle
  // the cookies import differently to avoid Server Component issues
  const cookieStore = await import('next/headers').then(mod => mod.cookies())

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Service role client for admin operations
export async function createServiceRoleClient() {
  const cookieStore = await import('next/headers').then(mod => mod.cookies())
  
  // Check if required environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment configuration.")
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Please check your environment configuration.")
  }
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Ignore set calls from Server Components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Ignore remove calls from Server Components
          }
        },
      },
    }
  )
}

// Client-side Supabase client
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: {
          eventsPerSecond: 10,
          reconnect: true,
          headers: () => {
            const headers = new Headers();
            const token = localStorage.getItem(`sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`);
            if (token) {
              headers.append('Authorization', `Bearer ${token}`)
            }
            headers.append('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
            return Object.fromEntries(headers.entries());
          }
        }
      }
    }
  )
}

// Client-side helper function to resolve single user display name
export async function resolveClientUserDisplayName(userId: string): Promise<string> {
  try {
    const supabase = createBrowserSupabaseClient()

    // First, try to get from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', userId)
      .single()

    if (!profileError && profile) {
      return profile.full_name || profile.username || 'User'
    }

    // Fallback to auth user data
    const serviceRoleSupabase = await createServiceRoleClient()
    const { data: authUsers, error: authError } = await serviceRoleSupabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    if (!authError && authUsers?.users) {
      const user = authUsers.users.find(u => u.id === userId)
      if (user) {
        return (user as any).raw_user_meta_data?.full_name ||
               (user as any).raw_user_meta_data?.name ||
               (user as any).raw_user_meta_data?.display_name ||
               user.email?.split('@')[0] ||
               'User'
      }
    }

    console.warn(`Could not resolve display name for user ${userId}`)
    return 'Unknown User'
  } catch (error) {
    console.error(`Error resolving display name for user ${userId}:`, error)
    return 'Unknown User'
  }
}

// Client-side helper function to resolve multiple user display names
export async function resolveUserDisplayNames(userIds: string[]): Promise<Map<string, string>> {
  const userMap = new Map<string, string>()

  try {
    const supabase = createBrowserSupabaseClient()

    // First, try to get from profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, full_name, username')
      .in('id', userIds)

    if (!profilesError && profiles) {
      profiles.forEach(profile => {
        const displayName = profile.display_name || profile.full_name || profile.username || 'Unknown User'
        userMap.set(profile.id, displayName)
      })
    }

    // For any users not found in profiles, try to get from auth.users
    const missingUserIds = userIds.filter(id => !userMap.has(id))
    if (missingUserIds.length > 0) {
      const serviceRoleSupabase = await createServiceRoleClient()
      const { data: authUsers, error: authError } = await serviceRoleSupabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      })

      if (!authError && authUsers?.users) {
        authUsers.users.forEach(user => {
          if (missingUserIds.includes(user.id)) {
            const displayName = (user as any).raw_user_meta_data?.full_name ||
                               (user as any).raw_user_meta_data?.name ||
                               (user as any).raw_user_meta_data?.display_name ||
                               user.email?.split('@')[0] ||
                               'User'
            userMap.set(user.id, displayName)
          }
        })
      }
    }

    // Set fallback for any remaining unknown users
    userIds.forEach(userId => {
      if (!userMap.has(userId)) {
        userMap.set(userId, 'Unknown User')
      }
    })

  } catch (error) {
    console.error('Error resolving user display names:', error)
    // Set fallback for all users
    userIds.forEach(userId => {
      userMap.set(userId, 'Unknown User')
    })
  }

  return userMap
}

// Helper function to execute raw SQL with proper UUID handling
export async function executeRawSql(query: string, params: any[] = []) {
  const supabase = await createClient()

  try {
    // Use PostgreSQL's format function for safe parameter substitution
    let finalQuery = query
    params.forEach((param, index) => {
      const placeholder = `$${index + 1}`
      if (typeof param === 'string' && param.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        // UUID format - add explicit casting
        finalQuery = finalQuery.replace(new RegExp(`\\${placeholder}`, 'g'), `${placeholder}::uuid`)
      } else {
        finalQuery = finalQuery.replace(new RegExp(`\\${placeholder}`, 'g'), `'${param}'`)
      }
    })

    // Use Supabase's RPC to execute the query
    const { data, error } = await supabase
      .rpc('exec_sql', {
        query: finalQuery,
        params: JSON.stringify(params)
      })

    if (error) {
      throw new Error(`Raw SQL execution failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Raw SQL execution error:", error)
    throw error
  }
}
