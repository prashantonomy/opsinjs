import {
  CLINICAL_STATUSES,
  CLINICAL_STATUS_META,
  type ClinicalStatus,
} from "@/lib/status"

/**
 * Presentation copy for the two colour axes, for the hand-written routes.
 *
 * The vocabulary itself is NOT declared here. The four clinical status levels —
 * their words, their example sentences, their icons and who is entitled to
 * assign them — live in `lib/status.ts`, which is the single runtime status
 * vocabulary for the whole system. This module adds only what a marketing or
 * tool surface needs on top of it, and adapts the ids to the token layer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE SHIM BELOW IS TEMPORARY, AND IT IS PAPERING OVER A REAL DISAGREEMENT.
 *
 * `lib/status.ts` names the four levels `steady · watch · attention · urgent`,
 * which is what `sidebar.txt` specifies and what every documentation page will
 * say. The CSS token layer — `app/globals.css`, `app/product.css` and the
 * generated `app/tokens.generated.css` — names them
 * `expected · watch · act · urgent` and emits custom properties to match.
 *
 * Nothing fails when those two disagree. `--opsin-status-steady-surface` simply
 * does not exist, resolves to nothing, and the surface renders untinted: a
 * silent, invisible failure in the one part of the system that is supposed to
 * be impossible to get quietly wrong.
 *
 * Until one side is renamed, every page here uses the WORDS from `lib/status.ts`
 * and the TOKEN IDS from the stylesheet, mapped once, in `STATUS_TOKEN_ID`.
 * When the two are reconciled that map becomes the identity function and should
 * be deleted along with every `tokenId` reference.
 *
 * The category axis has the same disagreement and no faithful mapping:
 * `lib/status.ts` lists `sleep · heart · activity · nutrition · mind · labs`
 * while the token layer defines `cardio · metabolic · respiratory · activity ·
 * sleep · body`. Four of the six have no counterpart in either direction, so
 * the categories below are the token layer's — because those are the ones that
 * actually paint — and reconciling them is a decision for the token source
 * rather than a mapping anybody can write.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Clinical status id → the id used in `--opsin-status-<id>-*`. TEMPORARY. */
export const STATUS_TOKEN_ID: Record<ClinicalStatus, string> = {
  steady: "expected",
  watch: "watch",
  attention: "act",
  urgent: "urgent",
}

/**
 * One line on what the level asks of the reader.
 *
 * `lib/status.ts` carries the canonical example sentence, which is written for
 * a patient. This is the same idea written for a developer choosing a level in
 * a component — a different audience, deliberately, and the only reason it is
 * not simply reused.
 */
const STATUS_MEANING: Record<ClinicalStatus, string> = {
  steady: "Inside the range this person was given. No action.",
  watch: "Outside the range but not urgent. Worth another reading.",
  attention: "Do something today, and say exactly what.",
  urgent: "Stop reading the app and get help now.",
}

export type StatusLevel = {
  id: ClinicalStatus
  /** The id the CSS custom properties actually use. See the shim note above. */
  tokenId: string
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
  tokenId: STATUS_TOKEN_ID[id],
  label: CLINICAL_STATUS_META[id].word,
  sentence: CLINICAL_STATUS_META[id].sentence,
  meaning: STATUS_MEANING[id],
  icon: CLINICAL_STATUS_META[id].icon,
}))

/**
 * The six measurement categories the TOKEN LAYER defines.
 *
 * Category is identity — what kind of measurement this is — and never a verdict.
 * The chroma is deliberately low so that a category swatch cannot be mistaken
 * for a status one.
 */
export const categories = [
  {
    id: "cardio",
    label: "Cardio",
    example: "Blood pressure, resting heart rate",
  },
  {
    id: "metabolic",
    label: "Metabolic",
    example: "Blood glucose, HbA1c, cholesterol",
  },
  {
    id: "respiratory",
    label: "Respiratory",
    example: "Blood oxygen, peak flow",
  },
  {
    id: "activity",
    label: "Activity",
    example: "Steps, active minutes, distance",
  },
  { id: "sleep", label: "Sleep", example: "Duration, timing, consistency" },
  { id: "body", label: "Body", example: "Weight, temperature, waist" },
] as const

export type CategoryId = (typeof categories)[number]["id"]
export type StatusLevelId = ClinicalStatus
