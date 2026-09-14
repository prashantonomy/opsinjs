/**
 * THE CATALOGUE is the single source of truth for what opsinjs contains.
 *
 * Everything downstream reads this file and nothing re-declares it: the status
 * matrix, the sidebar chips, `/r/index.json`, `/r/registry.json`, `llms.txt`,
 * the roadmap, and the "considered, not implemented" answer an agent gets when
 * it asks about a component that will never have a hand-written page.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THIS FILE OWNS THE ENTIRE ALIAS NAMESPACE.
 *
 * `aliases` are search synonyms. They are indexed by fumadocs, emitted into
 * `llms.txt` and into `/r/index.json`, and they must be globally unique across
 * the whole corpus. An alias that resolves to two pages resolves to neither.
 * Uniqueness cannot survive fifteen authors inventing synonyms in parallel, so
 * it is declared here once. A component page's frontmatter COPIES the array
 * below verbatim; it never invents one.
 *
 * WHAT IS ACTUALLY ENFORCED, because this comment used to claim three things and
 * only one of them existed:
 *   CAT005  fatal    two pages claim the same alias
 *   CAT007  fatal    an alias is also a catalogue id. This was added after
 *                    `status-pill` claimed `badge`, which is a real component
 *                    and its opposite
 *   CAT006  warning  a page is MISSING an alias its catalogue row has
 *   CAT011  warning  a page claims an alias its catalogue row does NOT have
 * CAT011 closed the gap this paragraph used to describe. The agreement between a
 * row and its page is now checked in both directions, so "copies the array
 * verbatim" is a gate rather than a convention, and a synonym invented in
 * frontmatter is reported rather than silently indexed.
 *
 * What is still NOT checked anywhere is the reserved list at the bottom of this
 * file against the rows above it. See the comment on `RESERVED_ALIASES` for the
 * two words that divergence has already cost.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * THIRTY-SEVEN ROWS ARE BUILT: twenty-five at `status: "beta"` and twelve at
 * `status: "alpha"`. Each has a
 * file at `registry/bases/base/<id>.tsx`, renders at
 * `/view/base/base-lyra/component/<id>`, and installs with `shadcn add`. Neither
 * phase is a promise of full stability: at alpha the API may change in any
 * release without a deprecation cycle, at beta it breaks only in a minor release
 * with a documented migration, and none of it has been through an accessibility
 * or clinical review. The other twenty-three rows carry `status: "considered"`,
 * which is a reserved name and a reason to reach for something else, with no
 * code and no hand-written page. The only page any of them has is a stub that
 * `scripts/build-registry.mts` generates from the row, so the address answers
 * instead of returning a 404.
 *
 * `planned` means specified in full, with no code. See `lib/status.ts`. It is
 * still a legal status and pages elsewhere in the corpus use it, but no row in
 * this file does. Do not copy it onto a new row on the assumption that it is
 * what a shipped row says. A row reaches `alpha` in the same commit as the file
 * under `registry/bases/base/` that implements it and the `status` in that
 * component's page frontmatter; the three never move apart.
 *
 * Imports here are relative and carry an explicit `.ts` extension because
 * `scripts/build-registry.mts` is executed by plain `node`, which does not read
 * the `@/*` path alias. Same reason there is no JSX and no non-erasable syntax
 * anywhere in this file.
 */

import type { HealthCategory, Status } from "../lib/status.ts"

/**
 * A catalogue category. The first four begin with `health-`, which is what
 * makes the Clinical meaning section and the `governedBy` frontmatter mandatory
 * on that component's page. `assert-ia.mts` enforces it in both directions.
 */
export const CATALOGUE_CATEGORIES = [
  "health-data-display",
  "health-communication",
  "health-input",
  "health-formatting",
  "data-display",
  "surfaces",
  "feedback",
  "overlay",
  "navigation",
  "actions-and-forms",
  "layout",
  "utility",
] as const

export type CatalogueCategory = (typeof CATALOGUE_CATEGORIES)[number]

/** Human labels for the categories, used by the status matrix and the sidebar. */
export const CATALOGUE_CATEGORY_LABELS: Record<CatalogueCategory, string> = {
  "health-data-display": "Health data display",
  "health-communication": "Health communication",
  "health-input": "Health input",
  "health-formatting": "Health formatting",
  "data-display": "Data display",
  surfaces: "Surfaces",
  feedback: "Feedback",
  overlay: "Overlay",
  navigation: "Navigation",
  "actions-and-forms": "Actions and forms",
  layout: "Layout",
  utility: "Utility",
}

