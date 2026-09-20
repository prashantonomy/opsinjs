/**
 * THE SINGLE STATUS VOCABULARY.
 *
 * `source.config.ts` declares the same two enums for frontmatter validation and
 * cannot export them, because fumadocs-mdx refuses any export from a source
 * config that is not a collection. This file is therefore the runtime copy.
 *
 * NOTHING HOLDS THE TWO IN STEP, AND THIS COMMENT USED TO SAY OTHERWISE. It
 * claimed `assert-ia.mts` asserts the two agree. It does not. FM004 validates
 * frontmatter against `content/_templates/frontmatter.schema.json`, which is a
 * third copy of the same vocabulary, and no check anywhere reads
 * `source.config.ts` at all. So the words are written down three times and
 * kept in step by hand, and the FM004 message in `scripts/assert-ia.mts` is
 * the only nudge that exists. If you add a status or a kind, add it in all
 * three places in the same commit: here, `source.config.ts`, and the schema.
 * Enforcement would be a small script that lifts the `z.enum(...)` array
 * literals out of `source.config.ts` and diffs them against `STATUSES` and
 * `KINDS`. That is worth doing, and it is not done, so do not read this file
 * as guarded.
 *
 * Everything that renders a release phase, gates a section, or asks "what
 * headings does this page need" reads from here. Nothing re-declares it.
 *
 * This module has no imports, no JSX and no non-erasable TypeScript syntax,
 * because `scripts/*.mts` are executed by plain `node` and import it directly
 * with an explicit `.ts` extension.
 */

/* ────────────────────────────────────────────────────────────────────────────
   RELEASE PHASE
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * A RELEASE PHASE IS NEVER PAINTED, AND THERE IS NOW NOTHING HERE TO PAINT IT
 * WITH.
 *
 * `components/docs/status.tsx` tints the phase chip from a neutral greyscale
 * map and tells the three phases apart by border style and by the word.
 * That is the never-mix rule applied to the system's own chrome: a release
 * phase is not a clinical status, and painting "Planned" in the colour that
 * means "a person should act" teaches a reader to misread the one palette
 * where misreading costs something. Do not wire a phase into a hue, a pill, a
 * token or a chart series. `StatusMeta` used to carry an unread `tone` field
 * against the day somebody wanted the other thing, and carrying it was the
 * invitation. There is no field here to wire one to, and that absence is the
 * enforcement.
 *
 * THREE PHASES, AND THEY ANSWER ONE QUESTION: is there code, and is it on its
 * way out. They say nothing about whether the code has been reviewed, because
 * none of it has. `REVIEW_FLOOR_NOTICE` below is that fact as one string, and
 * `STATUS_META.shipped.summary` ends with it, so every chip on the site
 * carries it.
 *
 * THE OLD CARRIER LIST NAMED SIX PLACES AND THE SENTENCE LIVES IN MORE THAN
 * TEN. Counting them was the mistake. An editor who revised the six that were
 * listed and stopped left the others promising something slightly different,
 * which is how one review floor becomes four. The count is therefore gone and
 * the constant is here instead. Two carriers reuse it verbatim,
 * `STATUS_META.shipped` and the `unreviewed` field in
 * `app/r/index.json/route.ts`, and `app/api/search/route.ts` composes it into
 * a longer indexed line. The rest cannot reuse it, because they are
 * mid-paragraph in prose written for a reader: "none of them has had an
 * accessibility review" and "none of it has been through an independent
 * accessibility review" are the same floor in the grammar each paragraph
 * needs. Those are restatements on purpose. To find every one of them before
 * you change the floor, run
 * `grep -rn "accessibility review" app lib components scripts content`, which
 * stays accurate in a way a list in this comment does not. SAFE001 in
 * `scripts/assert-ia.mts` holds the per-page copy, in authored MDX, on all 60
 * component pages.
 *
 * Several files still label themselves "SAFETY CARRIER 3", "4" or "6" in a
 * comment. Those numbers come from the old list of six and they are kept
 * because a number that appears in a review comment should keep meaning what
 * it meant. Read them as names, not as an enumeration: there is no carrier 7
 * to look for and the numbered ones are not all of them.
 */
