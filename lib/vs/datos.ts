/**
 * Lectura de la base para la página maestra. Solo se importa desde código de
 * servidor: usa la llave de servicio, así que cada función que expone datos de
 * un cliente recibe ya verificado quién pide.
 */
import { createSupabaseAdmin } from "@/lib/supabase/admin"

import { normalizarAjustes } from "./ajustes"
import type { Ajustes } from "./ajustes"
import type {
  AppRegistro,
  Cliente,
  Cobro,
  Entregable,
  Oferta,
  Pago,
  Pantalla,
  Prospecto,
  Proyecto,
  Trabajo,
} from "./types"

type Fila = Record<string, unknown>
const s = (v: unknown) => (typeof v === "string" ? v : v === null || v === undefined ? "" : String(v))
const sn = (v: unknown) => (typeof v === "string" && v !== "" ? v : null)
const n = (v: unknown) => (v === null || v === undefined || v === "" ? 0 : Number(v))
const nn = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v))
const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : [])

export function aTrabajo(r: Fila): Trabajo {
  const videoLocal = sn(r.video_local)
  const videoRemoto = sn(r.video_remoto)
  const fondoLocal = sn(r.fondo_local)
  const fondoRemoto = sn(r.fondo_remoto)
  const cifras = Array.isArray(r.cifras)
    ? (r.cifras as unknown[]).filter(Array.isArray).map((p) => [s((p as unknown[])[0]), s((p as unknown[])[1])] as [string, string])
    : []
  const pantallas = Array.isArray(r.pantallas)
    ? (r.pantallas as unknown[])
        .filter((p): p is Fila => !!p && typeof p === "object")
        .map((p): Pantalla => ({
          etiqueta: s(p.etiqueta),
          ...(p.vivo ? { vivo: true } : {}),
          ...(p.ver ? { ver: s(p.ver) } : {}),
          ...(p.leyenda ? { leyenda: s(p.leyenda) } : {}),
        }))
    : []
  const lienzo = r.lienzo === "marca" || r.lienzo === "estudio" || r.lienzo === "web" ? r.lienzo : null
  return {
    id: s(r.id),
    tipo: r.tipo === "video" || r.tipo === "marca" ? r.tipo : "app",
    cliente: s(r.cliente),
    obra: s(r.obra),
    donde: s(r.donde),
    titulo: sn(r.titulo),
    resumen: s(r.resumen),
    hecho: arr(r.hecho),
    cifras,
    vivo: sn(r.vivo),
    notaVivo: sn(r.nota_vivo),
    video: videoLocal || videoRemoto ? { local: videoLocal, remoto: videoRemoto } : null,
    poster: sn(r.poster),
    fondo: fondoLocal || fondoRemoto ? { local: fondoLocal, remoto: fondoRemoto } : null,
    lienzo,
    sonido: r.sonido === true,
    destacado: r.destacado === true,
    enDestacado: r.en_destacado === true,
    pantallas,
    visible: r.visible !== false,
    orden: n(r.orden),
  }
}

export function aOferta(r: Fila): Oferta {
  return {
    id: s(r.id),
    nombre: s(r.nombre),
    categoria: s(r.categoria) as Oferta["categoria"],
    resumen: s(r.resumen),
    incluye: arr(r.incluye),
    precioPublico: nn(r.precio_publico),
    precioReferencia: nn(r.precio_referencia),
    unidad: s(r.unidad) as Oferta["unidad"],
    publico: r.publico === true,
    activo: r.activo !== false,
    orden: n(r.orden),
  }
}

export function aCliente(r: Fila): Cliente {
  return {
    id: s(r.id),
    nombre: s(r.nombre),
    contacto: s(r.contacto),
    telefono: s(r.telefono),
    email: sn(r.email),
    sector: s(r.sector),
    ciudad: s(r.ciudad),
    enlace: s(r.enlace),
    oferta: s(r.oferta),
    audiencia: s(r.audiencia),
    prueba: s(r.prueba),
    rangoPrecio: s(r.rango_precio),
    objetivo: s(r.objetivo),
    obstaculo: s(r.obstaculo),
    tono: s(r.tono),
    materiales: s(r.materiales),
    notasInternas: s(r.notas_internas),
    estado: (s(r.estado) || "activo") as Cliente["estado"],
    createdAt: s(r.created_at),
  }
}

export function aProspecto(r: Fila): Prospecto {
  const datos: Record<string, string> = {}
  if (r.datos && typeof r.datos === "object" && !Array.isArray(r.datos))
    for (const [k, v] of Object.entries(r.datos as Fila)) datos[k] = s(v)
  return {
    id: s(r.id),
    negocio: s(r.negocio),
    contacto: s(r.contacto),
    telefono: s(r.telefono),
    instagram: s(r.instagram),
    sector: s(r.sector),
    ofertaId: sn(r.oferta_id),
    valor: nn(r.valor),
    estado: (s(r.estado) || "nuevo") as Prospecto["estado"],
    proximaAccion: s(r.proxima_accion),
    fechaProxima: sn(r.fecha_proxima),
    nota: s(r.nota),
    fuente: r.fuente === "web" ? "web" : "manual",
    datos,
    clienteId: sn(r.cliente_id),
    createdAt: s(r.created_at),
  }
}

