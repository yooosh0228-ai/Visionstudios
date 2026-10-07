/**
 * Markdown mínimo y seguro para los documentos: títulos, párrafos, listas,
 * tablas, separadores, negritas y cursivas. Produce un árbol que la pantalla
 * pinta con React (nunca HTML crudo). Puro y sin imports.
 */

export type Inline = { text: string; bold?: boolean; italic?: boolean }

export type Block =
  | { kind: "heading"; level: 1 | 2 | 3; content: Inline[] }
  | { kind: "paragraph"; content: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "table"; header: Inline[][]; rows: Inline[][][] }
  | { kind: "rule" }

export function parseInline(source: string): Inline[] {
  const out: Inline[] = []
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g
  let last = 0
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > last) out.push({ text: source.slice(last, index) })
    const token = match[0]
    if (token.startsWith("**") || token.startsWith("__"))
      out.push({ text: token.slice(2, -2), bold: true })
    else out.push({ text: token.slice(1, -1), italic: true })
    last = index + token.length
  }
  if (last < source.length) out.push({ text: source.slice(last) })
  return out.filter((part) => part.text.length > 0)
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => parseInline(c.trim()))

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n")
  const blocks: Block[] = []
  let paragraph: string[] = []

  const flush = () => {
    if (paragraph.length) {
      blocks.push({ kind: "paragraph", content: parseInline(paragraph.join(" ")) })
      paragraph = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trim()
    if (!trimmed) {
      flush()
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (heading) {
      flush()
      const level = Math.min(3, heading[1]!.length) as 1 | 2 | 3
      blocks.push({ kind: "heading", level, content: parseInline(heading[2]!.replace(/#+$/, "").trim()) })
      continue
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flush()
      blocks.push({ kind: "rule" })
      continue
    }
    if (trimmed.startsWith("|")) {
      flush()
      const tableLines: string[] = []
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) {
        tableLines.push((lines[i] ?? "").trim())
        i++
      }
      i--
      const isDivider = (l: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(l)
      const header = tableLines[0] ? cells(tableLines[0]) : []
      const body = tableLines.slice(1).filter((l) => !isDivider(l)).map(cells)
      blocks.push({ kind: "table", header, rows: body })
      continue
    }
    const bullet = /^[-*+]\s+(.*)$/.exec(trimmed)
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed)
    if (bullet || numbered) {
      flush()
      const ordered = !!numbered
      const items: Inline[][] = []
      while (i < lines.length) {
        const t = (lines[i] ?? "").trim()
        const m = ordered ? /^\d+[.)]\s+(.*)$/.exec(t) : /^[-*+]\s+(.*)$/.exec(t)
        if (!m) break
        items.push(parseInline(m[1]!))
        i++
      }
      i--
      blocks.push({ kind: "list", ordered, items })
      continue
    }
    paragraph.push(trimmed)
  }
  flush()
  return blocks
}
