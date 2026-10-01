import { createSupabaseServer } from "@/lib/supabase/server"

import { isOwnerEmail, parseOwnerEmails } from "./billing"

export type Session = { userId: string; email: string; isOwner: boolean }

/**
 * Sesión verificada contra Supabase Auth (no se confía en la cookie sola).
 * El dueño se reconoce por OWNER_EMAILS y solo con el correo confirmado.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  const email = data.user.email ?? ""
  const confirmed = !!data.user.email_confirmed_at
  return {
    userId: data.user.id,
    email,
    isOwner:
      confirmed && isOwnerEmail(email, parseOwnerEmails(process.env.OWNER_EMAILS)),
  }
}
