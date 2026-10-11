/**
 * Los formularios del panel se dibujan y se validan desde esta misma lista: el
 * navegador la usa para pintar los campos y el servidor para aceptar solo esas
 * columnas, con su tipo. Así no hay un campo en pantalla que el servidor ignore,
 * ni una columna que alguien pueda escribir sin estar aquí.
 */
import {
  CATEGORIAS_OFERTA,
  CATEGORIA_LABEL,
  ESTADOS_APP,
  ESTADO_APP_LABEL,
  ESTADOS_ENTREGABLE,
  ENTREGABLE_LABEL,
  ESTADOS_PROSPECTO,
  ESTADO_PROSPECTO_LABEL,
  ETAPAS,
  ETAPA_LABEL,
  SECTORES,
  TIPOS_APP,
  TIPO_APP_LABEL,
  TIPOS_COBRO,
  TIPO_COBRO_LABEL,
  TIPOS_TRABAJO,
  TIPO_TRABAJO_LABEL,
  UNIDADES_OFERTA,
} from "./types"

export type TipoCampo =
  | "texto"
  | "largo"
  | "numero"
  | "dinero"
  | "fecha"
  | "opcion"
  | "si-no"
  | "lineas"
  | "cifras"
  | "pantallas"
  | "url"
  | "correo"
  | "telefono"
  | "id"

/** Listas que el panel carga de la base para algunos selectores. */
export type FuenteOpciones = "clientes" | "ofertas" | "proyectos"

export type Campo = {
  columna: string
  etiqueta: string
  tipo: TipoCampo
  requerido?: boolean
  ayuda?: string
  opciones?: readonly (readonly [string, string])[]
  fuente?: FuenteOpciones
  ancho?: "medio" | "completo"
  /** Solo al crear: después el id no cambia. */
  soloAlCrear?: boolean
  max?: number
  /** Permite subir el archivo desde el teléfono o la computadora. */
  subida?: "video" | "imagen"
}

export type Entidad =
  | "prospecto"
  | "cliente"
  | "proyecto"
  | "entregable"
  | "cobro"
  | "oferta"
  | "trabajo"
  | "app"

export const TABLA: Record<Entidad, string> = {
  prospecto: "vs_prospectos",
  cliente: "vs_clientes",
  proyecto: "vs_proyectos",
  entregable: "vs_entregables",
  cobro: "vs_cobros",
  oferta: "vs_ofertas",
  trabajo: "vs_trabajos",
  app: "vs_apps",
}

/** Entidades cuyo id lo escribe el dueño (un slug corto), no la base. */
export const ID_MANUAL: ReadonlySet<Entidad> = new Set(["oferta", "trabajo"])

const op = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>
) => values.map((v) => [v, labels[v]] as const)

