/**
 * Reglas de cobro puras (sin red ni base de datos) para poder probarlas solas.
 * Un crédito del estudio es la unidad que el dueño vende; el precio de cada
 * modelo lo fija el dueño en /admin.
 */

export const DEFAULT_TOPUP_URL = "https://instagram.com/402visionstudios"

/** Correos de dueño: variable OWNER_EMAILS separada por comas, sin distinguir mayúsculas. */
export function parseOwnerEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isOwnerEmail(
  email: string | null | undefined,
  owners: readonly string[]
): boolean {
  return !!email && owners.includes(email.trim().toLowerCase())
}

/** Cuántas salidas pide la configuración (Soul: batchSize "1" o "4"). */
export function outputCount(settings: Record<string, unknown>): number {
  const raw = settings.batchSize ?? settings.numImages ?? settings.count
  const n = typeof raw === "string" ? Number(raw) : raw
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 8
    ? n
    : 1
}

export function roundCredits(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Costo en créditos de una generación: precio del modelo × cantidad de salidas.
 * Devuelve null cuando el modelo no tiene precio (los clientes no lo pueden usar).
 * El precio del modelo debe corresponder a su configuración más cara
 * (duración o resolución máximas), así nunca se cobra de menos.
 */
export function generationCost(
  price: number | null | undefined,
  settings: Record<string, unknown>
): number | null {
  if (price == null || !Number.isFinite(price) || price < 0) return null
  return roundCredits(price * outputCount(settings))
}

export function formatCredits(value: number): string {
  return new Intl.NumberFormat("es-DO", { maximumFractionDigits: 2 }).format(
    value
  )
}

/** Lo que el usuario puede o no hacer con su saldo para esta generación. */
export type Affordability =
  | { state: "free" }
  | { state: "ok"; cost: number }
  | { state: "unpriced" }
  | { state: "short"; cost: number; missing: number }

export function affordability(input: {
  isOwner: boolean
  credits: number
  price: number | null | undefined
  settings: Record<string, unknown>
}): Affordability {
  if (input.isOwner) return { state: "free" }
  const cost = generationCost(input.price, input.settings)
  if (cost === null) return { state: "unpriced" }
  if (input.credits < cost)
    return { state: "short", cost, missing: roundCredits(cost - input.credits) }
  return { state: "ok", cost }
}

/** Valida un monto escrito por el dueño; lanza con un mensaje legible. */
export function parseCreditAmount(
  raw: unknown,
  { allowNegative = false, max = 100_000 }: { allowNegative?: boolean; max?: number } = {}
): number {
  if (typeof raw === "string" && raw.trim() === "")
    throw new Error("Escribe un número válido")
  const n = typeof raw === "string" ? Number(raw.replace(",", ".")) : raw
  if (typeof n !== "number" || !Number.isFinite(n))
    throw new Error("Escribe un número válido")
  if (n === 0) throw new Error("El monto no puede ser cero")
  if (n < 0 && !allowNegative) throw new Error("El monto debe ser mayor que cero")
  if (Math.abs(n) > max) throw new Error(`El monto máximo es ${max}`)
  return roundCredits(n)
}

/** Precio de un modelo escrito por el dueño. Vacío = quitar el precio. */
export function parsePriceInput(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === "string" && raw.trim() === "") return null
  const n = typeof raw === "string" ? Number(raw.replace(",", ".")) : raw
  if (typeof n !== "number" || !Number.isFinite(n))
    throw new Error("Escribe un precio válido")
  if (n < 0) throw new Error("El precio no puede ser negativo")
  if (n > 10_000) throw new Error("El precio máximo es 10000")
  return roundCredits(n)
}
