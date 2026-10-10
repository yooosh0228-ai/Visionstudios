import { cache } from "react"
import { redirect } from "next/navigation"

import { getSession } from "@/generation/session"

import { leerPanel } from "./datos"

/**
 * Todo el negocio, solo para el dueño. La verificación va aquí, junto a la
 * lectura, y no solo en el marco del panel: Next puede pintar una página sin
 * volver a pintar su marco. Una sola lectura por cada vez que se pinta.
 */
export const panelDelDueno = cache(async () => {
  let sesion = null
  try {
    sesion = await getSession()
  } catch {
    sesion = null
  }
  if (!sesion?.isOwner) redirect("/entrar?a=/admin")
  return leerPanel()
})
