/**
 * Cliente mínimo de la API de Claude (Messages API) con fetch. Solo servidor:
 * la llave ANTHROPIC_API_KEY nunca llega al navegador.
 */
import type { ToolSpec } from "./prompts"

const API_URL = "https://api.anthropic.com/v1/messages"
const API_VERSION = "2023-06-01"

export type Usage = {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

export class ClaudeError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly retryable: boolean
  ) {
    super(message)
    this.name = "ClaudeError"
  }
}

type SystemBlock = {
  type: "text"
  text: string
  cache_control?: { type: "ephemeral" }
}

type Message = { role: "user" | "assistant"; content: string }

type ApiResponse = {
  content?: { type: string; text?: string; name?: string; input?: unknown }[]
  stop_reason?: string
  usage?: Usage
  error?: { type?: string; message?: string }
}

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new ClaudeError("Falta ANTHROPIC_API_KEY en el servidor", null, false)
  return key
}

async function call(body: Record<string, unknown>, timeoutMs: number): Promise<ApiResponse> {
  let response: Response
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey(),
        "anthropic-version": API_VERSION,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (caught) {
    if (caught instanceof ClaudeError) throw caught
    if (caught instanceof Error && caught.name === "TimeoutError")
      throw new ClaudeError("La respuesta tardó demasiado", null, true)
    throw new ClaudeError("No se pudo conectar con el servicio", null, true)
  }
  const json = (await response.json().catch(() => ({}))) as ApiResponse
  if (!response.ok) {
    // Nunca se registra el cuerpo de la solicitud: lleva datos del cliente.
    const kind = json.error?.type ?? "error"
    console.error("[claude] request failed", { status: response.status, kind })
    throw new ClaudeError(
      response.status === 429 || response.status === 529
        ? "El servicio está ocupado. Intenta en un momento."
        : "El servicio no pudo completar la solicitud.",
      response.status,
      response.status === 429 || response.status >= 500
    )
  }
  return json
}

/** Pide una respuesta forzando una herramienta y devuelve su entrada (JSON). */
export async function callTool(options: {
  model: string
  maxTokens: number
  system: string
  user: string
  tool: ToolSpec
  timeoutMs?: number
}): Promise<{ input: unknown; usage: Usage | null }> {
  const json = await call(
    {
      model: options.model,
      max_tokens: options.maxTokens,
      system: options.system,
      messages: [{ role: "user", content: options.user }],
      tools: [options.tool],
      tool_choice: { type: "tool", name: options.tool.name },
    },
    options.timeoutMs ?? 10 * 60_000
  )
  if (json.stop_reason === "max_tokens")
    throw new ClaudeError("La respuesta quedó incompleta", null, true)
  const block = json.content?.find((b) => b.type === "tool_use" && b.name === options.tool.name)
  if (!block) throw new ClaudeError("La respuesta no trajo el formato esperado", null, true)
  return { input: block.input, usage: json.usage ?? null }
}

/** Respuesta corta de chat. La ficha va en un bloque en caché. */
export async function callChat(options: {
  model: string
  maxTokens: number
  rules: string
  knowledge: string
  messages: Message[]
  timeoutMs?: number
}): Promise<{ text: string; usage: Usage | null }> {
  const system: SystemBlock[] = [
    { type: "text", text: options.rules },
    { type: "text", text: options.knowledge, cache_control: { type: "ephemeral" } },
  ]
  const json = await call(
    {
      model: options.model,
      max_tokens: options.maxTokens,
      system,
      messages: options.messages,
    },
    options.timeoutMs ?? 40_000
  )
  const text = (json.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("")
    .trim()
  if (!text) throw new ClaudeError("Respuesta vacía", null, true)
  return { text, usage: json.usage ?? null }
}

/**
 * Respuesta de un agente del chat. Las instrucciones van en caché. Si se
 * llega al tope de tokens se devuelve lo escrito y se marca como cortado.
 */
export async function callAgent(options: {
  model: string
  maxTokens: number
  system: string
  messages: Message[]
  timeoutMs?: number
}): Promise<{ text: string; usage: Usage | null; truncated: boolean }> {
  const json = await call(
    {
      model: options.model,
      max_tokens: options.maxTokens,
      system: [{ type: "text", text: options.system, cache_control: { type: "ephemeral" } }],
      messages: options.messages,
    },
    options.timeoutMs ?? 25_000
  )
  const text = (json.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("")
    .trim()
  if (!text) throw new ClaudeError("Respuesta vacía", null, true)
  return { text, usage: json.usage ?? null, truncated: json.stop_reason === "max_tokens" }
}
