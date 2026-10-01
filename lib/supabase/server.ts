import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { supabasePublicEnv } from "./env"

/** Cliente con la sesión del usuario (cookies). Solo lectura bajo RLS. */
export async function createSupabaseServer() {
  const jar = await cookies()
  const { url, key } = supabasePublicEnv()
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list)
            jar.set(name, value, options)
        } catch {
          // Render de servidor sin permiso de escribir cookies: el proxy las refresca.
        }
      },
    },
  })
}
