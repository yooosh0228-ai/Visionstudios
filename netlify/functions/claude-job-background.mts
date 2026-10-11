/**
 * Función de fondo de Netlify (hasta 15 minutos): ejecuta un trabajo de los
 * servicios de texto que el servidor ya cobró. Netlify responde 202 al
 * instante; el resultado queda en la tabla claude_jobs.
 * Solo acepta avisos firmados por el propio servidor.
 */
import { runJob, verifyJobSignature } from "../../servicios/run-job"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const handler = async (request: Request): Promise<void> => {
  if (request.method !== "POST") return
  let body: { jobId?: unknown; signature?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return
  }
  const jobId = typeof body.jobId === "string" ? body.jobId : ""
  if (!UUID.test(jobId) || !verifyJobSignature(jobId, body.signature)) {
    console.warn("[servicios] aviso rechazado")
    return
  }
  await runJob(jobId)
}

export default handler
