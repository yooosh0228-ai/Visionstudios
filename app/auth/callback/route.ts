import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { createSupabaseServer } from "@/lib/supabase/server"

/** Solo rutas internas: nunca se redirige a otro sitio. */
function destinoSeguro(valor: string | undefined): string {
  if (!valor) return "/cuenta"
  let ruta: string
  try {
    ruta = decodeURIComponent(valor)
  } catch {
    return "/cuenta"
  }
  return ruta.startsWith("/") && !ruta.startsWith("//") && !ruta.includes("\\")
    ? ruta
    : "/cuenta"
}

/**
 * Google devuelve aquí con un código; se cambia por la sesión y se sigue a donde
 * la persona iba (el Estudio, su cuenta o el panel), guardado en la cookie vs_next.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? origin
  const jar = await cookies()
  const destino = destinoSeguro(jar.get("vs_next")?.value)
  const code = searchParams.get("code")
  if (code) {
    const supabase = await createSupabaseServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const res = NextResponse.redirect(`${base}${destino}`)
      res.cookies.delete("vs_next")
      return res
    }
  }
  return NextResponse.redirect(`${base}/entrar?error=login`)
}
