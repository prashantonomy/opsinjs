/**
 * GET /llms-foundations.txt serves the token shard.
 *
 * Foundations (what a token means), Theming (how to change it) and Reference
 * (the generated list of every one). Those three are deliberately separate
 * homes for the same subject, and the split is the reason a reader can find
 * out what `--opsin-status-urgent-surface` is *for* without reading a table of
 * six hundred variables, and can read the table without wading through
 * doctrine.
 *
 * The generated reference pages are committed MDX, so their numbers are
 * measured rather than typed: contrast figures come from the APCA and WCAG
 * implementations in `lib/color`, token tables from `tokens/*.json`. If a
 * number appears here it was computed by a script whose output CI compares
 * against its source on every run.
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
      "Foundations says what a token means. Theming says how to change it. Reference is the generated list of every one. Quote the right home for the question.",
      `Themes as installable registry items: \`GET /r/themes/<preset>.json\``,
    ],
  })
  return text(body)
}