export const CAMPOS: Record<Entidad, Campo[]> = {
  prospecto: [
    { columna: "negocio", etiqueta: "Negocio", tipo: "texto", requerido: true },
    {
      columna: "contacto",
      etiqueta: "Contacto",
      tipo: "texto",
      ancho: "medio",
    },
    {
      columna: "telefono",
      etiqueta: "WhatsApp",
      tipo: "telefono",
      ancho: "medio",
    },
    {
      columna: "instagram",
      etiqueta: "Instagram",
      tipo: "texto",
      ancho: "medio",
      ayuda: "Sin @",
    },
    {
      columna: "sector",
      etiqueta: "Sector",
      tipo: "opcion",
      opciones: SECTORES.map((s) => [s, s] as const),
      ancho: "medio",
    },
    {
      columna: "oferta_id",
      etiqueta: "Servicio recomendado",
      tipo: "opcion",
      fuente: "ofertas",
      ancho: "medio",
    },
    {
      columna: "valor",
      etiqueta: "Valor potencial (RD$)",
      tipo: "dinero",
      ancho: "medio",
    },
    {
      columna: "estado",
      etiqueta: "Estado",
      tipo: "opcion",
      requerido: true,
      opciones: op(ESTADOS_PROSPECTO, ESTADO_PROSPECTO_LABEL),
      ancho: "medio",
    },
    {
      columna: "fecha_proxima",
      etiqueta: "Fecha de la próxima acción",
      tipo: "fecha",
      ancho: "medio",
    },
    {
      columna: "proxima_accion",
      etiqueta: "Próxima acción",
      tipo: "texto",
      ayuda: "Una sola, concreta: «Mandar la muestra de fotos».",
    },
    { columna: "nota", etiqueta: "Lo que observaste", tipo: "largo" },
  ],
  cliente: [
    {
      columna: "nombre",
      etiqueta: "Nombre del negocio",
      tipo: "texto",
      requerido: true,
    },
    {
      columna: "contacto",
      etiqueta: "Persona de contacto",
      tipo: "texto",
      ancho: "medio",
    },
    {
      columna: "telefono",
      etiqueta: "Teléfono / WhatsApp",
      tipo: "telefono",
      ancho: "medio",
    },
    {
      columna: "email",
      etiqueta: "Correo de Google del cliente",
      tipo: "correo",
      ayuda:
        "Con este correo entra a su área de cliente y ve sus proyectos, entregas y saldo.",
    },
    {
      columna: "sector",
      etiqueta: "Sector",
      tipo: "opcion",
      opciones: SECTORES.map((s) => [s, s] as const),
      ancho: "medio",
    },
    {
      columna: "ciudad",
      etiqueta: "Ciudad / zona",
      tipo: "texto",
      ancho: "medio",
    },
    {
      columna: "enlace",
      etiqueta: "Instagram, web o Google Business",
      tipo: "texto",
    },
    { columna: "oferta", etiqueta: "Qué vende y a qué precio", tipo: "largo" },
    { columna: "audiencia", etiqueta: "A quién le vende", tipo: "largo" },
    {
      columna: "prueba",
      etiqueta: "Pruebas que tiene",
      tipo: "largo",
      ayuda: "Fotos, casos, testimonios, años en el negocio.",
    },
    {
      columna: "rango_precio",
      etiqueta: "Presupuesto o rango",
      tipo: "texto",
      ancho: "medio",
    },
    {
      columna: "tono",
      etiqueta: "Tono de la marca",
      tipo: "texto",
      ancho: "medio",
    },
    { columna: "objetivo", etiqueta: "Objetivo principal", tipo: "largo" },
    { columna: "obstaculo", etiqueta: "Obstáculo principal", tipo: "largo" },
    {
      columna: "materiales",
      etiqueta: "Material, permisos y restricciones",
      tipo: "largo",
    },
    {
      columna: "estado",
      etiqueta: "Estado",
      tipo: "opcion",
      opciones: [
        ["activo", "Activo"],
        ["pausa", "En pausa"],
        ["cerrado", "Cerrado"],
      ],
      ancho: "medio",
    },
    {
      columna: "notas_internas",
      etiqueta: "Notas internas",
      tipo: "largo",
      ayuda: "El cliente nunca ve esto.",
    },
  ],
  proyecto: [
    {
      columna: "cliente_id",
      etiqueta: "Cliente",
      tipo: "opcion",
      fuente: "clientes",
      requerido: true,
    },
    {
      columna: "nombre",
      etiqueta: "Nombre del proyecto",
      tipo: "texto",
      requerido: true,
    },
    {
      columna: "oferta_id",
      etiqueta: "Servicio",
      tipo: "opcion",
      fuente: "ofertas",
      ancho: "medio",
    },
    {
      columna: "etapa",
      etiqueta: "Etapa",
      tipo: "opcion",
      requerido: true,
      opciones: op(ETAPAS, ETAPA_LABEL),
      ancho: "medio",
    },
    {
      columna: "fecha_entrega",
      etiqueta: "Fecha de entrega",
      tipo: "fecha",
      ancho: "medio",
    },
    {
      columna: "cerrado",
      etiqueta: "Proyecto cerrado",
      tipo: "si-no",
      ancho: "medio",
    },
    {
      columna: "nota_cliente",
      etiqueta: "Nota para el cliente",
      tipo: "largo",
      ayuda: "La ve en su área de cliente.",
    },
    {
      columna: "notas_internas",
      etiqueta: "Notas internas",
      tipo: "largo",
      ayuda: "El cliente nunca ve esto.",
    },
  ],
  entregable: [
    {
      columna: "proyecto_id",
      etiqueta: "Proyecto",
      tipo: "opcion",
      fuente: "proyectos",
      requerido: true,
    },
    { columna: "titulo", etiqueta: "Título", tipo: "texto", requerido: true },
    {
      columna: "enlace",
      etiqueta: "Enlace",
      tipo: "url",
      ayuda: "Video, carpeta, página o archivo.",
    },
    { columna: "descripcion", etiqueta: "Descripción", tipo: "largo" },
    {
      columna: "estado",
      etiqueta: "Estado",
      tipo: "opcion",
      requerido: true,
      opciones: op(ESTADOS_ENTREGABLE, ENTREGABLE_LABEL),
      ancho: "medio",
    },
    {
      columna: "visible_cliente",
      etiqueta: "Lo ve el cliente",
      tipo: "si-no",
      ancho: "medio",
    },
  ],
  cobro: [
    {
      columna: "cliente_id",
      etiqueta: "Cliente",
      tipo: "opcion",
      fuente: "clientes",
      requerido: true,
    },
    {
      columna: "concepto",
      etiqueta: "Concepto",
      tipo: "texto",
      requerido: true,
    },
    {
      columna: "tipo",
      etiqueta: "Tipo",
      tipo: "opcion",
      requerido: true,
      opciones: op(TIPOS_COBRO, TIPO_COBRO_LABEL),
      ancho: "medio",
    },
    {
      columna: "oferta_id",
      etiqueta: "Servicio",
      tipo: "opcion",
      fuente: "ofertas",
      ancho: "medio",
    },
    {
      columna: "proyecto_id",
      etiqueta: "Proyecto",
      tipo: "opcion",
      fuente: "proyectos",
      ancho: "medio",
    },
    {
      columna: "precio",
      etiqueta: "Precio contratado (RD$)",
      tipo: "dinero",
      requerido: true,
      ancho: "medio",
    },
    {
      columna: "deposito",
      etiqueta: "Depósito requerido (RD$)",
      tipo: "dinero",
      ancho: "medio",
      ayuda: "Vacío: se calcula con tus reglas de cobro.",
    },
    {
      columna: "vencimiento",
      etiqueta: "Vencimiento",
      tipo: "fecha",
      ancho: "medio",
    },
    {
      columna: "cancelado",
      etiqueta: "Cancelado",
      tipo: "si-no",
      ancho: "medio",
    },
    {
      columna: "nota",
      etiqueta: "Nota",
      tipo: "largo",
      ayuda: "La ve el cliente junto al cobro.",
    },
  ],
  oferta: [
    {
      columna: "id",
      etiqueta: "Código",
      tipo: "id",
      requerido: true,
      soloAlCrear: true,
      ancho: "medio",
      ayuda: "Minúsculas y guiones: «pagina-signal».",
    },
    {
      columna: "nombre",
      etiqueta: "Nombre",
      tipo: "texto",
      requerido: true,
      ancho: "medio",
    },
    {
      columna: "categoria",
      etiqueta: "Categoría",
      tipo: "opcion",
      requerido: true,
      opciones: op(CATEGORIAS_OFERTA, CATEGORIA_LABEL),
      ancho: "medio",
    },
    {
      columna: "unidad",
      etiqueta: "Se cobra",
      tipo: "opcion",
      requerido: true,
      opciones: UNIDADES_OFERTA.map((u) => [u, u] as const),
      ancho: "medio",
    },
    { columna: "resumen", etiqueta: "Una línea de qué es", tipo: "texto" },
    {
      columna: "incluye",
      etiqueta: "Qué incluye",
      tipo: "lineas",
      ayuda: "Un punto por línea.",
    },
    {
      columna: "precio_publico",
      etiqueta: "Precio público (RD$)",
      tipo: "dinero",
      ancho: "medio",
      ayuda: "Vacío: no se muestra precio. Hoy solo la radiografía lo tiene.",
    },
    {
      columna: "precio_referencia",
      etiqueta: "Precio de referencia interno (RD$)",
      tipo: "dinero",
      ancho: "medio",
    },
    {
      columna: "publico",
      etiqueta: "Sale en la portada",
      tipo: "si-no",
      ancho: "medio",
    },
    { columna: "activo", etiqueta: "Activa", tipo: "si-no", ancho: "medio" },
    { columna: "orden", etiqueta: "Orden", tipo: "numero", ancho: "medio" },
  ],
  trabajo: [
    {
      columna: "id",
      etiqueta: "Código",
      tipo: "id",
      requerido: true,
      soloAlCrear: true,
      ancho: "medio",
      ayuda: "Sale en el enlace: 402visionstudios.com/#codigo",
    },
    {
      columna: "tipo",
      etiqueta: "Filtro",
      tipo: "opcion",
      requerido: true,
      opciones: op(TIPOS_TRABAJO, TIPO_TRABAJO_LABEL),
      ancho: "medio",
    },
    {
      columna: "cliente",
      etiqueta: "Cliente",
      tipo: "texto",
      requerido: true,
      ancho: "medio",
    },
    {
      columna: "obra",
      etiqueta: "Qué es",
      tipo: "texto",
      requerido: true,
      ancho: "medio",
    },
    {
      columna: "donde",
      etiqueta: "Lugar y año",
      tipo: "texto",
      ancho: "medio",
    },
    { columna: "titulo", etiqueta: "Titular", tipo: "texto", ancho: "medio" },
    { columna: "resumen", etiqueta: "Resumen", tipo: "largo" },
    {
      columna: "hecho",
      etiqueta: "Qué hicimos",
      tipo: "lineas",
      ayuda: "Un punto por línea.",
    },
    {
      columna: "video_local",
      etiqueta: "Video",
      tipo: "texto",
      subida: "video",
      ayuda: "Sube un MP4 vertical (menos de 50 MB) o pega la dirección.",
    },
    {
      columna: "video_remoto",
      etiqueta: "Video (enlace de respaldo)",
      tipo: "url",
      ancho: "medio",
    },
    {
      columna: "poster",
      etiqueta: "Imagen de espera",
      tipo: "texto",
      subida: "imagen",
      ayuda: "La que se ve mientras carga el video.",
    },
    {
      columna: "sonido",
      etiqueta: "El video tiene sonido",
      tipo: "si-no",
      ancho: "medio",
    },
    {
      columna: "vivo",
      etiqueta: "Enlace en vivo",
      tipo: "texto",
      ayuda: "La app o página real. Se muestra dentro de un teléfono.",
    },
    {
      columna: "nota_vivo",
      etiqueta: "Aviso bajo el enlace en vivo",
      tipo: "texto",
    },
    {
      columna: "lienzo",
      etiqueta: "Dibujo si no hay video",
      tipo: "opcion",
      opciones: [
        ["marca", "Logo"],
        ["estudio", "Pantalla del Estudio"],
        ["web", "Página en vivo"],
      ],
      ancho: "medio",
    },
    { columna: "orden", etiqueta: "Orden", tipo: "numero", ancho: "medio" },
    {
      columna: "visible",
      etiqueta: "Visible en la portada",
      tipo: "si-no",
      ancho: "medio",
    },
    {
      columna: "destacado",
      etiqueta: "Es el destacado",
      tipo: "si-no",
      ancho: "medio",
      ayuda: "Solo uno: el primero de la vitrina.",
    },
    {
      columna: "en_destacado",
      etiqueta: "Se ve dentro del destacado",
      tipo: "si-no",
      ancho: "medio",
      ayuda: "No se repite en la rejilla de «Todo».",
    },
    {
      columna: "cifras",
      etiqueta: "Cifras del destacado",
      tipo: "cifras",
      ayuda: "Una por línea: «4 | toques para apartar».",
    },
    {
      columna: "pantallas",
      etiqueta: "Pantallas del teléfono destacado",
      tipo: "pantallas",
      ayuda:
        "Una por línea: «La app | vivo | leyenda» o «El anuncio | gallery-anuncio | leyenda».",
    },
    {
      columna: "fondo_local",
      etiqueta: "Video de fondo",
      tipo: "texto",
      subida: "video",
    },
    {
      columna: "fondo_remoto",
      etiqueta: "Video de fondo (enlace)",
      tipo: "url",
      ancho: "medio",
    },
  ],
  app: [
    { columna: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
    { columna: "url", etiqueta: "Dirección", tipo: "texto" },
    {
      columna: "tipo",
      etiqueta: "Tipo",
      tipo: "opcion",
      requerido: true,
      opciones: op(TIPOS_APP, TIPO_APP_LABEL),
      ancho: "medio",
    },
    {
      columna: "estado",
      etiqueta: "Estado",
      tipo: "opcion",
      requerido: true,
      opciones: op(ESTADOS_APP, ESTADO_APP_LABEL),
      ancho: "medio",
    },
    {
      columna: "cliente_id",
      etiqueta: "Cliente",
      tipo: "opcion",
      fuente: "clientes",
      ancho: "medio",
    },
    {
      columna: "mensualidad",
      etiqueta: "Mensualidad (RD$)",
      tipo: "dinero",
      ancho: "medio",
    },
    {
      columna: "hosting",
      etiqueta: "Dónde vive",
      tipo: "texto",
      ancho: "medio",
      ayuda: "Netlify, Claude, Oracle…",
    },
    { columna: "repo", etiqueta: "Código", tipo: "texto", ancho: "medio" },
    { columna: "orden", etiqueta: "Orden", tipo: "numero", ancho: "medio" },
    { columna: "notas", etiqueta: "Notas", tipo: "largo" },
  ],
}

/** Valores iniciales de un registro nuevo (lo que el formulario muestra vacío). */
export const NUEVO: Partial<Record<Entidad, Record<string, unknown>>> = {
  prospecto: { estado: "nuevo" },
  cliente: { estado: "activo", ciudad: "Santiago de los Caballeros" },
  proyecto: { etapa: "intake", cerrado: false },
  entregable: { estado: "revision", visible_cliente: true },
  cobro: { tipo: "proyecto", cancelado: false },
  oferta: {
    categoria: "otro",
    unidad: "pago único",
    publico: false,
    activo: true,
    orden: 100,
  },
  trabajo: {
    tipo: "app",
    visible: true,
    destacado: false,
    en_destacado: false,
    sonido: false,
    orden: 100,
    donde: "Santiago, 2026",
  },
  app: { tipo: "pagina", estado: "activo", orden: 100 },
}

// ---------------------------------------------------------------------------
// Conversión de lo que llega del formulario a lo que se guarda.
// ---------------------------------------------------------------------------

export class CampoInvalido extends Error {}

const SLUG = /^[a-z0-9-]{2,60}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const FECHA = /^\d{4}-\d{2}-\d{2}$/

/** Convierte un valor del formulario al valor de la columna, o lanza CampoInvalido. */
export function convertir(campo: Campo, bruto: unknown): unknown {
  const texto = typeof bruto === "string" ? bruto.trim() : bruto
  const vacio = texto === undefined || texto === null || texto === ""
  const max = campo.max ?? (campo.tipo === "largo" ? 4000 : 400)

  if (campo.tipo === "si-no")
    return bruto === true || bruto === "true" || bruto === "on"

  if (vacio) {
    if (campo.requerido) throw new CampoInvalido(`Falta «${campo.etiqueta}».`)
    switch (campo.tipo) {
      case "numero":
      case "dinero":
      case "fecha":
      case "url":
      case "correo":
        return null
      case "opcion":
        return campo.fuente || campo.columna === "lienzo" ? null : ""
      case "lineas":
        return []
      case "cifras":
      case "pantallas":
        return []
      default:
        return ""
    }
  }

  switch (campo.tipo) {
    case "numero":
    case "dinero": {
      const n = Number(String(texto).replace(/[,\s]|RD\$/gi, ""))
      if (!Number.isFinite(n) || n < 0)
        throw new CampoInvalido(`«${campo.etiqueta}» debe ser un número.`)
      return campo.tipo === "numero" ? Math.round(n) : Math.round(n * 100) / 100
    }
    case "fecha":
      if (typeof texto !== "string" || !FECHA.test(texto))
        throw new CampoInvalido(`«${campo.etiqueta}» no es una fecha.`)
      return texto
    case "id":
      if (typeof texto !== "string" || !SLUG.test(texto))
        throw new CampoInvalido(
          `«${campo.etiqueta}» solo lleva minúsculas, números y guiones.`
        )
      return texto
    case "correo": {
      const correo = String(texto).toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
        throw new CampoInvalido(`«${campo.etiqueta}» no es un correo.`)
      return correo
    }
    case "url": {
      const url = String(texto)
      if (!/^(https?:\/\/|\/)/.test(url))
        throw new CampoInvalido(
          `«${campo.etiqueta}» debe empezar con https:// o con /.`
        )
      return url.slice(0, 1000)
    }
    case "opcion": {
      const valor = String(texto)
      if (campo.fuente) {
        if (campo.fuente === "ofertas" ? !SLUG.test(valor) : !UUID.test(valor))
          throw new CampoInvalido(`«${campo.etiqueta}» no es válido.`)
        return valor
      }
      if (campo.opciones && !campo.opciones.some(([v]) => v === valor))
        throw new CampoInvalido(`«${campo.etiqueta}» no es una opción válida.`)
      return valor
    }
    case "lineas":
      return lineas(texto)
        .map((l) => l.slice(0, 300))
        .slice(0, 30)
    case "cifras":
      return lineas(texto)
        .map((l) => l.split("|").map((x) => x.trim()))
        .filter((p) => p[0] && p[1])
        .map((p) => [p[0]!.slice(0, 20), p[1]!.slice(0, 80)])
        .slice(0, 4)
    case "pantallas":
      return lineas(texto)
        .map((l) => l.split("|").map((x) => x.trim()))
        .filter((p) => p[0] && p[1])
        .map((p) =>
          p[1] === "vivo"
            ? {
                etiqueta: p[0]!.slice(0, 30),
                vivo: true,
                leyenda: (p[2] ?? "").slice(0, 160),
              }
            : {
                etiqueta: p[0]!.slice(0, 30),
                ver: p[1]!.slice(0, 60),
                leyenda: (p[2] ?? "").slice(0, 160),
              }
        )
        .slice(0, 5)
    default:
      return String(texto).slice(0, max)
  }
}

function lineas(v: unknown): string[] {
  const base = Array.isArray(v) ? v.map(String) : String(v).split(/\r?\n/)
  return base.map((l) => l.trim()).filter(Boolean)
}

/** Para pintar en el formulario un valor guardado (listas y JSON como texto). */
export function aTexto(campo: Campo, valor: unknown): string {
  if (valor === null || valor === undefined) return ""
  if (campo.tipo === "lineas" && Array.isArray(valor)) return valor.join("\n")
  if (campo.tipo === "cifras" && Array.isArray(valor))
    return valor.map((p) => (Array.isArray(p) ? p.join(" | ") : "")).join("\n")
  if (campo.tipo === "pantallas" && Array.isArray(valor))
    return valor
      .map((p) => {
        const o = (p ?? {}) as {
          etiqueta?: string
          vivo?: boolean
          ver?: string
          leyenda?: string
        }
        return [
          o.etiqueta ?? "",
          o.vivo ? "vivo" : (o.ver ?? ""),
          o.leyenda ?? "",
        ].join(" | ")
      })
      .join("\n")
  return String(valor)
}

/** Lo que el servidor guarda: solo columnas conocidas, convertidas. */
export function limpiarRegistro(
  entidad: Entidad,
  datos: Record<string, unknown>,
  { creando }: { creando: boolean }
): Record<string, unknown> {
  const fila: Record<string, unknown> = {}
  for (const campo of CAMPOS[entidad]) {
    if (campo.soloAlCrear && !creando) continue
    fila[campo.columna] = convertir(campo, datos[campo.columna])
  }
  return fila
}

/** Pasa un registro (camelCase) a columnas (snake_case) para el formulario. */
export function aColumnas(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const fila: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if ((k === "video" || k === "fondo") && v && typeof v === "object") {
      const f = v as { local?: string | null; remoto?: string | null }
      fila[`${k}_local`] = f.local ?? null
      fila[`${k}_remoto`] = f.remoto ?? null
      continue
    }
    fila[k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)] = v
  }
  return fila
}
