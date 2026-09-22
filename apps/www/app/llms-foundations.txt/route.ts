/**
 * GET /llms-foundations.txt serves the token doctrine shard.
 *
 * Foundations (what a token means) and Theming (how to change it). Reference,
 * the generated list of every one, used to be here too and is now
 * `/llms-reference.txt`. Those three are deliberately separate homes for the
 * same subject, and the split is the reason a reader can find out what
 * `--opsin-status-urgent-surface` is *for* without reading a table of six
 * hundred variables, and can read the table without wading through doctrine.
 * The shards now cut in the same place the corpus does.
 *
 * WHAT THE SPLIT FIXED. Reference is 899 kB of which eight generated table
 * pages are 800 kB, so a shard carrying all three sections spent its budget on
 * tables and truncated partway through Foundations. The file named for the
 * doctrine was dropping the doctrine. Both halves now fit whole.
 */

import { absoluteUrl, text } from "@/app/_machine/contracts"
import { BUDGETS, SHARDS, buildCorpusFile } from "@/app/_machine/corpus"

export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  const body = await buildCorpusFile({
    title: SHARDS.foundations.title,
    blurb: SHARDS.foundations.blurb,
    sections: SHARDS.foundations.sections,
    budget: BUDGETS.shard,
    overflowHint: `Fetch the remaining pages individually. Every documentation URL answers to a \`.md\` suffix. The full list is at ${absoluteUrl("/llms.txt")}.`,
    notes: [
      "Foundations says what a token means. Theming says how to change it. The generated list of every one is a separate shard. Quote the right home for the question.",
      `Every token, variable and measured pair: ${absoluteUrl("/llms-reference.txt")}`,
      `Themes as installable registry items: \`GET /r/themes/<preset>.json\``,
    ],
  })
  return text(body)
}
