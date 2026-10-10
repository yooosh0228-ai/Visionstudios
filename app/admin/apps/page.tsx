import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { EditarRegistro } from "@/components/panel/registro"
import {
  Encabezado,
  Insignia,
  Kpi,
  Tarjeta,
  Vacio,
} from "@/components/panel/ui"
import { aColumnas } from "@/lib/vs/campos"
import { formatoRD } from "@/lib/vs/cuentas"
import { panelDelDueno } from "@/lib/vs/panel-cache"
import { opcionesDe } from "@/lib/vs/resumen"
import { ESTADOS_APP, ESTADO_APP_LABEL, TIPO_APP_LABEL } from "@/lib/vs/types"

export const metadata = { title: "Apps y páginas" }

export default async function Apps() {
  const p = await panelDelDueno()
  const opciones = opcionesDe(p)
  const cliente = new Map(p.clientes.map((c) => [c.id, c.nombre]))
  const mensual = p.apps
    .filter((a) => a.estado === "activo")
    .reduce((s, a) => s + (a.mensualidad ?? 0), 0)

  return (
    <>
      <Encabezado
        titulo="Apps y páginas"
        texto="Todo lo que Vision Studios tiene en línea o en camino: dónde vive, de quién es y cuánto deja al mes."
        acciones={
          <EditarRegistro entidad="app" variante="primario" opciones={opciones}>
            Agregar
          </EditarRegistro>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          etiqueta="En línea"
          valor={String(p.apps.filter((a) => a.estado === "activo").length)}
        />
        <Kpi
          etiqueta="En desarrollo"
          valor={String(p.apps.filter((a) => a.estado === "desarrollo").length)}
        />
        <Kpi
          etiqueta="Mensualidades"
          valor={formatoRD(mensual)}
          nota="De lo que está en línea"
          tono="bien"
        />
        <Kpi etiqueta="Total" valor={String(p.apps.length)} />
      </div>
      {p.apps.length === 0 ? (
        <Vacio titulo="Todavía no hay nada registrado." />
      ) : (
        ESTADOS_APP.map((estado) => {
          const lista = p.apps.filter((a) => a.estado === estado)
          if (!lista.length) return null
          return (
            <section
              key={estado}
              className="flex flex-col gap-3"
              aria-labelledby={`t-${estado}`}
            >
              <h2 id={`t-${estado}`} className="text-lg font-semibold">
                {ESTADO_APP_LABEL[estado]}{" "}
                <span className="text-muted-foreground">{lista.length}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {lista.map((a) => (
                  <Tarjeta key={a.id} className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{a.nombre}</p>
                      <Insignia>{TIPO_APP_LABEL[a.tipo]}</Insignia>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {[
                        a.clienteId ? cliente.get(a.clienteId) : "Propio",
                        a.hosting,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {a.notas ? (
                      <p className="text-sm text-muted-foreground">{a.notas}</p>
                    ) : null}
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      {a.mensualidad ? (
                        <Insignia tono="bien">
                          {formatoRD(a.mensualidad)}/mes
                        </Insignia>
                      ) : null}
                      <span className="flex-1" />
                      {a.url ? (
                        <Link
                          href={a.url}
                          target="_blank"
                          className="inline-flex h-8 items-center gap-1 rounded-full bg-muted px-3 text-xs font-semibold hover:bg-muted/70"
                        >
                          <ExternalLink className="size-3.5" /> Abrir
                        </Link>
                      ) : null}
                      <EditarRegistro
                        entidad="app"
                        id={a.id}
                        valores={aColumnas(a)}
                        opciones={opciones}
                        tam="chico"
                        variante="fantasma"
                      >
                        Editar
                      </EditarRegistro>
                    </div>
                  </Tarjeta>
                ))}
              </div>
            </section>
          )
        })
      )}
    </>
  )
}
