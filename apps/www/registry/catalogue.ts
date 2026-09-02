/**
 * THE CATALOGUE — the single source of truth for what opsinjs contains.
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
 * the whole corpus — an alias that resolves to two pages resolves to neither.
 * Uniqueness cannot survive fifteen authors inventing synonyms in parallel, so
 * it is declared here once. A component page's frontmatter COPIES the array
 * below verbatim; it never invents one. `assert-ia.mts` fails the build when a
 * page's `aliases` are not exactly its catalogue row's, when two rows share an
 * alias, or when an alias collides with any catalogue id.
 *
 * The reserved doctrine aliases at the bottom of this file are the synonyms
 * that belong to Health and Content pages rather than to components, recorded
 * here so the uniqueness check can see them.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * NOTHING IS BUILT. Every shipped row is `status: "planned"` and every
 * considered row is `status: "considered"`. A `planned` row means there is a
 * written specification at a guessable URL; it does not mean there is code.
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
 * on that component's page — `assert-ia.mts` enforces it in both directions.
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
  "health-data-display": "Health — data display",
  "health-communication": "Health — communication",
  "health-input": "Health — input",
  "health-formatting": "Health — formatting",
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
   * patient and not for the engineer. This is the page's H1 subtitle, the
   * catalogue row's second column and the card subtitle in `<ComponentsList>`.
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
   * Date of the last accessibility review, ISO 8601. `null` until a review has
   * happened — and it has not, because nothing is built. Rendering a date here
   * that nobody produced would be the exact dishonesty this scaffold exists to
   * avoid, so the matrix prints "not yet reviewed" rather than a placeholder.
   */
  a11yDate: string | null
  /**
   * Doctrine pages that govern this component, by page id. Mandatory for every
   * `health-*` category. These are ids, not paths — `lib/routes.ts` turns them
   * into URLs.
   */
  governedBy?: string[]
  /** The health category whose colour ramp this component may use, if any. */
  healthCategory?: HealthCategory
  /**
   * The recipes and screens that use this component: the reverse of a recipe's
   * component list. Populated as those pages land; `assert-ia.mts` enforces
   * both directions.
   */
  usedIn?: string[]
  /**
   * npm packages this component's source imports, exactly as they appear in a
   * `package.json`. `["@base-ui/react"]` for anything built on a Base UI
   * primitive; `["lucide-react"]` for anything that renders a status icon.
   *
   * It is declared on the row rather than inferred from the source because a
   * consumer's `shadcn add` installs precisely this list, and a list scraped
   * from import statements would silently follow a refactor into installing
   * something nobody reviewed. Omit it rather than writing `[]` — a component
   * whose only imports are `@/lib/utils` and `@/lib/opsinjs` needs nothing.
   */
  dependencies?: string[]
  /**
   * Other opsinjs components this one composes, by bare catalogue id.
   *
   * `result-card` names `status-pill` and `value` here and never inlines a copy
   * of either: a second copy of a status pill is a second place the two colour
   * axes can drift apart. Bare ids, because the catalogue does not know what a
   * registry namespace is — `app/_machine/registry-payload.ts` prefixes
   * `@opsinjs/` when it serves the item, which is what makes shadcn resolve the
   * dependency against this registry instead of against ui.shadcn.com.
   *
   * Every id must be a real catalogue `name`. A dependency on a `considered`
   * row is a dependency on something that will never exist.
   */
  registryDependencies?: string[]
  /**
   * Considered rows only: why it is not on the shipped roster, and what to
   * reach for instead. This is what an agent gets back instead of a 404, and it
   * is the reason the considered roster is in the catalogue at all.
   */
  why?: string
  useInstead?: string[]
}

