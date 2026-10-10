/**
 * Radiografía rápida a partir del Master Intake. No inventa nada: mide qué tan
 * completa y concreta está la información que dio el cliente y separa los
 * hechos (lo que dijo) de las hipótesis (lo que Vision Studios supone).
 */
import type { Cliente } from "./types"

export type Puntaje = { etiqueta: string; valor: number; nota: string }
export type Radiografia = {
  puntajes: Puntaje[]
  problema: string
  recomendacion: string
  ofertaSugerida: string
  hechos: string[]
  hipotesis: string[]
  completo: number
}

/** 0 vacío · 1 vago · 2 algo concreto · 3 concreto y con detalle. */
export function puntuar(texto: string): number {
  const t = texto.trim()
  if (!t) return 0
  const palabras = t.split(/\s+/).length
  const concreto = /\d|rd\$|\$|%|clientes|semana|mes|día|precio/i.test(t)
  if (palabras < 4) return 1
  if (palabras >= 12 && concreto) return 3
  return 2
}

export function radiografiaDe(
  c: Pick<Cliente, "oferta" | "audiencia" | "enlace" | "prueba" | "objetivo" | "obstaculo" | "materiales" | "rangoPrecio">
): Radiografia {
  const oferta = puntuar(c.oferta)
  const presencia = c.enlace.trim() ? (/instagram|google|\.com|\.do|http|www/i.test(c.enlace) ? 3 : 2) : 0
  const prueba = puntuar(c.prueba)
  const objetivo = puntuar(c.objetivo)

  let problema: string
  let recomendacion: string
  let ofertaSugerida: string
  if (oferta < 2) {
    problema = "La oferta no está clara: no se entiende rápido qué vende ni por qué elegirlo."
    recomendacion = "Aterrizar una promesa concreta antes de publicar o invertir en pauta."
    ofertaSugerida = "radiografia"
  } else if (presencia < 2) {
    problema = "No hay presencia verificable: el cliente no tiene dónde comprobar que el negocio existe."
    recomendacion = "Montar una presencia mínima que lleve a escribir por WhatsApp."
    ofertaSugerida = "pagina-signal"
  } else if (prueba < 2) {
    problema = "Falta prueba: no hay fotos, casos ni testimonios que respalden la promesa."
    recomendacion = "Producir piezas con trabajo real del negocio antes de vender más fuerte."
    ofertaSugerida = "pieza-que-vende"
  } else {
    problema = "La base está; falta convertir la atención en conversaciones y citas."
    recomendacion = "Una campaña con un solo llamado a la acción y un canal claro de respuesta."
    ofertaSugerida = "presencia-movimiento"
  }

  const hechos = [
    `Oferta: ${c.oferta.trim() || "sin definir"}`,
    `Audiencia: ${c.audiencia.trim() || "sin definir"}`,
    `Presencia: ${c.enlace.trim() || "sin enlace verificado"}`,
    `Prueba: ${c.prueba.trim() || "no confirmada"}`,
    `Objetivo: ${c.objetivo.trim() || "por confirmar"}`,
    `Obstáculo: ${c.obstaculo.trim() || "por confirmar"}`,
  ]
  const hipotesis = [
    `Hipótesis: ${problema}`,
    "Hipótesis: la primera campaña debe tener un solo llamado a la acción y un canal claro de respuesta.",
    "Hipótesis: en el piloto, medir conversaciones y citas sirve más que perseguir alcance.",
  ]
  const campos = [c.oferta, c.audiencia, c.enlace, c.prueba, c.objetivo, c.obstaculo, c.materiales, c.rangoPrecio]
  const completo = Math.round((campos.filter((x) => x.trim()).length / campos.length) * 100)

  return {
    puntajes: [
      { etiqueta: "Oferta clara", valor: oferta, nota: "Se entiende qué vende y por qué elegirlo" },
      { etiqueta: "Presencia", valor: presencia, nota: "Hay dónde verlo: Instagram, web o Google" },
      { etiqueta: "Prueba", valor: prueba, nota: "Fotos, casos o testimonios reales" },
      { etiqueta: "Objetivo", valor: objetivo, nota: "Una meta concreta y medible" },
    ],
    problema,
    recomendacion,
    ofertaSugerida,
    hechos,
    hipotesis,
    completo,
  }
}
