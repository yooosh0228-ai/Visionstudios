"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bot,
  Check,
  CircleDot,
  ExternalLink,
  Image as ImageIcon,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react"

import {
  Aviso,
  Boton,
  Hoja,
  Insignia,
  Tarjeta,
  claseCampo,
  useAccion,
} from "@/components/panel/ui"
import { BrandMark } from "@/components/studio/brand-mark"
import { formatCredits } from "@/generation/billing"
import {
  pedirCreditos,
  reportarPago,
  responderEntregable,
} from "@/lib/vs/acciones-cliente"
import type { CuentaPago, PaqueteCreditos } from "@/lib/vs/ajustes"
import { ESTADO_COBRO_LABEL, formatoFecha, formatoRD } from "@/lib/vs/cuentas"
import type { CuentaCobro } from "@/lib/vs/cuentas"
import type { Portal } from "@/lib/vs/datos"
import { createSupabaseBrowser } from "@/lib/supabase/browser"
import { ETAPAS, ETAPA_CLIENTE } from "@/lib/vs/types"
import type { Cobro, MetodoPago, Pago } from "@/lib/vs/types"
import { METODOS_PAGO, METODO_LABEL } from "@/lib/vs/types"
import { cn } from "@/lib/utils"

type CobroVista = Cobro & { cuenta: CuentaCobro }

