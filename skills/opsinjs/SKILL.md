---
name: opsinjs
description: Use when building, reviewing or generating consumer- and patient-facing health UI with opsinjs - result cards, reference ranges, clinical status, alerts, consent, health logging, vitals, lab results - or when asked to add an opsinjs component, use its colour tokens, or answer a question about the opsinjs design system. Enforces the two-colour-axes rule, tokens over raw values, the registry namespace, and the fact that no opsinjs component has been implemented yet.
---

# opsinjs

opsinjs is a React design system for consumer health apps: interfaces where a
layperson reads something about their own body. Its documentation is at
`https://opsinjs.dev`, its machine-readable index is `https://opsinjs.dev/llms.txt`,
and every page is available as plain markdown at its own URL with a `.md` suffix.

## Read this first: nothing has been implemented

Every component in opsinjs is currently at `status: planned`. The documentation
pages are **specifications**, not references for shipped code. There is no
package to install, no import that resolves, and no prop interface that is
stable.

That means:

- **Never write code against an opsinjs component API.** A page describing
  `<RangeBar>` is describing a component that does not exist. Generating an
  import for it produces code that cannot run and an API that will be wrong.
- **Never claim an opsinjs component exists** in an answer, a comment, a commit
  message or a plan.
- When someone asks for an opsinjs component, say plainly that it is specified
  and not built, then either implement the behaviour directly against the
  specification or use a primitive they already have. The specification is
  genuinely useful for that: it states the intent, the cases where the component
  is the wrong answer, the accessibility bar, and the clinical contract.
- The catalogue also lists components at `status: considered` - deliberately not
  shipping. "Considered, not implemented" is a complete answer. Do not invent one.

## When to use this skill

Trigger on any of: a health value shown to the person it belongs to; a lab or
test result; a reference or "normal" range; a vital sign; a trend over time; a
symptom or medication log; a clinical alert or escalation; consent for health
data; anything using opsinjs tokens, its registry, or its colour engine.

Do **not** use it for clinician-facing EHR interfaces, regulated medical device
UI, or anything that triages, diagnoses or advises. opsinjs is explicitly out of
scope for those, and says so on `/docs/start/safety-scope-and-limitations`.

## The four rules, in priority order

Read the rule file before generating anything that touches its subject. They are
short and they are hard rules, not preferences.

1. [`rules/status-and-colour.md`](rules/status-and-colour.md) - the two colour
   axes never mix on one element, and status is never carried by colour alone.
2. [`rules/tokens-not-values.md`](rules/tokens-not-values.md) - reference a
   token; never write a raw `oklch()`, `hsl()` or hex value.
3. [`rules/never-invent.md`](rules/never-invent.md) - never invent a component,
   an API, a threshold, a statistic or a citation.
4. [`rules/registry.md`](rules/registry.md) - ask which registry; never assume
   `@opsinjs` is configured.

When two rules appear to conflict, the one earlier in this list wins. In
practice they do not conflict: they are four faces of one idea, which is that a
health interface must never assert more than it knows.

## The five things that make health UI different

These are the failures that show up in generated health interfaces, in the order
they show up.

1. **A number without its range means nothing.** "HbA1c 51" is not information.
   The value, its units, its reference range and the date it was measured travel
   together or not at all.
2. **The interface does not own the threshold.** opsinjs presents a status; it
   never decides one. Whoever supplies the data owns the thresholds, and the UI
   must be able to render "we do not know" without breaking.
3. **"Normal" is a banned word.** It carries a verdict the interface is not
   entitled to give, and its complement is what a reader hears about themselves.
   Say "in the usual range" or name the range.
4. **Urgency has a budget.** Every alert makes the next one weaker. At most one
   urgent surface per screen, and an alert that cannot be acted on is not an
   alert.
5. **Uncertainty is content, not an edge case.** Stale, estimated, partial and
   missing are five distinct states with five distinct renderings, and the empty
   state is the one a real person meets first.

## Answering questions about opsinjs

Prefer the documentation over recall, in this order:

1. `https://opsinjs.dev/llms.txt` - the curated index, absolute URLs, one line
   per page. Start here to find the right page.
2. `https://opsinjs.dev/docs/<path>.md` - any page as plain markdown.
3. `https://opsinjs.dev/llms-health.txt`, `llms-components.txt`,
   `llms-foundations.txt` - the three shards, when you need a whole pillar.
4. `https://opsinjs.dev/r/registry.json` - the component catalogue, including
   every considered component and its status. This is also what the shadcn MCP
   server reads.
5. `https://opsinjs.dev/r/docs.json` - the whole corpus in one bundle, for
   working without a network.

Every measured number on the site - contrast ratios, token values, prop tables,
the catalogue - is generated from source and regenerated in CI. Quote those
freely. Do not quote a number that is not on one of those pages.

## Reviewing someone else's health UI

Work through this, in order, and stop at the first failure:

1. Does any element take colour from both axes at once?
2. Is any status carried by colour alone, with no word?
3. Is there a raw colour value where a token belongs?
4. Does a number appear without its units, its range, or its date?
5. Does the interface state a threshold as though it owns it?
6. Is there more than one urgent surface on the screen?
7. What does this render when the value is missing, stale or partial?
8. Does the copy say "normal", "abnormal", "bad", "poor" or "failed"?
9. Is every interactive target at least 44pt, with the spacing to match?
10. Does it still work in grayscale, at 200% text, and with reduced motion?

Nine of those ten are answerable from the markup alone, which is what makes this
a review a machine can actually do.
