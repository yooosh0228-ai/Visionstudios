"use server"

import { createHash } from "node:crypto"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { createSupabaseAdmin } from "@/lib/supabase/admin"

import { hoyRD } from "./cuentas"

export type ResultadoContacto =
  { ok: true } | { ok: false; mensaje: string; campo?: string }

const PRESUPUESTOS = [
  "Todavía no sé",
  "Menos de RD$10,000",
  "RD$10,000 – 30,000",
  "RD$30,000 – 80,000",
  "Más de RD$80,000",
] as const

function texto(v: FormDataEntryValue | null, max: number): string {
  return typeof v === "string"
    ? v.trim().replace(/\s+/g, " ").slice(0, max)
    : ""
}

/**
 * «Cuéntanos tu negocio»: guarda el mensaje como prospecto nuevo en el panel,
 * con la próxima acción ya puesta para hoy. Sin cuenta y sin pasar por terceros.
 */
export async function enviarContacto(
  form: FormData
): Promise<ResultadoContacto> {
  // Campo trampa: las personas no lo ven; los robots lo llenan.
  if (texto(form.get("sitio-web"), 200)) return { ok: true }

  const nombre = texto(form.get("nombre"), 120)
  const telefono = texto(form.get("telefono"), 40)
  const negocio = texto(form.get("negocio"), 160)
  if (!nombre)
    return { ok: false, mensaje: "Falta tu nombre.", campo: "nombre" }
  if (telefono.replace(/\D/g, "").length < 7)
    return {
      ok: false,
      mensaje: "Escribe un WhatsApp válido.",
      campo: "telefono",
    }
  if (!negocio)
    return {
      ok: false,
      mensaje: "Cuéntanos cuál es tu negocio.",
      campo: "negocio",
    }

  const intereses = form
    .getAll("intereses")
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 10)
  const presupuestoBruto = texto(form.get("presupuesto"), 60)
  const presupuesto = (PRESUPUESTOS as readonly string[]).includes(
    presupuestoBruto
  )
    ? presupuestoBruto
    : "Todavía no sé"
  const instagram = texto(form.get("instagram"), 60).replace(/^@/, "")
  const detalle =
    typeof form.get("detalle") === "string"
      ? String(form.get("detalle")).trim().slice(0, 2000)
      : ""
  const dispositivo = texto(form.get("dispositivo"), 40)
  // Demo armado en /demo: la configuración y el logo (ya reducido en el navegador).
  let demo: Record<string, unknown> | null = null
  const demoBruto = form.get("demo")
  if (typeof demoBruto === "string" && demoBruto.length < 300_000) {
    try {
      const d = JSON.parse(demoBruto) as Record<string, unknown>
      const logo = typeof d.logo === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(d.logo) ? d.logo : null
      demo = {
        tipo: String(d.tipo ?? "").slice(0, 40),
        color: /^#[0-9a-f]{6}$/i.test(String(d.color)) ? d.color : "",
        estilo: String(d.estilo ?? "").slice(0, 20),
        letra: String(d.letra ?? "").slice(0, 20),
        forma: String(d.forma ?? "").slice(0, 20),
        lema: String(d.lema ?? "").slice(0, 80),
        logo,
      }
    } catch {
      demo = null
    }
  }

  try {
    const db = createSupabaseAdmin()
    // Frenos contra abuso: por conexión, por número y en total. La conexión se
    // guarda solo como huella (no la dirección).
    const h = await headers()
    const ip = (
      h.get("x-nf-client-connection-ip") ??
      h.get("x-forwarded-for")?.split(",")[0] ??
      ""
    ).trim()
    const origen = ip
      ? createHash("sha256").update(`vs:${ip}`).digest("hex").slice(0, 24)
      : ""
    const haceUnaHora = new Date(Date.now() - 3600_000).toISOString()
    const contar = (
      filtro: (q: ReturnType<typeof base>) => ReturnType<typeof base>
    ) => filtro(base())
    const base = () =>
      db
        .from("vs_prospectos")
        .select("id", { count: "exact", head: true })
        .eq("fuente", "web")
        .gte("created_at", haceUnaHora)
    const [total, mismaConexion, mismoNumero] = await Promise.all([
      contar((q) => q),
      origen
        ? contar((q) => q.eq("datos->>origen", origen))
        : Promise.resolve({ count: 0 }),
      contar((q) => q.eq("telefono", telefono)),
    ])
    if (
      (total.count ?? 0) >= 200 ||
      (mismaConexion.count ?? 0) >= 5 ||
      (mismoNumero.count ?? 0) >= 3
    )
      return {
        ok: false,
        mensaje:
          "Ya recibimos tus mensajes. Te escribimos pronto; si es urgente, escríbenos por el chat.",
      }

    const { error } = await db.from("vs_prospectos").insert({
      negocio,
      contacto: nombre,
      telefono,
      instagram,
      estado: "nuevo",
      fuente: "web",
      proxima_accion: demo ? "Ver su demo y responder por WhatsApp" : "Responder por WhatsApp",
      fecha_proxima: hoyRD(),
      nota: detalle,
      datos: {
        intereses: intereses.join(", "),
        presupuesto,
        detalle,
        dispositivo,
        origen,
        ...(demo ? { demo } : {}),
      },
    })
    if (error) throw error
    revalidatePath("/admin", "layout")
    return { ok: true }
  } catch (caught) {
    console.error("[contacto]", caught)
    return {
      ok: false,
      mensaje: "No pudimos guardar tu mensaje. Escríbenos por el chat.",
    }
  }
}

/** «Avísame cuando salga»: guarda el correo en la lista de espera. */
export async function suscribir(
  form: FormData
): Promise<{ ok: true } | { ok: false; mensaje: string }> {
  if (texto(form.get("sitio-web"), 200)) return { ok: true }
  const email = texto(form.get("email"), 200).toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, mensaje: "Escribe un correo válido." }
  try {
    const db = createSupabaseAdmin()
    const h = await headers()
    const ip = (h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "").trim()
    const origen = ip ? createHash("sha256").update(`vs:${ip}`).digest("hex").slice(0, 24) : ""
    if (origen) {
      const { count } = await db
        .from("vs_suscriptores")
        .select("email", { count: "exact", head: true })
        .eq("origen", origen)
        .gte("created_at", new Date(Date.now() - 3600_000).toISOString())
      if ((count ?? 0) >= 5) return { ok: true }
    }
    const { error } = await db
      .from("vs_suscriptores")
      .upsert({ email, fuente: texto(form.get("fuente"), 40) || "proximamente", origen }, { onConflict: "email", ignoreDuplicates: true })
    if (error) throw error
    return { ok: true }
  } catch (caught) {
    console.error("[suscribir]", caught)
    return { ok: false, mensaje: "No pudimos guardar tu correo. Intenta de nuevo." }
  }
}
