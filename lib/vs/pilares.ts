/** Los servicios protagonistas de la portada (las demás ofertas salen del panel). */
export type Pilar = {
  id: string
  ancla: string
  rotulo: string
  nombre: string
  gancho: string
  puntos: string[]
  servicio: string
  accion: string
}

export const PILARES: Pilar[] = [
  {
    id: "videos",
    ancla: "videos",
    rotulo: "01 · Video",
    nombre: "Videos promocionales",
    gancho:
      "Tu negocio contado por gente que habla como tus clientes. Videos verticales listos para Instagram, TikTok y estados de WhatsApp.",
    puntos: ["Guion con gancho", "Personajes y voces", "Subtítulos y música", "Formato 9:16 y 1:1"],
    servicio: "Video y foto publicitaria",
    accion: "Quiero un video así",
  },
  {
    id: "influencer",
    ancla: "influencer",
    rotulo: "02 · Vision Influencer",
    nombre: "Una influencer para tu marca",
    gancho:
      "Creamos el personaje de tu negocio: la misma cara siempre, su voz, su estilo y contenido cada semana. Sin depender de nadie ni de su agenda.",
    puntos: ["Personaje propio", "Mismo rostro siempre", "Contenido semanal", "Cuenta lista para crecer"],
    servicio: "Vision Influencer",
    accion: "Quiero mi influencer",
  },
  {
    id: "apps",
    ancla: "trabajo",
    rotulo: "03 · Apps web",
    nombre: "Apps y páginas a la medida",
    gancho:
      "Turnos, pedidos, catálogos y reservas en el teléfono de tus clientes. Primero entendemos cómo funciona tu negocio; después la programamos desde cero. Nada de plantillas.",
    puntos: ["Reservas y turnos", "Pedidos por enlace", "Panel para el dueño", "Mantenimiento"],
    servicio: "Apps y páginas",
    accion: "Quiero mi app",
  },
  {
    id: "marca",
    ancla: "servicios",
    rotulo: "04 · Marca",
    nombre: "Identidad y piezas que venden",
    gancho:
      "Logo, colores, tipografía y las piezas del día a día. Que tu negocio se vea como lo que es, desde cero o renovado.",
    puntos: ["Logo y sistema", "Perfil listo para vender", "Piezas para redes", "Rebranding"],
    servicio: "Identidad de marca",
    accion: "Quiero mi marca",
  },
]

/** Los videos promocionales hechos para negocios. */
export const PROMOS = [
  {
    id: "ramon",
    negocio: "Colmado de Don Ramón",
    titulo: "«Mi colmado tiene app»",
    src: "/videos/promos/ramon-v3.mp4",
    poster: "/videos/promos/ramon-v3.jpg",
  },
  {
    id: "junior",
    negocio: "Car wash de Junior",
    titulo: "«Antes perdía citas»",
    src: "/videos/promos/junior-v3.mp4",
    poster: "/videos/promos/junior-v3.jpg",
  },
  {
    id: "bizcochos",
    negocio: "Repostería de Carla",
    titulo: "«Pedí mi bizcocho sin escribirle a nadie»",
    src: "/videos/promos/reposteria-v3.mp4",
    poster: "/videos/promos/reposteria-v3.jpg",
  },
] as const
