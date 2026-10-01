import { NextResponse } from "next/server"

import { createPlatformClient, PlatformError } from "@/generation/platform"
import { getSession } from "@/generation/session"
import { requireUploadContentType } from "@/generation/upload-contract"

export async function POST(request: Request): Promise<NextResponse> {
  const origin = request.headers.get("origin")
  if (origin && origin !== new URL(request.url).origin)
    return failure(403, "No se permiten subidas desde otro origen.")

  let contentType: string
  try {
    const body: unknown = await request.json()
    contentType = requireUploadContentType(
      body && typeof body === "object" && "contentType" in body
        ? body.contentType
        : null
    )
  } catch (error) {
    return failure(
      400,
      error instanceof SyntaxError
        ? "Solicitud de subida inválida."
        : "Tipo de archivo no permitido. Usa JPEG, PNG, WebP, GIF, MP4 o WAV."
    )
  }

  const session = await getSession()
  if (!session)
    return failure(401, "Entra a tu cuenta antes de subir referencias.")
  const apiKey = process.env.HF_API_KEY
  const baseUrl = process.env.HF_API_BASE_URL
  if (!apiKey || !baseUrl)
    return failure(503, "El estudio no está conectado a Higgsfield todavía.")

  try {
    const ticket = await createPlatformClient({
      apiKey,
      baseUrl,
    }).createUpload(contentType)
    return NextResponse.json(ticket, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    const status = error instanceof PlatformError ? error.status : 502
    console.error("[upload] Could not prepare reference upload", { status })
    if (status === 429)
      return failure(
        429,
        "Higgsfield recibió muchas subidas. Espera un momento e intenta de nuevo."
      )
    return failure(
      502,
      "No se pudo preparar la subida con Higgsfield. Intenta de nuevo."
    )
  }
}

function failure(status: number, error: string): NextResponse {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } }
  )
}