export interface CatalogueEntry {
  /**
   * kebab-case. The URL segment, the registry item name, and the id every
   * other file refers to.
   *
   * It is called `name` rather than `id` because that is what the shadcn
   * registry specification calls it, and `/r/index.json` and
   * `/r/registry.json` serve these rows more or less verbatim. A row whose
   * `name` had to be renamed on the way out would be a row that could drift.
   */
  name: string
  /** PascalCase. How the component is named in prose and in code. */
  title: string
  /**
   * One plain-English sentence describing what a READER sees, written for the
   * patient and not for the engineer. This is the second column of the status
   * matrix and the card subtitle in `<ComponentsList>`.
   *
   * It is NOT the page's H1 subtitle. That comes from the page's own
   * frontmatter `description`, and on all but one row the two sentences are
   * worded differently. A card subtitle has to survive on one line and a page
   * subtitle does not. Nothing compares them, so editing this one will not
   * change the page: when you change either, read the other and make sure they
   * still describe the same component.
   */
  description: string
  category: CatalogueCategory
  status: Status
  /** Version this entry was introduced in. `"unreleased"` until something ships. */
  since: string
  /** Search synonyms. Globally unique. Copied verbatim into page frontmatter. */
  aliases: string[]
  /** The discipline that reviews this component's specification. */
  owner: "design" | "engineering" | "clinical" | "content"
  /**
   * Date of the last accessibility review, ISO 8601. `null` on every row,
   * because no accessibility review has happened. It has not happened for the
   * twenty-five built components either. Rendering a date here that nobody
   * produced would be the exact dishonesty this file exists to avoid, so the
   * matrix prints "not yet reviewed" rather than a placeholder.
   */
  a11yDate: string | null
  /**
   * Doctrine pages that govern this component, by page id. Mandatory for every
   * `health-*` category. These are ids, not paths. `lib/routes.ts` turns them
   * into URLs.
   */
  governedBy?: string[]
  /** The health category whose colour ramp this component may use, if any. */
  healthCategory?: HealthCategory
  /**
   * The recipes and screens that use this component: the reverse of a recipe's
   * component list. Write the bare page id `health-metric-card` rather than
   * `recipes/health-metric-card`.
   *
   * This is what `/r/index.json` publishes as the reverse index. The component
   * page's own frontmatter carries the same list and is what renders in the
   * page's anatomy block; nothing in `assert-ia.mts` compares the two, so a row
   * left empty after its page gained a recipe is a silent gap. Populate it in
   * the same edit that adds the component to the recipe.
   */
  usedIn?: string[]
  /**
   * The measured contrast scopes this component renders colour from, declared by
   * the component's author. `components/docs/a11y.tsx` resolves a
   * `<ContrastReport component="…">` through this list and shows every measured
   * row whose scope is named here, so the report resolves to real rows rather
   * than an empty state. The four scope names are the ones
   * `lib/generated/contrast.json` measures: `category`, `status`, `materials`
   * and `neutral`.
   *
   * It is NOT a per-component measurement and must never be described as one. The
   * numbers are per token pair, shared across every component that draws the same
   * pair. What this field records is which of those shared scopes a component's
   * own parts paint. A scope owned entirely by a composed child, for example the
   * status colour a card delegates to an embedded StatusPill, belongs to that
   * child's row and its own report, not to this one. A material rung the
   * component names itself, for example a `rung="card"` or `rung="scrim"` this
   * file hard-codes on a Surface, counts as painted here even though Surface
   * does the painting: the component chose the rung, so the pair is one a reader
   * of this component asks about. Every component paints text
   * or a boundary, so every built row names `neutral` at least. Leave the field
   * off a `considered` row: it has no code and no page to carry a report.
   */
  contrastScopes?: string[]
  /**
   * npm packages this component's source imports, exactly as they appear in a
   * `package.json`. `["@base-ui/react"]` for anything built on a Base UI
   * primitive; `["lucide-react"]` for anything that renders a status icon.
   *
   * It is declared on the row rather than inferred from the source because a
   * consumer's `shadcn add` installs precisely this list, and a list scraped
   * from import statements would silently follow a refactor into installing
   * something nobody reviewed. Omit it rather than writing `[]`. A component
   * whose only imports are `@/lib/utils` and `@/lib/opsinjs` needs nothing.
   */
  dependencies?: string[]
  /**
   * Other opsinjs components this one composes, by bare catalogue id.
   *
   * `result-card` names `status-pill` and `value` here and never inlines a copy
   * of either: a second copy of a status pill is a second place the two colour
   * axes can drift apart. Bare ids, because the catalogue does not know what a
   * registry namespace is. `app/_machine/registry-payload.ts` prefixes
   * `@opsinjs/` when it serves the item, which is what makes shadcn resolve the
   * dependency against this registry instead of against ui.shadcn.com.
   *
   * Every id must be a real catalogue `name`. A dependency on a `considered`
   * row is a dependency on something that will never exist.
   */
  registryDependencies?: string[]
  /**
   * Considered rows only: why it is not on the shipped roster. This is what an
   * agent gets back instead of a 404, and it is the reason the considered
   * roster is in the catalogue at all. Plain prose, no markdown: it is rendered
   * as MDX on the generated stub page AND as a text node in the status matrix,
   * and a link written here shows up as literal brackets in the second.
   */
  why?: string
  /**
   * Considered rows only: what to reach for instead, and EVERY ID HERE MUST BE
   * ONE OF THE 25 BUILT ONES.
   *
   * `emitConsideredStub` in `scripts/build-registry.mts` turns each id into a
   * link on the stub page, so naming another `considered` row resolves. It
   * hands the reader a second page that also says "not built, use something
   * else". That is the dead end this roster exists to prevent: the point of the
   * row is that the answer ends here. `tabs` and `segmented-control` used to
   * name each other, which sent an agent round in a circle, and four other rows
   * pointed one hop into the unbuilt set.
   *
   * When no built component is the honest answer, OMIT THE FIELD rather than
   * naming an unbuilt id. The generator then says there is no direct
   * replacement and points at the catalogue, and `why` above carries the real
   * answer. For the rows delegated to Base UI, that answer is Base UI's own
   * component, which is not ours to list here.
   */
  useInstead?: string[]
}

/**
 * THE THIRTY-SEVEN SHIPPED IDS. Every one has a specification page at
 * `/docs/components/<id>` and a row in `/r/index.json`. Order within a category
 * is the order they appear in the sidebar.
 */
