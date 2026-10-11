/**
 * Catálogo de los servicios de texto. Puro y sin imports: lo usan el
 * navegador (formularios), el servidor (validación y cobro) y las pruebas.
 * Los prompts viven aparte, solo en el servidor (prompts.ts).
 */

export type ServiceId = "contenido" | "radiografia" | "documento" | "asistente"

export type FieldKind = "text" | "textarea" | "select" | "multi"

export type Field = {
  name: string
  label: string
  kind: FieldKind
  required?: boolean
  placeholder?: string
  hint?: string
  options?: readonly { value: string; label: string }[]
  max: number
}

export type ServiceDef = {
  id: ServiceId
  /** Fila de model_prices con el precio en créditos. */
  priceId: string
  name: string
  tagline: string
  /** Lo que el cliente recibe, en una línea. */
  deliverable: string
  fields: readonly Field[]
}

/** Precio de cada respuesta del asistente público (se cobra al dueño del asistente). */
export const ASSISTANT_MESSAGE_PRICE_ID = "svc-asistente-msg"

/** Precio de cada respuesta de los Agentes Vision (chat con especialistas). */
export const AGENT_MESSAGE_PRICE_ID = "svc-agente-msg"

const TONES = [
  { value: "cercano", label: "Cercano y alegre" },
  { value: "profesional", label: "Profesional" },
  { value: "juvenil", label: "Juvenil y callejero" },
  { value: "elegante", label: "Elegante" },
] as const

const NETWORKS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "Estados de WhatsApp" },
] as const

export const DOCUMENT_TYPES = [
  { value: "cv", label: "Currículum (CV)" },
  { value: "carta-presentacion", label: "Carta de presentación" },
  { value: "cotizacion", label: "Cotización / presupuesto" },
  { value: "contrato", label: "Contrato sencillo" },
  { value: "carta-formal", label: "Carta formal" },
] as const

