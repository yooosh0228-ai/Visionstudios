/**
 * Cuentas de cobro: lo contratado, lo recibido y lo que falta. Funciones puras,
 * sin servidor, para que el panel, el área de clientes y las pruebas den lo mismo.
 */
import type { Cobro, Pago } from "./types"

export type EstadoCobro = "pagado" | "deposito" | "saldo" | "vencido" | "cancelado"

export const ESTADO_COBRO_LABEL: Record<EstadoCobro, string> = {
  pagado: "Pagado",
  deposito: "Depósito pendiente",
  saldo: "Saldo pendiente",
  vencido: "Vencido",
  cancelado: "Cancelado",
}

export type CuentaCobro = {
  recibido: number
  porConfirmar: number
  saldo: number
  estado: EstadoCobro
  /** Mientras haya saldo, la entrega final queda retenida. */
  retieneEntrega: boolean
}

/** Fecha de hoy en Santo Domingo como AAAA-MM-DD. */
export function hoyRD(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santo_Domingo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

export function cuentaDe(cobro: Cobro, pagos: Pago[], hoy: string = hoyRD()): CuentaCobro {
  const propios = pagos.filter((p) => p.tipo === "cobro" && p.cobroId === cobro.id)
  const recibido = sum(propios.filter((p) => p.estado === "confirmado").map((p) => p.monto))
  const porConfirmar = sum(propios.filter((p) => p.estado === "pendiente").map((p) => p.monto))
  const saldo = Math.max(0, round2(cobro.precio - recibido))
  let estado: EstadoCobro
  if (cobro.cancelado) estado = "cancelado"
  else if (saldo <= 0) estado = "pagado"
  else if (cobro.vencimiento && cobro.vencimiento < hoy) estado = "vencido"
  else if (recibido < cobro.deposito) estado = "deposito"
  else estado = "saldo"
  return {
    recibido,
    porConfirmar,
    saldo: cobro.cancelado ? 0 : saldo,
    estado,
    retieneEntrega: !cobro.cancelado && saldo > 0,
  }
}

/** Depósito sugerido según las reglas de cobro de Vision Studios. */
export function depositoSugerido(precio: number, tipo: Cobro["tipo"]): number {
  if (!(precio > 0)) return 0
  if (tipo === "mensualidad" || tipo === "terceros") return precio
  if (precio <= 10000) return precio
  return Math.round(precio * 0.6)
}

export function sum(values: number[]): number {
  return round2(values.reduce((a, b) => a + b, 0))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** RD$12,500 */
export function formatoRD(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—"
  return `RD$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
}

/** 12 oct 2026 */
export function formatoFecha(iso: string | null | undefined): string {
  if (!iso) return "Sin fecha"
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso)
  if (Number.isNaN(d.getTime())) return "Sin fecha"
  return d.toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })
}
