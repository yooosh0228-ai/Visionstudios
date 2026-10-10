import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Encabezado } from "@/components/panel/ui"

import { Intake } from "./intake"

export const metadata = { title: "Master Intake" }

export default function NuevoCliente() {
  return (
    <>
      <Link
        href="/admin/clientes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Clientes
      </Link>
      <Encabezado
        titulo="Master Intake"
        texto="Información que se convierte en dirección. Se completa con el cliente; los campos con asterisco son la base mínima. El borrador se guarda en este dispositivo."
      />
      <Intake />
    </>
  )
}
