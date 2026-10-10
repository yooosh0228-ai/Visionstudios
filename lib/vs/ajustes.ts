/**
 * Ajustes generales de Vision Studios (una sola fila en vs_ajustes). Lo que
 * falte en la base se completa con estos valores, así la portada nunca se rompe
 * aunque la fila esté vacía o a medias.
 */

export type CuentaPago = { banco: string; titular: string; numero: string; tipo: string }
export type PaqueteCreditos = { precio: number; creditos: number }

export type Ajustes = {
  nombre: string
  whatsapp: string
  instagram: string
  correo: string
  portada: string
  pruebaSocial: [string, string][]
  espacioLibre: { titulo: string; texto: string }
  compromisos: [string, string, string][]
  radiografia: { oferta: string; etiqueta: string; condicion: string; lead: string }
  pasos: [string, string][]
  metaMensual: number
  capacidad: number
  reglasCobro: [string, string][]
  cuentasPago: CuentaPago[]
  paquetesCreditos: PaqueteCreditos[]
}

export const AJUSTES_BASE: Ajustes = {
  nombre: "Vision Studios",
  whatsapp: "",
  instagram: "visionstudios.rd",
  correo: "",
  portada: "spot-tu-negocio",
  pruebaSocial: [
    ["100%", "personalizado"],
    ["Cero", "plantillas"],
    ["Hecho", "en Santiago"],
  ],
  espacioLibre: {
    titulo: "El próximo puede ser el tuyo.",
    texto: "Cuéntanos tu negocio y lo ponemos en foco.",
  },
  compromisos: [
    ["desde-cero", "Desde cero", "Cada página, app y pieza se diseña y se programa para ti. No compramos plantillas para revenderlas."],
    ["tuyo", "Es tuyo", "Va con tu nombre y en tu dominio. Te quedas con los archivos."],
    ["manual", "Te enseñamos a usarlo", "Entregamos con manual y te acompañamos hasta que lo manejes sin depender de nadie."],
  ],
  radiografia: {
    oferta: "radiografia",
    etiqueta: "Precio de lanzamiento",
    condicion:
      "Pago único. Sales con un plan escrito, tuyo, lo hagas con nosotros o con quien quieras. Si contratas el siguiente servicio con nosotros, se te descuenta.",
    lead: "Antes de gastar en página, logo o publicidad, mira dónde se te va el cliente. Revisamos tu negocio completo y te decimos qué falta y en qué orden.",
  },
  pasos: [
    ["Enfocar", "Hablamos de tu negocio: qué vendes, a quién y qué te está costando clientes."],
    ["Encuadrar", "Te proponemos qué hacer, en qué orden y cuánto cuesta. Por escrito."],
    ["Disparar", "Lo hacemos y te enseñamos avances para que corrijas a tiempo."],
    ["Revelar", "Te lo entregamos a tu nombre y te enseñamos a usarlo."],
  ],
  metaMensual: 50000,
  capacidad: 7,
  reglasCobro: [
    ["Hasta RD$10,000", "100% antes de iniciar."],
    ["Proyecto de RD$10,000–40,000", "60% al inicio, 40% antes de la entrega final o la publicación."],
    ["Mensualidad", "Se paga al inicio del ciclo, no al final."],
    ["Costos de terceros", "Impresión, pauta, dominio y otros: 100% del cliente antes de comprarlos."],
  ],
  cuentasPago: [],
  paquetesCreditos: [
    { precio: 300, creditos: 500 },
    { precio: 600, creditos: 1100 },
    { precio: 1500, creditos: 2900 },
  ],
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v)
const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback)
const num = (v: unknown, fallback: number) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN
  return Number.isFinite(n) && n >= 0 ? n : fallback
}
function tuples<T extends string[]>(v: unknown, size: number, fallback: T[]): T[] {
  if (!Array.isArray(v)) return fallback
  const out = v.filter(
    (row): row is T =>
      Array.isArray(row) && row.length >= size && row.slice(0, size).every((c) => typeof c === "string")
  )
  return out.map((row) => row.slice(0, size) as T)
}

/** Une lo guardado con la base, descartando lo que no tenga la forma correcta. */
export function normalizarAjustes(raw: unknown): Ajustes {
  const d = isObj(raw) ? raw : {}
  const b = AJUSTES_BASE
  const radio = isObj(d.radiografia) ? d.radiografia : {}
  const libre = isObj(d.espacioLibre) ? d.espacioLibre : {}
  return {
    nombre: str(d.nombre, b.nombre),
    whatsapp: str(d.whatsapp, b.whatsapp).replace(/\D/g, ""),
    instagram: str(d.instagram, b.instagram).replace(/^@/, ""),
    correo: str(d.correo, b.correo),
    portada: str(d.portada, b.portada),
    pruebaSocial: "pruebaSocial" in d ? tuples<[string, string]>(d.pruebaSocial, 2, []) : b.pruebaSocial,
    espacioLibre: {
      titulo: str(libre.titulo, b.espacioLibre.titulo),
      texto: str(libre.texto, b.espacioLibre.texto),
    },
    compromisos: "compromisos" in d ? tuples<[string, string, string]>(d.compromisos, 3, []) : b.compromisos,
    radiografia: {
      oferta: str(radio.oferta, b.radiografia.oferta),
      etiqueta: str(radio.etiqueta, b.radiografia.etiqueta),
      condicion: str(radio.condicion, b.radiografia.condicion),
      lead: str(radio.lead, b.radiografia.lead),
    },
    pasos: "pasos" in d ? tuples<[string, string]>(d.pasos, 2, []) : b.pasos,
    metaMensual: num(d.metaMensual, b.metaMensual),
    capacidad: Math.round(num(d.capacidad, b.capacidad)),
    reglasCobro: "reglasCobro" in d ? tuples<[string, string]>(d.reglasCobro, 2, []) : b.reglasCobro,
    cuentasPago: Array.isArray(d.cuentasPago)
      ? d.cuentasPago.filter(isObj).map((c) => ({
          banco: str(c.banco, ""),
          titular: str(c.titular, ""),
          numero: str(c.numero, ""),
          tipo: str(c.tipo, ""),
        }))
      : b.cuentasPago,
    paquetesCreditos: Array.isArray(d.paquetesCreditos)
      ? d.paquetesCreditos
          .filter(isObj)
          .map((p) => ({ precio: num(p.precio, 0), creditos: num(p.creditos, 0) }))
          .filter((p) => p.precio > 0 && p.creditos > 0)
      : b.paquetesCreditos,
  }
}

/** Enlace de chat: WhatsApp si hay número, si no el chat de Instagram. */
export function enlaceChat(a: Pick<Ajustes, "whatsapp" | "instagram">, texto?: string): string {
  if (a.whatsapp) return `https://wa.me/${a.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`
  return `https://ig.me/m/${a.instagram}`
}
