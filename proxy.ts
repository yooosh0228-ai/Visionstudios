import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import {
  DEVICE_COOKIE,
  DEVICE_COOKIE_OPTIONS,
  resolveDeviceId,
} from "./generation/device"

export async function proxy(request: NextRequest) {
  const { deviceId, minted } = resolveDeviceId(
    request.cookies.get(DEVICE_COOKIE)?.value
  )
  let response = NextResponse.next({ request })
  if (minted) response.cookies.set(DEVICE_COOKIE, deviceId, DEVICE_COOKIE_OPTIONS)

  // Refresca la sesión de Supabase en las navegaciones. Las server actions la
  // refrescan por su cuenta, así que no pagan este viaje en cada sondeo.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (url && key && !request.headers.has("next-action")) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          if (minted)
            response.cookies.set(DEVICE_COOKIE, deviceId, DEVICE_COOKIE_OPTIONS)
          for (const { name, value, options } of list)
            response.cookies.set(name, value, options)
        },
      },
    })
    await supabase.auth.getUser()
  }
  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