export const SHIPPED: CatalogueEntry[] = [
  {
    name: "result-card",
    title: "ResultCard",
    description:
      "One test result, showing the number, what it is compared against, and what it means.",
    category: "health-data-display",
    status: "beta",
    since: "unreleased",
    aliases: [
      "results",
      "lab result",
      "test result",
      "report card",
      "blood pressure",
      "a1c",
    ],
    owner: "clinical",
    a11yDate: null,
    governedBy: [
      "two-colour-axes",
      "reference-ranges",
      "numbers-units-precision",
      "uncertainty-and-staleness",
      "clinical-status-semantics",
      "data-provenance-and-device-accuracy",
      "delivering-difficult-results",
      "on-screen-privacy",
    ],
    healthCategory: "labs",
    registryDependencies: ["status-pill", "value", "range-bar", "relative-time", "button", "link"],
    usedIn: [
      "choose-a-component",
      "health-metric-card",
      "result-disclosure",
      "results-screen",
      "sharing-with-a-clinician",
      "value-against-a-range",
    ],
    contrastScopes: ["category", "neutral"],
  },
  {
    name: "range-bar",
    title: "RangeBar",
    description:
      "A bar showing where one reading sits against the range it is compared with.",
    category: "health-data-display",
    status: "beta",
    since: "unreleased",
    aliases: [
      "reference range",
      "normal range",
      "in range",
      "range indicator",
      "gauge bar",
    ],
    owner: "clinical",
    a11yDate: null,
    governedBy: [
      "two-colour-axes",
      "reference-ranges",
      "numbers-units-precision",
      "unit-systems",
    ],
    dependencies: ["lucide-react"],
    registryDependencies: ["value", "status-pill"],
    usedIn: [
      "choose-a-component",
      "result-disclosure",
      "results-screen",
      "trend-review",
      "value-against-a-range",
    ],
    contrastScopes: ["category", "neutral", "status"],
  },
  {
    name: "score-dial",
    title: "ScoreDial",
    description:
      "A single composite number drawn as a ring, with the words that say what it counts.",
    category: "health-data-display",
    status: "beta",
    since: "unreleased",
    aliases: ["dial", "ring", "gauge", "score", "index", "bmi"],
    owner: "design",
    a11yDate: null,
    governedBy: [
      "reference-ranges",
      "risk-and-statistics",
      "numbers-units-precision",
      "two-colour-axes",
      "motion-in-health-ui",
      "category-identity",
    ],
    dependencies: ["lucide-react"],
    registryDependencies: ["value", "status-pill"],
    usedIn: ["choose-a-component", "health-metric-card", "results-screen"],
    contrastScopes: ["category", "neutral", "status"],
  },
  {
    name: "trend-sparkline",
    title: "TrendSparkline",
    description:
      "A small chart of one reading over time, with an honest caption saying what changed.",
    category: "health-data-display",
    status: "beta",
    since: "unreleased",
    aliases: ["sparkline", "trend", "over time", "mini chart", "line chart", "chart", "graph"],
    owner: "clinical",
    a11yDate: null,
    governedBy: [
      "trends-and-change",
      "numbers-units-precision",
      "uncertainty-and-staleness",
      "category-identity",
    ],
    registryDependencies: ["status-pill", "value"],
    usedIn: [
      "choose-a-component",
      "sharing-with-a-clinician",
      "trend-review",
      "trend-with-a-caption",
      "trends-screen",
    ],
    contrastScopes: ["category", "neutral"],
  },
  {
    name: "metric-tile",
    title: "MetricTile",
    description:
      "A compact tile showing one reading, its unit and when it was taken.",
    category: "health-data-display",
    status: "beta",
    since: "unreleased",
    aliases: [
      "stat",
      "kpi",
      "vitals",
      "summary tile",
      "steps",
      "resting heart rate",
      "spo2",
      "tile",
    ],
    owner: "design",
    a11yDate: null,
    governedBy: [
      "category-identity",
      "clinical-interaction-guidelines",
      "clinical-status-semantics",
      "data-provenance-and-device-accuracy",
      "numbers-units-precision",
      "on-screen-privacy",
      "reference-ranges",
      "trends-and-change",
      "two-colour-axes",
      "uncertainty-and-staleness",
      "unit-systems",
    ],
    dependencies: ["lucide-react"],
    registryDependencies: ["surface", "value", "status-pill", "relative-time"],
    usedIn: [
      "alert-escalation",
      "choose-a-component",
      "daily-log-screen",
      "empty-and-first-use",
      "health-metric-card",
      "offline-and-stale-data",
      "results-screen",
      "trend-review",
      "trends-screen",
    ],
    contrastScopes: ["category", "materials", "neutral"],
  },
  {
    name: "status-pill",
    title: "StatusPill",
    description:
      "A short label saying what a reading means and what, if anything, to do about it.",
    category: "health-data-display",
    status: "beta",
    since: "unreleased",
    aliases: ["chip", "status chip", "status badge", "status label", "traffic light"],
    owner: "clinical",
    a11yDate: null,
    governedBy: [
      "clinical-status-semantics",
      "two-colour-axes",
      "alarm-fatigue",
      "category-identity",
    ],
    usedIn: [
      "alert-escalation",
      "choose-a-component",
      "health-metric-card",
      "offline-and-stale-data",
      "result-disclosure",
      "results-screen",
      "staged-alert",
      "trend-review",
      "value-against-a-range",
    ],
    contrastScopes: ["neutral", "status"],
    dependencies: ["lucide-react"],
  },
  {
    name: "timeline-entry",
    title: "TimelineEntry",
    description: "One dated event in a vertical history.",
    category: "health-data-display",
    status: "alpha",
    since: "unreleased",
    aliases: ["history item", "event list", "activity feed"],
    owner: "design",
    a11yDate: null,
    governedBy: ["uncertainty-and-staleness", "trends-and-change"],
    registryDependencies: ["relative-time", "status-pill"],
    usedIn: ["daily-log-screen"],
    contrastScopes: ["neutral"],
  },
  {
    name: "range-legend",
    title: "RangeLegend",
    description: "The key explaining what the bands on a range mean.",
    category: "health-data-display",
    status: "alpha",
    since: "unreleased",
    aliases: ["key", "chart legend", "band legend"],
    owner: "design",
    a11yDate: null,
    governedBy: ["reference-ranges", "two-colour-axes"],
    dependencies: ["lucide-react"],
    usedIn: ["trends-screen"],
    contrastScopes: ["neutral", "status"],
  },

  {
    name: "alert-banner",
    title: "AlertBanner",
    description:
      "A prominent message about something that needs the reader's attention now.",
    category: "health-communication",
    status: "beta",
    since: "unreleased",
    aliases: [
      "warning banner",
      "notification banner",
      "inline alert",
      "warning",
      "notification",
      "alert",
      "banner",
    ],
    owner: "clinical",
    a11yDate: null,
    governedBy: [
      "two-colour-axes",
      "clinical-status-semantics",
      "alarm-fatigue",
      "motion-in-health-ui",
      "emergency-and-escalation",
      "notifications-and-off-screen-alerts",
      "crisis-and-self-harm",
      "delivering-difficult-results",
    ],
    registryDependencies: ["status-pill", "button", "relative-time", "link"],
    usedIn: [
      "alert-escalation",
      "choose-a-component",
      "forms/error-summaries",
      "offline-and-stale-data",
      "result-disclosure",
      "results-screen",
      "staged-alert",
    ],
    contrastScopes: ["neutral", "status"],
  },
  {
    name: "care-card",
    title: "CareCard",
    description: "A card saying what to do next, and how urgently.",
    category: "health-communication",
    status: "beta",
    since: "unreleased",
    aliases: [
      "what to do next",
      "action card",
      "advice card",
      "next steps",
      "guidance card",
      "what to do",
      "advice",
    ],
    owner: "clinical",
    a11yDate: null,
    governedBy: [
      "two-colour-axes",
      "clinical-status-semantics",
      "alarm-fatigue",
      "clinical-interaction-guidelines",
      "emergency-and-escalation",
    ],
    registryDependencies: ["card", "button", "status-pill", "link"],
    usedIn: [
      "alert-escalation",
      "ask-users-for/contact-details",
      "ask-users-for/symptoms",
      "choose-a-component",
      "consent-and-permissions",
      "empty-and-first-use",
      "offline-and-stale-data",
      "onboarding-and-first-run",
      "onboarding-screen",
      "result-disclosure",
      "results-screen",
      "sharing-with-a-clinician",
      "staged-alert",
    ],
    contrastScopes: ["neutral"],
  },
  {
    name: "term",
    title: "Term",
    description:
      "A clinical word with its everyday meaning attached, so a sentence can be read without leaving it.",
    category: "health-communication",
    status: "beta",
    since: "unreleased",
    aliases: ["glossary term", "jargon", "plain word", "definition", "plain english", "tooltip term"],
    owner: "content",
    a11yDate: null,
    governedBy: ["who-this-is-for", "clinical-interaction-guidelines"],
    usedIn: [
      "ask-users-for/ethnicity",
      "ask-users-for/medications",
      "ask-users-for/sex-and-gender",
      "ask-users-for/symptoms",
      "choose-a-component",
      "consent-and-permissions",
      "consent-flow",
      "onboarding-screen",
      "result-disclosure",
      "results-screen",
      "trends-screen",
      "value-against-a-range",
    ],
    contrastScopes: ["neutral"],
  },
  {
    name: "consent-sheet",
    title: "ConsentSheet",
    description:
      "A sheet that asks permission for one specific thing, and records the answer.",
    category: "health-communication",
    status: "beta",
    since: "unreleased",
    aliases: ["consent", "permission", "opt in", "data sharing", "agree"],
    owner: "clinical",
    a11yDate: null,
    governedBy: ["consent-and-disclosure", "clinical-interaction-guidelines", "crisis-and-self-harm", "regulatory-context"],
    dependencies: ["lucide-react"],
    registryDependencies: ["sheet", "button"],
    usedIn: [
      "ask-users-for/contact-details",
      "consent-and-permissions",
      "consent-before-collection",
      "consent-flow",
      "forms/required-and-optional",
      "onboarding-and-first-run",
      "onboarding-screen",
      "sharing-with-a-clinician",
    ],
    contrastScopes: ["neutral"],
  },
  {
    name: "disclaimer-note",
    title: "DisclaimerNote",
    description: "The standing note about what this information is and is not.",
    category: "health-communication",
    status: "beta",
    since: "unreleased",
    aliases: ["disclaimer", "not medical advice", "legal note", "small print", "safety note"],
    owner: "clinical",
    a11yDate: null,
    governedBy: [
      "regulatory-context",
      "clinical-interaction-guidelines",
      "safety-review-checklist",
    ],
    dependencies: ["lucide-react"],
    registryDependencies: ["link"],
    usedIn: [
      "ask-users-for/ethnicity",
      "ask-users-for/height-and-weight",
      "ask-users-for/medications",
      "ask-users-for/sex-and-gender",
      "ask-users-for/symptoms",
      "choose-a-component",
      "consent-and-permissions",
      "consent-flow",
      "onboarding-and-first-run",
      "onboarding-screen",
      "result-disclosure",
      "results-screen",
      "sharing-with-a-clinician",
      "value-against-a-range",
    ],
    contrastScopes: ["neutral"],
  },

  {
    name: "source-citation",
    title: "SourceCitation",
    description:
      "Where a piece of health information came from, and when it was last checked.",
    category: "health-communication",
    status: "alpha",
    since: "unreleased",
    aliases: ["citation", "evidence link", "reviewed by"],
    owner: "content",
    a11yDate: null,
    governedBy: ["data-provenance-and-device-accuracy", "evidence-and-references"],
    registryDependencies: ["link"],
    usedIn: ["results-screen"],
    contrastScopes: ["neutral"],
  },
  {
    name: "log-sheet",
    title: "LogSheet",
    description:
      "A form for writing down what happened today, in as few taps as possible.",
    category: "health-input",
    status: "beta",
    since: "unreleased",
    aliases: ["log", "diary", "journal", "daily entry", "capture", "quick entry", "bottom sheet entry"],
    owner: "design",
    a11yDate: null,
    governedBy: [
      "numbers-units-precision",
      "unit-systems",
      "consent-and-disclosure",
    ],
    registryDependencies: ["sheet", "field", "button"],
    usedIn: [
      "ask-users-for/height-and-weight",
      "ask-users-for/medications",
      "ask-users-for/symptoms",
      "daily-log-entry",
      "daily-log-screen",
      "daily-logging",
      "forms/autocomplete-and-input-types",
      "forms/question-pages",
      "forms/required-and-optional",
      "forms/units-and-numeric-entry",
      "forms/validation-timing",
    ],
    contrastScopes: ["category", "neutral"],
  },
  {
    name: "reading-input",
    title: "ReadingInput",
    description:
      "An input for typing in a measurement, with the unit shown and switchable beside the number.",
    category: "health-input",
    status: "beta",
    since: "unreleased",
    aliases: [
      "enter a reading",
      "measurement input",
      "numeric entry",
      "manual entry",
      "numeric input",
      "unit switch",
    ],
    owner: "engineering",
    a11yDate: null,
    governedBy: ["numbers-units-precision", "unit-systems", "uncertainty-and-staleness"],
    dependencies: ["lucide-react"],
    registryDependencies: ["field"],
    usedIn: [
      "ask-users-for/date-of-birth",
      "ask-users-for/height-and-weight",
      "ask-users-for/medications",
      "daily-log-entry",
      "daily-log-screen",
      "daily-logging",
      "forms/autocomplete-and-input-types",
      "forms/question-pages",
      "forms/units-and-numeric-entry",
      "forms/validation-timing",
      "onboarding-and-first-run",
      "onboarding-screen",
    ],
    contrastScopes: ["neutral"],
  },
  {
    name: "body-map",
    title: "BodyMap",
    description: "A diagram of a body for pointing at where something hurts.",
    category: "health-input",
    status: "alpha",
    since: "unreleased",
    aliases: ["pain map", "anatomy diagram", "where does it hurt"],
    owner: "design",
    a11yDate: null,
    governedBy: ["two-colour-axes"],
    contrastScopes: ["neutral"],
  },

  {
    name: "value",
    title: "Value",
    description:
      "One number and its unit, formatted the same way everywhere in the product.",
    category: "health-formatting",
    status: "beta",
    since: "unreleased",
    aliases: ["number", "unit", "format a number", "numeric display", "figure", "format", "formatted number"],
    owner: "content",
    a11yDate: null,
    governedBy: [
      "numbers-units-precision",
      "unit-systems",
      "clinical-interaction-guidelines",
      "data-provenance-and-device-accuracy",
      "on-screen-privacy",
      "reference-ranges",
      "risk-and-statistics",
      "safety-review-checklist",
      "uncertainty-and-staleness",
      "who-this-is-for",
    ],
    usedIn: [
      "ask-users-for/height-and-weight",
      "choose-a-component",
      "daily-log-screen",
      "daily-logging",
      "forms/units-and-numeric-entry",
      "health-metric-card",
      "onboarding-screen",
      "results-screen",
      "sharing-with-a-clinician",
      "trend-review",
      "trends-screen",
      "value-against-a-range",
    ],
    contrastScopes: ["neutral"],
  },
  {
    name: "relative-time",
    title: "RelativeTime",
    description:
      "When a reading was taken, said the way a person would say it.",
    category: "health-formatting",
    status: "beta",
    since: "unreleased",
    aliases: ["time ago", "timestamp", "last updated", "date display", "ago", "freshness", "staleness"],
    owner: "content",
    a11yDate: null,
    governedBy: ["uncertainty-and-staleness", "numbers-units-precision"],
    usedIn: [
      "choose-a-component",
      "daily-log-screen",
      "daily-logging",
      "health-metric-card",
      "offline-and-stale-data",
      "results-screen",
      "sharing-with-a-clinician",
      "trend-review",
      "trends-screen",
    ],
    contrastScopes: ["neutral"],
  },

  {
    name: "table",
    title: "Table",
    description: "Rows and columns of data.",
    category: "data-display",
    status: "alpha",
    since: "unreleased",
    aliases: ["data table", "grid", "rows and columns"],
    owner: "engineering",
    a11yDate: null,
    usedIn: ["trends-screen"],
    contrastScopes: ["neutral"],
  },

  {
    name: "surface",
    title: "Surface",
    description:
      "The base panel every other surface is built from, at one of six material rungs.",
    category: "surfaces",
    status: "beta",
    since: "unreleased",
    aliases: ["material", "glass", "blur", "elevation", "layer", "translucency", "vibrancy"],
    owner: "design",
    a11yDate: null,
    usedIn: [
      "choose-a-component",
      "daily-log-screen",
      "health-metric-card",
      "onboarding-screen",
      "results-screen",
      "trends-screen",
    ],
    contrastScopes: ["materials", "neutral"],
  },
  {
    name: "card",
    title: "Card",
    description: "A bounded block of related content.",
    category: "surfaces",
    status: "beta",
    since: "unreleased",
    aliases: ["panel", "container", "content box", "box", "tile group"],
    owner: "design",
    a11yDate: null,
    dependencies: ["lucide-react"],
    registryDependencies: ["surface"],
    usedIn: [
      "choose-a-component",
      "daily-log-screen",
      "health-metric-card",
      "onboarding-screen",
      "results-screen",
      "trends-screen",
    ],
    contrastScopes: ["materials", "neutral"],
  },
  {
    name: "sheet",
    title: "Sheet",
    description:
      "A panel that slides over the screen and can be dismissed by dragging.",
    category: "surfaces",
    status: "beta",
    since: "unreleased",
    aliases: ["bottom sheet", "drawer", "side panel", "slide over", "modal sheet", "detent"],
    owner: "design",
    a11yDate: null,
    dependencies: ["@base-ui/react", "lucide-react"],
    registryDependencies: ["surface", "button"],
    usedIn: [
      "alert-escalation",
      "consent-and-permissions",
      "consent-flow",
      "daily-log-entry",
      "daily-log-screen",
      "daily-logging",
    ],
    contrastScopes: ["materials", "neutral"],
  },
  {
    name: "dialog",
    title: "Dialog",
    description:
      "A window that interrupts, for the one decision that cannot wait.",
    category: "surfaces",
    status: "beta",
    since: "unreleased",
    aliases: ["modal", "alert dialog", "confirm", "popup"],
    owner: "engineering",
    a11yDate: null,
    dependencies: ["@base-ui/react", "lucide-react"],
    registryDependencies: ["surface", "button"],
    usedIn: ["alert-escalation", "consent-flow"],
    contrastScopes: ["materials", "neutral"],
  },

  {
    name: "callout",
    title: "Callout",
    description:
      "A short piece of set-apart information that helps you understand what you are reading without claiming anything about your health, whether it is a note, a tip or a caveat.",
    category: "feedback",
    status: "beta",
    since: "unreleased",
    aliases: ["admonition", "note box", "info box", "tip", "note", "aside"],
    owner: "content",
    a11yDate: null,
    usedIn: [
      "alert-escalation",
      "choose-a-component",
      "consent-and-permissions",
      "consent-flow",
      "empty-and-first-use",
      "forms/error-summaries",
      "offline-and-stale-data",
      "onboarding-screen",
    ],
    contrastScopes: ["neutral"],
    dependencies: ["lucide-react"],
  },
  {
    name: "empty-state",
    title: "EmptyState",
    description:
      "What a screen shows when there is nothing to show, and what to do about it.",
    category: "feedback",
    status: "beta",
    since: "unreleased",
    aliases: [
      "no data",
      "nothing here",
      "zero state",
      "blank slate",
    ],
    owner: "content",
    a11yDate: null,
    registryDependencies: ["button", "link"],
    usedIn: [
      "choose-a-component",
      "consent-flow",
      "daily-log-screen",
      "daily-logging",
      "empty-and-first-use",
      "onboarding-and-first-run",
      "onboarding-screen",
      "results-screen",
      "trend-review",
      "trends-screen",
    ],
    contrastScopes: ["neutral"],
  },
  {
    name: "skeleton",
    title: "Skeleton",
    description: "The shape of content that has not arrived yet.",
    category: "feedback",
    status: "beta",
    since: "unreleased",
    aliases: ["loading placeholder", "shimmer", "ghost", "loading state", "placeholder"],
    owner: "design",
    a11yDate: null,
    usedIn: [
      "choose-a-component",
      "daily-log-screen",
      "empty-and-first-use",
      "offline-and-stale-data",
      "results-screen",
      "trends-screen",
    ],
    contrastScopes: ["neutral"],
  },

  {
    name: "segmented-control",
    title: "SegmentedControl",
    description: "A small row of mutually exclusive options.",
    category: "navigation",
    status: "alpha",
    since: "unreleased",
    aliases: ["segmented buttons", "toggle group"],
    owner: "design",
    a11yDate: null,
    dependencies: ["@base-ui/react"],
    contrastScopes: ["neutral"],
  },
  {
    name: "tab-bar",
    title: "TabBar",
    description:
      "The persistent bar of top-level destinations at the bottom of the screen.",
    category: "navigation",
    status: "alpha",
    since: "unreleased",
    aliases: ["bottom navigation", "nav bar"],
    owner: "design",
    a11yDate: null,
    dependencies: ["lucide-react"],
    registryDependencies: ["surface"],
    contrastScopes: ["materials", "neutral"],
  },
  {
    name: "stepper",
    title: "Stepper",
    description: "Progress through a sequence of steps.",
    category: "navigation",
    status: "alpha",
    since: "unreleased",
    aliases: ["wizard", "step indicator", "multi step"],
    owner: "design",
    a11yDate: null,
    dependencies: ["lucide-react"],
    contrastScopes: ["neutral"],
  },
  {
    name: "button",
    title: "Button",
    description: "The control that makes something happen.",
    category: "actions-and-forms",
    status: "beta",
    since: "unreleased",
    aliases: ["cta", "action", "submit", "primary button"],
    owner: "engineering",
    a11yDate: null,
    dependencies: ["@base-ui/react", "lucide-react"],
    usedIn: [
      "consent-and-permissions",
      "consent-flow",
      "daily-log-entry",
      "daily-log-screen",
      "empty-and-first-use",
      "forms/error-summaries",
      "forms/question-pages",
      "health-metric-card",
      "onboarding-and-first-run",
      "onboarding-screen",
    ],
    contrastScopes: ["neutral"],
  },
  {
    name: "link",
    title: "Link",
    description: "Navigation to somewhere else.",
    category: "actions-and-forms",
    status: "beta",
    since: "unreleased",
    aliases: ["anchor", "hyperlink"],
    owner: "engineering",
    a11yDate: null,
    registryDependencies: ["button"],
    contrastScopes: ["neutral"],
  },
  {
    name: "field",
    title: "Field",
    description:
      "A labelled input with its help text, its error, and the wiring that connects them.",
    category: "actions-and-forms",
    status: "beta",
    since: "unreleased",
    aliases: [
      "form field",
      "input wrapper",
      "form control",
      "validation message",
      "label",
      "error message",
      "hint",
    ],
    owner: "engineering",
    a11yDate: null,
    dependencies: ["@base-ui/react", "lucide-react"],
    usedIn: [
      "ask-users-for/contact-details",
      "ask-users-for/date-of-birth",
      "ask-users-for/ethnicity",
      "ask-users-for/height-and-weight",
      "ask-users-for/medications",
      "ask-users-for/name",
      "ask-users-for/sex-and-gender",
      "ask-users-for/symptoms",
      "consent-before-collection",
      "daily-log-entry",
      "daily-log-screen",
      "daily-logging",
      "forms/autocomplete-and-input-types",
      "forms/error-summaries",
      "forms/question-pages",
      "forms/required-and-optional",
      "forms/units-and-numeric-entry",
      "forms/validation-timing",
      "onboarding-and-first-run",
      "onboarding-screen",
    ],
    contrastScopes: ["neutral"],
  },
  {
    name: "icon-button",
    title: "IconButton",
    description: "A button whose only visible content is an icon.",
    category: "actions-and-forms",
    status: "alpha",
    since: "unreleased",
    aliases: ["glyph button", "round button"],
    owner: "design",
    a11yDate: null,
    dependencies: ["lucide-react"],
    registryDependencies: ["button"],
    contrastScopes: ["neutral"],
  },

  {
    name: "divider",
    title: "Divider",
    description: "A line separating two groups of content.",
    category: "layout",
    status: "alpha",
    since: "unreleased",
    aliases: ["separator", "rule"],
    owner: "design",
    a11yDate: null,
    contrastScopes: ["neutral"],
  },

  {
    name: "avatar",
    title: "Avatar",
    description: "A picture or initials standing for a person.",
    category: "utility",
    status: "alpha",
    since: "unreleased",
    aliases: ["profile picture", "initials", "user image"],
    owner: "design",
    a11yDate: null,
    dependencies: ["lucide-react"],
    contrastScopes: ["neutral"],
  },
  {
    name: "visually-hidden",
    title: "VisuallyHidden",
    description: "Content that screen readers announce and eyes do not see.",
    category: "utility",
    status: "alpha",
    since: "unreleased",
    aliases: ["sr only", "screen reader only", "clip"],
    owner: "engineering",
    a11yDate: null,
    contrastScopes: ["neutral"],
  },
]