export const STATUSES = ["planned", "shipped", "deprecated"] as const

/** The release phase of a component page or a catalogue entry. */
export type Status = (typeof STATUSES)[number]

export function isStatus(value: unknown): value is Status {
  return (
    typeof value === "string" && (STATUSES as readonly string[]).includes(value)
  )
}

export interface StatusMeta {
  /** The word shown on the badge. */
  label: string
  /**
   * One sentence a reader can act on. It is the chip's `title` and its
   * `aria-label`, so it reaches a sighted reader and a screen reader alike, and
   * it is the label in the `<StatusMatrix>` phase facet.
   *
   * `shipped` carries the review floor, and it carries it because the chip is
   * the shortest surface on the site that appears beside every component. If
   * you shorten that sentence you delete the only warning a reader gets from
   * the chrome. It ends with `REVIEW_FLOOR_NOTICE` rather than restating it,
   * so the floor cannot be shortened here without editing the constant, which
   * is the point of the constant. Edit the constant and you still have to walk
   * the restatements the block above tells you how to find.
   */
  summary: string
}

/**
 * The three phases, keyed by the word that appears in frontmatter and in a
 * catalogue row. Display order is `STATUSES` order; there is no `order` field
 * left to disagree with it.
 */
/**
 * THE REVIEW FLOOR, AS ONE STRING.
 *
 * `shipped` means the source installs. It means nothing about whether anybody
 * checked the source, and nobody has: no component in this catalogue has had
 * an accessibility review and none has had a clinical review. This sentence is
 * the whole of what replaced the old alpha-to-beta gradient, so it can be
 * moved and it cannot be softened away.
 *
 * Both halves are load-bearing and neither survives alone. "No review" without
 * "not for production" reads as a caveat somebody will weigh against a
 * deadline, and "not for production" without "no review" reads as a maturity
 * note about the API. SAFE001 in `scripts/assert-ia.mts` requires both halves
 * on every component page for the same reason.
 *
 * It is a plain string because that is the only shape this module allows: no
 * imports, no JSX, no non-erasable syntax, since `scripts/*.mts` run under
 * plain node and import this file directly.
 */
export const REVIEW_FLOOR_NOTICE =
  "No accessibility review and no clinical review. Not for a production health surface."

export const STATUS_META: Record<Status, StatusMeta> = {
  planned: {
    label: "Planned",
    summary: "Specified in full. There is no code. Do not generate against it.",
  },
  shipped: {
    label: "Shipped",
    summary: `Installable source. ${REVIEW_FLOOR_NOTICE}`,
  },
  deprecated: {
    label: "Deprecated",
    summary: "Still works, being removed, and its page names the replacement.",
  },
}

/** Statuses in display order. */
export const STATUS_ORDER: readonly Status[] = STATUSES

/**
 * True when a page at this status must carry a not-implemented marker.
 *
 * Called by `<StubNotice>` in `components/docs/stub.tsx`, which emits the
 * marker, and by the "use this instead" pointer in `components/docs/
 * guidance.tsx`. Both used to test `status === "planned"` inline. Which phase
 * earns the marker is a decision about the vocabulary, so it is taken here
 * once rather than re-taken at each call site, where a fourth phase would be
 * missed. It is not used against `CatalogueRow` in `app/_machine`, whose
 * `status` is typed as a bare `string`; widening this signature to fit would
 * give up the exhaustiveness `Status` buys everywhere else.
 */
export function isNotImplemented(status: Status): boolean {
  return status === "planned"
}

/* ────────────────────────────────────────────────────────────────────────────
   PAGE KIND
   ──────────────────────────────────────────────────────────────────────────── */

export const KINDS = [
  "component",
  "foundation",
  "health",
  "accessibility",
  "content",
  "pattern",
  "recipe",
  "screen",
  "handbook",
  "reference",
  "project",
  "guide",
] as const

