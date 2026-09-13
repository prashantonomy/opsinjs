/**
 * GET /llms-full.txt returns the whole corpus in one file.
 *
 * Every page, in sidebar order, as processed markdown, separated by rules and
 * each carrying its canonical URL, section and status. This is the file to
 * paste into a context window when the question is "what does opsinjs say
 * about X" and X could be anywhere.
 *
 * It is capped. Health doctrine, accessibility requirements and component
 * pages are all things that are dangerous half-read, so the file truncates at
 * a page boundary, states how many pages it dropped, and names the shards that
 * carry them in full. A silently truncated corpus is a corpus that answers
 * confidently and wrongly.
 */

import { absoluteUrl, text } from "@/app/_machine/contracts"
import { BUDGETS, SHARDS, buildCorpusFile } from "@/app/_machine/corpus"

export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  const body = await buildCorpusFile({
    title: "the complete documentation",
    blurb:
      "Every page of the opsinjs documentation as one markdown file, in the order the sidebar presents it.",
    sections: null,
    budget: BUDGETS.full,
    overflowHint: [
      "Read the shard that covers the section you need instead:",
      ...Object.values(SHARDS).map(
        (shard) => `- [${shard.title}](${absoluteUrl(shard.file)})`
      ),
      `- [The index of every page, with a URL each](${absoluteUrl("/llms.txt")})`,
    ].join("\n"),
    notes: [
      `Index: ${absoluteUrl("/llms.txt")}`,
      `Component roster: ${absoluteUrl("/r/index.json")}`,
    ],
  })
  return text(body)
}
