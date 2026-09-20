/**
 * THE CATALOGUE is the single source of truth for what opsinjs contains.
 *
 * Everything downstream reads this file and nothing re-declares it: the status
 * matrix, the sidebar chips, `/r/index.json`, `/r/registry.json`, `llms.txt`,
 * and the roadmap. An id that has no row here has no page and no registry item,
 * and the routes answer with a 404 rather than with a guess.
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
 * ALL SIXTY ROWS ARE `status: "shipped"`. Each has a file at
 * `registry/bases/base/<id>.tsx`, renders at
 * `/view/base/base-lyra/component/<id>`, and installs with `shadcn add`.
 * `shipped` is a statement about the source and about nothing else: the API
 * may change in any release with a changelog entry, and not one of these
 * sixty components has been through an accessibility review or a clinical
 * review. Do not read the word as a review having happened, and do not put
 * one of these on a production health surface.
 *
 * `planned` means specified in full, with no code. See `lib/status.ts`. It is
 * a legal status and no row in this file carries it today. Do not copy it onto
 * a new row on the assumption that it is what a shipped row says. A row
 * reaches `shipped` in the same commit as the file under
 * `registry/bases/base/` that implements it and the `status` in that
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
  /**
   * The version this entry was introduced in. `"unreleased"` on all sixty rows
   * and it stays that way until a version is cut, so today it distinguishes
   * nothing. It is kept anyway, because it is the only slot in the published
   * row shaped to hold a version, and six machine surfaces already carry it:
   * `app/r/index.json/route.ts`, `app/_machine/registry-payload.ts`,
   * `app/_machine/contracts.ts`, `lib/catalogue.ts`,
   * `scripts/build-registry.mts` and the Since column that
   * `scripts/build-reference.mts` writes into the generated catalogue table.
   * That is the blast radius of deleting it, and two of those surfaces are
   * JSON a consumer's tooling parses. The namesake page frontmatter field was
   * deleted; this one is a different field and is not.
   */
  since: string
  /** Search synonyms. Globally unique. Copied verbatim into page frontmatter. */
  aliases: string[]
  /** The discipline that reviews this component's specification. */
  owner: "design" | "engineering" | "clinical" | "content"
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
   * or a boundary, so every built row names `neutral` at least.
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
   * Every id must be a real catalogue `name`. A dependency on an id with no row
   * here is a dependency on something that does not exist.
   */
  registryDependencies?: string[]
}

/**
 * THE SIXTY SHIPPED IDS. Every one has a specification page at
 * `/components/<id>` and a row in `/r/index.json`. Order within a category
 * is roughly the order they appear in the sidebar, though the sidebar order is
 * owned by `content/docs/components/meta.json` and is authoritative.
 */