/**
 * THE CONSIDERED ROSTER. Frozen.
 *
 * These are real, deliberate decisions rather than an idea list. A considered
 * row has NO hand-written page. What it has is a row here, a row in the status
 * matrix, a row in `/r/index.json`, and a definitive machine-readable answer at
 * a guessable URL saying "considered, not planned, not implemented. Do not
 * generate code against this", with `useInstead` naming what to reach for.
 *
 * That last property is the whole point. An agent that gets a 404 for
 * `/docs/components/goal-ring` will invent a GoalRing API and ship it. An agent
 * that gets this row will not.
 */
export const CONSIDERED: CatalogueEntry[] = [
  {
    name: "questionnaire",
    title: "Questionnaire",
    description:
      "A multi-question form for a validated instrument such as a symptom score.",
    category: "health-input",
    status: "considered",
    since: "unreleased",
    aliases: ["survey", "assessment", "phq", "screening form"],
    owner: "clinical",
    a11yDate: null,
    why: "Validated instruments are licensed, scored and interpreted by their publishers, and a component that renders one invites a product to alter its wording or its scoring. That is a clinical-safety problem no amount of API design fixes.",
    useInstead: ["field", "log-sheet"],
  },
  {
    name: "symptom-picker",
    title: "SymptomPicker",
    description: "A picker for choosing symptoms from a controlled list.",
    category: "health-input",
    status: "considered",
    since: "unreleased",
    aliases: ["symptoms", "how are you feeling", "symptom checker"],
    owner: "clinical",
    a11yDate: null,
    why: "A symptom picker is one step from a symptom checker, and a symptom checker is a regulated device in most of the markets this system targets. The controlled vocabulary is also product-specific and cannot be shipped in a design system.",
    useInstead: ["field", "log-sheet"],
  },
  {
    name: "dose-tracker",
    title: "DoseTracker",
    description: "A record of medicine doses taken and missed.",
    category: "health-input",
    status: "considered",
    since: "unreleased",
    aliases: ["medication", "pill tracker", "dose", "adherence tracker"],
    owner: "clinical",
    a11yDate: null,
    why: "Dose data drives dosing decisions. A component that displays a missed dose is one product decision away from implying what to do about it, which is prescribing.",
    useInstead: ["log-sheet", "care-card"],
  },
  {
    name: "goal-ring",
    title: "GoalRing",
    description: "Progress towards a daily goal, drawn as a closing ring.",
    category: "health-data-display",
    status: "considered",
    since: "unreleased",
    aliases: ["activity ring", "close your rings", "daily goal"],
    owner: "design",
    a11yDate: null,
    why: "Goal rings are strongly associated with one platform's fitness product, and the pattern rewards streaks. That is the wrong incentive for a reader managing a condition rather than training for one.",
    useInstead: ["score-dial", "metric-tile"],
  },
  {
    name: "scale-input",
    title: "ScaleInput",
    description: "A one-to-ten scale for rating something like pain or mood.",
    category: "health-input",
    status: "considered",
    since: "unreleased",
    aliases: ["pain scale", "rating scale", "likert"],
    owner: "clinical",
    a11yDate: null,
    why: "The anchors and the number of points on a rating scale are what make it comparable over time, and they belong to whichever instrument the product is using. A fixed set of labelled options is a radio group, and opsinjs delegates that to Base UI rather than wrapping it.",
    useInstead: ["field"],
  },
  {
    name: "toast",
    title: "Toast",
    description: "A brief message that appears and disappears on its own.",
    category: "feedback",
    status: "considered",
    since: "unreleased",
    aliases: ["snackbar", "transient message", "notification toast"],
    owner: "design",
    a11yDate: null,
    why: "A message that removes itself is the wrong shape for anything about someone's health: the reader who most needs it is the one most likely to miss it. Kept on the roster because products use toasts for save confirmations, which is legitimate.",
    useInstead: ["alert-banner", "callout"],
  },
  {
    name: "tooltip",
    title: "Tooltip",
    description: "A short label that appears on hover or focus.",
    category: "overlay",
    status: "considered",
    since: "unreleased",
    aliases: ["hover label"],
    owner: "engineering",
    a11yDate: null,
    why: "There is no hover on a phone, and this is a phone-first system. Anything important enough for a tooltip is important enough to be on the screen.",
    useInstead: ["term", "field"],
  },
  {
    name: "popover",
    title: "Popover",
    description: "A small panel anchored to the control that opened it.",
    category: "overlay",
    status: "considered",
    since: "unreleased",
    aliases: ["anchored panel", "flyout"],
    owner: "engineering",
    a11yDate: null,
    why: "Base UI's popover is complete and unopinionated, and opsinjs has nothing to add to it beyond tokens.",
    useInstead: ["sheet", "dialog"],
  },
  {
    name: "tabs",
    title: "Tabs",
    description: "Switching between views that occupy the same space.",
    category: "navigation",
    status: "considered",
    since: "unreleased",
    aliases: ["tab list", "view switcher"],
    owner: "engineering",
    a11yDate: null,
    why: "Delegated to Base UI unchanged: Base UI's own Tabs is the component, and opsinjs documents it in the handbook rather than re-wrapping it. Nothing on the shipped roster switches between views, so there is no opsinjs component to reach for instead of it.",
  },
  {
    name: "accordion",
    title: "Accordion",
    description: "Sections that expand one at a time.",
    category: "navigation",
    status: "considered",
    since: "unreleased",
    aliases: ["disclosure", "expander", "collapsible"],
    owner: "engineering",
    a11yDate: null,
    why: "Delegated to Base UI unchanged. Note that hiding a safety message inside a collapsed section is a defect regardless of the component used.",
    useInstead: ["card"],
  },
  {
    name: "select",
    title: "Select",
    description: "Choosing one option from a list.",
    category: "actions-and-forms",
    status: "considered",
    since: "unreleased",
    aliases: ["dropdown", "picker"],
    owner: "engineering",
    a11yDate: null,
    why: "Delegated to Base UI. opsinjs adds guidance rather than a component. The guidance is that for short lists a radio group is easier for the reader, and Base UI has one. Inside a Field, render Base UI's Select through Field.Control's render prop. The shipped specimen registry/examples/field-with-another-control.tsx uses a native select on that same prop, and Base UI's Select goes through it the same way.",
    useInstead: ["field"],
  },
  {
    name: "combobox",
    title: "Combobox",
    description: "A text input that filters a list as you type.",
    category: "actions-and-forms",
    status: "considered",
    since: "unreleased",
    aliases: ["autocomplete", "typeahead", "search select"],
    owner: "engineering",
    a11yDate: null,
    why: "Delegated to Base UI. The hard part in a health product is the vocabulary being searched, not the widget.",
    useInstead: ["field"],
  },
  {
    name: "switch",
    title: "Switch",
    description: "An on-or-off control that takes effect immediately.",
    category: "actions-and-forms",
    status: "considered",
    since: "unreleased",
    aliases: ["toggle"],
    owner: "engineering",
    a11yDate: null,
    why: "Delegated to Base UI. A switch must never be used for consent, because consent is a decision with a record, not a setting. ConsentSheet is therefore the opsinjs answer for that case, and the setting itself stays Base UI's. Inside a Field, render Base UI's Switch through Field.Control's render prop. The shipped specimen registry/examples/field-with-another-control.tsx shows that render route with a native control.",
    useInstead: ["consent-sheet"],
  },
  {
    name: "checkbox",
    title: "Checkbox",
    description: "A box for choosing any number of options, including none.",
    category: "actions-and-forms",
    status: "considered",
    since: "unreleased",
    aliases: ["tick box", "multi select"],
    owner: "engineering",
    a11yDate: null,
    why: "Delegated to Base UI. Inside a Field, render Base UI's Checkbox through Field.Control's render prop. The shipped specimen registry/examples/field-with-another-control.tsx shows that render route with a native control.",
    useInstead: ["field"],
  },
  {
    name: "radio-group",
    title: "RadioGroup",
    description: "A set of options where exactly one can be chosen.",
    category: "actions-and-forms",
    status: "considered",
    since: "unreleased",
    aliases: ["radio buttons", "single choice"],
    owner: "engineering",
    a11yDate: null,
    why: "Delegated to Base UI. Preferred over Select for anything under about seven options.",
    useInstead: ["field"],
  },
  {
    name: "slider",
    title: "Slider",
    description: "Choosing a value by dragging along a track.",
    category: "actions-and-forms",
    status: "considered",
    since: "unreleased",
    aliases: ["range input", "drag to set"],
    owner: "engineering",
    a11yDate: null,
    why: "Delegated to Base UI, and discouraged for entering a measurement: a slider cannot express precision, and a reading typed in is a reading the person meant. A number with no clinical semantics behind it is Base UI's number field, unwrapped.",
    useInstead: ["reading-input"],
  },
  {
    name: "number-field",
    title: "NumberField",
    description: "An input for a number, with steppers.",
    category: "actions-and-forms",
    status: "considered",
    since: "unreleased",
    aliases: ["stepper input", "quantity input"],
    owner: "engineering",
    a11yDate: null,
    why: "Delegated to Base UI. ReadingInput is the health-aware wrapper, and it is on the shipped roster.",
    useInstead: ["reading-input"],
  },
  {
    name: "textarea",
    title: "Textarea",
    description: "A multi-line text input.",
    category: "actions-and-forms",
    status: "considered",
    since: "unreleased",
    aliases: ["long text", "notes input"],
    owner: "engineering",
    a11yDate: null,
    why: "A native element that needs tokens, not a component. Inside a Field, render a native textarea through Field.Control's render prop; registry/examples/field-with-another-control.tsx is the shipped specimen.",
    useInstead: ["field"],
  },
  {
    name: "progress",
    title: "Progress",
    description: "How far through something the reader is.",
    category: "feedback",
    status: "considered",
    since: "unreleased",
    aliases: ["progress bar", "completion"],
    owner: "design",
    a11yDate: null,
    why: "Delegated to Base UI. Never use it to show a health value: a progress bar implies a target, and most readings do not have one.",
    useInstead: ["range-bar", "score-dial"],
  },
  {
    name: "spinner",
    title: "Spinner",
    description: "An indeterminate loading indicator.",
    category: "feedback",
    status: "considered",
    since: "unreleased",
    aliases: ["loader", "busy indicator", "activity indicator"],
    owner: "design",
    a11yDate: null,
    why: "Skeletons are preferred throughout: a skeleton says what is arriving, and a spinner says only that something is.",
    useInstead: ["skeleton"],
  },
  {
    name: "badge",
    title: "Badge",
    description: "A small label attached to something else.",
    category: "data-display",
    status: "considered",
    since: "unreleased",
    aliases: ["counter", "label chip"],
    owner: "design",
    a11yDate: null,
    why: "Kept off the shipped roster deliberately: a generic badge next to a StatusPill is exactly how the two colour axes get mixed. If you need a badge to carry a health meaning, you need a StatusPill.",
    useInstead: ["status-pill"],
  },
  {
    name: "scroll-area",
    title: "ScrollArea",
    description: "A scrolling region with styled scrollbars.",
    category: "layout",
    status: "considered",
    since: "unreleased",
    aliases: ["scroller", "overflow container"],
    owner: "engineering",
    a11yDate: null,
    why: "Delegated to Base UI. Custom scrollbars are also a frequent cause of unreachable content at 200% text.",
    useInstead: ["card"],
  },
  {
    name: "menu",
    title: "Menu",
    description: "A list of actions opened from a button.",
    category: "overlay",
    status: "considered",
    since: "unreleased",
    aliases: ["dropdown menu", "context menu", "overflow menu"],
    owner: "engineering",
    a11yDate: null,
    why: "Delegated to Base UI. Hiding a destructive or a safety-relevant action in an overflow menu is a defect whatever renders it.",
    useInstead: ["sheet", "button"],
  },
]

