/**
 * GET /llms-reference.txt serves the generated reference shard.
 *
 * WHY IT IS A SHARD OF ITS OWN. It used to be the third section of
 * `/llms-foundations.txt`, and it was 899 kB of that file's 1.48 MB. Eight
 * generated table pages account for 800 kB of it: every token, every CSS
 * custom property, every measured contrast pair, the glossary and the table of
 * exported symbols. A combined shard therefore spent its whole budget on tables
 * and truncated before it reached the doctrine it was named for. Splitting
 * here costs one file and gives both halves their section whole.
 *
 * It is also the natural cut for the reader. Foundations says what a token
 * means and theming says how to change it, which is prose somebody reads. This
 * is the measured list, which is data somebody looks something up in. An agent
 * asking "what is `--opsin-status-urgent-surface` for" wants the first file and
 * an agent resolving that name to a value wants this one, and neither wants to
 * carry the other.
 *
 * EVERY NUMBER IN HERE WAS COMPUTED. The reference pages are committed MDX
 * emitted by `scripts/build-reference.mts`: contrast figures come from the APCA
 * and WCAG implementations in `lib/color`, token tables from `tokens/*.json`,
 * the symbol tables from the `export` declarations under `lib/`. If a figure
 * appears here, a script produced it and `pnpm check:generated` compares that
 * script's output against its source on every run. Nothing in this file was
 * typed by hand into a table.
 */

import { absoluteUrl, text } from "@/app/_machine/contracts"
import { BUDGETS, SHARDS, buildCorpusFile } from "@/app/_machine/corpus"

export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  const body = await buildCorpusFile({
    title: SHARDS.reference.title,
    blurb: SHARDS.reference.blurb,
    sections: SHARDS.reference.sections,
    budget: BUDGETS.shard,
    overflowHint: `Fetch the remaining pages individually. Every documentation URL answers to a \`.md\` suffix. The full list is at ${absoluteUrl("/llms.txt")}.`,
    notes: [
      "This shard is measurements, not doctrine. It says what a token resolves to and never what it is for. The page that says what it is for is in the foundations shard.",
      `Foundations and theming: ${absoluteUrl("/llms-foundations.txt")}`,
      `The same data as JSON, per component: \`GET /r/index.json\``,
    ],
  })
  return text(body)
}
