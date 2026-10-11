import { Encabezado } from "@/components/panel/ui"
import { panelDelDueno } from "@/lib/vs/panel-cache"

import { FormularioAjustes } from "./formulario"

export const metadata = { title: "Ajustes" }

export default async function Ajustes() {
  const p = await panelDelDueno()
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
      />
    </>
  )
}
