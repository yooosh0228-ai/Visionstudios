"use server"

import { revalidatePath } from "next/cache"

import { getSession } from "@/generation/session"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

import { normalizarAjustes } from "./ajustes"
import { cuentaDe } from "./cuentas"
import { aCobro, aPago } from "./datos"
import { METODOS_PAGO } from "./types"
import type { MetodoPago } from "./types"

export type Respuesta = { ok: true } | { ok: false; mensaje: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_PENDIENTES = 5

/** El cliente de la sesión, buscado por su correo verificado. */
async function clienteDeSesion() {
  const sesion = await getSession()
  if (!sesion) return { sesion: null, clienteId: null }
  const email = sesion.email.trim().toLowerCase()
  if (!email) return { sesion, clienteId: null }
  const { data } = await createSupabaseAdmin().from("vs_clientes").select("id").eq("email", email).maybeSingle()
  return { sesion, clienteId: data ? String(data.id) : null }
}

function texto(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : ""
}

function monto(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[,\s]|RD\$/gi, ""))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN
}

async function demasiadosPendientes(filtro: { cliente_id?: string; user_id?: string }) {
  let q = createSupabaseAdmin().from("vs_pagos").select("id", { count: "exact", head: true }).eq("estado", "pendiente")
  if (filtro.cliente_id) q = q.eq("cliente_id", filtro.cliente_id)
  if (filtro.user_id) q = q.eq("user_id", filtro.user_id)
  const { count } = await q
  return (count ?? 0) >= MAX_PENDIENTES
}

/** El cliente avisa que transfirió para un cobro. Queda pendiente hasta que el dueño lo confirme. */
export async function reportarPago(datos: {
  cobroId: string
  monto: unknown
  metodo: MetodoPago
  referencia: string
}): Promise<Respuesta> {
  try {
    const { sesion, clienteId } = await clienteDeSesion()
    if (!sesion) return { ok: false, mensaje: "Tu sesión se cerró. Entra de nuevo." }
    if (!clienteId) return { ok: false, mensaje: "Tu correo no está enlazado a una cuenta de cliente." }
    if (!UUID.test(datos.cobroId)) return { ok: false, mensaje: "Cobro inválido." }
    if (!METODOS_PAGO.includes(datos.metodo)) return { ok: false, mensaje: "Escoge cómo pagaste." }
    const valor = monto(datos.monto)
    if (!(valor > 0)) return { ok: false, mensaje: "Escribe cuánto transferiste." }
    const referencia = texto(datos.referencia, 200)
    if (!referencia) return { ok: false, mensaje: "Escribe el número de referencia o de comprobante." }

    const db = createSupabaseAdmin()
    const { data: fila } = await db.from("vs_cobros").select("*").eq("id", datos.cobroId).eq("cliente_id", clienteId).maybeSingle()
    if (!fila || fila.cancelado) return { ok: false, mensaje: "Ese cobro no está disponible." }
    const cobro = aCobro(fila)
    const { data: pagos } = await db.from("vs_pagos").select("*").eq("cobro_id", cobro.id)
    const cuenta = cuentaDe(cobro, (pagos ?? []).map(aPago))
    if (valor > cuenta.saldo - cuenta.porConfirmar + 0.01)
      return { ok: false, mensaje: "El monto es mayor que lo que falta por pagar." }
    if (await demasiadosPendientes({ cliente_id: clienteId }))
      return { ok: false, mensaje: "Tienes varios pagos esperando confirmación. Espera a que los revisemos." }

    const { error } = await db.from("vs_pagos").insert({
      tipo: "cobro",
      cobro_id: cobro.id,
      cliente_id: clienteId,
      user_id: sesion.userId,
      email: sesion.email.toLowerCase(),
      monto: valor,
      metodo: datos.metodo,
      referencia,
      estado: "pendiente",
      reportado_por: "cliente",
    })
    if (error) return { ok: false, mensaje: "No se pudo enviar. Intenta de nuevo." }
    revalidatePath("/cuenta")
    revalidatePath("/admin", "layout")
    return { ok: true }
  } catch (caught) {
    console.error("[cuenta] reportarPago", caught)
    return { ok: false, mensaje: "No se pudo enviar. Intenta de nuevo." }
  }
}