/**
 * THE 24 SHIPPED IDS. Frozen. Every one has a specification page at
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
    status: "planned",
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
      "clinical-status-semantics",
      "reference-ranges",
      "numbers-units-precision",
    ],
    healthCategory: "labs",
  },
  {
    name: "range-bar",
    title: "RangeBar",
    description:
      "A bar showing where one reading sits against the range it is compared with.",
    category: "health-data-display",
    status: "planned",
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
      "reference-ranges",
      "two-colour-axes",
      "uncertainty-and-staleness",
    ],
  },
  {
    name: "score-dial",
    title: "ScoreDial",
    description:
      "A single composite number drawn as a ring, with the words that say what it counts.",
    category: "health-data-display",
    status: "planned",
    since: "unreleased",
    aliases: ["dial", "ring", "gauge", "score", "index", "bmi"],
    owner: "design",
    a11yDate: null,
    governedBy: [
      "risk-and-statistics",
      "two-colour-axes",
      "motion-in-health-ui",
    ],
  },
  {
    name: "trend-sparkline",
    title: "TrendSparkline",
    description:
      "A small chart of one reading over time, with an honest caption saying what changed.",
    category: "health-data-display",
    status: "planned",
    since: "unreleased",
    aliases: ["sparkline", "trend", "over time", "mini chart", "line chart"],
    owner: "clinical",
    a11yDate: null,
    governedBy: ["trends-and-change", "uncertainty-and-staleness"],
  },
  {
    name: "metric-tile",
    title: "MetricTile",
    description:
      "A compact tile showing one reading, its unit and when it was taken.",
    category: "health-data-display",
    status: "planned",
    since: "unreleased",
    aliases: [
      "stat",
      "kpi",
      "vitals",
      "summary tile",
      "steps",
      "resting heart rate",
      "spo2",
    ],
    owner: "design",
    a11yDate: null,
    governedBy: [
      "numbers-units-precision",
      "two-colour-axes",
      "uncertainty-and-staleness",
    ],
  },
  {
    name: "status-pill",
    title: "StatusPill",
    description:
      "A short label saying what a reading means and what, if anything, to do about it.",
    category: "health-data-display",
    status: "planned",
    since: "unreleased",
    aliases: ["status chip", "status badge", "status label", "traffic light"],
    owner: "clinical",
    a11yDate: null,
    governedBy: [
      "clinical-status-semantics",
      "two-colour-axes",
      "alarm-fatigue",
    ],
  },

  {
    name: "alert-banner",
    title: "AlertBanner",
    description:
      "A prominent message about something that needs the reader's attention now.",
    category: "health-communication",
    status: "planned",
    since: "unreleased",
    aliases: [
      "warning banner",
      "notification banner",
      "inline alert",
    ],
    owner: "clinical",
    a11yDate: null,
    governedBy: [
      "alarm-fatigue",
      "clinical-status-semantics",
      "emergency-and-escalation",
      "notifications-and-off-screen-alerts",
    ],
  },
  {
    name: "care-card",
    title: "CareCard",
    description: "A card saying what to do next, and how urgently.",
    category: "health-communication",
    status: "planned",
    since: "unreleased",
    aliases: [
      "what to do next",
      "action card",
      "advice card",
      "next steps",
      "guidance card",
    ],
    owner: "clinical",
    a11yDate: null,
    governedBy: [
      "clinical-interaction-guidelines",
      "alarm-fatigue",
      "emergency-and-escalation",
    ],
  },
  {
    name: "term",
    title: "Term",
    description:
      "A clinical word shown in plain English, with the original available on demand.",
    category: "health-communication",
    status: "planned",
    since: "unreleased",
    aliases: ["glossary term", "jargon", "plain word", "definition"],
    owner: "content",
    a11yDate: null,
    governedBy: ["who-this-is-for", "clinical-interaction-guidelines"],
  },
  {
    name: "consent-sheet",
    title: "ConsentSheet",
    description:
      "A sheet that asks permission for one specific thing, and records the answer.",
    category: "health-communication",
    status: "planned",
    since: "unreleased",
    aliases: ["consent", "permission", "opt in", "data sharing", "agree"],
    owner: "clinical",
    a11yDate: null,
    governedBy: [
      "consent-and-disclosure",
      "on-screen-privacy",
      "crisis-and-self-harm",
    ],
  },
  {
    name: "disclaimer-note",
    title: "DisclaimerNote",
    description: "The standing note about what this information is and is not.",
    category: "health-communication",
    status: "planned",
    since: "unreleased",
    aliases: ["disclaimer", "not medical advice", "legal note", "small print"],
    owner: "clinical",
    a11yDate: null,
    governedBy: ["regulatory-context", "clinical-interaction-guidelines"],
  },

  {
    name: "log-sheet",
    title: "LogSheet",
    description:
      "A form for writing down what happened today, in as few taps as possible.",
    category: "health-input",
    status: "planned",
    since: "unreleased",
    aliases: ["log", "diary", "journal", "daily entry"],
    owner: "design",
    a11yDate: null,
    governedBy: ["clinical-interaction-guidelines", "who-this-is-for"],
  },
  {
    name: "reading-input",
    title: "ReadingInput",
    description:
      "An input for typing in a measurement, with its unit and a check that it is plausible.",
    category: "health-input",
    status: "planned",
    since: "unreleased",
    aliases: [
      "enter a reading",
      "measurement input",
      "numeric entry",
      "manual entry",
    ],
    owner: "engineering",
    a11yDate: null,
    governedBy: [
      "unit-systems",
      "numbers-units-precision",
      "reference-ranges",
    ],
  },

  {
    name: "value",
    title: "Value",
    description:
      "One number and its unit, formatted the same way everywhere in the product.",
    category: "health-formatting",
    status: "planned",
    since: "unreleased",
    aliases: ["number", "unit", "format a number", "numeric display", "figure"],
    owner: "content",
    a11yDate: null,
    governedBy: [
      "numbers-units-precision",
      "unit-systems",
      "grammar-and-mechanics",
    ],
  },
  {
    name: "relative-time",
    title: "RelativeTime",
    description:
      "When a reading was taken, said the way a person would say it.",
    category: "health-formatting",
    status: "planned",
    since: "unreleased",
    aliases: ["time ago", "timestamp", "last updated", "date display"],
    owner: "content",
    a11yDate: null,
    governedBy: [
      "uncertainty-and-staleness",
      "grammar-and-mechanics",
    ],
  },

  {
    name: "surface",
    title: "Surface",
    description:
      "The base panel every other surface is built from, at one of six material rungs.",
    category: "surfaces",
    status: "planned",
    since: "unreleased",
    aliases: ["material", "glass", "blur", "elevation", "layer"],
    owner: "design",
    a11yDate: null,
  },
  {
    name: "card",
    title: "Card",
    description: "A bounded block of related content.",
    category: "surfaces",
    status: "planned",
    since: "unreleased",
    aliases: ["panel", "container", "content box"],
    owner: "design",
    a11yDate: null,
  },
  {
    name: "sheet",
    title: "Sheet",
    description:
      "A panel that slides over the screen and can be dismissed by dragging.",
    category: "surfaces",
    status: "planned",
    since: "unreleased",
    aliases: ["bottom sheet", "drawer", "side panel", "slide over"],
    owner: "design",
    a11yDate: null,
  },
  {
    name: "dialog",
    title: "Dialog",
    description:
      "A window that interrupts, for the one decision that cannot wait.",
    category: "surfaces",
    status: "planned",
    since: "unreleased",
    aliases: ["modal", "alert dialog", "confirm", "popup"],
    owner: "engineering",
    a11yDate: null,
  },

  {
    name: "callout",
    title: "Callout",
    description: "A short aside, tinted by one of the four status levels.",
    category: "feedback",
    status: "planned",
    since: "unreleased",
    aliases: ["admonition", "note box", "info box", "tip"],
    owner: "content",
    a11yDate: null,
  },
  {
    name: "empty-state",
    title: "EmptyState",
    description:
      "What a screen shows when there is nothing to show, and what to do about it.",
    category: "feedback",
    status: "planned",
    since: "unreleased",
    aliases: [
      "no data",
      "nothing here",
      "zero state",
      "blank slate",
    ],
    owner: "content",
    a11yDate: null,
  },
  {
    name: "skeleton",
    title: "Skeleton",
    description: "The shape of content that has not arrived yet.",
    category: "feedback",
    status: "planned",
    since: "unreleased",
    aliases: ["loading placeholder", "shimmer", "ghost", "loading state"],
    owner: "design",
    a11yDate: null,
  },

  {
    name: "button",
    title: "Button",
    description: "The control that makes something happen.",
    category: "actions-and-forms",
    status: "planned",
    since: "unreleased",
    aliases: ["cta", "action", "submit", "primary button"],
    owner: "engineering",
    a11yDate: null,
  },
  {
    name: "field",
    title: "Field",
    description:
      "A labelled input with its help text, its error, and the wiring that connects them.",
    category: "actions-and-forms",
    status: "planned",
    since: "unreleased",
    aliases: [
      "form field",
      "input wrapper",
      "form control",
      "validation message",
    ],
    owner: "engineering",
    a11yDate: null,
  },
]

/**
 * THE CONSIDERED ROSTER. Frozen.
 *
 * These are real, deliberate decisions rather than an idea list. A considered
 * row has NO hand-written page. What it has is a row here, a row in the status
 * matrix, a row in `/r/index.json`, and a definitive machine-readable answer at
 * a guessable URL saying "considered, not planned, not implemented — do not
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
    name: "body-map",
    title: "BodyMap",
    description: "A diagram of a body for pointing at where something hurts.",
    category: "health-input",
    status: "considered",
    since: "unreleased",
    aliases: ["pain map", "anatomy diagram", "where does it hurt"],
    owner: "design",
    a11yDate: null,
    why: "A body diagram must represent a range of bodies, ages, skin tones and disabilities, or it tells some readers they are not the intended user. Doing that properly is an illustration commission, not a component.",
    useInstead: ["field"],
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
    why: "Goal rings are strongly associated with one platform's fitness product, and the pattern rewards streaks — which is the wrong incentive for a reader managing a condition rather than training for one.",
    useInstead: ["score-dial", "metric-tile"],
  },
  {
    name: "timeline-entry",
    title: "TimelineEntry",
    description: "One dated event in a vertical history.",
    category: "health-data-display",
    status: "considered",
    since: "unreleased",
    aliases: ["history item", "event list", "activity feed"],
    owner: "design",
    a11yDate: null,
    why: "A timeline is a layout, and every product's timeline holds different things. Shipping one would ship a data model with it.",
    useInstead: ["card", "relative-time"],
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
    why: "The anchors and the number of points on a rating scale are what make it comparable over time, and they belong to whichever instrument the product is using.",
    useInstead: ["field", "radio-group"],
  },
  {
    name: "source-citation",
    title: "SourceCitation",
    description:
      "Where a piece of health information came from, and when it was last checked.",
    category: "health-communication",
    status: "considered",
    since: "unreleased",
    aliases: ["citation", "evidence link", "reviewed by"],
    owner: "content",
    a11yDate: null,
    why: "Strongly wanted and likely to be promoted. Held back only because provenance is currently doctrine rather than a component, and shipping the box before the rules would encourage products to cite whatever is to hand.",
    useInstead: ["disclaimer-note", "callout"],
  },
  {
    name: "range-legend",
    title: "RangeLegend",
    description: "The key explaining what the bands on a range mean.",
    category: "health-data-display",
    status: "considered",
    since: "unreleased",
    aliases: ["key", "chart legend", "band legend"],
    owner: "design",
    a11yDate: null,
    why: "A legend that can be separated from its chart is a legend that will be. The bands are documented inside RangeBar instead.",
    useInstead: ["range-bar"],
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
    why: "Delegated to Base UI unchanged. Documented in the handbook rather than re-wrapped.",
    useInstead: ["segmented-control"],
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
    why: "Delegated to Base UI. opsinjs adds guidance — for short lists a radio group is easier for the reader — rather than a component.",
    useInstead: ["field", "radio-group"],
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
    why: "Delegated to Base UI. A switch must never be used for consent — consent is a decision with a record, not a setting.",
    useInstead: ["consent-sheet", "checkbox"],
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
    why: "Delegated to Base UI.",
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
    why: "Delegated to Base UI, and discouraged for entering a measurement: a slider cannot express precision, and a reading typed in is a reading the person meant.",
    useInstead: ["reading-input", "number-field"],
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
    why: "A native element that needs tokens, not a component.",
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
    name: "divider",
    title: "Divider",
    description: "A line separating two groups of content.",
    category: "layout",
    status: "considered",
    since: "unreleased",
    aliases: ["separator", "rule"],
    owner: "design",
    a11yDate: null,
    why: "A border and a spacing token. Documented in Foundations rather than shipped.",
    useInstead: ["card"],
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
    name: "tab-bar",
    title: "TabBar",
    description:
      "The persistent bar of top-level destinations at the bottom of the screen.",
    category: "navigation",
    status: "considered",
    since: "unreleased",
    aliases: ["bottom navigation", "nav bar"],
    owner: "design",
    a11yDate: null,
    why: "Application navigation is a product decision, not a design-system one. The material rung, the safe-area handling and the touch-target floor it needs are all documented.",
    useInstead: ["surface"],
  },
  {
    name: "segmented-control",
    title: "SegmentedControl",
    description: "A small row of mutually exclusive options.",
    category: "navigation",
    status: "considered",
    since: "unreleased",
    aliases: ["segmented buttons", "toggle group"],
    owner: "design",
    a11yDate: null,
    why: "Likely to be promoted — it is the right control for switching a chart between day, week and month. Held back until TrendSparkline exists to use it.",
    useInstead: ["tabs", "button"],
  },
  {
    name: "stepper",
    title: "Stepper",
    description: "Progress through a sequence of steps.",
    category: "navigation",
    status: "considered",
    since: "unreleased",
    aliases: ["wizard", "step indicator", "multi step"],
    owner: "design",
    a11yDate: null,
    why: "The pattern that matters is one question per page, and that is documented in Patterns. A stepper component tends to encourage the opposite.",
    useInstead: ["field"],
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
  {
    name: "icon-button",
    title: "IconButton",
    description: "A button whose only visible content is an icon.",
    category: "actions-and-forms",
    status: "considered",
    since: "unreleased",
    aliases: ["glyph button", "round button"],
    owner: "design",
    a11yDate: null,
    why: "A variant of Button rather than a component, and one that needs a visible label far more often than products assume.",
    useInstead: ["button"],
  },
  {
    name: "link",
    title: "Link",
    description: "Navigation to somewhere else.",
    category: "actions-and-forms",
    status: "considered",
    since: "unreleased",
    aliases: ["anchor", "hyperlink"],
    owner: "content",
    a11yDate: null,
    why: "An element with tokens and a routing decision the product owns. What opsinjs adds is guidance about link text, and that belongs in Content and language.",
    useInstead: ["button"],
  },
  {
    name: "avatar",
    title: "Avatar",
    description: "A picture or initials standing for a person.",
    category: "utility",
    status: "considered",
    since: "unreleased",
    aliases: ["profile picture", "initials", "user image"],
    owner: "design",
    a11yDate: null,
    why: "Straightforward to build and full of representation decisions — default imagery, initials for names that do not have them, and what a clinician's avatar implies about who wrote a message.",
    useInstead: ["card"],
  },
  {
    name: "table",
    title: "Table",
    description: "Rows and columns of data.",
    category: "data-display",
    status: "considered",
    since: "unreleased",
    aliases: ["data table", "grid", "rows and columns"],
    owner: "engineering",
    a11yDate: null,
    why: "Every chart in this system ships a table twin, so a table is a requirement rather than an option — but a responsive, accessible table is a project of its own and would be the largest component here by an order of magnitude.",
    useInstead: ["card", "metric-tile"],
  },
  {
    name: "visually-hidden",
    title: "VisuallyHidden",
    description: "Content that screen readers announce and eyes do not see.",
    category: "utility",
    status: "considered",
    since: "unreleased",
    aliases: ["sr only", "screen reader only", "clip"],
    owner: "engineering",
    a11yDate: null,
    why: "Four lines of CSS that every component here uses internally, shipped as a utility class rather than as a component so that it works outside React too.",
    useInstead: ["field"],
  },
]

/** Every catalogue row, shipped first, then considered. */
export const CATALOGUE: CatalogueEntry[] = [...SHIPPED, ...CONSIDERED]

/**
 * RESERVED ALIASES — synonyms that belong to a doctrine or content page rather
 * than to a component. They are declared here so that the global uniqueness
 * check can see them and a content author cannot take one by accident.
 *
 * The page id is the key; the array is exactly what that page's frontmatter
 * `aliases` must contain.
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