function Cuentas({ cuentas }: { cuentas: CuentaPago[] }) {
  if (!cuentas.length)
    return (
      <p className="text-sm text-muted-foreground">
        Escríbenos por el chat y te pasamos la cuenta para transferir.
      </p>
    )
  return (
    <ul className="flex flex-col gap-2">
      {cuentas.map((c) => (
        <li
          key={c.banco + c.numero}
          className="rounded-xl border border-border p-3 text-sm"
        >
          <p className="font-semibold">
            {c.banco}{" "}
            {c.tipo ? (
              <span className="font-normal text-muted-foreground">
                · {c.tipo}
              </span>
            ) : null}
          </p>
          <p className="font-mono text-base tracking-wide tabular-nums">
            {c.numero}
          </p>
          {c.titular ? (
            <p className="text-muted-foreground">A nombre de {c.titular}</p>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function CamposPago({
  metodo,
  setMetodo,
  referencia,
  setReferencia,
}: {
  metodo: MetodoPago
  setMetodo: (m: MetodoPago) => void
  referencia: string
  setReferencia: (r: string) => void
}) {
  return (
    <>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        ¿Por dónde pagaste?
        <select
          className={claseCampo}
          value={metodo}
          onChange={(e) => setMetodo(e.target.value as MetodoPago)}
        >
          {METODOS_PAGO.map((m) => (
            <option key={m} value={m}>
              {METODO_LABEL[m]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Número de referencia o de comprobante
        <input
          className={claseCampo}
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          autoComplete="off"
        />
        <span className="text-xs font-normal text-muted-foreground">
          Lo usamos para encontrar tu transferencia en el banco.
        </span>
      </label>
    </>
  )
}

function ReportarPago({
  cobro,
  cuentas,
}: {
  cobro: CobroVista
  cuentas: CuentaPago[]
}) {
  const [abierta, setAbierta] = useState(false)
  const falta = Math.max(0, cobro.cuenta.saldo - cobro.cuenta.porConfirmar)
  const sugerido =
    cobro.cuenta.recibido < cobro.deposito
      ? Math.min(falta, cobro.deposito - cobro.cuenta.recibido)
      : falta
  const [monto, setMonto] = useState(String(sugerido))
  const [metodo, setMetodo] = useState<MetodoPago>("popular")
  const [referencia, setReferencia] = useState("")
  const [listo, setListo] = useState(false)
  const { pendiente, mensaje, correr, limpiar } = useAccion()
  // El formulario sigue montado aunque ya no falte nada: así se ve el «Recibimos tu aviso».
  if (falta <= 0 && !abierta) return null
  return (
    <>
      {falta > 0 ? (
        <Boton
          variante="primario"
          tam="chico"
          className="self-start"
          onClick={() => {
            setListo(false)
            setMonto(String(sugerido))
            setAbierta(true)
          }}
        >
          <Wallet /> Pagar o reportar pago
        </Boton>
      ) : null}
      <Hoja
        abierta={abierta}
        onCerrar={() => {
          limpiar()
          setAbierta(false)
        }}
        titulo={cobro.concepto}
        descripcion={
          listo
            ? "Aviso enviado"
            : `Falta ${formatoRD(falta)}${cobro.cuenta.recibido < cobro.deposito ? ` · depósito para empezar: ${formatoRD(cobro.deposito - cobro.cuenta.recibido)}` : ""}`
        }
        pie={
          listo ? (
            <Boton variante="primario" onClick={() => setAbierta(false)}>
              Listo
            </Boton>
          ) : (
            <>
              <Boton
                variante="primario"
                disabled={pendiente}
                onClick={() =>
                  correr(
                    () =>
                      reportarPago({
                        cobroId: cobro.id,
                        monto,
                        metodo,
                        referencia,
                      }),
                    undefined,
                    (r) => r.ok && setListo(true)
                  )
                }
              >
                {pendiente ? "Enviando…" : "Ya transferí: avisar"}
              </Boton>
              <Boton variante="fantasma" onClick={() => setAbierta(false)}>
                Cancelar
              </Boton>
              <div className="w-full">
                <Aviso mensaje={mensaje} />
              </div>
            </>
          )
        }
      >
        {listo ? (
          <div className="flex flex-col items-start gap-2">
            <Check className="size-8 text-primary" />
            <p className="text-lg font-semibold">Recibimos tu aviso.</p>
            <p className="text-sm text-muted-foreground">
              Lo confirmamos en cuanto lo veamos en el banco. Aquí mismo verás
              el pago como confirmado.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">
                1. Transfiere a una de estas cuentas
              </p>
              <Cuentas cuentas={cuentas} />
            </div>
            <p className="text-sm font-medium">2. Avísanos aquí</p>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Monto que transferiste (RD$)
              <input
                className={claseCampo}
                inputMode="decimal"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </label>
            <CamposPago
              metodo={metodo}
              setMetodo={setMetodo}
              referencia={referencia}
              setReferencia={setReferencia}
            />
          </div>
        )}
      </Hoja>
    </>
  )
}

function ComprarCreditos({
  paquetes,
  cuentas,
}: {
  paquetes: PaqueteCreditos[]
  cuentas: CuentaPago[]
}) {
  const [abierta, setAbierta] = useState(false)
  const [elegido, setElegido] = useState(0)
  const [metodo, setMetodo] = useState<MetodoPago>("popular")
  const [referencia, setReferencia] = useState("")
  const [listo, setListo] = useState(false)
  const { pendiente, mensaje, correr, limpiar } = useAccion()
  if (!paquetes.length) return null
  const p = paquetes[elegido]
  return (
    <>
      <Boton
        variante="primario"
        onClick={() => {
          setListo(false)
          setAbierta(true)
        }}
      >
        <Wallet /> Recargar créditos
      </Boton>
      <Hoja
        abierta={abierta}
        onCerrar={() => {
          limpiar()
          setAbierta(false)
        }}
        titulo="Recargar créditos"
        descripcion="Pagas por transferencia y te cargamos el saldo en cuanto lo confirmamos."
        pie={
          listo ? (
            <Boton variante="primario" onClick={() => setAbierta(false)}>
              Listo
            </Boton>
          ) : (
            <>
              <Boton
                variante="primario"
                disabled={pendiente}
                onClick={() =>
                  correr(
                    () =>
                      pedirCreditos({ paquete: elegido, metodo, referencia }),
                    undefined,
                    (r) => r.ok && setListo(true)
                  )
                }
              >
                {pendiente
                  ? "Enviando…"
                  : p
                    ? `Ya transferí ${formatoRD(p.precio)}: avisar`
                    : "Avisar"}
              </Boton>
              <Boton variante="fantasma" onClick={() => setAbierta(false)}>
                Cancelar
              </Boton>
              <div className="w-full">
                <Aviso mensaje={mensaje} />
              </div>
            </>
          )
        }
      >
        {listo ? (
          <div className="flex flex-col items-start gap-2">
            <Check className="size-8 text-primary" />
            <p className="text-lg font-semibold">Recibimos tu aviso.</p>
            <p className="text-sm text-muted-foreground">
              Te cargamos los créditos en cuanto veamos la transferencia.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">
                1. Escoge un paquete
              </legend>
              {paquetes.map((x, i) => (
                <label
                  key={i}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3",
                    elegido === i
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paquete"
                      className="size-4 accent-[var(--primary)]"
                      checked={elegido === i}
                      onChange={() => setElegido(i)}
                    />
                    <span className="font-semibold tabular-nums">
                      {formatCredits(x.creditos)} créditos
                    </span>
                  </span>
                  <span className="tabular-nums">{formatoRD(x.precio)}</span>
                </label>
              ))}
            </fieldset>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">
                2. Transfiere a una de estas cuentas
              </p>
              <Cuentas cuentas={cuentas} />
            </div>
            <p className="text-sm font-medium">3. Avísanos aquí</p>
            <CamposPago
              metodo={metodo}
              setMetodo={setMetodo}
              referencia={referencia}
              setReferencia={setReferencia}
            />
          </div>
        )}
      </Hoja>
    </>
  )
}

function Entregable({ e }: { e: Portal["entregables"][number] }) {
  const [modo, setModo] = useState<"nada" | "cambios">("nada")
  const [comentario, setComentario] = useState("")
  const { pendiente, mensaje, correr } = useAccion()
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{e.titulo}</p>
          {e.descripcion ? (
            <p className="text-sm text-muted-foreground">{e.descripcion}</p>
          ) : null}
        </div>
        {e.estado === "aprobado" ? (
          <Insignia tono="bien">Aprobado</Insignia>
        ) : e.estado === "cambios" ? (
          <Insignia tono="atencion">Pediste cambios</Insignia>
        ) : (
          <Insignia tono="info">Para revisar</Insignia>
        )}
      </div>
      {e.enlace ? (
        <a
          href={e.enlace}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary hover:underline"
        >
          <ExternalLink className="size-4" /> Abrir
        </a>
      ) : null}
      {e.comentarioCliente ? (
        <p className="text-sm text-muted-foreground">
          Tu comentario: «{e.comentarioCliente}»
        </p>
      ) : null}
      {e.estado === "revision" ? (
        modo === "nada" ? (
          <div className="flex flex-wrap gap-2">
            <Boton
              variante="primario"
              tam="chico"
              disabled={pendiente}
              onClick={() =>
                correr(
                  () =>
                    responderEntregable({
                      id: e.id,
                      decision: "aprobado",
                      comentario: "",
                    }),
                  "¡Gracias! Quedó aprobado."
                )
              }
            >
              <Check /> Aprobar
            </Boton>
            <Boton tam="chico" onClick={() => setModo("cambios")}>
              Pedir cambios
            </Boton>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              ¿Qué quieres cambiar?
              <textarea
                className={cn(claseCampo, "min-h-24")}
                value={comentario}
                onChange={(x) => setComentario(x.target.value)}
              />
            </label>
            <div className="flex gap-2">
              <Boton
                variante="primario"
                tam="chico"
                disabled={pendiente}
                onClick={() =>
                  correr(
                    () =>
                      responderEntregable({
                        id: e.id,
                        decision: "cambios",
                        comentario,
                      }),
                    "Enviado. Te avisamos con la nueva versión."
                  )
                }
              >
                Enviar
              </Boton>
              <Boton
                variante="fantasma"
                tam="chico"
                onClick={() => setModo("nada")}
              >
                Cancelar
              </Boton>
            </div>
          </div>
        )
      ) : null}
      <Aviso mensaje={mensaje} />
    </li>
  )
}

function Salir() {
  const router = useRouter()
  const [ocupado, setOcupado] = useState(false)
  return (
    <Boton
      variante="fantasma"
      tam="chico"
      disabled={ocupado}
      onClick={async () => {
        setOcupado(true)
        try {
          await createSupabaseBrowser().auth.signOut()
        } finally {
          router.push("/")
          router.refresh()
        }
      }}
    >
      <LogOut /> Salir
    </Boton>
  )
}

/** El área privada de cada cliente: su proyecto, sus entregas, sus pagos y sus créditos. */
export function AreaCliente({
  correo,
  esDueno,
  cliente,
  proyectos,
  entregables,
  cobros,
  pagos,
  pagosCreditos,
  creditos,
  cuentasPago,
  paquetes,
  reglas,
  chat,
}: {
  correo: string
  esDueno: boolean
  cliente: Portal["cliente"]
  proyectos: Portal["proyectos"]
  entregables: Portal["entregables"]
  cobros: CobroVista[]
  pagos: Pago[]
  pagosCreditos: Pago[]
  creditos: number
  cuentasPago: CuentaPago[]
  paquetes: PaqueteCreditos[]
  reglas: [string, string][]
  chat: string
}) {
  const saldo = cobros.reduce((a, c) => a + c.cuenta.saldo, 0)
  const porRevisar = entregables.filter((e) => e.estado === "revision").length
  const nombre = cliente?.contacto?.split(" ")[0] || correo.split("@")[0]

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BrandMark className="w-8" /> Vision Studios
          </Link>
          <div className="flex items-center gap-1">
            {esDueno ? (
              <Link
                href="/admin"
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary/15 px-3 text-xs font-semibold text-primary"
              >
                <ShieldCheck className="size-4" /> Panel
              </Link>
            ) : null}
            <Salir />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Hola, {nombre}.
          </h1>
          <p className="text-sm text-muted-foreground">
            {cliente ? `${cliente.nombre} · ` : ""}
            {correo}
          </p>
        </div>

        {cliente ? (
          <div className="flex flex-wrap gap-2">
            {porRevisar ? (
              <Insignia tono="info">
                {porRevisar} entrega(s) para revisar
              </Insignia>
            ) : null}
            {saldo > 0 ? (
              <Insignia tono="atencion">
                Pendiente por pagar: {formatoRD(saldo)}
              </Insignia>
            ) : (
              <Insignia tono="bien">Pagos al día</Insignia>
            )}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
          <div className="flex flex-col gap-4">
            {cliente ? (
              <>
                <Tarjeta className="flex flex-col gap-4">
                  <h2 className="font-semibold">Tus proyectos</h2>
                  {proyectos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Todavía no hay un proyecto abierto.
                    </p>
                  ) : (
                    proyectos.map((x) => {
                      const i = ETAPAS.indexOf(x.etapa)
                      return (
                        <div key={x.id} className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="font-medium">{x.nombre}</p>
                            {x.fechaEntrega ? (
                              <span className="text-sm text-muted-foreground">
                                Entrega: {formatoFecha(x.fechaEntrega)}
                              </span>
                            ) : null}
                          </div>
                          <div
                            className="grid grid-cols-7 gap-1"
                            role="img"
                            aria-label={`Etapa ${i + 1} de 7: ${ETAPA_CLIENTE[x.etapa]}`}
                          >
                            {ETAPAS.map((e, j) => (
                              <span
                                key={e}
                                className={cn(
                                  "h-1.5 rounded-full",
                                  j <= i ? "bg-primary" : "bg-muted"
                                )}
                              />
                            ))}
                          </div>
                          <p className="flex items-center gap-1.5 text-sm">
                            <CircleDot className="size-4 text-primary" />{" "}
                            {ETAPA_CLIENTE[x.etapa]}
                          </p>
                          {x.notaCliente ? (
                            <p className="text-sm text-muted-foreground">
                              {x.notaCliente}
                            </p>
                          ) : null}
                        </div>
                      )
                    })
                  )}
                </Tarjeta>

                <Tarjeta className="flex flex-col gap-3">
                  <h2 className="font-semibold">Entregas</h2>
                  {entregables.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aquí aparece lo que te enviemos para revisar y aprobar.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {entregables.map((e) => (
                        <Entregable key={e.id} e={e} />
                      ))}
                    </ul>
                  )}
                </Tarjeta>

                <Tarjeta className="flex flex-col gap-3">
                  <h2 className="font-semibold">Pagos</h2>
                  {cobros.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tienes pagos pendientes.
                    </p>
                  ) : (
                    <ul className="flex flex-col divide-y divide-border">
                      {cobros.map((c) => {
                        const suyos = pagos.filter((p) => p.cobroId === c.id)
                        return (
                          <li key={c.id} className="flex flex-col gap-2 py-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium">{c.concepto}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatoRD(c.precio)} · pagado{" "}
                                  {formatoRD(c.cuenta.recibido)}
                                  {c.vencimiento
                                    ? ` · vence ${formatoFecha(c.vencimiento)}`
                                    : ""}
                                </p>
                              </div>
                              <Insignia
                                tono={
                                  c.cuenta.estado === "pagado"
                                    ? "bien"
                                    : c.cuenta.estado === "vencido"
                                      ? "mal"
                                      : "atencion"
                                }
                              >
                                {ESTADO_COBRO_LABEL[c.cuenta.estado]}
                                {c.cuenta.saldo > 0
                                  ? ` · ${formatoRD(c.cuenta.saldo)}`
                                  : ""}
                              </Insignia>
                            </div>
                            {c.nota ? (
                              <p className="text-sm text-muted-foreground">
                                {c.nota}
                              </p>
                            ) : null}
                            {suyos.length ? (
                              <ul className="flex flex-col gap-1 text-sm">
                                {suyos.map((p) => (
                                  <li
                                    key={p.id}
                                    className="flex flex-wrap gap-2 text-muted-foreground"
                                  >
                                    <span className="text-foreground tabular-nums">
                                      {formatoRD(p.monto)}
                                    </span>
                                    {METODO_LABEL[p.metodo]} ·{" "}
                                    {formatoFecha(p.createdAt)} ·
                                    <span
                                      className={
                                        p.estado === "confirmado"
                                          ? "text-primary"
                                          : p.estado === "rechazado"
                                            ? "text-destructive"
                                            : "text-amber-300"
                                      }
                                    >
                                      {p.estado === "confirmado"
                                        ? "confirmado"
                                        : p.estado === "rechazado"
                                          ? "no lo encontramos, escríbenos"
                                          : "esperando confirmación"}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            <ReportarPago cobro={c} cuentas={cuentasPago} />
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </Tarjeta>
              </>
            ) : (
              <Tarjeta className="flex flex-col gap-3">
                <h2 className="font-semibold">
                  Tu cuenta todavía no está enlazada a un proyecto.
                </h2>
                <p className="text-sm text-muted-foreground">
                  Si ya trabajas con Vision Studios, avísanos con este correo (
                  {correo}) y lo enlazamos: aquí verás en qué va tu proyecto,
                  las entregas para aprobar y tus pagos. Si todavía no,
                  cuéntanos tu negocio.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={chat}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                  >
                    <MessageCircle className="size-4" /> Escríbenos
                  </a>
                  <Link
                    href="/#contacto"
                    className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-semibold"
                  >
                    Cuéntanos tu negocio
                  </Link>
                </div>
              </Tarjeta>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Tarjeta className="flex flex-col gap-3">
              <h2 className="font-semibold">Créditos del Estudio</h2>
              <p className="text-3xl font-semibold tabular-nums">
                {esDueno ? "Ilimitado" : formatCredits(creditos)}{" "}
                <span className="text-base font-medium text-muted-foreground">
                  {esDueno ? "" : "créditos"}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Con ellos creas imágenes, video y usas los Agentes. Pagas solo
                lo que generas.
              </p>
              {!esDueno ? (
                <ComprarCreditos paquetes={paquetes} cuentas={cuentasPago} />
              ) : null}
              {pagosCreditos.length ? (
                <ul className="flex flex-col gap-1 text-sm">
                  {pagosCreditos.slice(0, 5).map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap gap-2 text-muted-foreground"
                    >
                      <span className="text-foreground tabular-nums">
                        {p.creditos} cr.
                      </span>
                      {formatoRD(p.monto)} · {formatoFecha(p.createdAt)} ·
                      <span
                        className={
                          p.estado === "confirmado"
                            ? "text-primary"
                            : p.estado === "rechazado"
                              ? "text-destructive"
                              : "text-amber-300"
                        }
                      >
                        {p.estado === "confirmado"
                          ? "cargados"
                          : p.estado === "rechazado"
                            ? "no lo encontramos"
                            : "esperando confirmación"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Tarjeta>
            <Tarjeta className="flex flex-col gap-2">
              <h2 className="font-semibold">Herramientas</h2>
              <Link
                href="/estudio"
                className="flex min-h-14 items-center gap-3 rounded-xl border border-border px-3 hover:bg-muted/40"
              >
                <ImageIcon className="size-5 text-primary" />
                <span className="flex flex-col">
                  <span className="font-medium">Estudio</span>
                  <span className="text-xs text-muted-foreground">
                    Imágenes y video para tu negocio
                  </span>
                </span>
              </Link>
              <Link
                href="/servicios"
                className="flex min-h-14 items-center gap-3 rounded-xl border border-border px-3 hover:bg-muted/40"
              >
                <Bot className="size-5 text-primary" />
                <span className="flex flex-col">
                  <span className="font-medium">Agentes</span>
                  <span className="text-xs text-muted-foreground">
                    Contenido, radiografía, documentos y asistente
                  </span>
                </span>
              </Link>
              <a
                href={chat}
                target="_blank"
                rel="noopener"
                className="flex min-h-14 items-center gap-3 rounded-xl border border-border px-3 hover:bg-muted/40"
              >
                <MessageCircle className="size-5 text-primary" />
                <span className="flex flex-col">
                  <span className="font-medium">Hablar con nosotros</span>
                  <span className="text-xs text-muted-foreground">
                    Te contesta una persona
                  </span>
                </span>
              </a>
            </Tarjeta>
            {cliente && reglas.length ? (
              <Tarjeta className="flex flex-col gap-2">
                <h2 className="font-semibold">Cómo cobramos</h2>
                <dl className="flex flex-col gap-1.5 text-sm">
                  {reglas.map(([a, b]) => (
                    <div key={a}>
                      <dt className="font-medium">{a}</dt>
                      <dd className="text-muted-foreground">{b}</dd>
                    </div>
                  ))}
                </dl>
              </Tarjeta>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
