import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { LoginScreen } from "@/components/studio/login-screen"
import { getSession } from "@/generation/session"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Entrar · Vision Studios",
  description:
    "Entra a tu cuenta de Vision Studios: proyectos, entregas, pagos, Estudio y Agentes.",
  robots: { index: false },
}

const DESTINOS = new Set(["/cuenta", "/estudio", "/servicios", "/admin"])

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; error?: string }>
}) {
  const { a, error } = await searchParams
  let sesion = null
  try {
    sesion = await getSession()
  } catch {
    sesion = null
  }
  const pedido = a && DESTINOS.has(a) ? a : null
  if (sesion) {
    // El panel es solo del dueño: a cualquier otra cuenta se le lleva a la suya.
    if (pedido === "/admin" && !sesion.isOwner) redirect("/cuenta")
    redirect(pedido ?? (sesion.isOwner ? "/admin" : "/cuenta"))
  }
  return (
    <LoginScreen
      next={pedido ?? "/cuenta"}
      titulo="Tu cuenta en Vision Studios"
      texto="Mira en qué va tu proyecto, aprueba las entregas, reporta tus pagos y entra al Estudio. Con tu cuenta de Google, en un toque."
      error={
        error
          ? "No pudimos completar la entrada con Google. Intenta de nuevo."
          : undefined
      }
    />
  )
}
