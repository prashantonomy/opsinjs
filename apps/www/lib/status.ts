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
 * way out. They say nothing about review. Every component has since been
 * audited against WCAG 2.2 AA and its findings fixed, but by the authors and
 * not by an independent party, and none has had a clinical review.
 * `REVIEW_FLOOR_NOTICE` below is that whole floor as one string, and
 * `STATUS_META.shipped.summary` ends with it, so every chip on the site
 * carries it. ADR 0025 is the record of the audit and of what it is not.
 *
 * THE OLD CARRIER LIST NAMED SIX PLACES AND THE SENTENCE LIVES IN MORE THAN
 * TEN. Counting them was the mistake. An editor who revised the six that were
 * listed and stopped left the others promising something slightly different,
 * which is how one review floor becomes four. The count is therefore gone and
 * the constant is here instead. Two carriers reuse it verbatim,
 * `STATUS_META.shipped` and the `unreviewed` field in
 * `app/r/index.json/route.ts`, and `app/api/search/route.ts` composes it into
 * a longer indexed line. The rest cannot reuse it, because they are
 * mid-paragraph in prose written for a reader: "no independent accessibility
 * review" and "audited by the authors, not independently reviewed" are the
 * same floor in the grammar each paragraph needs. Those are restatements on
 * purpose. To find every one of them before you change the floor, run
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

/**
 * What a release phase shows on a badge. A label and one sentence a reader
 * can act on, which is also the chip's title and its accessible name.
 */
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
 * `shipped` means the source installs. Every component has since been audited
 * against WCAG 2.2 AA and its findings fixed, but that audit was run by the
 * authors and not by an independent party, and no component has had a clinical
 * review. So the floor now records three things at once: the audit that
 * happened, the independent review that did not, and the clinical review that
 * did not. ADR 0025 is the record. This sentence is the machine-readable form
 * of that floor, so it can be moved and it cannot be softened away.
 *
 * Every clause is load-bearing. "Audited against WCAG 2.2 AA" without the rest
 * reads as a clean bill of health nobody signed; "no independent accessibility
 * review" alone reads as though nothing was checked; and dropping "not for a
 * production health surface" lets a reader weigh an unreviewed health component
 * against a deadline. SAFE001 in `scripts/assert-ia.mts` holds the shorter
 * per-page form of the same floor on every component page.
 *
 * It is a plain string because that is the only shape this module allows: no
 * imports, no JSX, no non-erasable syntax, since `scripts/*.mts` run under
 * plain node and import this file directly.
 */
export const REVIEW_FLOOR_NOTICE =
  "Audited against WCAG 2.2 AA. No independent accessibility review and no clinical review, so not for a production health surface."

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
  "guide",
  "foundation",
  "component",
  "health",
  "pattern",
  "reference",
] as const

/**
 * A page's kind, one per sidebar section. Only `component` fixes the page's
 * headings; every other kind names its own, as a page on blueprintjs.com does.
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

/**
 * The four clinical statuses plus `unknown`. Unknown is the absence of an
 * assertion rather than a fifth level of urgency.
 */
export type ClinicalStatusOrUnknown = ClinicalStatus | UnknownStatus

/**
 * Everything a clinical status carries besides its colour. The word, the
 * example sentence, who may assign it, its icon and its place in the order.
 */
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

/**
 * A refusal. It is what the system answers when a measurement category and a
 * clinical status are asked to share one surface.
 */
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
 * The H2s a page must have, by `kind`, for every kind but `component`.
 *
 * Every one is empty. A guide, a foundation, a health page, a pattern or a
 * reference page names its own sections, the way clawscale and blueprintjs.com
 * pages do, so a page is never made to invent prose to fill a heading. Only a
 * component page has a fixed outline, below.
 */
export const SECTION_OUTLINES: Record<Exclude<Kind, "component">, string[]> = {
  guide: [],
  foundation: [],
  health: [],
  pattern: [],
  reference: [],
}

/** No kind other than `component` has an exact outline. */
export const OUTLINE_IS_EXACT: Record<Exclude<Kind, "component">, boolean> = {
  guide: false,
  foundation: false,
  health: false,
  pattern: false,
  reference: false,
}

/**
 * The outline every component page with code behind it is held to, in order.
 * `shipped` and `deprecated` share it, so retiring a component is a frontmatter
 * change and nothing else.
 *
 * It is the clawscale and blueprintjs.com shape (Usage, Examples, Props
 * interface) plus the three things a health system adds: when not to reach for
 * the component, what it means clinically (health components only) and an
 * accessibility triage. `<StubNotice>` opens the page above the first H2 and
 * carries the review floor and the open safety questions. ADR 0026 is the
 * record.
 */
const SHIPPED_SECTIONS: string[] = [
  "Usage",
  "Examples",
  "When to use it",
  "Clinical meaning",
  "Accessibility",
  "Props interface",
]

/**
 * The outline by release phase. A `planned` page has nothing to install or
 * show, so it carries the specification instead: what it is for, what it means
 * clinically, the proposed API and the accessibility contract. No page is
 * `planned` today; the outline stays so that adding one is not a redesign.
 */
export const COMPONENT_SECTIONS_BY_STATUS: Record<Status, string[]> = {
  planned: [
    "When to use it",
    "Clinical meaning",
    "Proposed API",
    "Accessibility",
  ],
  shipped: SHIPPED_SECTIONS,
  deprecated: SHIPPED_SECTIONS,
}

/**
 * Sections a component page may leave out. None: every section in the outline
 * has something true to say on every component, and the one conditional
 * section, Clinical meaning, is gated by category below rather than optional.
 */
export const COMPONENT_OPTIONAL_SECTIONS: readonly string[] = []

/**
 * Sections whose presence depends on the component's category. Clinical
 * meaning is required on a `health-*` component and forbidden elsewhere,
 * because a component outside the health categories asserts nothing clinical.
 */
export const CATEGORY_GATED_SECTIONS: {
  section: string
  requiredForCategoryPrefix: string
}[] = [{ section: "Clinical meaning", requiredForCategoryPrefix: "health-" }]

/** The outline for one component page, with the category gate applied. */
export function componentSections(status: Status, category: string): string[] {
  const base = COMPONENT_SECTIONS_BY_STATUS[status]
  return base.filter((section) => {
    const gate = CATEGORY_GATED_SECTIONS.find((g) => g.section === section)
    if (!gate) return true
    return category.startsWith(gate.requiredForCategoryPrefix)
  })
}

/** The sections a component page must carry: its outline minus the optional ones. */
export function componentRequiredSections(
  status: Status,
  category: string
): string[] {
  return componentSections(status, category).filter(
    (section) => !COMPONENT_OPTIONAL_SECTIONS.includes(section)
  )
}
