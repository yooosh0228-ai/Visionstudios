import { cache } from "react"

import { leerPanel } from "./datos"

/** Una sola lectura de la base por cada vez que se pinta el panel (la usan el marco y la página). */
export const panelDelDueno = cache(leerPanel)
