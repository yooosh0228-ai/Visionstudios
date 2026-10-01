"use server"

import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { createSupabaseServer } from "@/lib/supabase/server"

import { getSession } from "./session"

/** Saldo actual del usuario con sesión; null si no hay sesión. */
export async function getBalance(): Promise<number | null> {
  const session = await getSession()
  if (!session) return null
  const { data } = await createSupabaseAdmin()
    .from("accounts")
    .select("credits")
    .eq("user_id", session.userId)
    .maybeSingle()
  return data ? Number(data.credits) : 0
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
}
