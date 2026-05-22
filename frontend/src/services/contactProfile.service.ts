/**
 * Contact Profile Service
 * Checks whether the user has completed their contact info setup.
 */

import { supabase } from '../lib/supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export interface ContactProfileStatus {
  complete: boolean
}

/**
 * Check if the current user's contact info is marked complete.
 * Returns true only when the user has filled in all required fields
 * (first_name, last_name, phone, country, state, city).
 */
export async function isContactInfoComplete(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  try {
    const res = await fetch(`${API_BASE_URL}/api/contact-profile/complete`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
    if (!res.ok) return false
    const data: ContactProfileStatus = await res.json()
    return data.complete === true
  } catch {
    // Fail-open on network error so users aren't locked out
    return true
  }
}