/**
 * Tipos y catálogos de la página maestra (tablas vs_* en Supabase). Este archivo
 * no toca el servidor: lo usan igual las páginas, los formularios y las pruebas.
 */

export const ETAPAS = [
  "intake",
  "diagnostico",
  "estrategia",
  "produccion",
  "revision",
  "aprobacion",
  "entrega",
] as const
export type Etapa = (typeof ETAPAS)[number]
export const ETAPA_LABEL: Record<Etapa, string> = {
  intake: "Intake",
  diagnostico: "Diagnóstico",
  estrategia: "Estrategia",
  produccion: "Producción",
  revision: "Revisión interna",
  aprobacion: "Aprobación del cliente",
  entrega: "Entrega",
}
/** Cómo se le dice al cliente en qué va su proyecto. */
export const ETAPA_CLIENTE: Record<Etapa, string> = {
  intake: "Recibimos tu información",
  diagnostico: "Estamos estudiando tu negocio",
  estrategia: "Preparamos la propuesta",
  produccion: "En producción",
  revision: "Revisión de calidad",
  aprobacion: "Esperando tu aprobación",
  entrega: "Entregado",
}

export const ESTADOS_PROSPECTO = [
  "nuevo",
  "contactado",
  "descubrimiento",
  "propuesta",
  "deposito",
  "ganado",
  "perdido",
] as const
export type EstadoProspecto = (typeof ESTADOS_PROSPECTO)[number]
export const ESTADO_PROSPECTO_LABEL: Record<EstadoProspecto, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  descubrimiento: "Descubrimiento",
  propuesta: "Propuesta enviada",
  deposito: "Depósito pendiente",
  ganado: "Ganado",
  perdido: "Perdido",
}

export const SECTORES = [
  "Barbería / belleza",
  "Comida / restaurante",
  "Comercio local",
  "Servicio profesional",
  "Otro",
] as const

export const METODOS_PAGO = [
  "popular",
  "qik",
  "banreservas",
  "efectivo",
  "transferencia",
  "otro",
] as const
export type MetodoPago = (typeof METODOS_PAGO)[number]
export const METODO_LABEL: Record<MetodoPago, string> = {
  popular: "Popular",
  qik: "Qik",
  banreservas: "Banreservas",
  efectivo: "Efectivo",
  transferencia: "Otra transferencia",
  otro: "Otro",
}

export const ESTADOS_ENTREGABLE = ["borrador", "revision", "aprobado", "cambios"] as const
export type EstadoEntregable = (typeof ESTADOS_ENTREGABLE)[number]
export const ENTREGABLE_LABEL: Record<EstadoEntregable, string> = {
  borrador: "Borrador (no lo ve el cliente)",
  revision: "Para revisar",
  aprobado: "Aprobado",
  cambios: "Pidió cambios",
}

export const TIPOS_COBRO = ["proyecto", "mensualidad", "terceros", "otro"] as const
export type TipoCobro = (typeof TIPOS_COBRO)[number]
export const TIPO_COBRO_LABEL: Record<TipoCobro, string> = {
  proyecto: "Proyecto",
  mensualidad: "Mensualidad",
  terceros: "Costos de terceros",
  otro: "Otro",
}

export const ESTADOS_PAGO = ["pendiente", "confirmado", "rechazado"] as const
export type EstadoPago = (typeof ESTADOS_PAGO)[number]

export const TIPOS_APP = ["app", "pagina", "sistema", "artifact", "otro"] as const
export const TIPO_APP_LABEL: Record<(typeof TIPOS_APP)[number], string> = {
  app: "App",
  pagina: "Página",
  sistema: "Sistema",
  artifact: "Artifact de Claude",
  otro: "Otro",
}
export const ESTADOS_APP = ["activo", "desarrollo", "pausa", "archivado"] as const
export const ESTADO_APP_LABEL: Record<(typeof ESTADOS_APP)[number], string> = {
  activo: "En línea",
  desarrollo: "En desarrollo",
  pausa: "En pausa",
  archivado: "Archivado",
}