export function aProyecto(r: Fila): Proyecto {
  return {
    id: s(r.id),
    clienteId: s(r.cliente_id),
    nombre: s(r.nombre),
    ofertaId: sn(r.oferta_id),
    etapa: (s(r.etapa) || "intake") as Proyecto["etapa"],
    fechaEntrega: sn(r.fecha_entrega),
    notaCliente: s(r.nota_cliente),
    notasInternas: s(r.notas_internas),
    cerrado: r.cerrado === true,
    createdAt: s(r.created_at),
  }
}

export function aEntregable(r: Fila): Entregable {
  return {
    id: s(r.id),
    proyectoId: s(r.proyecto_id),
    titulo: s(r.titulo),
    enlace: s(r.enlace),
    descripcion: s(r.descripcion),
    estado: (s(r.estado) || "revision") as Entregable["estado"],
    visibleCliente: r.visible_cliente !== false,
    comentarioCliente: s(r.comentario_cliente),
    respondidoAt: sn(r.respondido_at),
    createdAt: s(r.created_at),
  }
}

export function aCobro(r: Fila): Cobro {
  return {
    id: s(r.id),
    clienteId: s(r.cliente_id),
    proyectoId: sn(r.proyecto_id),
    ofertaId: sn(r.oferta_id),
    concepto: s(r.concepto),
    tipo: (s(r.tipo) || "proyecto") as Cobro["tipo"],
    precio: n(r.precio),
    deposito: n(r.deposito),
    vencimiento: sn(r.vencimiento),
    nota: s(r.nota),
    cancelado: r.cancelado === true,
    createdAt: s(r.created_at),
  }
}

export function aPago(r: Fila): Pago {
  return {
    id: s(r.id),
    tipo: r.tipo === "creditos" ? "creditos" : "cobro",
    cobroId: sn(r.cobro_id),
    clienteId: sn(r.cliente_id),
    userId: sn(r.user_id),
    email: sn(r.email),
    monto: n(r.monto),
    creditos: nn(r.creditos),
    metodo: (s(r.metodo) || "transferencia") as Pago["metodo"],
    referencia: s(r.referencia),
    estado: (s(r.estado) || "pendiente") as Pago["estado"],
    reportadoPor: r.reportado_por === "admin" ? "admin" : "cliente",
    nota: s(r.nota),
    createdAt: s(r.created_at),
    revisadoAt: sn(r.revisado_at),
  }
}

export function aApp(r: Fila): AppRegistro {
  return {
    id: s(r.id),
    nombre: s(r.nombre),
    url: s(r.url),
    tipo: (s(r.tipo) || "otro") as AppRegistro["tipo"],
    clienteId: sn(r.cliente_id),
    estado: (s(r.estado) || "activo") as AppRegistro["estado"],
    hosting: s(r.hosting),
    repo: s(r.repo),
    mensualidad: nn(r.mensualidad),
    notas: s(r.notas),
    orden: n(r.orden),
  }
}

const db = () => createSupabaseAdmin()

export async function leerAjustes(): Promise<Ajustes> {
  const { data } = await db().from("vs_ajustes").select("datos").eq("id", 1).maybeSingle()
  return normalizarAjustes(data?.datos)
}

/** Lo que ve cualquiera en la portada. Si la base falla, la portada sigue en pie. */
export async function sitioPublico(): Promise<{ ajustes: Ajustes; trabajos: Trabajo[]; ofertas: Oferta[] }> {
  try {
    const cliente = db()
    const [ajustes, trabajos, ofertas] = await Promise.all([
      cliente.from("vs_ajustes").select("datos").eq("id", 1).maybeSingle(),
      cliente.from("vs_trabajos").select("*").eq("visible", true).order("orden").order("created_at"),
      cliente.from("vs_ofertas").select("*").eq("publico", true).eq("activo", true).order("orden"),
    ])
    return {
      ajustes: normalizarAjustes(ajustes.data?.datos),
      trabajos: (trabajos.data ?? []).map(aTrabajo),
      ofertas: (ofertas.data ?? []).map(aOferta),
    }
  } catch {
    return { ajustes: normalizarAjustes(null), trabajos: [], ofertas: [] }
  }
}

export type Panel = {
  ajustes: Ajustes
  clientes: Cliente[]
  prospectos: Prospecto[]
  proyectos: Proyecto[]
  entregables: Entregable[]
  cobros: Cobro[]
  pagos: Pago[]
  ofertas: Oferta[]
  trabajos: Trabajo[]
  apps: AppRegistro[]
}

