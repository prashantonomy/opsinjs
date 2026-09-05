/**
 * GET /llms-health.txt — the doctrine shard.
 *
 * Health, accessibility, and content and language: the three pillars that
 * decide what a health interface is allowed to assert, how it must be
 * operable, and how it must be worded. None of it waited on an implementation:
 * it is written against the tokens and the language rather than against React,
 * so it was binding before the first component was built and it binds each one
 * that has landed since.
 *
 * This is the shard that matters most for generation. A model that has read
 * only the component pages knows the names of things; a model that has read
 * this knows that "normal" is a banned word, that a category colour may never
 * carry clinical status, that a percentage without its natural frequency is
 * not an honest statistic, and that at most one urgent surface may appear on a
 * screen. Those are the rules that make generated health UI
 * safe rather than merely plausible.
 *
 * Pages declare `evidence: cited | opinion | mixed`. Treat an `opinion` page
 * as a considered design position, not as a finding.
 */

import { absoluteUrl, text } from "@/app/_machine/contracts"
import { BUDGETS, SHARDS, buildCorpusFile } from "@/app/_machine/corpus"

export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  const body = await buildCorpusFile({
    title: SHARDS.health.title,
    blurb: SHARDS.health.blurb,
    sections: SHARDS.health.sections,
    budget: BUDGETS.shard,
    overflowHint: `Fetch the remaining pages individually — every documentation URL answers to a \`.md\` suffix. The full list is at ${absoluteUrl("/llms.txt")}.`,
    notes: [
      "Every page here declares `evidence: cited`, `opinion` or `mixed`. Do not report an opinion as a finding, and do not attribute a citation this corpus does not contain.",
      `The components these rules govern: ${absoluteUrl(SHARDS.components.file)}`,
    ],
  })
  return text(body)
}
