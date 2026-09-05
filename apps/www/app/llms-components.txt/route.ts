/**
 * GET /llms-components.txt — the component and screen shard.
 *
 * Every component page and every whole-screen specimen, and nothing else. This
 * is the shard to load before answering "does opsinjs have a …", "what props
 * does … take", or "how do I compose …".
 *
 * The pages in it are not one kind of thing, and reading them as one kind is
 * the mistake this comment exists to prevent. Some describe a component that
 * is built: there is source behind it, `/r/<id>.json` resolves, and the API
 * documented is the API installed. Some are specifications — intent, when not
 * to use it and what to reach for instead, the clinical contract, the proposed
 * anatomy and API, and the accessibility bar an implementation has to clear —
 * with nothing to install behind them. Some are reserved names on the
 * considered roster, kept so the URL answers with something better than a 404.
 * A page that is not built says so in a NOT IMPLEMENTED notice of its own,
 * directly above the API it sketches.
 *
 * No count belongs in this comment. The shard is assembled per build from the
 * registry, so a number typed here would be wrong on the day the next
 * component lands — which is how the previous version of this docblock came to
 * assert that nothing in the file existed while built components were inlined
 * a few kilobytes below it.
 *
 * Because the shard is mixed, it cannot be read as a blanket claim in either
 * direction, and an agent must settle each id on its own before generating
 * code against it. Two surfaces answer for a single id, and both are read off
 * the same registry these pages are: `implemented` per id in `/r/index.json`,
 * and the `implemented:` frontmatter on that page's own `.md` twin, which the
 * twin also sends as an `x-opsinjs-implemented` header. The page's `status` is
 * the coarser version of the same answer.
 *
 * The doctrine that governs these components — what a status colour may mean,
 * how a number must be formatted, when an alert is allowed to escalate — is in
 * the health shard, and a component page is not safely readable without it.
 */

import { absoluteUrl, text } from "@/app/_machine/contracts"
import { BUDGETS, SHARDS, buildCorpusFile } from "@/app/_machine/corpus"

export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  const body = await buildCorpusFile({
    title: SHARDS.components.title,
    blurb: SHARDS.components.blurb,
    sections: SHARDS.components.sections,
    budget: BUDGETS.shard,
    overflowHint: `Fetch the remaining pages individually — every documentation URL answers to a \`.md\` suffix. The full list is at ${absoluteUrl("/llms.txt")}.`,
    notes: [
      `This shard mixes built components with specifications and reserved names, so settle one id before you write code against it: ${absoluteUrl("/r/index.json")} carries \`implemented\` and \`status\` per id, and each page's \`.md\` twin carries the same \`implemented:\` in its frontmatter.`,
      `The doctrine every component here answers to: ${absoluteUrl(SHARDS.health.file)}`,
    ],
  })
  return text(body)
}
