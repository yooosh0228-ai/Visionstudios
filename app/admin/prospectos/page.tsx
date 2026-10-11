import Link from "next/link"
import { AtSign, MessageCircle } from "lucide-react"

import { EditarRegistro } from "@/components/panel/registro"
import { aColumnas } from "@/lib/vs/campos"
import {
  ConvertirEnCliente,
  EstadoProspecto,
  Posponer,
} from "@/components/panel/rapidas"
import { Encabezado, Insignia, Tarjeta, Vacio } from "@/components/panel/ui"
import { formatoFecha, formatoRD, hoyRD } from "@/lib/vs/cuentas"
import { panelDelDueno } from "@/lib/vs/panel-cache"
import { opcionesDe } from "@/lib/vs/resumen"
import { ESTADOS_PROSPECTO, ESTADO_PROSPECTO_LABEL } from "@/lib/vs/types"
import type { Prospecto } from "@/lib/vs/types"

export const metadata = { title: "Prospectos" }

function wa(telefono: string) {
  const n = telefono.replace(/\D/g, "")
  if (n.length < 10) return null
  return `https://wa.me/${n.length === 10 ? `1${n}` : n}`
}

export default async function Prospectos({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>
}) {
  const { ver } = await searchParams
  const p = await panelDelDueno()
  const hoy = hoyRD()
  const opciones = opcionesDe(p)
  const oferta = new Map(p.ofertas.map((o) => [o.id, o.nombre]))
  const cerrados = ver === "cerrados"
  const lista = p.prospectos.filter((x) =>
    (cerrados
      ? ["ganado", "perdido"]
      : ESTADOS_PROSPECTO.filter((e) => e !== "ganado" && e !== "perdido")
    ).includes(x.estado as never)
  )
  const potencial = lista.reduce((a, x) => a + (x.valor ?? 0), 0)

  const tarjeta = (x: Prospecto) => {
    const enlaceWa = wa(x.telefono)
    const atrasada = !!x.fechaProxima && x.fechaProxima < hoy && !cerrados
    return (
      <Tarjeta key={x.id} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{x.negocio}</h2>
            <p className="text-sm text-muted-foreground">
              {[
                x.contacto,
                x.sector,
                x.ofertaId ? oferta.get(x.ofertaId) : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Sin datos de contacto"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {x.fuente === "web" ? (
              <Insignia tono="info">Llegó por la página</Insignia>
            ) : null}
            {x.valor ? <Insignia>{formatoRD(x.valor)}</Insignia> : null}
          </div>
        </div>
        <div
          className={`rounded-xl border p-3 ${atrasada ? "border-destructive/50 bg-destructive/5" : "border-border bg-background/40"}`}
        >
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Próxima acción ·{" "}
            {x.fechaProxima === hoy ? "hoy" : formatoFecha(x.fechaProxima)}
            {atrasada ? " · atrasada" : ""}
          </p>
          <p className="mt-0.5">
            {x.proximaAccion || "Sin definir: ponle una."}
          </p>
        </div>
        {x.nota ? (
          <p className="text-sm whitespace-pre-line text-muted-foreground">
            {x.nota}
          </p>
        ) : null}
        {x.fuente === "web" && (x.datos.intereses || x.datos.presupuesto) ? (
          <p className="text-sm text-muted-foreground">
            Le interesa: {x.datos.intereses || "no marcó"} · Presupuesto:{" "}
            {x.datos.presupuesto || "—"}
            {x.datos.dispositivo
              ? ` · Escribió desde ${x.datos.dispositivo}`
              : ""}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <EstadoProspecto id={x.id} estado={x.estado} />
          {!cerrados ? <Posponer id={x.id} hoy={hoy} /> : null}
          {enlaceWa ? (
            <a
              href={enlaceWa}
              target="_blank"
              rel="noopener"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-semibold hover:bg-muted/70"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          ) : null}
          {x.instagram ? (
            <a
              href={`https://www.instagram.com/${x.instagram}/`}
              target="_blank"
              rel="noopener"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-semibold hover:bg-muted/70"
            >
              <AtSign className="size-4" /> {x.instagram}
            </a>
          ) : null}
          <span className="flex-1" />
          <EditarRegistro
            entidad="prospecto"
            id={x.id}
            valores={aColumnas(x)}
            opciones={opciones}
            tam="chico"
          >
            Editar
          </EditarRegistro>
          {x.clienteId ? (
            <Link
              href={`/admin/clientes/${x.clienteId}`}
              className="inline-flex h-8 items-center rounded-full bg-primary/15 px-3 text-xs font-semibold text-primary"
            >
              Ver cliente
            </Link>
          ) : (
            <ConvertirEnCliente id={x.id} />
          )}
        </div>
      </Tarjeta>
    )
  }

  return (
    <>
      <Encabezado
        titulo="Prospectos"
        texto="Cada negocio con una sola próxima acción y su fecha. Lo que llega por «Cuéntanos tu negocio» aparece aquí solo."
        acciones={
          <EditarRegistro
            entidad="prospecto"
            variante="primario"
            opciones={opciones}
            valores={{ fecha_proxima: hoy }}
          >
            Añadir prospecto
          </EditarRegistro>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/prospectos"
          aria-current={!cerrados ? "page" : undefined}
          className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold ${!cerrados ? "bg-foreground text-background" : "border border-border"}`}
        >
          Activos
        </Link>
        <Link
          href="/admin/prospectos?ver=cerrados"
          aria-current={cerrados ? "page" : undefined}
          className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold ${cerrados ? "bg-foreground text-background" : "border border-border"}`}
        >
          Ganados y perdidos
        </Link>
        <span className="text-sm text-muted-foreground">
          {lista.length} · potencial {formatoRD(potencial)}
        </span>
      </div>
      {lista.length === 0 ? (
        <Vacio
          titulo={
            cerrados
              ? "Todavía no hay prospectos cerrados."
              : "Aún no hay prospectos."
          }
          texto="Empieza con negocios reales que puedas observar y a los que puedas escribir con una idea concreta."
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">{lista.map(tarjeta)}</div>
      )}
      <Tarjeta className="flex flex-col gap-2">
        <h2 className="font-semibold">Regla de acercamiento</h2>
        <p className="text-sm text-muted-foreground">
          Primero observa. Luego presenta una oportunidad concreta.
        </p>
        <blockquote className="border-l-2 border-primary pl-3 text-sm">
          «Vi [observación real]. Creo que podemos hacer más claro [beneficio]
          para que la gente entienda qué elegir. ¿Te gustaría que te muestre una
          idea corta?»
        </blockquote>
        <p className="text-sm text-muted-foreground">
          No regales trabajo largo para cerrar. La radiografía es pagada y se
          descuenta del siguiente servicio si contratan.
        </p>
      </Tarjeta>
      <p className="text-xs text-muted-foreground">
        Estados:{" "}
        {ESTADOS_PROSPECTO.map((e) => ESTADO_PROSPECTO_LABEL[e]).join(" → ")}
      </p>
    </>
  )
}
