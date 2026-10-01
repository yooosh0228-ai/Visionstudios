export class MissingCredentialsError extends Error {
  constructor() {
    super("El estudio no tiene configurada la llave de Higgsfield")
    this.name = "MissingCredentialsError"
  }
}

export function toAuthorizationHeader(apiKey: string): string {
  return `Key ${requireApiKey(apiKey)}`
}

export function requireApiKey(apiKey: string): string {
  const key = apiKey.trim()
  if (!key) throw new Error("Enter an API key")
  if (/[^\x21-\x7E]/.test(key))
    throw new Error("Paste the API key exactly as copied from open.higgsfield.ai")
  return key
}
