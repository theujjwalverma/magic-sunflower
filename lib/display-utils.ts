import { Tables } from '@/types/supabase';

export type DisplayPreference = 'full_name' | 'username' | 'full_name_username' | 'email';

/**
 * Get a user's display name based on their profile preference
 */
export function getDisplayName(profile: Tables<'profiles'> | null, fallback: string = 'Partner'): string {
  if (!profile) return fallback;

  switch (profile.display_preference || 'full_name') {
    case 'username':
      return profile.username || fallback;
    
    case 'full_name_username':
      const fullName = profile.full_name || '';
      const username = profile.username || '';
      if (fullName && username) {
        return `${fullName} (@${username})`;
      }
      return fullName || username || fallback;
    
    case 'email':
      return profile.email || fallback;
    
    default: // full_name
      return profile.full_name || fallback;
  }
}

/**
 * Get a user's email from profile with fallback
 */
export function getEmail(profile: Tables<'profiles'> | null, fallback: string = 'partner@example.com'): string {
  return profile?.email || fallback;
}

/**
 * Get a user's username from profile with fallback
 */
export function getUsername(profile: Tables<'profiles'> | null, fallback: string = 'user'): string {
  return profile?.username || fallback;
}

/**
 * Get a user's full name from profile with fallback
 */
export function getFullName(profile: Tables<'profiles'> | null, fallback: string = 'User'): string {
  return profile?.full_name || fallback;
}

/**
 * Get display options for the settings dropdown
 */
export function getDisplayOptions() {
  return [
    { value: 'full_name', label: 'Full Name' },
    { value: 'username', label: 'Username' },
    { value: 'full_name_username', label: 'Full Name (@username)' },
    { value: 'email', label: 'Email Address' },
  ];
}
