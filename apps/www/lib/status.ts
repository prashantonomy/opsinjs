/**
 * THE SINGLE STATUS VOCABULARY.
 *
 * `source.config.ts` declares the same two enums for frontmatter validation and
 * cannot export them, because fumadocs-mdx refuses any export from a source
 * config that is not a collection. This file is therefore the runtime copy,
 * and `assert-ia.mts` asserts the two agree. If you add a status or a kind,
 * add it in both places in the same commit.
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

export const STATUSES = [
  "stable",
  "beta",
  "alpha",
  "planned",
  "deprecated",
  "considered",
] as const

/** The release phase of a page or a catalogue entry. */
export type Status = (typeof STATUSES)[number]

export function isStatus(value: unknown): value is Status {
  return (
    typeof value === "string" && (STATUSES as readonly string[]).includes(value)
  )
}

export interface StatusMeta {
  /** The word shown on the badge. */
  label: string
  /** One sentence a reader can act on, shown in the status legend and on hover. */
  summary: string
  /**
   * What this phase PROMISES, in the wording the versioning policy is written
   * against. Nothing renders it: `<StatusBadge>` shows `label` and `summary`,
   * and `project/release-phases.mdx` states the same commitments in its own
   * prose. So this is the source a reviewer checks that page against, not a
   * string the page interpolates. Change a promise here and edit that page in
   * the same commit, because nothing will do it for you.
   */
  promise: string
  /** Sort order for the status matrix and the section-progress counts. */
  order: number
  /**
   * Whether a page at this status may show a working example. TWO phases may
   * not, for two different reasons: `planned`, which is a specification with no
   * code behind it, and `considered`, which was declined and never had any. The
   * other four all have something real to render.
   */
  canDemonstrate: boolean
  /**
   * UNREAD, AND IT HAS TO STAY THAT WAY.
   *
   * Nothing in this repository or in a consuming project reads this field.
   * `components/docs/status.tsx` tints the release-phase badge from a neutral
   * greyscale map and distinguishes the phases by border style and by the word,
   * deliberately: a release phase is not a clinical status, and painting
   * "Alpha" in the colour that means "a person should act" teaches a reader to
   * misread the one palette where misreading costs something. Do not wire this
   * into a badge, a pill, a token or a chart series. It is still declared only
   * because dropping a member from an interface that ships into consumer
   * projects through `shadcn add` is a versioning decision rather than a tidy-up.
   */
  tone: ClinicalStatus | "unknown"
}

/**
 * Ordered most-finished first. `order` is what `<StatusMatrix>` sorts on and
 * what `<SectionProgress>` counts in.
 */
export const STATUS_META: Record<Status, StatusMeta> = {
  stable: {
    label: "Stable",
    summary: "Finished. Safe to build on.",
    promise:
      "The JavaScript API, the rendered DOM, the data-* attributes and the CSS custom properties are all covered by semver. A breaking change requires a major version and a migration guide.",
    order: 0,
    canDemonstrate: true,
    tone: "steady",
  },
  beta: {
    label: "Beta",
    summary: "Complete and in use, but the surface may still move.",
    promise:
      "Feature-complete and accessibility-reviewed. The API may change in a minor version with a deprecation notice and at least one release of overlap.",
    order: 1,
    canDemonstrate: true,
    tone: "steady",
  },
  alpha: {
    label: "Alpha",
    summary: "Usable, incomplete, and expected to change.",
    promise:
      "It works and it is documented. The API may change in any release without a deprecation cycle. Not for a production health surface.",
    order: 2,
    canDemonstrate: true,
    tone: "watch",
  },
  planned: {
    label: "Planned",
    summary: "Specified in full. Not implemented. There is no code.",
    promise:
      "The page you are reading is a specification: what it is for, when not to use it, what it asserts clinically, its proposed anatomy and API, and the accessibility bar the implementation must clear. Nothing has been built. Do not generate code against it.",
    order: 3,
    canDemonstrate: false,
    tone: "attention",
  },
  deprecated: {
    label: "Deprecated",
    summary: "Still works. Being removed. A replacement is named.",
    promise:
      "It keeps working until the removal version stated on its page. Every deprecated entry names its replacement and its removal version, and the Deprecations page under Project lists them together.",
    order: 4,
    canDemonstrate: true,
    tone: "watch",
  },
  considered: {
    label: "Considered",
    summary:
      "Looked at, decided against for now, with the reason written down.",
    promise:
      "There is no specification, no code and no plan. There IS a catalogue row and a short generated page at the component's own address, saying why the name was declined and what to reach for instead. The address answers rather than 404s, which is the whole point of keeping the row. A considered entry is a decision, not a backlog item.",
    order: 5,
    canDemonstrate: false,
    tone: "unknown",
  },
}

