/**
 * GET /llms-components.txt — the component and screen shard.
 *
 * The twenty-four component specifications and the whole-screen specimens,
 * nothing else. This is the shard to load before answering "does opsinjs have
 * a …", "what props does … take", or "how do I compose …".
 *
 * Every page here is a specification for something that does not exist. That
 * is stated in the header, again in each page's not-implemented notice, and
 * again in the registry. An agent that reads only this file must not be able
 * to come away thinking a single component is installable.
 *
 * The doctrine that governs these components — what a status colour may mean,
 * how a number must be formatted, when an alert is allowed to escalate — is in
 * the health shard, and a component specification is not safely readable
 * without it.
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
      `Machine roster with status per id: ${absoluteUrl("/r/index.json")}`,
      `The doctrine these specifications answer to: ${absoluteUrl(SHARDS.health.file)}`,
    ],
  })
  return text(body)
}
