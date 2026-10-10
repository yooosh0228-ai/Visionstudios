"use client"

import { useState } from "react"
import Link from "next/link"
import { LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

import { BrandMark } from "./brand-mark"

/** Entrada de un solo botón: cuenta de Google y listo. */
export function LoginScreen({
  error,
  next = "/estudio",
  titulo = "Estudio Vision",
  texto = "Crea imágenes y video para tu negocio. Entra con un toque y paga solo lo que generas, con créditos que recargas con nosotros.",
  volver = true,
}: {
  error?: string | undefined
  /** A dónde volver después de entrar con Google. */
  next?: string
  titulo?: string
  texto?: string
  volver?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState<string | null>(error ?? null)

  const signIn = async () => {
    setBusy(true)
    setFailed(null)
    try {
      // El destino viaja en una cookie corta: la dirección de regreso de Google
      // queda siempre igual, como la exige Supabase.
      document.cookie = `vs_next=${encodeURIComponent(next)}; path=/; max-age=600; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`
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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 70% at 50% 0%, rgba(53,179,126,0.16) 0%, rgba(53,179,126,0.05) 42%, transparent 72%)",
        }}
      />
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <BrandMark className="w-16 text-foreground" title="Vision Studios" />
        <div className="flex flex-col gap-2">
          <h1 className="text-q-headline-md-semi-bold">{titulo}</h1>
          <p className="text-sm text-muted-foreground">{texto}</p>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="h-12 w-full text-base"
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
        <p className="text-xs text-muted-foreground">
          Al continuar aceptas las{" "}
          <Link href="/terminos" className="underline">
            Condiciones
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" className="underline">
            Política de Privacidad
          </Link>
          .
        </p>
        {volver ? (
          <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            ← Volver a Vision Studios
          </Link>
        ) : null}
      </div>
    </main>
  )
}