/**
 * A page's kind. This is a contract, not a label: `kind` fully determines the
 * page's headings, and `assert-ia.mts` fails the build on a missing or an
 * unexpected one.
 */
export type Kind = (typeof KINDS)[number]

export function isKind(value: unknown): value is Kind {
  return (
    typeof value === "string" && (KINDS as readonly string[]).includes(value)
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   THE CLINICAL AXES
   ──────────────────────────────────────────────────────────────────────────── */

export const CLINICAL_STATUSES = [
  "steady",
  "watch",
  "attention",
  "urgent",
] as const

/**
 * What a reading means and what, if anything, to do about it.
 *
 * Four levels, ordered. This is the ONLY status vocabulary in the system: the
 * documentation chrome's callouts, the product's status pills and the dev
 * warnings all use these four words, so a developer reading a Callout in these
 * docs is reading the same vocabulary they will ship.
 *
 * A level is assigned by the consuming product from a reference range or a
 * threshold that the product owns. opsinjs never assigns one, because opsinjs
 * does not know the reader.
 */
export type ClinicalStatus = (typeof CLINICAL_STATUSES)[number]

/**
 * The absence of an assertion, which covers a reading never taken, a stale
 * reading, or a reading whose reference range the product does not own.
 *
 * Deliberately NOT a fifth clinical status: rendering "we do not know" as a
 * status would claim a verdict the system does not have, and colouring it
 * anywhere near `watch` would let a reader read it as "probably fine".
 */
export type UnknownStatus = "unknown"

export type ClinicalStatusOrUnknown = ClinicalStatus | UnknownStatus

export interface ClinicalStatusMeta {
  /** The word rendered beside the colour and the icon. Never omitted. */
  word: string
  /** The canonical example sentence, used by `<StatusLadder>`. */
  sentence: string
  /** Who is entitled to assign this level. */
  assignedBy: string
  /** The lucide icon name. Colour is never the only carrier of meaning. */
  icon: string
  /** 1 is the calmest. Used for ordering and for the escalation budget. */
  level: number
}

export const CLINICAL_STATUS_META: Record<
  ClinicalStatusOrUnknown,
  ClinicalStatusMeta
> = {
  steady: {
    word: "Steady",
    sentence: "This reading is where it is expected to be.",
    assignedBy: "The consuming product, from a reference range it owns.",
    icon: "Circle",
    level: 1,
  },
  watch: {
    word: "Watch",
    sentence:
      "This reading is outside your usual range. On its own that is not unusual, and there is nothing to do before your next reading.",
    assignedBy: "The consuming product, from a reference range it owns.",
    icon: "CircleDot",
    level: 2,
  },
  attention: {
    word: "Needs attention",
    sentence:
      "Contact your care team about this reading. It is outside the range they set for you.",
    assignedBy: "The consuming product, from a clinically reviewed threshold.",
    icon: "Diamond",
    level: 3,
  },
  urgent: {
    word: "Urgent",
    sentence:
      "Contact your urgent care service now. Tell them this reading and when you took it.",
    assignedBy: "A clinically reviewed threshold with a named clinical owner.",
    icon: "Octagon",
    level: 4,
  },
  unknown: {
    word: "Not known",
    sentence: "We do not have a reading to show.",
    assignedBy: "Nobody. This is the absence of an assertion.",
    icon: "Minus",
    level: 0,
  },
}

export const HEALTH_CATEGORIES = [
  "sleep",
  "heart",
  "activity",
  "nutrition",
  "mind",
  "labs",
] as const

/**
 * What a reading is ABOUT. Identity, never verdict.
 *
 * A heart-red card does not mean something is wrong with a heart reading; it
 * means the reading concerns the heart. This is the axis products most often
 * misuse, because red already means something else everywhere else on the web.
 */
export type HealthCategory = (typeof HEALTH_CATEGORIES)[number]

export const HEALTH_CATEGORY_LABELS: Record<HealthCategory, string> = {
  sleep: "Sleep",
  heart: "Heart",
  activity: "Activity",
  nutrition: "Nutrition",
  mind: "Mind",
  labs: "Labs",
}

export function isClinicalStatus(value: unknown): value is ClinicalStatus {
  return (
    typeof value === "string" &&
    (CLINICAL_STATUSES as readonly string[]).includes(value)
  )
}

export function isHealthCategory(value: unknown): value is HealthCategory {
  return (
    typeof value === "string" &&
    (HEALTH_CATEGORIES as readonly string[]).includes(value)
  )
}

export interface AxisConflict {
  code: "OPSIN-0001"
  category: HealthCategory
  status: ClinicalStatus
  message: string
  docs: string
}

/**
 * THE NEVER-MIX RULE, as a function.
 *
 * Returns a conflict when a single surface has been given both a category and a
 * clinical status. `<StatusAxisDemo>` in this documentation calls it and
 * REFUSES to render the mixed pair. Nothing else calls it: none of the shipped
 * components resolves both axes on one element, so none of them has anything to
 * report, and a blanket per-props call would flag every correct tile and card
 * (`metric-tile.tsx` and `result-card.tsx` say so at their own tops). What
 * catches the mistake today is A11Y008 in `scripts/check-a11y.mts`, a static
 * check over component sources. It runs here and does not run in a consumer
 * project, so do not build on a warning appearing at runtime. OPSIN-0001 is
 * reserved in `tokens/errors.json` for the day a component does resolve both
 * axes and has to report it; this is the function it will call.
 *
 * Both axes may appear on one SCREEN. A heart-tinted card containing a
 * `watch` pill is correct and common. What may not happen is one surface
 * carrying both, because then the reader cannot tell which of the two the
 * colour is answering.
 *
 * THE MESSAGE BELOW IS A SECOND WORDING OF OPSIN-0001, ON PURPOSE.
 * `tokens/errors.json` owns the canonical one, and it opens with the component
 * name. This function does not have that name, because it is given two values
 * and not the thing that holds them. So the sentence differs and the RULE does
 * not.
 * `scripts/build-tokens.mts` asserts that this file claims the same code and
 * sends a reader to the same page; only the phrasing is free to differ, and if
 * you are adding a third wording somewhere, do not.
 */
export function axisConflict(input: {
  category?: HealthCategory | null
  status?: ClinicalStatus | null
}): AxisConflict | null {
  const { category, status } = input
  if (!category || !status) return null
  return {
    code: "OPSIN-0001",
    category,
    status,
    message:
      "This surface was given both a category (" +
      category +
      ") and a clinical status (" +
      status +
      "). A surface carries one axis. Set the category on the surface and render the status as a StatusPill inside it.",
    docs: "health/two-colour-axes",
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   SECTION CONTRACTS
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * The H2s a page must have, by `kind`. This is the outline
 * `content/_templates/*.mdx` implements, `<PageTemplate>` asserts and
 * `assert-ia.mts` checks; all three read it from here so they cannot drift.
 *
 * `component` is absent on purpose: a component page's outline depends on its
 * status as well as its kind, and lives in COMPONENT_SECTIONS_BY_STATUS below.
 */
export const SECTION_OUTLINES: Record<Exclude<Kind, "component">, string[]> = {
  foundation: [
    "Overview",
    "How it works",
    "Using it",
    "Tokens",
    "Accessibility impact",
    "Related",
  ],
  health: [
    "What this means",
    "The rule",
    "Why (evidence)",
    "Applying it",
    "Components that implement this",
    "What this does not cover",
    "Updates to this page",
  ],
  accessibility: [
    "What we guarantee",
    "What you own",
    "How to check",
    "Measured results",
    "Known gaps",
    "Updates to this page",
  ],
  content: [
    "The rule",
    "Approved / Rejected",
    "Patterns",
    "Banned words",
    "Related components",
  ],
  pattern: [
    "When to use",
    "When not to use",
    "How it works",
    "Content",
    "Accessibility",
    "Research",
    "Updates to this page",
  ],
  recipe: [
    "The task",
    "What you need",
    "Build it",
    "The copy",
    "Get it right",
    "Variations",
    "Related",
  ],
  screen: [
    "What this screen does",
    "Composition",
    "Preview",
    "Safety notes",
    "Accessibility",
    "Status",
  ],
  handbook: [
    "The short version",
    "How it works",
    "Do this",
    "Not this",
    "Gotchas",
    "Related",
  ],
  reference: ["How this is generated"],
  project: [],
  guide: ["Overview", "Verify it worked", "Troubleshooting", "Next"],
}

/**
 * `kind: project` is free-form and `kind: guide` has task sections between its
 * fixed first and last headings, so for these two the outline is a REQUIRED
 * SUBSET rather than the complete list. Everything else is exact.
 */
export const OUTLINE_IS_EXACT: Record<Exclude<Kind, "component">, boolean> = {
  foundation: true,
  health: true,
  accessibility: true,
  content: true,
  pattern: true,
  recipe: true,
  screen: true,
  handbook: true,
  reference: false,
  project: false,
  guide: false,
}

/**
 * The outline every component page with code behind it is held to. `shipped`
 * and `deprecated` both point at this one array on purpose. The phases named
 * different outlines once, which is why a page could not change release phase
 * without a content edit, and that coupling is what this array removes: a page
 * that satisfies this outline satisfies it at both phases, so retiring a
 * component is a frontmatter change and nothing else.
 *
 * THE PAGE IS LEAN, AND THIS LIST IS SHORT BECAUSE OF IT. ADR 0024 is the
 * record. A developer comes to a component page to see the component, install
 * it, copy the usage, check the props, and learn the one thing this system adds
 * to a shadcn-style page, which is when not to reach for it. The seventeen
 * section anatomy this replaced carried a Status heading, a States matrix, a
 * Motion section, a Tokens table and a CSS variables table on top of that, and
 * the corpus it produced ran past a quarter of a million words across sixty
 * pages, which nobody read. Blueprint documents a component in a few hundred
 * words and a props table, and that is the density these pages now aim at.
 *
 * The Status heading is gone and nothing honest went with it: `<StubNotice>`
 * still opens every component page, above the first H2, and still carries the
 * review floor and the open safety questions. Motion and Tokens are gone; a
 * reduced-motion fact that matters is one bullet under Accessibility. Anatomy,
 * States, Content guidelines, Data attributes and CSS variables stay in the
 * outline and are optional, so a single-part component with no authored copy
 * is never made to invent a section to satisfy a checklist.
 */
const SHIPPED_SECTIONS: string[] = [
  "Preview",
  "Installation",
  "Usage",
  "When to use it",
  "Clinical meaning",
  "Anatomy",
  "Examples",
  "States",
  "Content guidelines",
  "Accessibility",
  "Data attributes",
  "CSS variables",
  "API reference",
  "Related",
]

/**
 * THE COMPONENT PAGE ANATOMY, status-gated.
 *
 * The page header and the page footer are generated from frontmatter and never
 * appear as an H2, so neither is listed here, and neither is `<StubNotice>`,
 * which sits above the first H2 with no heading of its own. Everything else a
 * reader scrolls past is, in page order.
 *
 * This array is the ORDER and the ALLOWED SET, not the required set. A page may
 * leave out any section named in `COMPONENT_OPTIONAL_SECTIONS` below, and
 * `componentRequiredSections()` is the list that must actually be present. What
 * is present has to appear in the order given here, as a subsequence: sections
 * may be skipped, never reshuffled. A heading with nothing under it is worse
 * than an absent heading, and both enforcers fail the build on an empty one.
 *
 * `## Clinical meaning` is listed here but is mandatory only for a `health-*`
 * category and forbidden outside one, which is a category gate rather than an
 * omission the author chooses; `CATEGORY_GATED_SECTIONS` below is the rule and
 * `assert-ia.mts` checks both directions.
 *
 * `## Accessibility` is spelled that way at every status, and the section
 * changes meaning rather than name: at `planned` it is the bar the
 * implementation has to clear, and once the component ships it is the set of
 * results being reported. One spelling, because a reader scanning a page for
 * the accessibility contract should not have to know the release phase before
 * they know what to look for, and because two spellings gave every enforcer an
 * alias table to keep in step.
 *
 * There are two outlines and three phases, because `deprecated` documents code
 * that still installs and therefore owes a reader everything `shipped` owes
 * them plus the replacement. Only `planned` gets the shorter one, and it is
 * shorter for a reason a reader can check: a specification cannot report
 * measured results, so it has no `## Usage`, no `## Examples`, no
 * `## Data attributes` and no `## API reference`, and it carries
 * `## Proposed API` instead.
 */
export const COMPONENT_SECTIONS_BY_STATUS: Record<Status, string[]> = {
  planned: [
    "Preview",
    "Installation",
    "When to use it",
    "Clinical meaning",
    "Anatomy",
    "Proposed API",
    "Accessibility",
    "Related",
  ],
  shipped: SHIPPED_SECTIONS,
  deprecated: SHIPPED_SECTIONS,
}

/**
 * The sections a component page may leave out.
 *
 * Write one where there is something to say and leave it out where there is
 * not. Omitting one is not a defect. Inventing content for one is: an Anatomy
 * section on a component with one part draws a tree with one node, a States
 * matrix on a control that carries no reading says "not applicable" five
 * times, and a Content guidelines section on a component that renders no
 * authored copy has nothing to approve or reject. Data attributes earns its
 * place only when the component stamps something beyond `data-slot`, and CSS
 * variables only when it declares a custom property of its own.
 *
 * This is the only list. `scripts/assert-ia.mts` reads it as its
 * `CONDITIONAL_HEADINGS.component` and `components/docs/page-template.tsx` reads
 * it at render time, so the build-time and runtime enforcers cannot disagree
 * about which headings are allowed to be missing. It applies at every phase:
 * Anatomy is the one member the `planned` outline also carries, and a
 * specification may leave it out for the same reason a shipped page may.
 *
 * A section here is optional, not unordered. It still has to appear in its
 * `COMPONENT_SECTIONS_BY_STATUS` position when it appears at all.
 */
export const COMPONENT_OPTIONAL_SECTIONS: readonly string[] = [
  "Anatomy",
  "States",
  "Content guidelines",
  "Data attributes",
  "CSS variables",
]

/**
 * Sections whose presence depends on the component's category rather than on
 * its status. Required when `category` starts with the prefix, and forbidden
 * when it does not.
 */
export const CATEGORY_GATED_SECTIONS: {
  section: string
  requiredForCategoryPrefix: string
}[] = [{ section: "Clinical meaning", requiredForCategoryPrefix: "health-" }]

/**
 * The full ordered outline for a component page at a given status and category:
 * the canonical order, and the set of headings the page is allowed to carry.
 * Some of what comes back is optional, so do not use this as the missing-heading
 * check. `componentRequiredSections()` is that.
 */
export function componentSections(status: Status, category: string): string[] {
  const base = COMPONENT_SECTIONS_BY_STATUS[status]
  return base.filter((section) => {
    const gate = CATEGORY_GATED_SECTIONS.find((g) => g.section === section)
    if (!gate) return true
    return category.startsWith(gate.requiredForCategoryPrefix)
  })
}

/**
 * The sections a component page at this status and category must actually
 * carry: the outline above with the optional five taken out. This is what an
 * enforcer reports as missing, and it is deliberately a filter over
 * `componentSections()` rather than a second hand-written table, so the two can
 * never name a heading the other does not.
 */
export function componentRequiredSections(
  status: Status,
  category: string
): string[] {
  return componentSections(status, category).filter(
    (section) => !COMPONENT_OPTIONAL_SECTIONS.includes(section)
  )
}
