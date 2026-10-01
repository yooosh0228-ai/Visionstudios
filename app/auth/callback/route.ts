import { NextResponse } from "next/server"

import { createSupabaseServer } from "@/lib/supabase/server"

/** Google devuelve aquí con un código; se cambia por la sesión y se entra al estudio. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? origin
  const code = searchParams.get("code")
  if (code) {
    const supabase = await createSupabaseServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${base}/`)
  }
  return NextResponse.redirect(`${base}/?error=login`)
}