export const CATEGORIAS_OFERTA = [
  "diagnostico",
  "apps",
  "marca",
  "video",
  "software",
  "contenido",
  "otro",
] as const
export const CATEGORIA_LABEL: Record<(typeof CATEGORIAS_OFERTA)[number], string> = {
  diagnostico: "Diagnóstico",
  apps: "Apps y páginas",
  marca: "Marca",
  video: "Video y foto",
  software: "Software",
  contenido: "Contenido",
  otro: "Otro",
}
export const UNIDADES_OFERTA = ["pago único", "mensual", "por pieza"] as const

export const TIPOS_TRABAJO = ["app", "video", "marca"] as const
export type TipoTrabajo = (typeof TIPOS_TRABAJO)[number]
export const TIPO_TRABAJO_LABEL: Record<TipoTrabajo, string> = {
  app: "Apps y páginas",
  video: "Video",
  marca: "Marca",
}

export type Pantalla = {
  etiqueta: string
  vivo?: boolean
  ver?: string
  leyenda?: string
}

/** Un trabajo del catálogo, tal como lo dibuja la portada. */
export type Trabajo = {
  id: string
  tipo: TipoTrabajo
  cliente: string
  obra: string
  donde: string
  titulo: string | null
  resumen: string
  hecho: string[]
  cifras: [string, string][]
  vivo: string | null
  notaVivo: string | null
  video: { local: string | null; remoto: string | null } | null
  poster: string | null
  fondo: { local: string | null; remoto: string | null } | null
  lienzo: "marca" | "estudio" | "web" | null
  sonido: boolean
  destacado: boolean
  enDestacado: boolean
  pantallas: Pantalla[]
  visible: boolean
  orden: number
}

export type Oferta = {
  id: string
  nombre: string
  categoria: (typeof CATEGORIAS_OFERTA)[number]
  resumen: string
  incluye: string[]
  precioPublico: number | null
  precioReferencia: number | null
  unidad: (typeof UNIDADES_OFERTA)[number]
  publico: boolean
  activo: boolean
  orden: number
}

export type Cliente = {
  id: string
  nombre: string
  contacto: string
  telefono: string
  email: string | null
  sector: string
  ciudad: string
  enlace: string
  oferta: string
  audiencia: string
  prueba: string
  rangoPrecio: string
  objetivo: string
  obstaculo: string
  tono: string
  materiales: string
  notasInternas: string
  estado: "activo" | "pausa" | "cerrado"
  createdAt: string
}

export type Prospecto = {
  id: string
  negocio: string
  contacto: string
  telefono: string
  instagram: string
  sector: string
  ofertaId: string | null
  valor: number | null
  estado: EstadoProspecto
  proximaAccion: string
  fechaProxima: string | null
  nota: string
  fuente: "web" | "manual"
  datos: Record<string, string>
  clienteId: string | null
  createdAt: string
}

export type Proyecto = {
  id: string
  clienteId: string
  nombre: string
  ofertaId: string | null
  etapa: Etapa
  fechaEntrega: string | null
  notaCliente: string
  notasInternas: string
  cerrado: boolean
  createdAt: string
}

export type Entregable = {
  id: string
  proyectoId: string
  titulo: string
  enlace: string
  descripcion: string
  estado: EstadoEntregable
  visibleCliente: boolean
  comentarioCliente: string
  respondidoAt: string | null
  createdAt: string
}

export type Cobro = {
  id: string
  clienteId: string
  proyectoId: string | null
  ofertaId: string | null
  concepto: string
  tipo: TipoCobro
  precio: number
  deposito: number
  vencimiento: string | null
  nota: string
  cancelado: boolean
  createdAt: string
}

export type Pago = {
  id: string
  tipo: "cobro" | "creditos"
  cobroId: string | null
  clienteId: string | null
  userId: string | null
  email: string | null
  monto: number
  creditos: number | null
  metodo: MetodoPago
  referencia: string
  estado: EstadoPago
  reportadoPor: "cliente" | "admin"
  nota: string
  createdAt: string
  revisadoAt: string | null
}

export type AppRegistro = {
  id: string
  nombre: string
  url: string
  tipo: (typeof TIPOS_APP)[number]
  clienteId: string | null
  estado: (typeof ESTADOS_APP)[number]
  hosting: string
  repo: string
  mensualidad: number | null
  notas: string
  orden: number
}