export const SHIPPED: CatalogueEntry[] = [
  {
    name: "result-card",
    title: "ResultCard",
    description:
      "One test result, showing the number, what it is compared against, and what it means.",
    category: "health-data-display",
    status: "shipped",
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
    status: "shipped",
    since: "unreleased",
    aliases: [
      "reference range",
      "normal range",
      "in range",
      "range indicator",
      "gauge bar",
    ],
    owner: "clinical",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["dial", "ring", "gauge", "score", "index", "bmi"],
    owner: "design",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["sparkline", "trend", "over time", "mini chart", "line chart", "chart", "graph"],
    owner: "clinical",
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
    status: "shipped",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["chip", "status chip", "status badge", "status label", "traffic light"],
    owner: "clinical",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["history item", "event list", "activity feed"],
    owner: "design",
    governedBy: ["uncertainty-and-staleness", "trends-and-change"],
    registryDependencies: ["relative-time", "status-pill"],
    usedIn: ["daily-log-screen", "diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },
  {
    name: "range-legend",
    title: "RangeLegend",
    description: "The key explaining what the bands on a range mean.",
    category: "health-data-display",
    status: "shipped",
    since: "unreleased",
    aliases: ["key", "chart legend", "band legend"],
    owner: "design",
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
    status: "shipped",
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
    status: "shipped",
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
      "diabetes-medicines-app",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["glossary term", "jargon", "plain word", "definition", "plain english", "tooltip term"],
    owner: "content",
    governedBy: ["who-this-is-for", "clinical-interaction-guidelines"],
    usedIn: [
      "ask-users-for/ethnicity",
      "ask-users-for/medications",
      "ask-users-for/sex-and-gender",
      "ask-users-for/symptoms",
      "choose-a-component",
      "consent-and-permissions",
      "consent-flow",
      "diabetes-medicines-app",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["consent", "permission", "opt in", "data sharing", "agree"],
    owner: "clinical",
    governedBy: ["consent-and-disclosure", "clinical-interaction-guidelines", "crisis-and-self-harm", "regulatory-context"],
    dependencies: ["lucide-react"],
    registryDependencies: ["sheet", "button"],
    usedIn: [
      "ask-users-for/contact-details",
      "consent-and-permissions",
      "consent-before-collection",
      "consent-flow",
      "diabetes-medicines-app",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["disclaimer", "not medical advice", "legal note", "small print", "safety note"],
    owner: "clinical",
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
      "diabetes-medicines-app",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["citation", "evidence link", "reviewed by"],
    owner: "content",
    governedBy: ["data-provenance-and-device-accuracy", "evidence-and-references"],
    registryDependencies: ["link"],
    usedIn: ["diabetes-medicines-app", "results-screen"],
    contrastScopes: ["neutral"],
  },
  {
    name: "log-sheet",
    title: "LogSheet",
    description:
      "A form for writing down what happened today, in as few taps as possible.",
    category: "health-input",
    status: "shipped",
    since: "unreleased",
    aliases: ["log", "diary", "journal", "daily entry", "capture", "quick entry", "bottom sheet entry"],
    owner: "design",
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
      "diabetes-medicines-app",
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
    status: "shipped",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["pain map", "anatomy diagram", "where does it hurt"],
    owner: "design",
    governedBy: ["two-colour-axes"],
    contrastScopes: ["neutral"],
  },

  {
    name: "value",
    title: "Value",
    description:
      "One number and its unit, formatted the same way everywhere in the product.",
    category: "health-formatting",
    status: "shipped",
    since: "unreleased",
    aliases: ["number", "unit", "format a number", "numeric display", "figure", "format", "formatted number"],
    owner: "content",
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
      "diabetes-medicines-app",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["time ago", "timestamp", "last updated", "date display", "ago", "freshness", "staleness"],
    owner: "content",
    governedBy: ["uncertainty-and-staleness", "numbers-units-precision"],
    usedIn: [
      "choose-a-component",
      "daily-log-screen",
      "daily-logging",
      "diabetes-medicines-app",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["data table", "grid", "rows and columns"],
    owner: "engineering",
    usedIn: ["trends-screen"],
    contrastScopes: ["neutral"],
  },
  {
    name: "badge",
    title: "Badge",
    description: "A small label attached to something else.",
    category: "data-display",
    status: "shipped",
    since: "unreleased",
    aliases: ["counter", "label chip"],
    owner: "design",
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },

  {
    name: "surface",
    title: "Surface",
    description:
      "The base panel every other surface is built from, at one of six material rungs.",
    category: "surfaces",
    status: "shipped",
    since: "unreleased",
    aliases: ["material", "glass", "blur", "elevation", "layer", "translucency", "vibrancy"],
    owner: "design",
    usedIn: [
      "choose-a-component",
      "daily-log-screen",
      "diabetes-medicines-app",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["panel", "container", "content box", "box", "tile group"],
    owner: "design",
    dependencies: ["lucide-react"],
    registryDependencies: ["surface"],
    usedIn: [
      "choose-a-component",
      "daily-log-screen",
      "diabetes-medicines-app",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["bottom sheet", "drawer", "side panel", "slide over", "modal sheet", "detent"],
    owner: "design",
    dependencies: ["@base-ui/react", "lucide-react"],
    registryDependencies: ["surface", "button"],
    usedIn: [
      "alert-escalation",
      "consent-and-permissions",
      "consent-flow",
      "daily-log-entry",
      "daily-log-screen",
      "daily-logging",
      "diabetes-medicines-app",
    ],
    contrastScopes: ["materials", "neutral"],
  },
  {
    name: "dialog",
    title: "Dialog",
    description:
      "A window that interrupts, for the one decision that cannot wait.",
    category: "surfaces",
    status: "shipped",
    since: "unreleased",
    aliases: ["modal", "alert dialog", "confirm", "popup"],
    owner: "engineering",
    dependencies: ["@base-ui/react", "lucide-react"],
    registryDependencies: ["surface", "button"],
    usedIn: ["alert-escalation", "consent-flow", "diabetes-medicines-app"],
    contrastScopes: ["materials", "neutral"],
  },

  {
    name: "callout",
    title: "Callout",
    description:
      "A short piece of set-apart information that helps you understand what you are reading without claiming anything about your health, whether it is a note, a tip or a caveat.",
    category: "feedback",
    status: "shipped",
    since: "unreleased",
    aliases: ["admonition", "note box", "info box", "tip", "note", "aside"],
    owner: "content",
    usedIn: [
      "alert-escalation",
      "choose-a-component",
      "consent-and-permissions",
      "consent-flow",
      "diabetes-medicines-app",
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
    status: "shipped",
    since: "unreleased",
    aliases: [
      "no data",
      "nothing here",
      "zero state",
      "blank slate",
    ],
    owner: "content",
    registryDependencies: ["button", "link"],
    usedIn: [
      "choose-a-component",
      "consent-flow",
      "daily-log-screen",
      "daily-logging",
      "diabetes-medicines-app",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["loading placeholder", "shimmer", "ghost", "loading state", "placeholder"],
    owner: "design",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["segmented buttons", "toggle group"],
    owner: "design",
    dependencies: ["@base-ui/react"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },
  {
    name: "tab-bar",
    title: "TabBar",
    description:
      "The persistent bar of top-level destinations at the bottom of the screen.",
    category: "navigation",
    status: "shipped",
    since: "unreleased",
    aliases: ["bottom navigation", "nav bar"],
    owner: "design",
    dependencies: ["lucide-react"],
    registryDependencies: ["surface"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["materials", "neutral"],
  },
  {
    name: "stepper",
    title: "Stepper",
    description: "Progress through a sequence of steps.",
    category: "navigation",
    status: "shipped",
    since: "unreleased",
    aliases: ["wizard", "step indicator", "multi step"],
    owner: "design",
    dependencies: ["lucide-react"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },
  {
    name: "button",
    title: "Button",
    description: "The control that makes something happen.",
    category: "actions-and-forms",
    status: "shipped",
    since: "unreleased",
    aliases: ["cta", "action", "submit", "primary button"],
    owner: "engineering",
    dependencies: ["@base-ui/react", "lucide-react"],
    usedIn: [
      "consent-and-permissions",
      "consent-flow",
      "daily-log-entry",
      "daily-log-screen",
      "diabetes-medicines-app",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["anchor", "hyperlink"],
    owner: "engineering",
    registryDependencies: ["button"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },
  {
    name: "field",
    title: "Field",
    description:
      "A labelled input with its help text, its error, and the wiring that connects them.",
    category: "actions-and-forms",
    status: "shipped",
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
      "diabetes-medicines-app",
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
    status: "shipped",
    since: "unreleased",
    aliases: ["glyph button", "round button"],
    owner: "design",
    dependencies: ["lucide-react"],
    registryDependencies: ["button"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },
  {
    name: "switch",
    title: "Switch",
    description: "An on-or-off control that takes effect immediately.",
    category: "actions-and-forms",
    status: "shipped",
    since: "unreleased",
    aliases: ["toggle"],
    owner: "engineering",
    dependencies: ["@base-ui/react"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },
  {
    name: "checkbox",
    title: "Checkbox",
    description: "A box for choosing any number of options, including none.",
    category: "actions-and-forms",
    status: "shipped",
    since: "unreleased",
    aliases: ["tick box", "multi select"],
    owner: "engineering",
    dependencies: ["@base-ui/react", "lucide-react"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },
  {
    name: "radio-group",
    title: "RadioGroup",
    description: "A set of options where exactly one can be chosen.",
    category: "actions-and-forms",
    status: "shipped",
    since: "unreleased",
    aliases: ["radio buttons", "single choice"],
    owner: "engineering",
    dependencies: ["@base-ui/react"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },
  {
    name: "select",
    title: "Select",
    description: "Choosing one option from a list.",
    category: "actions-and-forms",
    status: "shipped",
    since: "unreleased",
    aliases: ["dropdown", "picker"],
    owner: "engineering",
    dependencies: ["@base-ui/react", "lucide-react"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral", "materials"],
  },
  {
    name: "number-field",
    title: "NumberField",
    description: "An input for a number, with steppers.",
    category: "actions-and-forms",
    status: "shipped",
    since: "unreleased",
    aliases: ["stepper input", "quantity input"],
    owner: "engineering",
    dependencies: ["@base-ui/react", "lucide-react"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },
  {
    name: "textarea",
    title: "Textarea",
    description: "A multi-line text input.",
    category: "actions-and-forms",
    status: "shipped",
    since: "unreleased",
    aliases: ["long text", "notes input"],
    owner: "engineering",
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },

  {
    name: "divider",
    title: "Divider",
    description: "A line separating two groups of content.",
    category: "layout",
    status: "shipped",
    since: "unreleased",
    aliases: ["separator", "rule"],
    owner: "design",
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },

  {
    name: "avatar",
    title: "Avatar",
    description: "A picture or initials standing for a person.",
    category: "utility",
    status: "shipped",
    since: "unreleased",
    aliases: ["profile picture", "initials", "user image"],
    owner: "design",
    dependencies: ["lucide-react"],
    contrastScopes: ["neutral"],
  },
  {
    name: "visually-hidden",
    title: "VisuallyHidden",
    description: "Content that screen readers announce and eyes do not see.",
    category: "utility",
    status: "shipped",
    since: "unreleased",
    aliases: ["sr only", "screen reader only", "clip"],
    owner: "engineering",
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },

  {
    name: "goal-ring",
    title: "GoalRing",
    description: "Progress towards a daily goal, drawn as a closing ring.",
    category: "health-data-display",
    status: "shipped",
    since: "unreleased",
    aliases: ["activity ring", "close your rings", "daily goal"],
    owner: "design",
    governedBy: [
      "two-colour-axes",
      "category-identity",
      "numbers-units-precision",
      "motion-in-health-ui",
    ],
    contrastScopes: ["category", "neutral"],
  },
  {
    name: "scale-input",
    title: "ScaleInput",
    description: "A one-to-ten scale for rating something like pain or mood.",
    category: "health-input",
    status: "shipped",
    since: "unreleased",
    aliases: ["pain scale", "rating scale", "likert"],
    owner: "clinical",
    governedBy: [
      "clinical-interaction-guidelines",
      "numbers-units-precision",
      "who-this-is-for",
    ],
    dependencies: ["@base-ui/react"],
    contrastScopes: ["neutral"],
  },
  {
    name: "dose-tracker",
    title: "DoseTracker",
    description: "A record of medicine doses taken and missed.",
    category: "health-input",
    status: "shipped",
    since: "unreleased",
    aliases: ["medication", "pill tracker", "dose", "adherence tracker"],
    owner: "clinical",
    governedBy: [
      "clinical-interaction-guidelines",
      "uncertainty-and-staleness",
      "regulatory-context",
    ],
    dependencies: ["lucide-react"],
    registryDependencies: ["relative-time"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },
  {
    name: "questionnaire",
    title: "Questionnaire",
    description:
      "A multi-question form for a validated instrument such as a symptom score.",
    category: "health-input",
    status: "shipped",
    since: "unreleased",
    aliases: ["survey", "assessment", "phq", "screening form"],
    owner: "clinical",
    governedBy: [
      "clinical-interaction-guidelines",
      "regulatory-context",
      "evidence-and-references",
      "who-this-is-for",
    ],
    contrastScopes: ["neutral"],
  },
  {
    name: "symptom-picker",
    title: "SymptomPicker",
    description: "A picker for choosing symptoms from a controlled list.",
    category: "health-input",
    status: "shipped",
    since: "unreleased",
    aliases: ["symptoms", "how are you feeling", "symptom checker"],
    owner: "clinical",
    governedBy: [
      "clinical-interaction-guidelines",
      "regulatory-context",
      "who-this-is-for",
    ],
    dependencies: ["@base-ui/react", "lucide-react"],
    contrastScopes: ["neutral"],
  },

  {
    name: "toast",
    title: "Toast",
    description: "A brief message that appears and disappears on its own.",
    category: "feedback",
    status: "shipped",
    since: "unreleased",
    aliases: ["snackbar", "transient message", "notification toast"],
    owner: "design",
    dependencies: ["@base-ui/react", "lucide-react"],
    contrastScopes: ["neutral", "materials"],
  },
  {
    name: "progress",
    title: "Progress",
    description: "How far through something the reader is.",
    category: "feedback",
    status: "shipped",
    since: "unreleased",
    aliases: ["progress bar", "completion"],
    owner: "design",
    dependencies: ["@base-ui/react"],
    contrastScopes: ["neutral"],
  },
  {
    name: "spinner",
    title: "Spinner",
    description: "An indeterminate loading indicator.",
    category: "feedback",
    status: "shipped",
    since: "unreleased",
    aliases: ["loader", "busy indicator", "activity indicator"],
    owner: "design",
    contrastScopes: ["neutral"],
  },
  {
    name: "tooltip",
    title: "Tooltip",
    description: "A short label that appears on hover or focus.",
    category: "overlay",
    status: "shipped",
    since: "unreleased",
    aliases: ["hover label"],
    owner: "engineering",
    dependencies: ["@base-ui/react"],
    contrastScopes: ["neutral", "materials"],
  },
  {
    name: "popover",
    title: "Popover",
    description: "A small panel anchored to the control that opened it.",
    category: "overlay",
    status: "shipped",
    since: "unreleased",
    aliases: ["anchored panel", "flyout"],
    owner: "engineering",
    dependencies: ["@base-ui/react"],
    contrastScopes: ["neutral", "materials"],
  },
  {
    name: "menu",
    title: "Menu",
    description: "A list of actions opened from a button.",
    category: "overlay",
    status: "shipped",
    since: "unreleased",
    aliases: ["dropdown menu", "context menu", "overflow menu"],
    owner: "engineering",
    dependencies: ["@base-ui/react"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral", "materials"],
  },
  {
    name: "tabs",
    title: "Tabs",
    description: "Switching between views that occupy the same space.",
    category: "navigation",
    status: "shipped",
    since: "unreleased",
    aliases: ["tab list", "view switcher"],
    owner: "engineering",
    dependencies: ["@base-ui/react"],
    contrastScopes: ["neutral"],
  },
  {
    name: "accordion",
    title: "Accordion",
    description: "Sections that expand one at a time.",
    category: "navigation",
    status: "shipped",
    since: "unreleased",
    aliases: ["disclosure", "expander", "collapsible"],
    owner: "engineering",
    dependencies: ["@base-ui/react", "lucide-react"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral"],
  },
  {
    name: "slider",
    title: "Slider",
    description: "Choosing a value by dragging along a track.",
    category: "actions-and-forms",
    status: "shipped",
    since: "unreleased",
    aliases: ["range input", "drag to set"],
    owner: "engineering",
    dependencies: ["@base-ui/react"],
    contrastScopes: ["neutral"],
  },
  {
    name: "combobox",
    title: "Combobox",
    description: "A text input that filters a list as you type.",
    category: "actions-and-forms",
    status: "shipped",
    since: "unreleased",
    aliases: ["autocomplete", "typeahead", "search select"],
    owner: "engineering",
    dependencies: ["@base-ui/react", "lucide-react"],
    usedIn: ["diabetes-medicines-app"],
    contrastScopes: ["neutral", "materials"],
  },
  {
    name: "scroll-area",
    title: "ScrollArea",
    description: "A scrolling region with styled scrollbars.",
    category: "layout",
    status: "shipped",
    since: "unreleased",
    aliases: ["scroller", "overflow container"],
    owner: "engineering",
    dependencies: ["@base-ui/react"],
    contrastScopes: ["neutral"],
  },
]

/**
 * Every catalogue row. Both names are exported and both are kept: `SHIPPED` is
 * what the rows are, and `CATALOGUE` is the name twenty call sites import.
 */
export const CATALOGUE: CatalogueEntry[] = SHIPPED

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
