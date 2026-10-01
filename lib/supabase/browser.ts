import { createBrowserClient } from "@supabase/ssr"

import { supabasePublicEnv } from "./env"

export function createSupabaseBrowser() {
  const { url, key } = supabasePublicEnv()
  return createBrowserClient(url, key)
}