/** Cualquiera con cuenta pide un paquete de créditos y dice por dónde pagó. */
export async function pedirCreditos(datos: {
  paquete: number
  metodo: MetodoPago
  referencia: string
}): Promise<Respuesta> {
  try {
    const sesion = await getSession()
    if (!sesion) return { ok: false, mensaje: "Tu sesión se cerró. Entra de nuevo." }
    if (!METODOS_PAGO.includes(datos.metodo)) return { ok: false, mensaje: "Escoge cómo pagaste." }
    const referencia = texto(datos.referencia, 200)
    if (!referencia) return { ok: false, mensaje: "Escribe el número de referencia o de comprobante." }
    const db = createSupabaseAdmin()
    const { data } = await db.from("vs_ajustes").select("datos").eq("id", 1).maybeSingle()
    const paquete = normalizarAjustes(data?.datos).paquetesCreditos[datos.paquete]
    if (!paquete) return { ok: false, mensaje: "Ese paquete ya no existe. Recarga la página." }
    if (await demasiadosPendientes({ user_id: sesion.userId }))
      return { ok: false, mensaje: "Tienes varias recargas esperando confirmación. Espera a que las revisemos." }
    const { error } = await db.from("vs_pagos").insert({
      tipo: "creditos",
      user_id: sesion.userId,
      email: sesion.email.toLowerCase(),
      monto: paquete.precio,
      creditos: paquete.creditos,
      metodo: datos.metodo,
      referencia,
      estado: "pendiente",
      reportado_por: "cliente",
    })
    if (error) return { ok: false, mensaje: "No se pudo enviar. Intenta de nuevo." }
    revalidatePath("/cuenta")
    revalidatePath("/admin", "layout")
    return { ok: true }
  } catch (caught) {
    console.error("[cuenta] pedirCreditos", caught)
    return { ok: false, mensaje: "No se pudo enviar. Intenta de nuevo." }
  }
}

/** El cliente aprueba un entregable o pide cambios. */
export async function responderEntregable(datos: {
  id: string
  decision: "aprobado" | "cambios"
  comentario: string
}): Promise<Respuesta> {
  try {
    const { sesion, clienteId } = await clienteDeSesion()
    if (!sesion) return { ok: false, mensaje: "Tu sesión se cerró. Entra de nuevo." }
    if (!clienteId) return { ok: false, mensaje: "Tu correo no está enlazado a una cuenta de cliente." }
    if (!UUID.test(datos.id) || (datos.decision !== "aprobado" && datos.decision !== "cambios"))
      return { ok: false, mensaje: "Respuesta inválida." }
    const comentario = texto(datos.comentario, 2000)
    if (datos.decision === "cambios" && !comentario)
      return { ok: false, mensaje: "Cuéntanos qué quieres cambiar." }
    const db = createSupabaseAdmin()
    const { data: ent } = await db
      .from("vs_entregables")
      .select("id, estado, visible_cliente, proyecto_id, vs_proyectos!inner(cliente_id)")
      .eq("id", datos.id)
      .maybeSingle()
    const dueno = ent
      ? (ent as unknown as { vs_proyectos: { cliente_id: string } | { cliente_id: string }[] }).vs_proyectos
      : null
    const clienteDelEntregable = Array.isArray(dueno) ? dueno[0]?.cliente_id : dueno?.cliente_id
    if (!ent || !ent.visible_cliente || ent.estado === "borrador" || clienteDelEntregable !== clienteId)
      return { ok: false, mensaje: "Ese entregable no está disponible." }
    const { error } = await db
      .from("vs_entregables")
      .update({ estado: datos.decision, comentario_cliente: comentario, respondido_at: new Date().toISOString() })
      .eq("id", datos.id)
    if (error) return { ok: false, mensaje: "No se pudo enviar. Intenta de nuevo." }
    revalidatePath("/cuenta")
    revalidatePath("/admin", "layout")
    return { ok: true }
  } catch (caught) {
    console.error("[cuenta] responderEntregable", caught)
    return { ok: false, mensaje: "No se pudo enviar. Intenta de nuevo." }
  }
}
