import {
  CLINICAL_STATUSES,
  CLINICAL_STATUS_META,
  HEALTH_CATEGORIES,
  HEALTH_CATEGORY_LABELS,
  type ClinicalStatus,
  type HealthCategory,
} from "@/lib/status"

/**
 * Presentation copy for the two colour axes, for the hand-written routes.
 *
 * The vocabulary itself is NOT declared here. The four clinical status levels
 * and the six measurement categories live in `lib/status.ts`, which is the
 * single runtime vocabulary for the whole system, and which `tokens/color.json`
 * mirrors so that `--opsin-status-<id>-*` and `--opsin-category-<id>-*` use the
 * same ids. `lib/status.ts` is where their words, their example sentences,
 * their icons and who is entitled to assign them are all declared. This module
 * adds only what a marketing or tool surface needs on top of that.
 *
 * There used to be a `STATUS_TOKEN_ID` shim here, mapping `steady → expected`
 * and `attention → act`, because the authored CSS layer had guessed a
 * different set of names from the one the documentation was written against.
 * That disagreement was silent. `--opsin-status-steady-surface` simply did not
 * exist, resolved to nothing, and the surface rendered untinted. The CSS has
 * been renamed to the ids below, so ids and words now agree end to end and the
 * shim is gone. If a `tokenId` reference survives anywhere, it is dead.
 */

/**
 * One line on what the level asks of the reader.
 *
 * `lib/status.ts` carries the canonical example sentence, which is written for
 * a patient. This is the same idea written for a developer choosing a level in
 * a component. The audience is deliberately different, and that difference is
 * the only reason the example sentence is not simply reused.
 */
const STATUS_MEANING: Record<ClinicalStatus, string> = {
  steady: "Inside the range this person was given. No action.",
  watch: "Outside the range but not urgent. Worth another reading.",
  attention: "Do something today, and say exactly what.",
  urgent: "Stop reading the app and get help now.",
}

export type StatusLevel = {
  /** Also the token segment: `--opsin-status-<id>-*`. */
  id: ClinicalStatus
  label: string
  /** Written for a patient. From `lib/status.ts`. */
  sentence: string
  /** Written for a developer choosing a level. */
  meaning: string
  /** lucide icon name. Colour is never the only carrier of the verdict. */
  icon: string
}

export const statusLevels: StatusLevel[] = CLINICAL_STATUSES.map((id) => ({
  id,
  label: CLINICAL_STATUS_META[id].word,
  sentence: CLINICAL_STATUS_META[id].sentence,
  meaning: STATUS_MEANING[id],
  icon: CLINICAL_STATUS_META[id].icon,
}))

/**
 * What each of the six measurement categories covers, for a reader meeting the
 * axis for the first time.
 *
 * The ids and the labels come from `lib/status.ts`; only the examples are new,
 * because a category is easier to understand from three readings that belong
 * to it than from its name. Category is identity. It names what kind of
 * measurement this is, and it is never a verdict. The chroma is deliberately
 * low so a category swatch cannot be mistaken for a status one.
 */
const CATEGORY_EXAMPLE: Record<HealthCategory, string> = {
  sleep: "Duration, timing, consistency",
  heart: "Blood pressure, resting heart rate",
  activity: "Steps, active minutes, distance",
  nutrition: "Energy, protein, hydration",
  mind: "Mood, stress, questionnaire scores",
  labs: "Blood glucose, HbA1c, cholesterol",
}

export const categories = HEALTH_CATEGORIES.map((id) => ({
  id,
  label: HEALTH_CATEGORY_LABELS[id],
  example: CATEGORY_EXAMPLE[id],
}))

export type CategoryId = HealthCategory
export type StatusLevelId = ClinicalStatus