export const SERVICES: readonly ServiceDef[] = [
  {
    id: "contenido",
    priceId: "svc-contenido",
    name: "Mes de contenido",
    tagline: "30 publicaciones listas para subir, con textos y promociones.",
    deliverable:
      "Estrategia del mes, 30 posts con idea visual, texto y hashtags, promociones y mensajes de WhatsApp.",
    fields: [
      { name: "negocio", label: "Nombre del negocio", kind: "text", required: true, max: 80, placeholder: "Ej. Barbería El Corte" },
      { name: "rubro", label: "¿Qué tipo de negocio es?", kind: "text", required: true, max: 80, placeholder: "Ej. barbería, venta de celulares, comida rápida" },
      { name: "productos", label: "¿Qué vendes y a qué precios?", kind: "textarea", required: true, max: 1500, placeholder: "Lista tus productos o servicios principales con sus precios", hint: "Usa precios reales: se escriben tal cual en los posts." },
      { name: "publico", label: "¿Quién te compra?", kind: "textarea", max: 600, placeholder: "Ej. jóvenes de 18 a 30 en Santiago que cuidan su imagen" },
      { name: "ciudad", label: "Ciudad o zona", kind: "text", max: 80, placeholder: "Ej. Santiago, Los Jardines" },
      { name: "diferencia", label: "¿Qué te hace diferente?", kind: "textarea", max: 600, placeholder: "Ej. delivery gratis, atención sin cita, 10 años de experiencia" },
      { name: "ofertas", label: "Ofertas o fechas especiales este mes", kind: "textarea", max: 600, placeholder: "Ej. 2x1 los martes, aniversario el 15" },
      { name: "redes", label: "Redes", kind: "multi", required: true, options: NETWORKS, max: 4 },
      { name: "tono", label: "Tono", kind: "select", required: true, options: TONES, max: 20 },
      { name: "mes", label: "Mes", kind: "text", required: true, max: 30, placeholder: "Ej. noviembre 2026" },
    ],
  },
  {
    id: "radiografia",
    priceId: "svc-radiografia",
    name: "Radiografía de negocio",
    tagline: "Diagnóstico de tu negocio y mejoras ordenadas por presupuesto.",
    deliverable:
      "Puntaje por área, el cuello de botella real, mejoras gratis / baratas / de inversión y un plan de 30 días.",
    fields: [
      { name: "negocio", label: "Nombre del negocio", kind: "text", required: true, max: 80 },
      { name: "rubro", label: "¿Qué tipo de negocio es?", kind: "text", required: true, max: 80 },
      { name: "ciudad", label: "Ciudad o zona", kind: "text", max: 80 },
      { name: "tiempo", label: "¿Cuánto tiempo tiene abierto?", kind: "text", max: 60, placeholder: "Ej. 2 años" },
      { name: "equipo", label: "¿Cuántas personas trabajan?", kind: "text", max: 60 },
      { name: "ventas", label: "Ventas aproximadas al mes", kind: "text", max: 80, placeholder: "Ej. RD$60,000" },
      { name: "productos", label: "¿Qué vendes y a qué precios?", kind: "textarea", required: true, max: 1500 },
      { name: "clientes", label: "¿Cómo te llegan los clientes hoy?", kind: "textarea", required: true, max: 800, placeholder: "Ej. boca a boca, Instagram, pasan por el frente" },
      { name: "redes", label: "Redes y presencia en internet", kind: "textarea", max: 400, placeholder: "Ej. Instagram con 800 seguidores, no tengo página" },
      { name: "problema", label: "¿Qué es lo que más te preocupa?", kind: "textarea", required: true, max: 800, placeholder: "Ej. los clientes vienen una vez y no vuelven" },
      { name: "presupuesto", label: "¿Cuánto podrías invertir en mejoras?", kind: "text", max: 80, placeholder: "Ej. RD$5,000 al mes" },
    ],
  },
  {
    id: "documento",
    priceId: "svc-documento",
    name: "CV y documentos",
    tagline: "Currículum, cartas, cotizaciones y contratos listos para imprimir.",
    deliverable:
      "El documento redactado y ordenado, listo para imprimir o guardar en PDF, con notas de qué revisar.",
    fields: [
      { name: "tipo", label: "¿Qué documento necesitas?", kind: "select", required: true, options: DOCUMENT_TYPES, max: 30 },
      { name: "datos", label: "Tus datos", kind: "textarea", required: true, max: 3000, placeholder: "Pega o escribe toda la información que debe llevar", hint: "CV: nombre, contacto, estudios, trabajos con fechas, habilidades. Cotización: cliente, artículos, cantidades y precios. Contrato: partes, qué se acuerda, pagos y fechas." },
      { name: "objetivo", label: "¿Para qué es?", kind: "textarea", max: 600, placeholder: "Ej. aplicar a cajera en un supermercado; cotizar un logo a una ferretería" },
      { name: "estilo", label: "Indicaciones extra", kind: "textarea", max: 400, placeholder: "Ej. que quepa en una página, sin foto" },
    ],
  },
  {
    id: "asistente",
    priceId: "svc-asistente",
    name: "Asistente de WhatsApp",
    tagline: "Un asistente que contesta a tus clientes 24/7 y los pasa a tu WhatsApp.",
    deliverable:
      "La ficha de tu negocio y un enlace de chat que responde precios, horarios y dudas, y manda a tu WhatsApp para cerrar la venta.",
    fields: [
      { name: "negocio", label: "Nombre del negocio", kind: "text", required: true, max: 80 },
      { name: "whatsapp", label: "Tu WhatsApp (con código de país)", kind: "text", required: true, max: 20, placeholder: "Ej. 18095551234" },
      { name: "rubro", label: "¿Qué tipo de negocio es?", kind: "text", required: true, max: 80 },
      { name: "productos", label: "Productos o servicios con precios", kind: "textarea", required: true, max: 3000, placeholder: "Todo lo que el asistente puede ofrecer y cuánto cuesta" },
      { name: "horario", label: "Horario", kind: "text", required: true, max: 200, placeholder: "Ej. lunes a sábado 9:00 a 7:00, domingo cerrado" },
      { name: "ubicacion", label: "Ubicación y cómo llegar", kind: "textarea", max: 400 },
      { name: "entregas", label: "Delivery, citas o reservas", kind: "textarea", max: 600, placeholder: "Ej. delivery en Santiago RD$150; citas solo por WhatsApp" },
      { name: "pagos", label: "Formas de pago", kind: "text", max: 200, placeholder: "Ej. efectivo, transferencia, tarjeta" },
      { name: "preguntas", label: "Preguntas que siempre te hacen (con su respuesta)", kind: "textarea", max: 2000 },
      { name: "tono", label: "Tono", kind: "select", required: true, options: TONES, max: 20 },
    ],
  },
]

export function getService(id: unknown): ServiceDef | null {
  return SERVICES.find((s) => s.id === id) ?? null
}

