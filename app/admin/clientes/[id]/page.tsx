import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, MessageCircle } from "lucide-react"

import { MoverEtapa, RegistrarPago } from "@/components/panel/rapidas"
import { EditarRegistro } from "@/components/panel/registro"
import { Encabezado, Insignia, Tarjeta, Vacio } from "@/components/panel/ui"
import { CopyButton } from "@/components/servicios/copy-button"
import { aColumnas } from "@/lib/vs/campos"
import {
  ESTADO_COBRO_LABEL,
  formatoFecha,
  formatoRD,
  hoyRD,
} from "@/lib/vs/cuentas"
import { panelDelDueno } from "@/lib/vs/panel-cache"
import { radiografiaDe } from "@/lib/vs/radiografia"
import { cobrosConCuenta, opcionesDe } from "@/lib/vs/resumen"
import {
  ENTREGABLE_LABEL,
  ETAPA_LABEL,
  METODO_LABEL,
  TIPO_COBRO_LABEL,
} from "@/lib/vs/types"

export const metadata = { title: "Cliente" }

function wa(telefono: string) {
  const n = telefono.replace(/\D/g, "")
  if (n.length < 10) return null
  return `https://wa.me/${n.length === 10 ? `1${n}` : n}`
}

export default async function ClienteDetalle({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const p = await panelDelDueno()
  const c = p.clientes.find((x) => x.id === id)
  if (!c) notFound()
  const hoy = hoyRD()
  const opciones = opcionesDe(p)
  const rx = radiografiaDe(c)
  const ofertaSugerida = p.ofertas.find((o) => o.id === rx.ofertaSugerida)
  const proyectos = p.proyectos.filter((x) => x.clienteId === c.id)
  const entregables = p.entregables.filter((e) =>
    proyectos.some((x) => x.id === e.proyectoId)
  )
  const cobros = cobrosConCuenta(p, hoy).filter((x) => x.clienteId === c.id)
  const pagos = p.pagos.filter((x) => cobros.some((k) => k.id === x.cobroId))
  const apps = p.apps.filter((a) => a.clienteId === c.id)
  const saldo = cobros.reduce((a, x) => a + x.cuenta.saldo, 0)
  const enlaceWa = wa(c.telefono)

  const estrategia = [
    "Vision Studios — Estrategia inicial",
    `Cliente: ${c.nombre}`,
    `Objetivo: ${c.objetivo || "por confirmar"}`,
    `Problema principal: ${rx.problema}`,
    `Foco recomendado: ${rx.recomendacion}${ofertaSugerida ? ` (${ofertaSugerida.nombre})` : ""}`,
    `Promesa: ${c.oferta ? `Haz visible por qué elegir ${c.nombre}: ${c.oferta.replace(/[.\s]+$/, "")}.` : "Aterrizar una promesa concreta antes de publicar."}`,
    `Llamado a la acción: Escribe por WhatsApp para ${c.objetivo ? "lograr: " + c.objetivo.replace(/[.\s]+$/, "").toLowerCase() : "apartar o pedir"}.`,
    `Tono: ${c.tono || "por definir con el cliente"}`,
    "",
    ...rx.hipotesis,
  ].join("\n")

  return (
    <>
      <Link
        href="/admin/clientes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Clientes
      </Link>
      <Encabezado
        titulo={c.nombre}
        texto={[c.contacto, c.telefono, c.sector, c.ciudad]
          .filter(Boolean)
          .join(" · ")}
        acciones={
          <>
            {enlaceWa ? (
              <a
                href={enlaceWa}
                target="_blank"
                rel="noopener"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            ) : null}
            <EditarRegistro
              entidad="cliente"
              id={c.id}
              valores={aColumnas(c)}
              variante="primario"
              titulo="Client Brain"
            >
              Editar datos
            </EditarRegistro>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {c.email ? (
          <Insignia tono="bien">Entra a su área con {c.email}</Insignia>
        ) : (
          <Insignia tono="atencion">
            Sin acceso: escribe su correo de Google en «Editar datos»
          </Insignia>
        )}
        {saldo > 0 ? (
          <Insignia tono="atencion">Debe {formatoRD(saldo)}</Insignia>
        ) : (
          <Insignia tono="bien">Al día</Insignia>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Tarjeta className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-semibold">Radiografía rápida</h2>
            <span className="text-xs text-muted-foreground">
              Información {rx.completo}% completa
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            {rx.puntajes.map((s) => (
              <li key={s.etiqueta} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span>{s.etiqueta}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {s.valor}/3
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1" aria-hidden>
                  {[1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className={`h-1.5 rounded-full ${s.valor >= n ? (s.valor === 3 ? "bg-primary" : "bg-amber-300") : "bg-muted"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{s.nota}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Problema principal (hipótesis)
            </p>
            <p className="mt-1">{rx.problema}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {rx.recomendacion}
              {ofertaSugerida
                ? ` Servicio sugerido: ${ofertaSugerida.nombre}.`
                : ""}
            </p>
          </div>
        </Tarjeta>

        <Tarjeta className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Estrategia inicial</h2>
            <CopyButton text={estrategia} label="Copiar" />
          </div>
          <p className="text-sm text-muted-foreground">
            Sale de lo que dijo el cliente. No hay estrategia sin información
            real: completa el Client Brain para afinarla.
          </p>
          <pre className="max-h-80 overflow-auto rounded-xl bg-background/60 p-3 font-sans text-sm whitespace-pre-wrap">
            {estrategia}
          </pre>
        </Tarjeta>
      </div>

      <Tarjeta className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Proyectos</h2>
          <EditarRegistro
            entidad="proyecto"
            opciones={opciones}
            valores={{ cliente_id: c.id }}
            ocultar={["cliente_id"]}
            tam="chico"
            variante="suave"
          >
            Nuevo proyecto
          </EditarRegistro>
        </div>
        {proyectos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin proyectos todavía.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {proyectos.map((x) => {
              const suyos = entregables.filter((e) => e.proyectoId === x.id)
              return (
                <li key={x.id} className="flex flex-col gap-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 font-medium">
                      {x.nombre}
                    </span>
                    <Insignia tono={x.etapa === "entrega" ? "bien" : "info"}>
                      {ETAPA_LABEL[x.etapa]}
                    </Insignia>
                    {x.fechaEntrega ? (
                      <span className="text-sm text-muted-foreground">
                        Entrega {formatoFecha(x.fechaEntrega)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <MoverEtapa id={x.id} etapa={x.etapa} />
                    <EditarRegistro
                      entidad="proyecto"
                      id={x.id}
                      valores={aColumnas(x)}
                      opciones={opciones}
                      tam="chico"
                      variante="fantasma"
                    >
                      Editar
                    </EditarRegistro>
                    <EditarRegistro
                      entidad="entregable"
                      opciones={opciones}
                      valores={{ proyecto_id: x.id }}
                      ocultar={["proyecto_id"]}
                      tam="chico"
                      variante="fantasma"
                    >
                      + Entregable
                    </EditarRegistro>
                  </div>
                  {suyos.length ? (
                    <ul className="flex flex-col gap-2 rounded-xl bg-background/40 p-3">
                      {suyos.map((e) => (
                        <li
                          key={e.id}
                          className="flex flex-wrap items-center gap-2 text-sm"
                        >
                          <span className="min-w-0 flex-1">
                            {e.titulo}
                            {e.comentarioCliente ? (
                              <span className="block text-muted-foreground">
                                «{e.comentarioCliente}»
                              </span>
                            ) : null}
                          </span>
                          <Insignia
                            tono={
                              e.estado === "aprobado"
                                ? "bien"
                                : e.estado === "cambios"
                                  ? "atencion"
                                  : "neutro"
                            }
                          >
                            {ENTREGABLE_LABEL[e.estado]}
                          </Insignia>
                          {e.enlace ? (
                            <a
                              href={e.enlace}
                              target="_blank"
                              rel="noopener"
                              aria-label={`Abrir ${e.titulo}`}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="size-4" />
                            </a>
                          ) : null}
                          <EditarRegistro
                            entidad="entregable"
                            id={e.id}
                            valores={aColumnas(e)}
                            opciones={opciones}
                            tam="chico"
                            variante="fantasma"
                          >
                            Editar
                          </EditarRegistro>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Cobros</h2>
          <EditarRegistro
            entidad="cobro"
            opciones={opciones}
            valores={{ cliente_id: c.id }}
            ocultar={["cliente_id"]}
            tam="chico"
            variante="suave"
          >
            Nuevo cobro
          </EditarRegistro>
        </div>
        {cobros.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin cobros registrados. El calendario de producción no empieza hasta
            registrar el depósito.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {cobros.map((k) => (
              <li
                key={k.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{k.concepto}</p>
                  <p className="text-sm text-muted-foreground">
                    {TIPO_COBRO_LABEL[k.tipo]} · {formatoRD(k.precio)} ·
                    recibido {formatoRD(k.cuenta.recibido)}
                    {k.vencimiento
                      ? ` · vence ${formatoFecha(k.vencimiento)}`
                      : ""}
                  </p>
                </div>
                <Insignia
                  tono={
                    k.cuenta.estado === "pagado"
                      ? "bien"
                      : k.cuenta.estado === "vencido"
                        ? "mal"
                        : k.cuenta.estado === "cancelado"
                          ? "neutro"
                          : "atencion"
                  }
                >
                  {ESTADO_COBRO_LABEL[k.cuenta.estado]}
                  {k.cuenta.saldo > 0 ? ` · ${formatoRD(k.cuenta.saldo)}` : ""}
                </Insignia>
                {k.cuenta.saldo > 0 ? (
                  <RegistrarPago
                    cobroId={k.id}
                    saldo={k.cuenta.saldo}
                    concepto={k.concepto}
                  />
                ) : null}
                <EditarRegistro
                  entidad="cobro"
                  id={k.id}
                  valores={aColumnas(k)}
                  opciones={opciones}
                  tam="chico"
                  variante="fantasma"
                >
                  Editar
                </EditarRegistro>
              </li>
            ))}
          </ul>
        )}
        {pagos.length ? (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              Pagos ({pagos.length})
            </summary>
            <ul className="mt-2 flex flex-col gap-1">
              {pagos.map((x) => (
                <li key={x.id} className="flex flex-wrap gap-2">
                  <span className="tabular-nums">{formatoRD(x.monto)}</span>
                  <span className="text-muted-foreground">
                    {METODO_LABEL[x.metodo]} ·{" "}
                    {x.referencia || "sin referencia"} ·{" "}
                    {formatoFecha(x.createdAt)}
                  </span>
                  <Insignia
                    tono={
                      x.estado === "confirmado"
                        ? "bien"
                        : x.estado === "rechazado"
                          ? "mal"
                          : "atencion"
                    }
                  >
                    {x.estado}
                  </Insignia>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </Tarjeta>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Tarjeta className="flex flex-col gap-2">
          <h2 className="font-semibold">Lo que sabemos (Client Brain)</h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
            {(
              [
                ["Oferta", c.oferta],
                ["Audiencia", c.audiencia],
                ["Presencia", c.enlace],
                ["Pruebas", c.prueba],
                ["Presupuesto", c.rangoPrecio],
                ["Objetivo", c.objetivo],
                ["Obstáculo", c.obstaculo],
                ["Tono", c.tono],
                ["Materiales", c.materiales],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="whitespace-pre-line">
                  {v || (
                    <span className="text-muted-foreground">Pendiente</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {c.notasInternas ? (
            <div className="mt-2 rounded-xl border border-amber-300/30 bg-amber-300/5 p-3 text-sm">
              <p className="text-xs font-medium text-amber-300 uppercase">
                Notas internas · el cliente no las ve
              </p>
              <p className="mt-1 whitespace-pre-line">{c.notasInternas}</p>
            </div>
          ) : null}
        </Tarjeta>
        <Tarjeta className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Apps y páginas de este cliente</h2>
            <EditarRegistro
              entidad="app"
              opciones={opciones}
              valores={{ cliente_id: c.id }}
              tam="chico"
              variante="suave"
            >
              Añadir
            </EditarRegistro>
          </div>
          {apps.length === 0 ? (
            <Vacio titulo="Nada todavía." />
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {apps.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 flex-1 font-medium">{a.nombre}</span>
                  {a.mensualidad ? (
                    <Insignia>{formatoRD(a.mensualidad)}/mes</Insignia>
                  ) : null}
                  {a.url ? (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener"
                      className="text-primary hover:underline"
                    >
                      Abrir
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  )
}
