"use server"

import { revalidatePath } from "next/cache"

import { getSession } from "@/generation/session"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

import { normalizarAjustes } from "./ajustes"
import type { Ajustes } from "./ajustes"
import { CampoInvalido, ID_MANUAL, TABLA, limpiarRegistro } from "./campos"
import type { Entidad } from "./campos"
import { depositoSugerido } from "./cuentas"
import { ETAPAS, ESTADOS_PROSPECTO, METODOS_PAGO } from "./types"
import type { Etapa, EstadoProspecto, MetodoPago } from "./types"

export type Resultado =
  { ok: true; id?: string } | { ok: false; mensaje: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ENTIDADES = Object.keys(TABLA) as Entidad[]

class Prohibido extends Error {}

async function soloDueno(): Promise<void> {
  const sesion = await getSession()
  if (!sesion?.isOwner) throw new Prohibido("Solo el dueño puede hacer esto.")
}

function fallo(caught: unknown): Resultado {
  if (caught instanceof CampoInvalido || caught instanceof Prohibido)
    return { ok: false, mensaje: caught.message }
  console.error("[panel]", caught)
  return { ok: false, mensaje: "No se pudo guardar. Intenta de nuevo." }
}

function mensajeBase(error: { code?: string; message: string }): string {
  if (error.code === "23505")
    return "Ya existe un registro con ese código o correo."
  if (error.code === "23503")
    return "Ese registro está en uso por otro (un cliente, proyecto o cobro)."
  if (error.code === "23514") return "Algún valor no es válido."
  return "No se pudo guardar. Intenta de nuevo."
}

function refrescar(entidad?: Entidad) {
  revalidatePath("/admin", "layout")
  if (!entidad || entidad === "trabajo" || entidad === "oferta")
    revalidatePath("/")
  revalidatePath("/cuenta")
}

/** Crea (id vacío) o actualiza un registro de cualquiera de las tablas del panel. */
export async function guardarRegistro(
  entidad: Entidad,
  id: string | null,
  datos: Record<string, unknown>
): Promise<Resultado> {
  try {
    await soloDueno()
    if (!ENTIDADES.includes(entidad))
      throw new CampoInvalido("Tipo de registro desconocido.")
    const creando = !id
    if (
      id &&
      !(ID_MANUAL.has(entidad) ? /^[a-z0-9-]{2,60}$/.test(id) : UUID.test(id))
    )
      throw new CampoInvalido("Registro inválido.")
    const fila = limpiarRegistro(entidad, datos, { creando })

    if (
      entidad === "cobro" &&
      (fila.deposito === null || fila.deposito === undefined)
    )
      fila.deposito = depositoSugerido(
        Number(fila.precio),
        fila.tipo as "proyecto"
      )
    if (entidad === "cobro" && Number(fila.deposito) > Number(fila.precio))
      throw new CampoInvalido("El depósito no puede ser mayor que el precio.")
    if (entidad !== "entregable" && entidad !== "cobro")
      fila.updated_at = new Date().toISOString()

    const db = createSupabaseAdmin()
    const tabla = TABLA[entidad]
    // Solo un trabajo puede ser el destacado de la portada.
    if (entidad === "trabajo" && fila.destacado === true) {
      const query = db
        .from(tabla)
        .update({ destacado: false })
        .eq("destacado", true)
      await (id ? query.neq("id", id) : query)
    }
    const { data, error } = creando
      ? await db.from(tabla).insert(fila).select("id").single()
      : await db.from(tabla).update(fila).eq("id", id).select("id").single()
    if (error) return { ok: false, mensaje: mensajeBase(error) }
    refrescar(entidad)
    return { ok: true, id: String(data.id) }
  } catch (caught) {
    return fallo(caught)
  }
}

export async function borrarRegistro(
  entidad: Entidad,
  id: string
): Promise<Resultado> {
  try {
    await soloDueno()
    if (!ENTIDADES.includes(entidad))
      throw new CampoInvalido("Tipo de registro desconocido.")
    if (
      !(ID_MANUAL.has(entidad) ? /^[a-z0-9-]{2,60}$/.test(id) : UUID.test(id))
    )
      throw new CampoInvalido("Registro inválido.")
    const { error } = await createSupabaseAdmin()
      .from(TABLA[entidad])
      .delete()
      .eq("id", id)
    if (error) return { ok: false, mensaje: mensajeBase(error) }
    refrescar(entidad)
    return { ok: true }
  } catch (caught) {
    return fallo(caught)
  }
}

export async function moverEtapa(
  proyectoId: string,
  etapa: Etapa
): Promise<Resultado> {
  try {
    await soloDueno()
    if (!UUID.test(proyectoId) || !ETAPAS.includes(etapa))
      throw new CampoInvalido("Etapa inválida.")
    const { error } = await createSupabaseAdmin()
      .from("vs_proyectos")
      .update({ etapa, updated_at: new Date().toISOString() })
      .eq("id", proyectoId)
    if (error) return { ok: false, mensaje: mensajeBase(error) }
    refrescar("proyecto")
    return { ok: true }
  } catch (caught) {
    return fallo(caught)
  }
}

export async function cambiarEstadoProspecto(
  prospectoId: string,
  cambios: {
    estado?: EstadoProspecto
    proximaAccion?: string
    fechaProxima?: string | null
  }
): Promise<Resultado> {
  try {
    await soloDueno()
    if (!UUID.test(prospectoId)) throw new CampoInvalido("Prospecto inválido.")
    const fila: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (cambios.estado !== undefined) {
      if (!ESTADOS_PROSPECTO.includes(cambios.estado))
        throw new CampoInvalido("Estado inválido.")
      fila.estado = cambios.estado
    }
    if (cambios.proximaAccion !== undefined)
      fila.proxima_accion = String(cambios.proximaAccion).trim().slice(0, 400)
    if (cambios.fechaProxima !== undefined) {
      if (
        cambios.fechaProxima !== null &&
        !/^\d{4}-\d{2}-\d{2}$/.test(cambios.fechaProxima)
      )
        throw new CampoInvalido("Fecha inválida.")
      fila.fecha_proxima = cambios.fechaProxima
    }
    const { error } = await createSupabaseAdmin()
      .from("vs_prospectos")
      .update(fila)
      .eq("id", prospectoId)
    if (error) return { ok: false, mensaje: mensajeBase(error) }
    refrescar("prospecto")
    return { ok: true }
  } catch (caught) {
    return fallo(caught)
  }
}

/** Gana un prospecto: crea su Client Brain con lo que ya se sabe y lo enlaza. */
export async function convertirEnCliente(
  prospectoId: string
): Promise<Resultado> {
  try {
    await soloDueno()
    if (!UUID.test(prospectoId)) throw new CampoInvalido("Prospecto inválido.")
    const db = createSupabaseAdmin()
    const { data: p } = await db
      .from("vs_prospectos")
      .select("*")
      .eq("id", prospectoId)
      .maybeSingle()
    if (!p) return { ok: false, mensaje: "Ese prospecto ya no existe." }
    if (p.cliente_id) return { ok: true, id: String(p.cliente_id) }
    const datos = (p.datos ?? {}) as Record<string, string>
    const { data: cliente, error } = await db
      .from("vs_clientes")
      .insert({
        nombre: p.negocio,
        contacto: p.contacto ?? "",
        telefono: p.telefono ?? "",
        sector: p.sector ?? "",
        enlace: p.instagram
          ? `instagram.com/${String(p.instagram).replace(/^@/, "")}`
          : "",
        rango_precio: datos.presupuesto ?? "",
        objetivo: datos.detalle ?? "",
        notas_internas: p.nota ?? "",
      })
      .select("id")
      .single()
    if (error) return { ok: false, mensaje: mensajeBase(error) }
    await db
      .from("vs_prospectos")
      .update({
        cliente_id: cliente.id,
        estado: "ganado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", prospectoId)
    refrescar("cliente")
    return { ok: true, id: String(cliente.id) }
  } catch (caught) {
    return fallo(caught)
  }
}

/** Master Intake: crea el Client Brain y abre su proyecto en etapa Intake. */
export async function crearDesdeIntake(
  datos: Record<string, unknown>,
  proyecto: string
): Promise<Resultado> {
  try {
    await soloDueno()
    const fila = limpiarRegistro(
      "cliente",
      { ...datos, estado: "activo" },
      { creando: true }
    )
    const db = createSupabaseAdmin()
    const { data: cliente, error } = await db
      .from("vs_clientes")
      .insert(fila)
      .select("id")
      .single()
    if (error) return { ok: false, mensaje: mensajeBase(error) }
    const nombre =
      String(proyecto ?? "")
        .trim()
        .slice(0, 200) || "Diagnóstico inicial"
    await db
      .from("vs_proyectos")
      .insert({
        cliente_id: cliente.id,
        nombre,
        etapa: "intake",
        oferta_id: "radiografia",
      })
    refrescar("cliente")
    return { ok: true, id: String(cliente.id) }
  } catch (caught) {
    return fallo(caught)
  }
}

/** El dueño anota un pago que ya vio entrar (queda confirmado de una vez). */
export async function registrarPago(datos: {
  cobroId: string
  monto: unknown
  metodo: MetodoPago
  referencia?: string
  nota?: string
}): Promise<Resultado> {
  try {
    await soloDueno()
    if (!UUID.test(datos.cobroId)) throw new CampoInvalido("Cobro inválido.")
    if (!METODOS_PAGO.includes(datos.metodo))
      throw new CampoInvalido("Método inválido.")
    const monto = Number(String(datos.monto ?? "").replace(/[,\s]|RD\$/gi, ""))
    if (!Number.isFinite(monto) || monto <= 0)
      throw new CampoInvalido("Escribe cuánto entró.")
    const db = createSupabaseAdmin()
    const { data: cobro } = await db
      .from("vs_cobros")
      .select("id, cliente_id")
      .eq("id", datos.cobroId)
      .maybeSingle()
    if (!cobro) return { ok: false, mensaje: "Ese cobro ya no existe." }
    const { error } = await db.from("vs_pagos").insert({
      tipo: "cobro",
      cobro_id: cobro.id,
      cliente_id: cobro.cliente_id,
      monto: Math.round(monto * 100) / 100,
      metodo: datos.metodo,
      referencia: String(datos.referencia ?? "")
        .trim()
        .slice(0, 200),
      nota: String(datos.nota ?? "")
        .trim()
        .slice(0, 400),
      estado: "confirmado",
      reportado_por: "admin",
      revisado_at: new Date().toISOString(),
    })
    if (error) return { ok: false, mensaje: mensajeBase(error) }
    refrescar()
    return { ok: true }
  } catch (caught) {
    return fallo(caught)
  }
}

/** Confirma o rechaza un pago que reportó un cliente. Los de créditos recargan el saldo. */
export async function revisarPago(
  pagoId: string,
  decision: "confirmar" | "rechazar",
  nota?: string
): Promise<Resultado> {
  try {
    await soloDueno()
    if (!UUID.test(pagoId)) throw new CampoInvalido("Pago inválido.")
    const db = createSupabaseAdmin()
    const { data: pago } = await db
      .from("vs_pagos")
      .select("id, tipo, estado")
      .eq("id", pagoId)
      .maybeSingle()
    if (!pago) return { ok: false, mensaje: "Ese pago ya no existe." }
    if (pago.estado !== "pendiente")
      return { ok: false, mensaje: "Ese pago ya fue revisado." }
    const limpia = String(nota ?? "")
      .trim()
      .slice(0, 400)
    if (decision === "confirmar" && pago.tipo === "creditos") {
      const { error } = await db.rpc("vs_confirmar_pago_creditos", {
        p_pago: pagoId,
        p_nota: limpia,
      })
      if (error)
        return {
          ok: false,
          mensaje: error.message.includes("no_account")
            ? "Esa persona todavía no tiene cuenta en el Estudio."
            : "No se pudo recargar el saldo.",
        }
    } else {
      const { error } = await db
        .from("vs_pagos")
        .update({
          estado: decision === "confirmar" ? "confirmado" : "rechazado",
          revisado_at: new Date().toISOString(),
          ...(limpia ? { nota: limpia } : {}),
        })
        .eq("id", pagoId)
        .eq("estado", "pendiente")
      if (error) return { ok: false, mensaje: mensajeBase(error) }
    }
    refrescar()
    return { ok: true }
  } catch (caught) {
    return fallo(caught)
  }
}

/** Guarda los ajustes. Lo que no tenga la forma correcta se descarta. */
export async function guardarAjustes(
  cambios: Partial<Ajustes>
): Promise<Resultado> {
  try {
    await soloDueno()
    const db = createSupabaseAdmin()
    const { data } = await db
      .from("vs_ajustes")
      .select("datos")
      .eq("id", 1)
      .maybeSingle()
    const actual = normalizarAjustes(data?.datos)
    const nuevos = normalizarAjustes({ ...actual, ...cambios })
    const { error } = await db
      .from("vs_ajustes")
      .upsert({ id: 1, datos: nuevos, updated_at: new Date().toISOString() })
    if (error) return { ok: false, mensaje: mensajeBase(error) }
    refrescar()
    return { ok: true }
  } catch (caught) {
    return fallo(caught)
  }
}

const BUCKET = "vs-catalogo"
const TIPOS_SUBIDA: Record<string, "video" | "imagen"> = {
  "video/mp4": "video",
  "image/jpeg": "imagen",
  "image/png": "imagen",
  "image/webp": "imagen",
}

export type Subida =
  | { ok: true; ruta: string; token: string; publica: string }
  | { ok: false; mensaje: string }

/**
 * Permiso de un solo uso para subir un video o una imagen del catálogo directo
 * a Supabase Storage (sin pasar el archivo por el servidor).
 */
export async function firmarSubida(datos: {
  nombre: string
  tipo: string
  tamano: number
}): Promise<Subida> {
  try {
    await soloDueno()
    const clase = TIPOS_SUBIDA[datos.tipo]
    if (!clase) return { ok: false, mensaje: "Sube un MP4, JPG, PNG o WebP." }
    if (!(datos.tamano > 0) || datos.tamano > 50 * 1024 * 1024)
      return {
        ok: false,
        mensaje: "El archivo pasa de 50 MB. Compríme el video primero.",
      }
    const base =
      String(datos.nombre ?? "archivo")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\.[a-z0-9]+$/, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "archivo"
    const extension =
      datos.tipo === "video/mp4" ? "mp4" : datos.tipo.split("/")[1]
    const ruta = `${clase}s/${Date.now()}-${base}.${extension}`
    const almacen = createSupabaseAdmin().storage.from(BUCKET)
    const { data, error } = await almacen.createSignedUploadUrl(ruta)
    if (error || !data)
      return { ok: false, mensaje: "No se pudo preparar la subida." }
    return {
      ok: true,
      ruta: data.path,
      token: data.token,
      publica: almacen.getPublicUrl(data.path).data.publicUrl,
    }
  } catch (caught) {
    const r = fallo(caught)
    return { ok: false, mensaje: r.ok ? "" : r.mensaje }
  }
}
