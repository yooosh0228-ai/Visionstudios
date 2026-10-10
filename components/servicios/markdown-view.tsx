import { Fragment } from "react"

import { parseMarkdown } from "@/servicios/markdown"
import type { Inline } from "@/servicios/markdown"

function Text({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.bold ? (
          <strong key={i} className="font-semibold">
            {part.text}
          </strong>
        ) : part.italic ? (
          <em key={i}>{part.text}</em>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        )
      )}
    </>
  )
}

/** Pinta Markdown sencillo como documento (sin HTML crudo). */
export function MarkdownView({ source, className }: { source: string; className?: string }) {
  const blocks = parseMarkdown(source)
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "heading":
            return block.level === 1 ? (
              <h1 key={i} className="mt-2 mb-3 text-2xl font-semibold">
                <Text parts={block.content} />
              </h1>
            ) : block.level === 2 ? (
              <h2 key={i} className="mt-5 mb-2 border-b border-current/15 pb-1 text-lg font-semibold">
                <Text parts={block.content} />
              </h2>
            ) : (
              <h3 key={i} className="mt-4 mb-1 text-base font-semibold">
                <Text parts={block.content} />
              </h3>
            )
          case "paragraph":
            return (
              <p key={i} className="my-2 leading-relaxed">
                <Text parts={block.content} />
              </p>
            )
          case "rule":
            return <hr key={i} className="my-4 border-current/15" />
          case "list": {
            const Tag = block.ordered ? "ol" : "ul"
            return (
              <Tag
                key={i}
                className={`my-2 flex flex-col gap-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
              >
                {block.items.map((item, j) => (
                  <li key={j} className="leading-relaxed">
                    <Text parts={item} />
                  </li>
                ))}
              </Tag>
            )
          }
          case "table":
            return (
              <div key={i} className="my-3 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      {block.header.map((cell, j) => (
                        <th key={j} className="border border-current/20 px-2 py-1 text-left font-semibold">
                          <Text parts={cell} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, j) => (
                          <td key={j} className="border border-current/20 px-2 py-1 align-top">
                            <Text parts={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      })}
    </div>
  )
}