/** Statuses in display order. */
export const STATUS_ORDER: Status[] = [...STATUSES].sort(
  (a, b) => STATUS_META[a].order - STATUS_META[b].order
)

/** True when a page at this status must carry a not-implemented marker. */
export function isNotImplemented(status: Status): boolean {
  return status === "planned" || status === "considered"
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
    icon: "Check",
    level: 1,
  },
  watch: {
    word: "Watch",
    sentence: "This reading is outside the usual range. Keep an eye on it.",
    assignedBy: "The consuming product, from a reference range it owns.",
    icon: "Eye",
    level: 2,
  },
  attention: {
    word: "Needs attention",
    sentence: "This reading needs to be looked at. Contact your care team.",
    assignedBy: "The consuming product, from a clinically reviewed threshold.",
    icon: "TriangleAlert",
    level: 3,
  },
  urgent: {
    word: "Urgent",
    sentence: "This reading needs help now.",
    assignedBy: "A clinically reviewed threshold with a named clinical owner.",
    icon: "OctagonAlert",
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
 * THE COMPONENT PAGE ANATOMY, status-gated.
 *
 * Sections 1 (header) and 22 (footer) are generated from frontmatter and never
 * appear as an H2, so they are not listed. Everything else is, in page order.
 *
 * At each status the listed sections are the WHOLE page. The others are
 * omitted, not left empty. A heading with nothing under it is worse than an
 * absent heading, and `<PageTemplate kind="component">` fails the build either
 * way. `## Clinical meaning` is included here but is mandatory only for a
 * `health-*` category and forbidden outside one; `assert-ia.mts` checks both
 * directions, which is why it is listed separately below.
 *
 * `considered` is the short one, and it is a real outline rather than an empty
 * list. Those pages are not authored: `emitConsideredStub()` in
 * `scripts/build-registry.mts` generates each one from its catalogue row with
 * exactly these three headings, which is the whole of what ADR 0008 allows a
 * page for a component nobody has designed. Leaving the entry out would make
 * `componentSections("considered", …)` empty, and the machine-readable page
 * contract `<PageTemplate>` emits would then tell an agent that a considered
 * page is entitled to no sections at all. Yet the page in front of it has
 * three. Keep this list and the generator in step.
 */
export const COMPONENT_SECTIONS_BY_STATUS: Record<Status, string[]> = {
  planned: [
    "Status",
    "Preview",
    "Installation",
    "When to use it",
    "Clinical meaning",
    "Anatomy",
    "Proposed API",
    "Content guidelines",
    "Accessibility requirements",
    "Related",
  ],
  alpha: [
    "Status",
    "Preview",
    "Installation",
    "Usage",
    "When to use it",
    "Clinical meaning",
    "Anatomy",
    "Examples",
    "Content guidelines",
    "Accessibility",
    "API reference",
    "Related",
  ],
  beta: [
    "Status",
    "Preview",
    "Installation",
    "Usage",
    "When to use it",
    "Clinical meaning",
    "Anatomy",
    "Examples",
    "States",
    "Content guidelines",
    "Motion",
    "Accessibility",
    "Data attributes",
    "CSS variables",
    "Tokens",
    "API reference",
    "Cost",
    "Related",
  ],
  stable: [
    "Status",
    "Preview",
    "Installation",
    "Usage",
    "When to use it",
    "Clinical meaning",
    "Anatomy",
    "Examples",
    "States",
    "Content guidelines",
    "Motion",
    "Accessibility",
    "Data attributes",
    "CSS variables",
    "Tokens",
    "API reference",
    "Cost",
    "Related",
    "Research and rationale",
  ],
  deprecated: [
    "Status",
    "Preview",
    "Installation",
    "Usage",
    "When to use it",
    "Clinical meaning",
    "Anatomy",
    "Content guidelines",
    "Accessibility",
    "API reference",
    "Related",
  ],
  considered: [
    "What this name refers to",
    "Why it is not on the roster",
    "What to use instead",
  ],
}

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
 * The H2 that carries a component's accessibility contract. It is named
 * "Accessibility requirements" at `planned`, because at that status it is a bar
 * the implementation must clear rather than a set of results, and
 * "Accessibility" from `alpha` onwards, when there is something to measure.
 * Mandatory at every status; never delegated upstream.
 */
export function accessibilitySectionFor(status: Status): string {
  return status === "planned" ? "Accessibility requirements" : "Accessibility"
}

/** The sections required for a component page at a given status and category. */
export function componentSections(status: Status, category: string): string[] {
  const base = COMPONENT_SECTIONS_BY_STATUS[status]
  return base.filter((section) => {
    const gate = CATEGORY_GATED_SECTIONS.find((g) => g.section === section)
    if (!gate) return true
    return category.startsWith(gate.requiredForCategoryPrefix)
  })
}
