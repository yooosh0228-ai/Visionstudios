"use client"

import { useSyncExternalStore } from "react"

/**
 * El dispositivo desde el que se entra al Estudio, para darle a cada uno su
 * mejor forma:
 *
 * - "telefono": pantalla estrecha (menos de 768 px). El menú lateral se vuelve
 *   un cajón que se abre con el botón de menú.
 * - "tablet": de 768 a 1279 px. El menú lateral arranca contraído en iconos.
 * - "escritorio": 1280 px o más. El menú lateral arranca abierto.
 *
 * `tactil` dice si el puntero principal es un dedo: ahí no hay "hover", así
 * que las acciones que en la computadora aparecen al pasar el mouse se
 * muestran siempre.
 *
 * En el servidor (y en el primer pintado) devuelve "escritorio" sin táctil;
 * en cuanto el navegador hidrata, se corrige solo.
 */
export type Dispositivo = "telefono" | "tablet" | "escritorio"

export interface DeviceInfo {
  tipo: Dispositivo
  tactil: boolean
}

const TELEFONO = "(max-width: 767px)"
const TABLET = "(min-width: 768px) and (max-width: 1279px)"
const TACTIL = "(pointer: coarse)"

const SERVIDOR: DeviceInfo = { tipo: "escritorio", tactil: false }
let ultimo: DeviceInfo = SERVIDOR

function leer(): DeviceInfo {
  const tipo: Dispositivo = window.matchMedia(TELEFONO).matches
    ? "telefono"
    : window.matchMedia(TABLET).matches
      ? "tablet"
      : "escritorio"
  const tactil = window.matchMedia(TACTIL).matches
  // Misma referencia si nada cambió, para no repintar de más.
  if (tipo !== ultimo.tipo || tactil !== ultimo.tactil)
    ultimo = { tipo, tactil }
  return ultimo
}

function suscribir(avisar: () => void) {
  const consultas = [TELEFONO, TABLET, TACTIL].map((q) => window.matchMedia(q))
  consultas.forEach((m) => m.addEventListener("change", avisar))
  return () => consultas.forEach((m) => m.removeEventListener("change", avisar))
}

export function useDevice(): DeviceInfo {
  return useSyncExternalStore(suscribir, leer, () => SERVIDOR)
}