/** Todas las filas de precio que agregan los servicios. */
export const SERVICE_PRICE_IDS: readonly string[] = [
  ...SERVICES.map((s) => s.priceId),
  ASSISTANT_MESSAGE_PRICE_ID,
  AGENT_MESSAGE_PRICE_ID,
]

export const SERVICE_PRICE_LABELS: Record<string, string> = {
  ...Object.fromEntries(SERVICES.map((s) => [s.priceId, s.name])),
  [ASSISTANT_MESSAGE_PRICE_ID]: "Asistente: cada respuesta",
  [AGENT_MESSAGE_PRICE_ID]: "Agentes Vision: cada respuesta",
}

export type ServiceInput = Record<string, string | string[]>

/**
 * Limpia y valida lo que llega del formulario. Solo pasan los campos del
 * servicio, recortados a su largo máximo. Lanza con un mensaje legible.
 */
export function cleanServiceInput(service: ServiceDef, raw: unknown): ServiceInput {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Solicitud inválida")
  const source = raw as Record<string, unknown>
  const out: ServiceInput = {}
  for (const field of service.fields) {
    const value = source[field.name]
    if (field.kind === "multi") {
      const allowed = new Set((field.options ?? []).map((o) => o.value))
      const list = Array.isArray(value)
        ? [...new Set(value.filter((v): v is string => typeof v === "string" && allowed.has(v)))]
        : []
      if (field.required && list.length === 0)
        throw new Error(`Escoge al menos una opción en «${field.label}»`)
      if (list.length) out[field.name] = list.slice(0, field.max)
      continue
    }
    const text = typeof value === "string" ? value.replace(/\u0000/g, "").trim() : ""
    if (field.kind === "select") {
      const allowed = (field.options ?? []).map((o) => o.value)
      if (!allowed.includes(text)) {
        if (field.required) throw new Error(`Escoge una opción en «${field.label}»`)
        continue
      }
      out[field.name] = text
      continue
    }
    if (!text) {
      if (field.required) throw new Error(`Falta «${field.label}»`)
      continue
    }
    if (text.length > field.max)
      throw new Error(`«${field.label}» es muy largo (máximo ${field.max} caracteres)`)
    out[field.name] = text
  }
  if (service.id === "asistente") {
    const phone = normalizeWhatsapp(out.whatsapp)
    if (!phone) throw new Error("Escribe el WhatsApp con código de país, solo números (ej. 18095551234)")
    out.whatsapp = phone
  }
  return out
}

/** Solo dígitos, entre 10 y 15 (formato internacional de wa.me). */
export function normalizeWhatsapp(value: unknown): string | null {
  if (typeof value !== "string") return null
  const digits = value.replace(/\D/g, "")
  if (digits.length === 10 && /^(809|829|849)/.test(digits)) return `1${digits}`
  return digits.length >= 10 && digits.length <= 15 ? digits : null
}

/** Título corto para el historial. */
export function jobTitle(service: ServiceDef, input: ServiceInput): string {
  const pick = (key: string) => (typeof input[key] === "string" ? (input[key] as string) : "")
  if (service.id === "documento") {
    const type = DOCUMENT_TYPES.find((t) => t.value === pick("tipo"))?.label ?? "Documento"
    const who = pick("datos").split("\n")[0]?.slice(0, 40) ?? ""
    return who ? `${type} · ${who}` : type
  }
  const name = pick("negocio") || service.name
  return service.id === "contenido" && pick("mes") ? `${name} · ${pick("mes")}` : name
}

/** Dirección pública del asistente: minúsculas, sin acentos, guiones. */
export function slugify(value: string): string {
  const base = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/g, "")
  return base.length >= 3 ? base : `negocio-${base || "402"}`.slice(0, 32)
}

export const SLUG_PATTERN = /^[a-z0-9-]{3,40}$/

/** Mensaje de un cliente en el chat público: texto plano y corto. */
export const CHAT_MESSAGE_MAX = 600
export const CHAT_VISITOR_DAILY_MAX = 40
export const WHATSAPP_MARKER = "[WHATSAPP]"

/** Quita la marca de traspaso a WhatsApp y dice si estaba. */
export function splitHandoff(reply: string): { text: string; handoff: boolean } {
  const handoff = reply.includes(WHATSAPP_MARKER)
  return { text: reply.split(WHATSAPP_MARKER).join("").trim(), handoff }
}

export function whatsappLink(phone: string, text?: string): string {
  const q = text ? `?text=${encodeURIComponent(text)}` : ""
  return `https://wa.me/${phone}${q}`
}
