/**
 * Cuentas del panel a partir de todas las filas: lo cobrado en el mes, lo que
 * falta por cobrar, la capacidad y las opciones de los selectores. Puro y sin
 * servidor para poder probarlo.
 */
import type { Panel } from "./datos"
import { cuentaDe, hoyRD, sum } from "./cuentas"
import type { CuentaCobro } from "./cuentas"
import type { Cobro } from "./types"

export function opcionesDe(
  p: Pick<Panel, "clientes" | "ofertas" | "proyectos">
) {
  const nombreCliente = new Map(p.clientes.map((c) => [c.id, c.nombre]))
  return {
    clientes: p.clientes.map((c) => ({ valor: c.id, etiqueta: c.nombre })),
    ofertas: p.ofertas
      .filter((o) => o.activo)
      .map((o) => ({ valor: o.id, etiqueta: o.nombre })),
    proyectos: p.proyectos.map((x) => ({
      valor: x.id,
      etiqueta: `${x.nombre} — ${nombreCliente.get(x.clienteId) ?? ""}`,
    })),
  }
}

export type CobroConCuenta = Cobro & { cuenta: CuentaCobro; cliente: string }

export function cobrosConCuenta(
  p: Pick<Panel, "cobros" | "pagos" | "clientes">,
  hoy = hoyRD()
): CobroConCuenta[] {
  const nombre = new Map(p.clientes.map((c) => [c.id, c.nombre]))
  return p.cobros.map((c) => ({
    ...c,
    cuenta: cuentaDe(c, p.pagos, hoy),
    cliente: nombre.get(c.clienteId) ?? "",
  }))
}

/** El mes (AAAA-MM) de un momento, contado en hora de Santo Domingo. */
function mesRD(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso.slice(0, 7) : hoyRD(d).slice(0, 7)
}

export function resumenDe(p: Panel, hoy = hoyRD()) {
  const mes = hoy.slice(0, 7)
  const confirmadosMes = p.pagos.filter(
    (x) =>
      x.estado === "confirmado" &&
      x.tipo === "cobro" &&
      mesRD(x.revisadoAt ?? x.createdAt) === mes
  )
  const creditosMes = p.pagos.filter(
    (x) =>
      x.estado === "confirmado" &&
      x.tipo === "creditos" &&
      mesRD(x.revisadoAt ?? x.createdAt) === mes
  )
  const cobros = cobrosConCuenta(p, hoy)
  const abiertos = cobros.filter((c) => !c.cancelado && c.cuenta.saldo > 0)
  const activos = new Set(
    p.proyectos
      .filter((x) => !x.cerrado && x.etapa !== "entrega")
      .map((x) => x.clienteId)
  )
  const acciones = p.prospectos
    .filter((x) => !["ganado", "perdido"].includes(x.estado))
    .sort((a, b) =>
      (a.fechaProxima ?? "9999").localeCompare(b.fechaProxima ?? "9999")
    )
  return {
    cobradoMes: sum(confirmadosMes.map((x) => x.monto)),
    creditosMes: sum(creditosMes.map((x) => x.monto)),
    porCobrar: sum(abiertos.map((c) => c.cuenta.saldo)),
    depositosPendientes: abiertos.filter((c) => c.cuenta.estado === "deposito")
      .length,
    vencidos: abiertos.filter((c) => c.cuenta.estado === "vencido"),
    pagosPorConfirmar: p.pagos.filter((x) => x.estado === "pendiente"),
    capacidadUsada: activos.size,
    acciones,
    accionesVencidas: acciones.filter(
      (x) => x.fechaProxima && x.fechaProxima < hoy
    ).length,
    mensajesWeb: p.prospectos.filter(
      (x) => x.fuente === "web" && x.estado === "nuevo"
    ),
    respuestasClientes: p.entregables.filter(
      (x) =>
        x.respondidoAt && (x.estado === "cambios" || x.estado === "aprobado")
    ),
    abiertos,
  }
}
