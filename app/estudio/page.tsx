import type { Metadata, Viewport } from "next"

import { MODELS } from "@/generation/catalog"
import { getSession } from "@/generation/session"
import { StudioTemplate } from "@/layouts/studio"
import { createSupabaseServer } from "@/lib/supabase/server"

import { AccountGate } from "@/components/studio/account-gate"
import { LoginScreen } from "@/components/studio/login-screen"
import { NoModels } from "@/components/studio/no-models"

export const metadata: Metadata = {
  title: "VS Studio · genera tus imágenes y compártelas con tus amigos",
  description: "Crea imágenes y video para tu negocio desde el navegador. Entra con Google y paga solo lo que generas.",
  appleWebApp: { capable: true, title: "Estudio", statusBarStyle: "black" },
  formatDetection: { telephone: false },
}

// Llena la pantalla del iPhone (con muesca) y respeta las zonas seguras.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#141819",
  colorScheme: "dark",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  if (MODELS.length === 0) return <NoModels />

  let session
  try {
    session = await getSession()
  } catch {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          El estudio todavía no está configurado: faltan las variables de
          Supabase en el servidor.
        </p>
      </main>
    )
  }

  if (!session) {
    const { error } = await searchParams
    return (
      <LoginScreen
        error={
          error
            ? "No pudimos completar la entrada con Google. Intenta de nuevo."
            : undefined
        }
      />
    )
  }

  const supabase = await createSupabaseServer()
  const [account, priceRows] = await Promise.all([
    supabase
      .from("accounts")
      .select("credits")
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase.from("model_prices").select("model_id, credits"),
  ])
  const prices: Record<string, number> = {}
  for (const row of priceRows.data ?? [])
    prices[String(row.model_id)] = Number(row.credits)

  return (
    <AccountGate
      userId={session.userId}
      account={{
        email: session.email,
        credits: account.data ? Number(account.data.credits) : 0,
        isOwner: session.isOwner,
      }}
      prices={prices}
    >
      <StudioTemplate />
    </AccountGate>
  )
}
