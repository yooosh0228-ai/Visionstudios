"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseAdmin } from "@/lib/supabase/admin"

import { hoyRD } from "./cuentas"

export type ResultadoContacto = { ok: true } | { ok: false; mensaje: string; campo?: string }

const PRESUPUESTOS = [
  "Todavía no sé",
  "Menos de RD$10,000",
  "RD$10,000 – 30,000",
  "RD$30,000 – 80,000",
  "Más de RD$80,000",
] as const

function texto(v: FormDataEntryValue | null, max: number): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : ""
}

/**
 * «Cuéntanos tu negocio»: guarda el mensaje como prospecto nuevo en el panel,
 * con la próxima acción ya puesta para hoy. Sin cuenta y sin pasar por terceros.
 */
export async function enviarContacto(form: FormData): Promise<ResultadoContacto> {
  // Campo trampa: las personas no lo ven; los robots lo llenan.
  if (texto(form.get("sitio-web"), 200)) return { ok: true }

  const nombre = texto(form.get("nombre"), 120)
  const telefono = texto(form.get("telefono"), 40)
  const negocio = texto(form.get("negocio"), 160)
  if (!nombre) return { ok: false, mensaje: "Falta tu nombre.", campo: "nombre" }
  if (telefono.replace(/\D/g, "").length < 7) return { ok: false, mensaje: "Escribe un WhatsApp válido.", campo: "telefono" }
  if (!negocio) return { ok: false, mensaje: "Cuéntanos cuál es tu negocio.", campo: "negocio" }

  const intereses = form
    .getAll("intereses")
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 10)
  const presupuestoBruto = texto(form.get("presupuesto"), 60)
  const presupuesto = (PRESUPUESTOS as readonly string[]).includes(presupuestoBruto) ? presupuestoBruto : "Todavía no sé"
  const instagram = texto(form.get("instagram"), 60).replace(/^@/, "")
  const detalle = typeof form.get("detalle") === "string" ? String(form.get("detalle")).trim().slice(0, 2000) : ""
  const dispositivo = texto(form.get("dispositivo"), 40)

  try {
    const db = createSupabaseAdmin()
    // Freno simple contra abuso: no más de 40 mensajes de la web por hora.
    const haceUnaHora = new Date(Date.now() - 3600_000).toISOString()
    const { count } = await db
      .from("vs_prospectos")
      .select("id", { count: "exact", head: true })
      .eq("fuente", "web")
      .gte("created_at", haceUnaHora)
    if ((count ?? 0) >= 40)
      return { ok: false, mensaje: "Recibimos muchos mensajes a la vez. Escríbenos por el chat, por favor." }

    const { error } = await db.from("vs_prospectos").insert({
      negocio,
      contacto: nombre,
      telefono,
      instagram,
      estado: "nuevo",
      fuente: "web",
      proxima_accion: "Responder por WhatsApp",
      fecha_proxima: hoyRD(),
      nota: detalle,
      datos: { intereses: intereses.join(", "), presupuesto, detalle, dispositivo },
    })
    if (error) throw error
    revalidatePath("/admin", "layout")
    return { ok: true }
  } catch (caught) {
    console.error("[contacto]", caught)
    return { ok: false, mensaje: "No pudimos guardar tu mensaje. Escríbenos por el chat." }
  }
}
