/**
 * The clinical vocabulary: the four statuses a reading can carry and the
 * health categories a surface can belong to. These are the two colour axes,
 * and `axisConflict` is the guard that keeps them off one element.
 *
 * This module has no imports, no JSX and no non-erasable TypeScript syntax,
 * because the documentation site's scripts are run by plain `node` and import
 * it directly with an explicit `.ts` extension.
 */
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
