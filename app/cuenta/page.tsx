import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AreaCliente } from "@/components/cuenta/area-cliente"
import { getSession } from "@/generation/session"
import type { Session } from "@/generation/session"
import { cuentaDe, hoyRD } from "@/lib/vs/cuentas"
import { leerPortal } from "@/lib/vs/datos"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Mi cuenta · Vision Studios",
  robots: { index: false },
}

export default async function Cuenta() {
  let sesion: Session | null = null
  try {
    sesion = await getSession()
  } catch {
    sesion = null
  }
  if (!sesion) redirect("/entrar?a=/cuenta")

  const portal = await leerPortal(sesion)
  const hoy = hoyRD()
  const cobros = portal.cobros.map((c) => ({
    ...c,
    cuenta: cuentaDe(c, portal.pagos, hoy),
  }))

  return (
    <AreaCliente
      correo={sesion.email}
      esDueno={sesion.isOwner}
      cliente={portal.cliente}
      proyectos={portal.proyectos}
      entregables={portal.entregables}
      cobros={cobros}
      pagos={portal.pagos}
      pagosCreditos={portal.pagosCreditos}
      creditos={portal.creditos}
      cuentasPago={portal.ajustes.cuentasPago}
      paquetes={portal.ajustes.paquetesCreditos}
      reglas={portal.ajustes.reglasCobro}
      chat={
        portal.ajustes.whatsapp
          ? `https://wa.me/${portal.ajustes.whatsapp}`
          : `https://ig.me/m/${portal.ajustes.instagram}`
      }
    />
  )
}