/** Every catalogue row, shipped first, then considered. */
export const CATALOGUE: CatalogueEntry[] = [...SHIPPED, ...CONSIDERED]

/**
 * RESERVED ALIASES are synonyms that belong to a doctrine or content page
 * rather than to a component, recorded here so that the whole alias namespace
 * is declared in one file rather than discovered a page at a time.
 *
 * BE CLEAR ABOUT WHAT THIS LIST DOES AND DOES NOT DO, because the sentence that
 * used to stand here claimed "the array is exactly what that page's frontmatter
 * `aliases` must contain". That was not true of seven of the thirteen entries
 * and nothing was ever going to notice. Nothing reads this map at build time.
 * It is not compared against the pages it names, so a reserved synonym the page
 * never carries is simply absent from search; and it is not compared against
 * the rows above it, so a component row may claim a word reserved here without
 * a warning anywhere. The case that actually breaks a reader is two PAGES
 * claiming one synonym. CAT005 catches it, and that is the only alias collision
 * any gate sees.
 *
 * TWO WORDS HAVE ALREADY GONE THE OTHER WAY, and they are named rather than
 * quietly deleted: `term` claims "plain english", which is reserved below for
 * `plain-english-a-z`, and `surface` claims "translucency", which is reserved
 * below for `the-contrast-floor`. Both component pages carry the word too, so
 * CAT006 and CAT011 are satisfied and search sends the reader to the component.
 * Neither doctrine page carries it, so no CAT005 collision exists today.
 * Deciding which of the two should own each word is a content decision and is
 * not taken here; recording that the reservation has been overtaken is.
 *
 * The page id is the key. Treat the array as the claim this file makes on those
 * words, not as a description of what any page currently publishes.
 */