/** Todo el negocio, para el panel del dueño. Son pocas filas: se trae de una vez. */
export async function leerPanel(): Promise<Panel> {
  const c = db()
  const [aj, cl, pr, py, en, co, pa, of, tr, ap] = await Promise.all([
    c.from("vs_ajustes").select("datos").eq("id", 1).maybeSingle(),
    c.from("vs_clientes").select("*").order("created_at", { ascending: false }),
    c.from("vs_prospectos").select("*").order("fecha_proxima", { ascending: true, nullsFirst: false }),
    c.from("vs_proyectos").select("*").order("updated_at", { ascending: false }),
    c.from("vs_entregables").select("*").order("created_at", { ascending: false }),
    c.from("vs_cobros").select("*").order("created_at", { ascending: false }),
    c.from("vs_pagos").select("*").order("created_at", { ascending: false }).limit(500),
    c.from("vs_ofertas").select("*").order("orden"),
    c.from("vs_trabajos").select("*").order("orden"),
    c.from("vs_apps").select("*").order("orden"),
  ])
  const fallo = [cl, pr, py, en, co, pa, of, tr, ap].find((r) => r.error)
  if (fallo?.error) throw new Error(`No se pudo leer la base: ${fallo.error.message}`)
  return {
    ajustes: normalizarAjustes(aj.data?.datos),
    clientes: (cl.data ?? []).map(aCliente),
    prospectos: (pr.data ?? []).map(aProspecto),
    proyectos: (py.data ?? []).map(aProyecto),
    entregables: (en.data ?? []).map(aEntregable),
    cobros: (co.data ?? []).map(aCobro),
    pagos: (pa.data ?? []).map(aPago),
    ofertas: (of.data ?? []).map(aOferta),
    trabajos: (tr.data ?? []).map(aTrabajo),
    apps: (ap.data ?? []).map(aApp),
  }
}

export type Portal = {
  ajustes: Ajustes
  cliente: Pick<Cliente, "id" | "nombre" | "contacto"> | null
  proyectos: Pick<Proyecto, "id" | "nombre" | "etapa" | "fechaEntrega" | "notaCliente" | "cerrado">[]
  entregables: Pick<Entregable, "id" | "proyectoId" | "titulo" | "enlace" | "descripcion" | "estado" | "comentarioCliente" | "respondidoAt">[]
  cobros: Cobro[]
  pagos: Pago[]
  pagosCreditos: Pago[]
  creditos: number
}

/**
 * Lo que ve un cliente en su área: solo lo suyo y solo los campos pensados para
 * él (sin notas internas). Se busca por el correo verificado de su sesión.
 */
export async function leerPortal(sesion: { userId: string; email: string }): Promise<Portal> {
  const c = db()
  const email = sesion.email.trim().toLowerCase()
  const [aj, cl, cuenta, creditos] = await Promise.all([
    c.from("vs_ajustes").select("datos").eq("id", 1).maybeSingle(),
    email ? c.from("vs_clientes").select("id, nombre, contacto").eq("email", email).maybeSingle() : Promise.resolve({ data: null }),
    c.from("accounts").select("credits").eq("user_id", sesion.userId).maybeSingle(),
    c.from("vs_pagos").select("*").eq("tipo", "creditos").eq("user_id", sesion.userId).order("created_at", { ascending: false }).limit(30),
  ])
  const base: Portal = {
    ajustes: normalizarAjustes(aj.data?.datos),
    cliente: null,
    proyectos: [],
    entregables: [],
    cobros: [],
    pagos: [],
    pagosCreditos: (creditos.data ?? []).map(aPago),
    creditos: cuenta.data ? Number(cuenta.data.credits) : 0,
  }
  if (!cl.data) return base
  const clienteId = s(cl.data.id)
  const [py, co] = await Promise.all([
    c.from("vs_proyectos").select("id, nombre, etapa, fecha_entrega, nota_cliente, cerrado").eq("cliente_id", clienteId).order("created_at", { ascending: false }),
    c.from("vs_cobros").select("*").eq("cliente_id", clienteId).eq("cancelado", false).order("created_at", { ascending: false }),
  ])
  const proyectos = (py.data ?? []).map(aProyecto)
  const cobros = (co.data ?? []).map(aCobro)
  const [en, pa] = await Promise.all([
    proyectos.length
      ? c.from("vs_entregables").select("*").in("proyecto_id", proyectos.map((p) => p.id)).eq("visible_cliente", true).neq("estado", "borrador").order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Fila[] }),
    cobros.length
      ? c.from("vs_pagos").select("*").in("cobro_id", cobros.map((x) => x.id)).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Fila[] }),
  ])
  return {
    ...base,
    cliente: { id: clienteId, nombre: s(cl.data.nombre), contacto: s(cl.data.contacto) },
    proyectos: proyectos.map(({ id, nombre, etapa, fechaEntrega, notaCliente, cerrado }) => ({ id, nombre, etapa, fechaEntrega, notaCliente, cerrado })),
    entregables: (en.data ?? []).map(aEntregable).map(({ id, proyectoId, titulo, enlace, descripcion, estado, comentarioCliente, respondidoAt }) => ({
      id, proyectoId, titulo, enlace, descripcion, estado, comentarioCliente, respondidoAt,
    })),
    cobros,
    pagos: (pa.data ?? []).map(aPago),
  }
}
