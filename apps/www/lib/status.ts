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

/*
 * The clinical vocabulary ships in `@opsinjs/react`, because the components
 * read it at runtime. This file re-exports it by relative path, so the plain
 * `node` scripts that import `lib/status.ts` keep one import.
 */
export {
  CLINICAL_STATUSES,
  CLINICAL_STATUS_META,
  HEALTH_CATEGORIES,
  HEALTH_CATEGORY_LABELS,
  isClinicalStatus,
  isHealthCategory,
  axisConflict,
} from "../../../packages/react/src/status.ts"

export type {
  ClinicalStatus,
  UnknownStatus,
  ClinicalStatusOrUnknown,
  ClinicalStatusMeta,
  HealthCategory,
  AxisConflict,
} from "../../../packages/react/src/status.ts"

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