export const RESERVED_ALIASES: Record<string, string[]> = {
  "clinical-status-semantics": ["severity", "urgency", "triage"],
  "numbers-units-precision": ["rounding", "significant figures", "decimals"],
  "unit-systems": [
    "mmol/L",
    "mg/dL",
    "imperial",
    "metric",
    "stone",
    "fahrenheit",
  ],
  "two-colour-axes": ["category colour", "status colour", "colour axes"],
  "alarm-fatigue": [
    "alert fatigue",
    "notification budget",
    "escalation budget",
  ],
  "reference-ranges": [
    "what is normal",
    "normal result",
    "range source",
  ],
  "uncertainty-and-staleness": [
    "stale data",
    "missing data",
    "we do not know",
  ],
  "springs-as-tokens": ["easing", "linear()", "spring", "cubic-bezier"],
  "contrast-and-apca": ["APCA", "Lc", "WCAG", "contrast ratio"],
  "responsive-modes": ["breakpoints", "mobile", "tablet", "wide", "density"],
  "plain-english-a-z": ["glossary", "a to z", "jargon buster", "plain english"],
  "the-contrast-floor": ["scrim", "backdrop-filter", "translucency"],
  "colour-blindness": [
    "colour vision deficiency",
    "protanopia",
    "deuteranopia",
    "tritanopia",
    "cvd",
  ],
}
