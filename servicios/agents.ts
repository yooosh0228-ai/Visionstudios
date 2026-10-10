/**
 * Agentes Vision: catálogo de los agentes especialistas del chat. Puro y sin
 * imports: lo usan el navegador, el servidor y las pruebas. Las instrucciones
 * de cada agente viven solo en el servidor (prompts.ts).
 */

export type AgentId = "negocio" | "contenido" | "marca" | "ventas"

export type AgentDef = {
  id: AgentId
  name: string
  role: string
  description: string
  /** Ideas para arrancar la conversación. */
  starters: readonly string[]
}

export const AGENT_MESSAGE_MAX = 4000
/** Mensajes previos que se mandan como contexto en cada respuesta. */
export const AGENT_HISTORY_LIMIT = 16
/** Respuestas por conversación antes de pedir una nueva. */
export const AGENT_CHAT_MAX_REPLIES = 60

export const AGENTS: readonly AgentDef[] = [
  {
    id: "negocio",
    name: "Consultor de negocio",
    role: "Precios, clientes y operación",
    description:
      "Encuentra dónde se te escapa el dinero, te ayuda a poner precios y te arma un plan con lo que tienes.",
    starters: [
      "Tengo una barbería y los clientes vienen una vez y no vuelven. ¿Qué hago?",
      "¿Cómo le pongo precio a mis servicios sin perder clientes?",
      "Quiero abrir un negocio con RD$50,000. ¿Por dónde empiezo?",
    ],
  },
  {
    id: "contenido",
    name: "Community manager",
    role: "Redes sociales y contenido",
    description:
      "Ideas de posts, captions listos para copiar, guiones de reels y qué publicar esta semana.",
    starters: [
      "Dame 5 ideas de reels para una tienda de ropa esta semana.",
      "Escríbeme el caption para la promo 2x1 de los martes.",
      "Hazme un guion de 30 segundos para presentar mi negocio.",
    ],
  },
  {
    id: "marca",
    name: "Estratega de marca",
    role: "Nombres, eslóganes e identidad",
    description:
      "Nombres para tu negocio, eslogan, propuesta de valor, tono de voz y dirección visual de tu marca.",
    starters: [
      "Dame 10 nombres para una repostería en Santiago.",
      "Necesito un eslogan corto para mi taller de detailing.",
      "¿Qué colores y estilo le van a una marca de café premium?",
    ],
  },
  {
    id: "ventas",
    name: "Vendedor",
    role: "WhatsApp, ofertas y cierre",
    description:
      "Respuestas para tus clientes, cómo manejar el «está caro», ofertas que venden y mensajes para recuperar clientes.",
    starters: [
      "Un cliente me dijo «está caro». ¿Qué le respondo?",
      "Escríbeme un mensaje para clientes que no vienen hace un mes.",
      "Arma una oferta para vender más los días flojos.",
    ],
  },
]

export function getAgent(id: unknown): AgentDef | null {
  return AGENTS.find((a) => a.id === id) ?? null
}

/** Texto de un mensaje del usuario: sin caracteres nulos, recortado y validado. */
export function cleanAgentMessage(value: unknown): string {
  const text = typeof value === "string" ? value.replace(/\u0000/g, "").trim() : ""
  if (!text) throw new Error("Escribe tu mensaje.")
  if (text.length > AGENT_MESSAGE_MAX)
    throw new Error(`Tu mensaje es muy largo (máximo ${AGENT_MESSAGE_MAX.toLocaleString("es-DO")} caracteres).`)
  return text
}

/** Título de la conversación a partir del primer mensaje. */
export function chatTitle(firstMessage: string): string {
  const line = firstMessage.split("\n").find((l) => l.trim())?.trim() ?? ""
  if (!line) return "Conversación nueva"
  return line.length > 60 ? `${line.slice(0, 57).trimEnd()}…` : line
}

export type Turn = { role: "user" | "assistant"; content: string }

/**
 * Historial listo para la API: los últimos mensajes, empezando por el
 * usuario y alternando (los seguidos del mismo lado se unen).
 */
export function buildTurns(history: readonly Turn[], next: string, limit = AGENT_HISTORY_LIMIT): Turn[] {
  const recent = history.slice(-limit)
  while (recent.length && recent[0]?.role !== "user") recent.shift()
  const turns: Turn[] = []
  for (const m of [...recent, { role: "user" as const, content: next }]) {
    const last = turns[turns.length - 1]
    if (last && last.role === m.role) last.content = `${last.content}\n\n${m.content}`
    else turns.push({ ...m })
  }
  return turns
}
