import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { MarcoPanel } from "@/components/panel/marco"
import { getSession } from "@/generation/session"
import type { Session } from "@/generation/session"
import { hoyRD } from "@/lib/vs/cuentas"
import { panelDelDueno } from "@/lib/vs/panel-cache"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: { default: "Panel · Vision Studios", template: "%s · Panel" },
  robots: { index: false },
}

export default async function LayoutPanel({
  children,
}: {
  children: React.ReactNode
}) {
  let sesion: Session | null = null
  try {
    sesion = await getSession()
  } catch {
    sesion = null
  }
  if (!sesion?.isOwner) redirect("/entrar?a=/admin")

  let contadores = { prospectos: 0, cobros: 0, proyectos: 0 }
  try {
    const p = await panelDelDueno()
    const hoy = hoyRD()
    contadores = {
      prospectos: p.prospectos.filter(
        (x) =>
          !["ganado", "perdido"].includes(x.estado) &&
          (!x.fechaProxima || x.fechaProxima <= hoy)
      ).length,
      cobros: p.pagos.filter((x) => x.estado === "pendiente").length,
      proyectos: p.entregables.filter((x) => x.estado === "cambios").length,
    }
  } catch {
    // Si la base no responde, el panel igual abre y cada página avisa.
  }

  return (
    <MarcoPanel correo={sesion.email} contadores={contadores}>
      {children}
    </MarcoPanel>
  )
}
