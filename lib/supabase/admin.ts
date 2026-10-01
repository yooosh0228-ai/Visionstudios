import { createClient } from "@supabase/supabase-js"

import { supabasePublicEnv } from "./env"

/**
 * Cliente con la llave de servicio: salta RLS y es el único que puede ejecutar
 * las funciones de cobro. Solo se importa desde código de servidor.
 */
export function createSupabaseAdmin() {
  const { url } = supabasePublicEnv()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY")
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
