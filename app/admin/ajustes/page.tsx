import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { Encabezado } from "@/components/panel/ui"
import { panelDelDueno } from "@/lib/vs/panel-cache"

import { FormularioAjustes } from "./formulario"

export const metadata = { title: "Ajustes" }

async function contarRegalados(): Promise<number | null> {
  try {
    const { count, error } = await createSupabaseAdmin()
      .from("ledger")
      .select("id", { count: "exact", head: true })
      .eq("reason", "adjustment")
      .eq("note", "Bienvenida")
    return error ? null : (count ?? 0)
  } catch {
    return null
  }
}

export default async function Ajustes() {
  const p = await panelDelDueno()
  const regalados = await contarRegalados()
  return (
    <>
      <Encabezado
        titulo="Ajustes"
        texto="Contacto, cuentas para transferir, paquetes de créditos, metas y los textos de la portada."
      />
      <FormularioAjustes
        ajustes={p.ajustes}
        videos={p.trabajos
          .filter((t) => t.video)
          .map((t) => ({ id: t.id, nombre: `${t.obra} · ${t.cliente}` }))}
        ofertas={p.ofertas.map((o) => ({ id: o.id, nombre: o.nombre }))}
        regalados={regalados}
      />
    </>
  )
}
