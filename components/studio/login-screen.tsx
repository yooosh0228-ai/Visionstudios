"use client"

import { useState } from "react"
import { LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

import { BrandMark } from "./brand-mark"

/** Entrada de un solo botón: cuenta de Google y listo. */
export function LoginScreen({ error }: { error?: string | undefined }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState<string | null>(error ?? null)

  const signIn = async () => {
    setBusy(true)
    setFailed(null)
    try {
      const { error: oauthError } =
        await createSupabaseBrowser().auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        })
      if (oauthError) throw oauthError
    } catch {
      setBusy(false)
      setFailed("No pudimos abrir Google. Intenta de nuevo.")
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 70% at 50% 0%, rgba(53,179,126,0.16) 0%, rgba(53,179,126,0.05) 42%, transparent 72%)",
        }}
      />
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <BrandMark className="w-16 text-foreground" title="402 Vision Studios" />
        <div className="flex flex-col gap-2">
          <h1 className="text-q-headline-md-semi-bold">402 Vision Studios</h1>
          <p className="text-sm text-muted-foreground">
            Genera imágenes y video con IA. Entra con un clic y paga solo lo que
            generas, con créditos que recargas con nosotros.
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="h-11 w-full text-base"
          disabled={busy}
          onClick={() => void signIn()}
        >
          <LogIn />
          {busy ? "Abriendo Google…" : "Continuar con Google"}
        </Button>
        {failed ? (
          <p role="alert" className="text-sm text-destructive">
            {failed}
          </p>
        ) : null}
      </div>
    </main>
  )
}
