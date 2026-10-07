/**
 * Forma de lo que entrega cada servicio. Claude la devuelve como la entrada de
 * una herramienta forzada (JSON), y aquí se normaliza para que la pantalla no
 * se rompa si falta algo. Puro y sin imports.
 */

export type ContentPost = {
  dia: number
  red: string
  formato: string
  tema: string
  idea_visual: string
  texto: string
  hashtags: string[]
  llamada_accion: string
}

export type ContentOutput = {
  estrategia: string
  pilares: string[]
  posts: ContentPost[]
  promociones: { nombre: string; mecanica: string; texto_whatsapp: string }[]
  mensajes_whatsapp: { situacion: string; texto: string }[]
}

export type DiagnosisOutput = {
  resumen: string
  cuello_de_botella: { titulo: string; explicacion: string }
  areas: { area: string; nota: number; comentario: string }[]
  mejoras: {
    nivel: "gratis" | "bajo" | "inversion"
    titulo: string
    por_que: string
    pasos: string[]
    costo_estimado: string
    impacto: string
  }[]
  plan_30_dias: { semana: string; acciones: string[] }[]
  siguiente_paso: string
}

export type DocumentOutput = {
  titulo: string
  documento: string
  notas: string[]
}

export type AssistantOutput = {
  ficha: string
  saludo: string
  preguntas_frecuentes: { pregunta: string; respuesta: string }[]
}

export type ServiceOutput =
  | { service: "contenido"; data: ContentOutput }
  | { service: "radiografia"; data: DiagnosisOutput }
  | { service: "documento"; data: DocumentOutput }
  | { service: "asistente"; data: AssistantOutput }

type Obj = Record<string, unknown>

const obj = (v: unknown): Obj =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {}
const str = (v: unknown, max = 20_000): string =>
  typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : ""
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const strs = (v: unknown, max = 500): string[] =>
  arr(v).map((x) => str(x, max)).filter(Boolean)

export function normalizeContent(raw: unknown): ContentOutput {
  const o = obj(raw)
  return {
    estrategia: str(o.estrategia, 3000),
    pilares: strs(o.pilares, 120).slice(0, 8),
    posts: arr(o.posts)
      .map((p, i) => {
        const x = obj(p)
        const dia = Number(x.dia)
        return {
          dia: Number.isInteger(dia) && dia >= 1 && dia <= 31 ? dia : i + 1,
          red: str(x.red, 40),
          formato: str(x.formato, 40),
          tema: str(x.tema, 200),
          idea_visual: str(x.idea_visual, 800),
          texto: str(x.texto, 2500),
          hashtags: strs(x.hashtags, 60)
            .map((h) => (h.startsWith("#") ? h : `#${h}`).replace(/\s+/g, ""))
            .slice(0, 15),
          llamada_accion: str(x.llamada_accion, 200),
        }
      })
      .filter((p) => p.texto)
      .slice(0, 40),
    promociones: arr(o.promociones)
      .map((p) => {
        const x = obj(p)
        return {
          nombre: str(x.nombre, 120),
          mecanica: str(x.mecanica, 800),
          texto_whatsapp: str(x.texto_whatsapp, 1200),
        }
      })
      .filter((p) => p.nombre)
      .slice(0, 8),
    mensajes_whatsapp: arr(o.mensajes_whatsapp)
      .map((p) => {
        const x = obj(p)
        return { situacion: str(x.situacion, 160), texto: str(x.texto, 1200) }
      })
      .filter((p) => p.texto)
      .slice(0, 10),
  }
}

const LEVELS = ["gratis", "bajo", "inversion"] as const

