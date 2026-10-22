/** Preguntas de «¿Tú sabe' o tú no sabe'?», la trivia dominicana. */
export type Pregunta = {
  q: string
  ops: [string, string, string, string]
  ok: 0 | 1 | 2 | 3
  dato: string
  tema: "Historia" | "Comida" | "Música" | "Dichos" | "Geografía" | "Deporte" | "Cultura"
}

export const PREGUNTAS: Pregunta[] = [
  { tema: "Historia", q: "¿En qué año se proclamó la Independencia dominicana?", ops: ["1821", "1844", "1863", "1865"], ok: 1, dato: "El 27 de febrero de 1844, en la Puerta del Conde." },
  { tema: "Historia", q: "¿Qué se celebra el 16 de agosto?", ops: ["La Independencia", "El Día de la Altagracia", "La Restauración", "La Constitución"], ok: 2, dato: "La Guerra de la Restauración arrancó con el Grito de Capotillo en 1863." },
  { tema: "Historia", q: "¿Cuál de estos NO es uno de los tres Padres de la Patria?", ops: ["Duarte", "Sánchez", "Mella", "Luperón"], ok: 3, dato: "Luperón fue héroe de la Restauración, no de la Independencia." },
  { tema: "Historia", q: "¿Cómo se llamaban las hermanas asesinadas el 25 de noviembre de 1960?", ops: ["Las Mirabal", "Las Duarte", "Las Peña", "Las Brito"], ok: 0, dato: "Patria, Minerva y María Teresa. Por ellas es el Día contra la Violencia hacia la Mujer." },
  { tema: "Geografía", q: "¿Cuál es el pico más alto del Caribe?", ops: ["Loma Isabel de Torres", "Pico Duarte", "Loma Diego de Ocampo", "Pico Yaque"], ok: 1, dato: "Unos 3,087 metros, en la Cordillera Central." },
  { tema: "Geografía", q: "¿A qué ciudad le dicen «La Ciudad Corazón»?", ops: ["La Vega", "Santiago", "Moca", "San Francisco de Macorís"], ok: 1, dato: "Santiago de los Caballeros, la capital del Cibao." },
  { tema: "Geografía", q: "¿Qué monumento domina el centro de Santiago?", ops: ["El Faro a Colón", "El Monumento a los Héroes de la Restauración", "El Altar de la Patria", "La Fortaleza Ozama"], ok: 1, dato: "Lo terminaron en tiempos de Trujillo y hoy es el símbolo de la ciudad." },
  { tema: "Geografía", q: "¿Cuál es el lago de agua salada que está bajo el nivel del mar?", ops: ["Lago Enriquillo", "Laguna de Oviedo", "Lago Azuei", "Laguna Redonda"], ok: 0, dato: "Está unos 40 metros bajo el nivel del mar y tiene cocodrilos americanos." },
  { tema: "Geografía", q: "¿En qué provincia queda el Salto del Limón?", ops: ["Puerto Plata", "Samaná", "Jarabacoa", "Barahona"], ok: 1, dato: "En Las Terrenas y El Limón, Samaná. Se llega a caballo o a pie." },
  { tema: "Geografía", q: "¿Cuál es el río más largo del país?", ops: ["Ozama", "Yuna", "Yaque del Norte", "Higuamo"], ok: 2, dato: "El Yaque del Norte pasa por Santiago y nace cerca del Pico Duarte." },
  { tema: "Comida", q: "¿Qué lleva «La Bandera» dominicana?", ops: ["Arroz, habichuela y carne", "Mangú y salami", "Moro y pescado", "Sancocho y aguacate"], ok: 0, dato: "El almuerzo de cada día, y si hay aguacate, mejor." },
  { tema: "Comida", q: "¿Qué son «los tres golpes»?", ops: ["Un merengue de Fernando Villalona", "Mangú con salami, queso frito y huevo", "Tres tragos de mamajuana", "Una jugada de dominó"], ok: 1, dato: "El desayuno más dominicano que hay." },
  { tema: "Comida", q: "¿Qué postre se come en Semana Santa?", ops: ["Majarete", "Habichuela con dulce", "Arroz con leche", "Dulce de coco"], ok: 1, dato: "Lleva batata, leche de coco, canela y galletitas de leche." },
  { tema: "Comida", q: "¿Cómo se le dice a lo que queda pegado en el fondo del caldero?", ops: ["Concón", "Raspao", "Pegao", "Las dos primeras… y pegao también"], ok: 3, dato: "Concón en la capital, pegao en el Cibao. El mejor pedazo del arroz." },
  { tema: "Comida", q: "¿Con qué se hace el mangú?", ops: ["Yuca", "Plátano verde", "Guineo maduro", "Yautía"], ok: 1, dato: "Plátano verde hervido y majado, con cebollita roja encima." },
  { tema: "Comida", q: "¿Qué es un chimi?", ops: ["Un jugo", "Una hamburguesa de la calle", "Un dulce", "Un tipo de pan sobao"], ok: 1, dato: "Pan, carne, repollo y salsa rosada. De madrugada sabe mejor." },
  { tema: "Comida", q: "¿Qué bebida se hace con raíces y cortezas dejadas en ron, vino y miel?", ops: ["Mabí", "Mamajuana", "Morir soñando", "Ponche"], ok: 1, dato: "Cada quien tiene su receta y jura que la suya es la buena." },
  { tema: "Comida", q: "¿Qué lleva un «morir soñando»?", ops: ["Leche y jugo de naranja", "Café y ron", "Coco y piña", "Avena y canela"], ok: 0, dato: "Leche bien fría con jugo de naranja y azúcar. Rápido, antes de que se corte." },
  { tema: "Música", q: "¿Quién canta «Ojalá que llueva café»?", ops: ["Juan Luis Guerra", "Fernando Villalona", "Wilfrido Vargas", "Johnny Ventura"], ok: 0, dato: "Salió en 1989 con 4.40." },
  { tema: "Música", q: "¿A quién le dicen «El Mayimbe»?", ops: ["Anthony Santos", "Fernando Villalona", "Sergio Vargas", "Raulín Rodríguez"], ok: 1, dato: "Fernando Villalona, ídolo del merengue." },
  { tema: "Música", q: "¿Qué ritmo nació en los barrios y los colmados, tocado con güira y guitarra?", ops: ["Merengue", "Bachata", "Salve", "Son"], ok: 1, dato: "Por años la llamaron «música de amargue»; hoy es Patrimonio de la Humanidad." },
  { tema: "Música", q: "¿Qué instrumento de metal raspado lleva el merengue típico?", ops: ["Maracas", "Güira", "Pandero", "Claves"], ok: 1, dato: "Junto a la tambora y el acordeón forma el perico ripiao." },
  { tema: "Música", q: "¿A quién le dicen «El Caballo Mayor»?", ops: ["Johnny Ventura", "Toño Rosario", "Eddy Herrera", "Héctor Acosta"], ok: 0, dato: "Johnny Ventura, el que puso a bailar a medio mundo con «Patacón pisao»." },
  { tema: "Música", q: "¿Qué género urbano dominicano tiene como base un ritmo que se hizo famoso en los 2000?", ops: ["Trap", "Dembow", "Reguetón", "Mambo"], ok: 1, dato: "El dembow dominicano tiene su propio sabor, rápido y pa' la calle." },
  { tema: "Dichos", q: "Si alguien «está en olla», ¿cómo está?", ops: ["Comiendo mucho", "Sin un peso", "Muy contento", "En la cocina"], ok: 1, dato: "Pelao, limpio, sin un chele." },
  { tema: "Dichos", q: "¿Qué es un «chin»?", ops: ["Un poquito", "Un mosquito", "Un chisme", "Un apodo"], ok: 0, dato: "«Dame un chin de eso». Y si es menos, un chinchín." },
  { tema: "Dichos", q: "¿Qué significa «tirar un pique»?", ops: ["Echar un vellón", "Enojarse", "Bailar", "Correr"], ok: 1, dato: "Cuando alguien se pone bravo y se va con la cara pa'l lado." },
  { tema: "Dichos", q: "«Más pelao que…»", ops: ["un plátano", "una rodilla", "un coco", "un huevo"], ok: 1, dato: "Más pelao que rodilla de chivo: sin un peso." },
  { tema: "Dichos", q: "¿Qué es un «tíguere»?", ops: ["Un gato grande", "Alguien vivo, que se las sabe todas", "Un policía", "Un motoconchista"], ok: 1, dato: "Puede ser elogio o advertencia, según el tono." },
  { tema: "Dichos", q: "¿Qué significa «¡Qué lo que!»?", ops: ["¿Qué pasó?, ¿cómo estás?", "Estoy bravo", "No entiendo", "Vámonos"], ok: 0, dato: "El saludo más dominicano. La respuesta: «Aquí, tranquilo»." },
  { tema: "Dichos", q: "Si te dicen «ta' to'», ¿qué quiere decir?", ops: ["Todo está mal", "Todo está bien", "Está todo vendido", "Ya no hay"], ok: 1, dato: "Está todo bien. Sin preocupación." },
  { tema: "Dichos", q: "¿Qué es «una vaina»?", ops: ["Una cosa, cualquier cosa", "Una fruta", "Un baile", "Un insulto siempre"], ok: 0, dato: "La palabra más versátil del idioma: «pásame esa vaina»." },
  { tema: "Dichos", q: "¿Qué es «un motoconcho»?", ops: ["Un taxi en motor", "Un mecánico", "Una guagua", "Una carrera ilegal"], ok: 0, dato: "Moto + concho (carro público). Tres pasajeros y una funda, mínimo." },
  { tema: "Deporte", q: "¿Qué deporte es la pasión número uno en RD?", ops: ["Fútbol", "Béisbol", "Baloncesto", "Voleibol"], ok: 1, dato: "La pelota. Y en invierno, la liga se pone caliente." },
  { tema: "Deporte", q: "¿Cuál es el equipo de pelota de Santiago?", ops: ["Leones del Escogido", "Águilas Cibaeñas", "Tigres del Licey", "Gigantes del Cibao"], ok: 1, dato: "Las Águilas juegan en el Estadio Cibao." },
  { tema: "Deporte", q: "¿Qué equipo es «el Glorioso»?", ops: ["Licey", "Escogido", "Estrellas Orientales", "Toros del Este"], ok: 0, dato: "Los Tigres del Licey, el equipo con más coronas." },
  { tema: "Deporte", q: "¿Cuántas fichas tiene un juego de dominó doble seis?", ops: ["24", "28", "32", "36"], ok: 1, dato: "28 fichas, 7 por jugador cuando juegan cuatro." },
  { tema: "Deporte", q: "En dominó, ¿qué es «dar una capicúa»?", ops: ["Pasar", "Dominar con una ficha que pega por las dos puntas", "Perder la mano", "Tranque"], ok: 1, dato: "Vale puntos extra en muchas mesas, y se celebra con un buen golpe." },
  { tema: "Cultura", q: "¿Qué personaje del carnaval de La Vega lleva vejiga y careta con cuernos?", ops: ["El Diablo Cojuelo", "Roba la Gallina", "Califé", "Los Guloyas"], ok: 0, dato: "Cuidao con los vejigazos en febrero." },
  { tema: "Cultura", q: "¿Quién es la protectora del pueblo dominicano, celebrada el 21 de enero?", ops: ["La Virgen de la Altagracia", "La Virgen de las Mercedes", "Santa Bárbara", "La Virgen del Carmen"], ok: 0, dato: "Su basílica está en Higüey." },
  { tema: "Cultura", q: "¿Qué es una «guagua»?", ops: ["Un bebé", "Un autobús", "Un perro", "Un helado"], ok: 1, dato: "Y si va llena, siempre cabe uno más." },
  { tema: "Cultura", q: "¿Cuál es la moneda dominicana?", ops: ["El colón", "El peso dominicano", "El bolívar", "El balboa"], ok: 1, dato: "RD$. Al de 5 centavos le dicen «un chele»." },
  { tema: "Cultura", q: "¿Cuál es el ave nacional?", ops: ["La cigua palmera", "El papagayo", "La paloma", "El guaraguao"], ok: 0, dato: "Hace nidos comunitarios en las palmas reales." },
  { tema: "Cultura", q: "¿Cuál es la flor nacional?", ops: ["La rosa de Bayahíbe", "La caoba", "La orquídea", "El flamboyán"], ok: 0, dato: "Desde 2011. Antes era la flor de la caoba." },
]

/** Elige n preguntas al azar sin repetir. */
export function barajar<T>(lista: T[], n = lista.length): T[] {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a.slice(0, n)
}
