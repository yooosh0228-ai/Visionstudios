import type {
  GenerationPlane,
  MediaItem,
  MediaKind,
  MediaRole,
  ModelEntry,
} from "./types"

export const MEDIA_ROLES: MediaRole[] = [
  "source",
  "start",
  "end",
  "reference",
  "video",
  "audio",
]
export const ROLE_LABEL: Record<MediaRole, string> = {
  source: "Video de origen",
  start: "Inicio",
  end: "Final",
  reference: "Imágenes de referencia",
  video: "Videos de referencia",
  audio: "Audios de referencia",
}
export const ROLE_KIND: Record<MediaRole, MediaKind> = {
  source: "video",
  start: "image",
  end: "image",
  reference: "image",
  video: "video",
  audio: "audio",
}

export function inputRoles(
  model: ModelEntry,
  mode?: string
): ModelEntry["roles"] {
  if (!mode) return model.roles
  const selected = model.mediaModes?.find((item) => item.id === mode)
  if (!selected) throw new Error(`Unknown input mode for ${model.label}.`)
  return selected.roles
}

export function groupMedia(items: MediaItem[]): GenerationPlane["media"] {
  const grouped: GenerationPlane["media"] = {}
  for (const item of items) (grouped[item.role] ??= []).push(item)
  return grouped
}

export function mergeMedia(
  current: MediaItem[],
  role: MediaRole,
  selected: MediaItem[],
  max: number
): MediaItem[] {
  if (
    selected.some(
      (item) =>
        item.role !== role || (item.kind && item.kind !== ROLE_KIND[role])
    )
  )
    throw new Error(
      `Para ${ROLE_LABEL[role].toLowerCase()} escoge archivos de tipo ${ROLE_KIND[role]}.`
    )
  const existing =
    max === 1 ? current.filter((item) => item.role !== role) : current
  const next = [...existing]
  for (const item of selected) {
    if (!next.some((other) => other.role === role && other.url === item.url))
      next.push(item)
  }
  if (!max || next.filter((item) => item.role === role).length > max)
    throw new Error(`${ROLE_LABEL[role]}: máximo ${max}.`)
  return next
}

export const REFERENCE_ROLE = {
  image: "reference",
  video: "video",
  audio: "audio",
} as const

export function mergeReferences(
  current: MediaItem[],
  selected: (Omit<MediaItem, "role" | "kind"> & { kind: MediaKind })[],
  roles: ModelEntry["roles"]
): MediaItem[] {
  const next = [...current]
  for (const item of selected) {
    if (next.some((other) => other.url === item.url)) continue
    const role = REFERENCE_ROLE[item.kind]
    const max = roles[role] ?? 0
    if (!max)
      throw new Error(`Este modelo no acepta referencias de tipo ${item.kind}.`)
    if (next.filter((other) => other.role === role).length >= max)
      throw new Error(`${ROLE_LABEL[role]}: máximo ${max}.`)
    next.push({ ...item, role })
  }
  return next
}

export function inferInputMode(
  model: ModelEntry,
  media: MediaItem[]
): string | undefined {
  if (!media.length || !model.mediaModes) return undefined
  const firstRole =
    media.find((item) => item.role === "start" || item.role === "end")?.role ??
    media[0]!.role
  return model.mediaModes.find((mode) => (mode.roles[firstRole] ?? 0) > 0)?.id
}

export function changeImageRole(
  model: ModelEntry,
  media: MediaItem[],
  id: string,
  role: "reference" | "start" | "end"
): MediaItem[] {
  if (!model.roles[role])
    throw new Error(`Este modelo no acepta ${ROLE_LABEL[role].toLowerCase()}.`)
  const target = media.find((item) => item.id === id)
  if (!target || ROLE_KIND[target.role] !== "image")
    throw new Error("Solo las imágenes pueden ser cuadro inicial o final.")
  const next = media.map((item): MediaItem => {
    if (item.id === id) return { ...item, role }
    if (role !== "reference" && item.role === role)
      return { ...item, role: "reference" }
    return item
  })
  for (const key of ["reference", "start", "end"] as const) {
    if (
      next.filter((item) => item.role === key).length > (model.roles[key] ?? 0)
    )
      throw new Error(`${ROLE_LABEL[key]}: máximo ${model.roles[key] ?? 0}.`)
  }
  return next
}

export function validateMedia(
  model: ModelEntry,
  media: GenerationPlane["media"],
  mode?: string
): void {
  const roles = inputRoles(model, mode)
  for (const [key, items] of Object.entries(media)) {
    const role = key as MediaRole
    const max = roles[role] ?? 0
    if (!Array.isArray(items))
      throw new Error("Los archivos adjuntos no son válidos.")
    if (!items.length) continue
    if (!MEDIA_ROLES.includes(role) || !max) {
      if (
        mode === "frames" &&
        (role === "reference" || role === "video" || role === "audio")
      )
        throw new Error(
          "Con cuadro inicial o final, este modelo no acepta otras referencias: cambia el cuadro a imagen de referencia o quita las demás."
        )
      throw new Error(
        `Este modelo no acepta ${(ROLE_LABEL[role] ?? key).toLowerCase()} en este modo.`
      )
    }
    if (items.length > max)
      throw new Error(
        `${ROLE_LABEL[role]}: máximo ${max} en ${model.label}. Quita los que sobran.`
      )
    for (const item of items) {
      if (
        !item ||
        item.role !== role ||
        typeof item.url !== "string" ||
        !/^https?:\/\//.test(item.url)
      )
        throw new Error(
          `El enlace de ${ROLE_LABEL[role].toLowerCase()} no es válido.`
        )
      if (item.kind && item.kind !== ROLE_KIND[role])
        throw new Error(
          `${ROLE_LABEL[role]} solo acepta archivos de tipo ${ROLE_KIND[role]}.`
        )
    }
  }
  for (const role of model.requiredRoles ?? []) {
    if (!media[role]?.length)
      throw new Error(
        `Para usar ${model.label} añade ${ROLE_LABEL[role].toLowerCase()}.`
      )
  }
  if (
    model.mediaModes?.find((item) => item.id === mode)?.requireAny &&
    !Object.values(media).some((items) => items?.length)
  ) {
    throw new Error(
      "Añade por lo menos una imagen, un video o un audio de referencia."
    )
  }
}
