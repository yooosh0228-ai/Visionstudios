import { createSupabaseServer } from "@/lib/supabase/server"

import { isOwnerEmail, parseOwnerEmails } from "./billing"

export type Session = { userId: string; email: string; isOwner: boolean }

/**
 * Sesión verificada contra Supabase Auth (no se confía en la cookie sola).
 * El dueño se reconoce por OWNER_EMAILS y solo con el correo confirmado.
 */
export async function getSession(): Promise<Session | null> {
  const prueba = await sesionDePrueba()
  if (prueba !== undefined) return prueba
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

/**
 * Solo en la computadora de desarrollo (`next dev`): permite probar el panel y el
 * área de clientes sin Google. En producción NODE_ENV es "production" y esto
 * nunca corre.
 */
async function sesionDePrueba(): Promise<Session | null | undefined> {
  if (process.env.NODE_ENV !== "development" || !process.env.VS_DEV_USER_ID) return undefined
  const { cookies } = await import("next/headers")
  const elegida = (await cookies()).get("vs_dev")?.value?.split("|")
  const userId = elegida?.[0] || process.env.VS_DEV_USER_ID
  const email = elegida?.[1] || process.env.VS_DEV_EMAIL
  if (!email) return undefined
  if (userId === "ninguno") return null
  return {
    userId,
    email,
    isOwner: isOwnerEmail(email, parseOwnerEmails(process.env.OWNER_EMAILS)),
  }
}