export function normalizeDiagnosis(raw: unknown): DiagnosisOutput {
  const o = obj(raw)
  const cuello = obj(o.cuello_de_botella)
  return {
    resumen: str(o.resumen, 3000),
    cuello_de_botella: {
      titulo: str(cuello.titulo, 200),
      explicacion: str(cuello.explicacion, 2000),
    },
    areas: arr(o.areas)
      .map((a) => {
        const x = obj(a)
        const nota = Math.round(Number(x.nota))
        return {
          area: str(x.area, 80),
          nota: Number.isFinite(nota) ? Math.min(10, Math.max(1, nota)) : 5,
          comentario: str(x.comentario, 600),
        }
      })
      .filter((a) => a.area)
      .slice(0, 10),
    mejoras: arr(o.mejoras)
      .map((m) => {
        const x = obj(m)
        const nivel = LEVELS.find((l) => l === x.nivel) ?? "bajo"
        return {
          nivel,
          titulo: str(x.titulo, 200),
          por_que: str(x.por_que, 1000),
          pasos: strs(x.pasos, 400).slice(0, 8),
          costo_estimado: str(x.costo_estimado, 120),
          impacto: str(x.impacto, 300),
        }
      })
      .filter((m) => m.titulo)
      .slice(0, 15),
    plan_30_dias: arr(o.plan_30_dias)
      .map((s) => {
        const x = obj(s)
        return { semana: str(x.semana, 60), acciones: strs(x.acciones, 400).slice(0, 8) }
      })
      .filter((s) => s.acciones.length)
      .slice(0, 6),
    siguiente_paso: str(o.siguiente_paso, 800),
  }
}

export function normalizeDocument(raw: unknown): DocumentOutput {
  const o = obj(raw)
  return {
    titulo: str(o.titulo, 200) || "Documento",
    documento: str(o.documento, 30_000),
    notas: strs(o.notas, 400).slice(0, 10),
  }
}

export function normalizeAssistant(raw: unknown): AssistantOutput {
  const o = obj(raw)
  return {
    ficha: str(o.ficha, 12_000),
    saludo: str(o.saludo, 400),
    preguntas_frecuentes: arr(o.preguntas_frecuentes)
      .map((q) => {
        const x = obj(q)
        return { pregunta: str(x.pregunta, 300), respuesta: str(x.respuesta, 1000) }
      })
      .filter((q) => q.pregunta && q.respuesta)
      .slice(0, 20),
  }
}

export function normalizeOutput(service: string, raw: unknown): ServiceOutput | null {
  switch (service) {
    case "contenido":
      return { service, data: normalizeContent(raw) }
    case "radiografia":
      return { service, data: normalizeDiagnosis(raw) }
    case "documento":
      return { service, data: normalizeDocument(raw) }
    case "asistente":
      return { service, data: normalizeAssistant(raw) }
    default:
      return null
  }
}

/** ¿Trae lo mínimo para entregarse? Si no, se reembolsa. */
export function isUsable(output: ServiceOutput): boolean {
  switch (output.service) {
    case "contenido":
      return output.data.posts.length >= 10
    case "radiografia":
      return !!output.data.resumen && output.data.mejoras.length > 0
    case "documento":
      return output.data.documento.length > 80
    case "asistente":
      return output.data.ficha.length > 80
  }
}

/** Texto plano de un mes de contenido (para copiar o descargar). */
export function contentToText(data: ContentOutput): string {
  const lines: string[] = ["ESTRATEGIA", data.estrategia, ""]
  if (data.pilares.length) lines.push(`Pilares: ${data.pilares.join(" · ")}`, "")
  for (const p of data.posts)
    lines.push(
      `DÍA ${p.dia} · ${p.red} · ${p.formato}`,
      `Tema: ${p.tema}`,
      `Idea visual: ${p.idea_visual}`,
      "",
      p.texto,
      "",
      p.hashtags.join(" "),
      p.llamada_accion ? `Llamada a la acción: ${p.llamada_accion}` : "",
      "—".repeat(20)
    )
  if (data.promociones.length) {
    lines.push("", "PROMOCIONES")
    for (const p of data.promociones)
      lines.push(`• ${p.nombre}: ${p.mecanica}`, p.texto_whatsapp, "")
  }
  if (data.mensajes_whatsapp.length) {
    lines.push("", "MENSAJES DE WHATSAPP")
    for (const m of data.mensajes_whatsapp) lines.push(`• ${m.situacion}`, m.texto, "")
  }
  return lines.filter((l, i, all) => !(l === "" && all[i - 1] === "")).join("\n")
}
