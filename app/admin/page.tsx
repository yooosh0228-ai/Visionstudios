import Link from "next/link"
import { ArrowRight, MessageCircle } from "lucide-react"

import { EditarRegistro } from "@/components/panel/registro"
import { Posponer } from "@/components/panel/rapidas"
import {
  Encabezado,
  Insignia,
  Kpi,
  Tarjeta,
  Vacio,
} from "@/components/panel/ui"
import {
  ESTADO_COBRO_LABEL,
  formatoFecha,
  formatoRD,
  hoyRD,
} from "@/lib/vs/cuentas"
import { panelDelDueno } from "@/lib/vs/panel-cache"
import { opcionesDe, resumenDe } from "@/lib/vs/resumen"
import { ESTADO_PROSPECTO_LABEL, ETAPAS, ETAPA_LABEL } from "@/lib/vs/types"

export const metadata = { title: "Resumen" }

function whatsapp(telefono: string) {
  const n = telefono.replace(/\D/g, "")
  if (n.length < 10) return null
  return `https://wa.me/${n.length === 10 ? `1${n}` : n}`
}

export default async function Resumen() {
  const p = await panelDelDueno()
  const hoy = hoyRD()
  const r = resumenDe(p, hoy)
  const opciones = opcionesDe(p)
  const avance =
    p.ajustes.metaMensual > 0
      ? Math.min(100, Math.round((r.cobradoMes / p.ajustes.metaMensual) * 100))
      : 0
  const mes = new Date(`${hoy}T12:00:00`).toLocaleDateString("es-DO", {
    month: "long",
    year: "numeric",
  })

  return (
    <>
      <Encabezado
        titulo="El negocio antes que el ruido."
        texto="Lo que necesita atención hoy. Convierte conversaciones en depósitos, y depósitos en casos que puedas mostrar."
        acciones={
          <>
            <EditarRegistro
              entidad="prospecto"
              variante="primario"
              opciones={opciones}
              valores={{ fecha_proxima: hoy }}
            >
              Añadir prospecto
            </EditarRegistro>
            <Link
              href="/admin/clientes/nuevo"
              className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"
            >
              Registrar cliente
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          etiqueta={`Cobrado en ${mes.split(" ")[0]}`}
          valor={formatoRD(r.cobradoMes)}
          nota={
            r.creditosMes
              ? `+ ${formatoRD(r.creditosMes)} en créditos`
              : `Meta ${formatoRD(p.ajustes.metaMensual)}`
          }
          tono="bien"
        />
        <Kpi
          etiqueta="Por cobrar"
          valor={formatoRD(r.porCobrar)}
          nota={`${r.depositosPendientes} depósito(s) pendiente(s)`}
          tono={r.vencidos.length ? "mal" : undefined}
        />
        <Kpi
          etiqueta="Pagos por confirmar"
          valor={String(r.pagosPorConfirmar.length)}
          nota="Transferencias que reportaron"
          tono={r.pagosPorConfirmar.length ? "atencion" : undefined}
        />
        <Kpi
          etiqueta="Capacidad activa"
          valor={`${r.capacidadUsada}/${p.ajustes.capacidad}`}
          nota="Clientes con proyecto en curso"
          tono={r.capacidadUsada >= p.ajustes.capacidad ? "mal" : undefined}
        />
      </div>

      <Tarjeta>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Ritmo del mes</h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatoRD(r.cobradoMes)} de {formatoRD(p.ajustes.metaMensual)} ·{" "}
            {avance}%
          </span>
        </div>
        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={avance}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avance de la meta del mes"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${avance}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Meta de inicio; ajústala en Ajustes después de validar tres meses.
        </p>
      </Tarjeta>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Tarjeta className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Próximas acciones</h2>
            {r.accionesVencidas ? (
              <Insignia tono="mal">{r.accionesVencidas} atrasada(s)</Insignia>
            ) : null}
          </div>
          {r.acciones.length === 0 ? (
            <Vacio
              titulo="Ningún seguimiento programado"
              texto="Añade un prospecto y ponle una próxima acción con fecha."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {r.acciones.slice(0, 8).map((x) => {
                const wa = whatsapp(x.telefono)
                const atrasada = !!x.fechaProxima && x.fechaProxima < hoy
                return (
                  <li
                    key={x.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {x.negocio}{" "}
                        {x.fuente === "web" ? (
                          <Insignia tono="info">Web</Insignia>
                        ) : null}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {x.proximaAccion || "Sin próxima acción"}
                      </p>
                    </div>
                    <span
                      className={
                        atrasada
                          ? "text-sm font-medium text-destructive"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      {x.fechaProxima === hoy
                        ? "Hoy"
                        : formatoFecha(x.fechaProxima)}
                    </span>
                    <span className="flex gap-1">
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener"
                          aria-label={`WhatsApp de ${x.negocio}`}
                          className="inline-flex size-8 items-center justify-center rounded-full bg-muted hover:bg-muted/70"
                        >
                          <MessageCircle className="size-4" />
                        </a>
                      ) : null}
                      <Posponer id={x.id} hoy={hoy} />
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <Link
            href="/admin/prospectos"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            Ver todos los prospectos <ArrowRight className="size-4" />
          </Link>
        </Tarjeta>

        <div className="flex flex-col gap-4">
          <Tarjeta className="flex flex-col gap-3">
            <h2 className="font-semibold">Control de entrega</h2>
            <p className="text-sm text-muted-foreground">
              El saldo pendiente retiene la entrega final.
            </p>
            {r.abiertos.length === 0 ? (
              <p className="text-sm">No hay saldos pendientes.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {r.abiertos.slice(0, 5).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {c.cliente} · {c.concepto}
                    </span>
                    <Insignia
                      tono={c.cuenta.estado === "vencido" ? "mal" : "atencion"}
                    >
                      {formatoRD(c.cuenta.saldo)} ·{" "}
                      {ESTADO_COBRO_LABEL[c.cuenta.estado]}
                    </Insignia>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/cobros"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              Ir a cobros <ArrowRight className="size-4" />
            </Link>
          </Tarjeta>

          {r.respuestasClientes.length ? (
            <Tarjeta className="flex flex-col gap-2">
              <h2 className="font-semibold">Respuestas de clientes</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {r.respuestasClientes.slice(0, 5).map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="min-w-0 truncate">{e.titulo}</span>
                    <Insignia
                      tono={e.estado === "aprobado" ? "bien" : "atencion"}
                    >
                      {e.estado === "aprobado" ? "Aprobó" : "Pidió cambios"}
                    </Insignia>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          ) : null}
        </div>
      </div>

      <Tarjeta className="flex flex-col gap-3">
        <h2 className="font-semibold">Estado de cartera</h2>
        <p className="text-sm text-muted-foreground">
          Cada proyecto tiene una etapa visible, no conversaciones perdidas.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {ETAPAS.map((e) => {
            const n = p.proyectos.filter(
              (x) => x.etapa === e && !x.cerrado
            ).length
            return (
              <Link
                key={e}
                href={`/admin/proyectos#${e}`}
                className="flex flex-col gap-1 rounded-xl border border-border p-3 hover:bg-muted/40"
              >
                <span className="text-xs text-muted-foreground">
                  {ETAPA_LABEL[e]}
                </span>
                <span className="text-xl font-semibold tabular-nums">{n}</span>
              </Link>
            )
          })}
        </div>
      </Tarjeta>

      {r.mensajesWeb.length ? (
        <Tarjeta className="flex flex-col gap-2">
          <h2 className="font-semibold">Mensajes nuevos de la página</h2>
          <ul className="flex flex-col divide-y divide-border">
            {r.mensajesWeb.slice(0, 6).map((x) => (
              <li
                key={x.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="min-w-0">
                  <b>{x.negocio}</b> · {x.contacto} ·{" "}
                  {x.datos.intereses || "sin servicio marcado"}
                </span>
                <span className="text-muted-foreground">
                  {ESTADO_PROSPECTO_LABEL[x.estado]}
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      ) : null}
    </>
  )
}
