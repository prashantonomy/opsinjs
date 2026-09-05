/* eslint-disable */
/**
 * GENERATED FILE - DO NOT EDIT.
 *
 * Source:    tokens/*.json
 * Generator: scripts/build-tokens.mts   (`pnpm run generate`)
 * Gate:      `pnpm check:generated` regenerates this file and fails on a diff.
 *
 * lib/tokens.ts is the typed reader over this module; pages and MDX components
 * import that, never this. Editing a value here is not a change - it is a
 * conflict with tokens/*.json that the next `pnpm generate` deletes.
 *
 * WHY `TOKEN_META.generatedAt` IS NOT A TIMESTAMP. This file is guarded by a
 * byte-for-byte drift gate: CI regenerates it and fails on any diff. A build
 * time would therefore fail every run made on a different second from the
 * commit. It carries the token source hash instead - non-null once the
 * generator has actually run, and changing when, and only when, tokens/*.json
 * changes. `tokensAreGenerated()` reads it exactly as intended.
 */

/** Which token source file a token came from. One namespace per file in `tokens/`. */
export type TokenNamespace = "color" | "material" | "motion" | "type" | "space" | "shape"

/**
 * The three tiers from /docs/foundations/token-architecture.
 *
 *   primitive  a raw value on a scale - `--opsin-category-heart-600`. May be
 *              re-tuned in a minor release. Components must never reference one.
 *   semantic   a role - `--opsin-status-urgent-ink`. Covered by the versioning
 *              policy, which explicitly includes CSS custom properties.
 *   component  a token scoped to one component's internals.
 */
export type TokenTier = "primitive" | "semantic" | "component"

export interface GeneratedToken {
  /** The token's name without the prefix: `status-urgent-ink`. */
  name: string
  /** The full custom property: `--opsin-status-urgent-ink`. */
  cssVar: string
  namespace: TokenNamespace
  tier: TokenTier
  /** The sub-group within the namespace, for table headings: `status`, `category`, `ladder`. */
  group: string
  /** The light-mode value, as it appears in CSS. May be a `var()` reference. */
  value: string
  /** The dark-mode value, when the token has one. */
  darkValue?: string
  /** The Display-P3 enhancement, emitted inside `@supports (color-gamut: p3)`. */
  p3Value?: string
  /** The Display-P3 enhancement for the dark theme. */
  p3DarkValue?: string
  /** What this token controls - the second column of every token table. */
  description: string
  /**
   * Which registry components consume it. The THIRD column, and the one that
   * turns a token list into a decision aid.
   *
   * Derived by scanning `registry/bases` for two things: the token's custom
   * property written literally, and any Tailwind utility that app/product.css
   * bridges back to it in `@theme inline` - which is how the status, category,
   * type, space and radius tokens are really consumed. Empty means no shipped
   * component reads this token, which for a primitive is the expected state:
   * components consume roles, and roles reference primitives. Examples and
   * screens are out of scope, so a token used only by a demo reads empty too.
   */
  usedBy: string[]
  deprecated?: { since: string; replacement: string; removal: string }
  /** The literal behind `value` when it is a single `var()` reference. */
  resolvedValue?: string
  /** The literal behind `darkValue` when it is a `var()` reference. */
  darkResolvedValue?: string
  /** The value this token takes under `prefers-reduced-motion: reduce`. */
  reducedMotionValue?: string
  /**
   * The value this token takes under `prefers-reduced-transparency: reduce`.
   * Only the material ladder has one: reduced transparency is a statement about
   * surfaces, so no colour, type, space or shape token moves under it.
   */
  reducedTransparencyValue?: string
  /** Where it was authored: `color.json#status.urgent.roles.ink`. */
  sourcePath?: string
}

/** One row of the clinical to plain-English glossary. */
export interface GeneratedGlossaryEntry {
  term: string
  plain: string
  definition?: string
  /** `always` | `first-use` | `plain-only` - when the clinical term must still appear. */
  showBoth?: string
  reason?: string
  category?: string
  related?: string[]
}

/** A word the system does not use, and what to write instead. */
export interface GeneratedBannedWord {
  word: string
  instead: string
  reason: string
}

export const TOKENS: GeneratedToken[] = [
  { name: "neutral-0", cssVar: "--opsin-neutral-0", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(1 0 0)", description: "Neutral ramp, step 0.", usedBy: [], sourcePath: "color.json#neutral.steps.0" },
  { name: "neutral-50", cssVar: "--opsin-neutral-50", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(0.985 0.002 250)", description: "Neutral ramp, step 50.", usedBy: [], sourcePath: "color.json#neutral.steps.50" },
  { name: "neutral-100", cssVar: "--opsin-neutral-100", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(0.967 0.003 250)", description: "Neutral ramp, step 100.", usedBy: [], sourcePath: "color.json#neutral.steps.100" },
  { name: "neutral-200", cssVar: "--opsin-neutral-200", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(0.929 0.004 250)", description: "Neutral ramp, step 200.", usedBy: [], sourcePath: "color.json#neutral.steps.200" },
  { name: "neutral-300", cssVar: "--opsin-neutral-300", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(0.871 0.005 250)", description: "Neutral ramp, step 300.", usedBy: [], sourcePath: "color.json#neutral.steps.300" },
  { name: "neutral-400", cssVar: "--opsin-neutral-400", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(0.708 0.008 250)", description: "Neutral ramp, step 400.", usedBy: [], sourcePath: "color.json#neutral.steps.400" },
  { name: "neutral-500", cssVar: "--opsin-neutral-500", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(0.556 0.009 250)", description: "Neutral ramp, step 500.", usedBy: [], sourcePath: "color.json#neutral.steps.500" },
  { name: "neutral-600", cssVar: "--opsin-neutral-600", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(0.439 0.009 250)", description: "Neutral ramp, step 600.", usedBy: [], sourcePath: "color.json#neutral.steps.600" },
  { name: "neutral-700", cssVar: "--opsin-neutral-700", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(0.371 0.008 250)", description: "Neutral ramp, step 700.", usedBy: [], sourcePath: "color.json#neutral.steps.700" },
  { name: "neutral-800", cssVar: "--opsin-neutral-800", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(0.269 0.007 250)", description: "Neutral ramp, step 800.", usedBy: [], sourcePath: "color.json#neutral.steps.800" },
  { name: "neutral-900", cssVar: "--opsin-neutral-900", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(0.205 0.006 250)", description: "Neutral ramp, step 900.", usedBy: [], sourcePath: "color.json#neutral.steps.900" },
  { name: "neutral-950", cssVar: "--opsin-neutral-950", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(0.145 0.005 250)", description: "Neutral ramp, step 950.", usedBy: [], sourcePath: "color.json#neutral.steps.950" },
  { name: "neutral-1000", cssVar: "--opsin-neutral-1000", namespace: "color", tier: "primitive", group: "neutral", value: "oklch(0 0 0)", description: "Neutral ramp, step 1000.", usedBy: [], sourcePath: "color.json#neutral.steps.1000" },
  { name: "category-sleep-50", cssVar: "--opsin-category-sleep-50", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.972 0.013 275)", p3Value: "oklch(0.972 0.015 275)", description: "Sleep ramp, step 50.", usedBy: [], sourcePath: "color.json#categories.sleep.steps.50" },
  { name: "category-sleep-100", cssVar: "--opsin-category-sleep-100", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.941 0.028 275)", p3Value: "oklch(0.941 0.031 275)", description: "Sleep ramp, step 100.", usedBy: [], sourcePath: "color.json#categories.sleep.steps.100" },
  { name: "category-sleep-200", cssVar: "--opsin-category-sleep-200", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.884 0.057 275)", p3Value: "oklch(0.884 0.062 275)", description: "Sleep ramp, step 200.", usedBy: [], sourcePath: "color.json#categories.sleep.steps.200" },
  { name: "category-sleep-300", cssVar: "--opsin-category-sleep-300", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.806 0.092 275)", p3Value: "oklch(0.806 0.107 275)", description: "Sleep ramp, step 300.", usedBy: [], sourcePath: "color.json#categories.sleep.steps.300" },
  { name: "category-sleep-400", cssVar: "--opsin-category-sleep-400", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.714 0.123 275)", p3Value: "oklch(0.714 0.145 275)", description: "Sleep ramp, step 400.", usedBy: [], sourcePath: "color.json#categories.sleep.steps.400" },
  { name: "category-sleep-500", cssVar: "--opsin-category-sleep-500", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.622 0.14 275)", p3Value: "oklch(0.622 0.165 275)", description: "Sleep ramp, step 500.", usedBy: [], sourcePath: "color.json#categories.sleep.steps.500" },
  { name: "category-sleep-600", cssVar: "--opsin-category-sleep-600", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.541 0.136 275)", p3Value: "oklch(0.541 0.16 275)", description: "Sleep ramp, step 600.", usedBy: [], sourcePath: "color.json#categories.sleep.steps.600" },
  { name: "category-sleep-700", cssVar: "--opsin-category-sleep-700", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.452 0.123 275)", p3Value: "oklch(0.452 0.145 275)", description: "Sleep ramp, step 700.", usedBy: [], sourcePath: "color.json#categories.sleep.steps.700" },
  { name: "category-sleep-800", cssVar: "--opsin-category-sleep-800", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.362 0.104 275)", p3Value: "oklch(0.362 0.122 275)", description: "Sleep ramp, step 800.", usedBy: [], sourcePath: "color.json#categories.sleep.steps.800" },
  { name: "category-sleep-900", cssVar: "--opsin-category-sleep-900", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.276 0.081 275)", p3Value: "oklch(0.276 0.096 275)", description: "Sleep ramp, step 900.", usedBy: [], sourcePath: "color.json#categories.sleep.steps.900" },
  { name: "category-sleep-950", cssVar: "--opsin-category-sleep-950", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.208 0.062 275)", p3Value: "oklch(0.208 0.073 275)", description: "Sleep ramp, step 950.", usedBy: [], sourcePath: "color.json#categories.sleep.steps.950" },
  { name: "category-sleep-surface", cssVar: "--opsin-category-sleep-surface", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.972 0.013 275)", darkValue: "oklch(0.276 0.081 275)", p3Value: "oklch(0.972 0.015 275)", p3DarkValue: "oklch(0.276 0.096 275)", description: "The tinted background a component in this ramp sits on.", usedBy: [], sourcePath: "color.json#categories.sleep.roles.surface" },
  { name: "category-sleep-line", cssVar: "--opsin-category-sleep-line", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.541 0.136 275)", darkValue: "oklch(0.806 0.092 275)", p3Value: "oklch(0.541 0.16 275)", p3DarkValue: "oklch(0.806 0.107 275)", description: "The boundary, icon stroke or chart mark. The lightest value in the ramp that clears the non-text floor against `surface`.", usedBy: ["trend-sparkline"], sourcePath: "color.json#categories.sleep.roles.line" },
  { name: "category-sleep-ink", cssVar: "--opsin-category-sleep-ink", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.362 0.104 275)", darkValue: "oklch(0.941 0.028 275)", p3Value: "oklch(0.362 0.122 275)", p3DarkValue: "oklch(0.941 0.031 275)", description: "Text and text-sized icons on `surface`. Clears the text floor against `surface`.", usedBy: ["metric-tile", "range-bar", "result-card", "score-dial"], sourcePath: "color.json#categories.sleep.roles.ink" },
  { name: "category-sleep-accent", cssVar: "--opsin-category-sleep-accent", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.58 0.14 275)", darkValue: "oklch(0.714 0.123 275)", p3DarkValue: "oklch(0.714 0.145 275)", description: "The identity fill: a bar fill, a dial track, a legend dot. Chosen for recognition, not for contrast. It must be bounded by `line` or labelled in `ink`; it is never the only thing that carries the meaning.", usedBy: ["log-sheet"], sourcePath: "color.json#categories.sleep.roles.accent" },
  { name: "category-heart-50", cssVar: "--opsin-category-heart-50", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.972 0.014 15)", p3Value: "oklch(0.972 0.018 15)", description: "Heart ramp, step 50.", usedBy: [], sourcePath: "color.json#categories.heart.steps.50" },
  { name: "category-heart-100", cssVar: "--opsin-category-heart-100", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.941 0.03 15)", p3Value: "oklch(0.941 0.039 15)", description: "Heart ramp, step 100.", usedBy: [], sourcePath: "color.json#categories.heart.steps.100" },
  { name: "category-heart-200", cssVar: "--opsin-category-heart-200", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.884 0.062 15)", p3Value: "oklch(0.884 0.081 15)", description: "Heart ramp, step 200.", usedBy: [], sourcePath: "color.json#categories.heart.steps.200" },
  { name: "category-heart-300", cssVar: "--opsin-category-heart-300", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.806 0.112 15)", p3Value: "oklch(0.806 0.132 15)", description: "Heart ramp, step 300.", usedBy: [], sourcePath: "color.json#categories.heart.steps.300" },
  { name: "category-heart-400", cssVar: "--opsin-category-heart-400", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.714 0.15 15)", p3Value: "oklch(0.714 0.177 15)", description: "Heart ramp, step 400.", usedBy: [], sourcePath: "color.json#categories.heart.steps.400" },
  { name: "category-heart-500", cssVar: "--opsin-category-heart-500", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.622 0.17 15)", p3Value: "oklch(0.622 0.201 15)", description: "Heart ramp, step 500.", usedBy: [], sourcePath: "color.json#categories.heart.steps.500" },
  { name: "category-heart-600", cssVar: "--opsin-category-heart-600", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.541 0.165 15)", p3Value: "oklch(0.541 0.195 15)", description: "Heart ramp, step 600.", usedBy: [], sourcePath: "color.json#categories.heart.steps.600" },
  { name: "category-heart-700", cssVar: "--opsin-category-heart-700", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.452 0.15 15)", p3Value: "oklch(0.452 0.177 15)", description: "Heart ramp, step 700.", usedBy: [], sourcePath: "color.json#categories.heart.steps.700" },
  { name: "category-heart-800", cssVar: "--opsin-category-heart-800", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.362 0.126 15)", p3Value: "oklch(0.362 0.148 15)", description: "Heart ramp, step 800.", usedBy: [], sourcePath: "color.json#categories.heart.steps.800" },
  { name: "category-heart-900", cssVar: "--opsin-category-heart-900", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.276 0.099 15)", p3Value: "oklch(0.276 0.116 15)", description: "Heart ramp, step 900.", usedBy: [], sourcePath: "color.json#categories.heart.steps.900" },
  { name: "category-heart-950", cssVar: "--opsin-category-heart-950", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.208 0.075 15)", p3Value: "oklch(0.208 0.088 15)", description: "Heart ramp, step 950.", usedBy: [], sourcePath: "color.json#categories.heart.steps.950" },
  { name: "category-heart-surface", cssVar: "--opsin-category-heart-surface", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.972 0.014 15)", darkValue: "oklch(0.276 0.099 15)", p3Value: "oklch(0.972 0.018 15)", p3DarkValue: "oklch(0.276 0.116 15)", description: "The tinted background a component in this ramp sits on.", usedBy: [], sourcePath: "color.json#categories.heart.roles.surface" },
  { name: "category-heart-line", cssVar: "--opsin-category-heart-line", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.541 0.165 15)", darkValue: "oklch(0.806 0.112 15)", p3Value: "oklch(0.541 0.195 15)", p3DarkValue: "oklch(0.806 0.132 15)", description: "The boundary, icon stroke or chart mark. The lightest value in the ramp that clears the non-text floor against `surface`.", usedBy: ["trend-sparkline"], sourcePath: "color.json#categories.heart.roles.line" },
  { name: "category-heart-ink", cssVar: "--opsin-category-heart-ink", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.362 0.126 15)", darkValue: "oklch(0.941 0.03 15)", p3Value: "oklch(0.362 0.148 15)", p3DarkValue: "oklch(0.941 0.039 15)", description: "Text and text-sized icons on `surface`. Clears the text floor against `surface`.", usedBy: ["metric-tile", "range-bar", "result-card", "score-dial"], sourcePath: "color.json#categories.heart.roles.ink" },
  { name: "category-heart-accent", cssVar: "--opsin-category-heart-accent", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.62 0.17 15)", darkValue: "oklch(0.714 0.15 15)", p3DarkValue: "oklch(0.714 0.177 15)", description: "The identity fill: a bar fill, a dial track, a legend dot. Chosen for recognition, not for contrast. It must be bounded by `line` or labelled in `ink`; it is never the only thing that carries the meaning.", usedBy: ["log-sheet"], sourcePath: "color.json#categories.heart.roles.accent" },
  { name: "category-activity-50", cssVar: "--opsin-category-activity-50", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.972 0.022 140)", p3Value: "oklch(0.972 0.026 140)", description: "Activity ramp, step 50.", usedBy: [], sourcePath: "color.json#categories.activity.steps.50" },
  { name: "category-activity-100", cssVar: "--opsin-category-activity-100", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.941 0.038 140)", p3Value: "oklch(0.941 0.045 140)", description: "Activity ramp, step 100.", usedBy: [], sourcePath: "color.json#categories.activity.steps.100" },
  { name: "category-activity-200", cssVar: "--opsin-category-activity-200", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.884 0.067 140)", p3Value: "oklch(0.884 0.079 140)", description: "Activity ramp, step 200.", usedBy: [], sourcePath: "color.json#categories.activity.steps.200" },
  { name: "category-activity-300", cssVar: "--opsin-category-activity-300", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.806 0.106 140)", p3Value: "oklch(0.806 0.125 140)", description: "Activity ramp, step 300.", usedBy: [], sourcePath: "color.json#categories.activity.steps.300" },
  { name: "category-activity-400", cssVar: "--opsin-category-activity-400", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.714 0.141 140)", p3Value: "oklch(0.714 0.166 140)", description: "Activity ramp, step 400.", usedBy: [], sourcePath: "color.json#categories.activity.steps.400" },
  { name: "category-activity-500", cssVar: "--opsin-category-activity-500", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.622 0.16 140)", p3Value: "oklch(0.622 0.189 140)", description: "Activity ramp, step 500.", usedBy: [], sourcePath: "color.json#categories.activity.steps.500" },
  { name: "category-activity-600", cssVar: "--opsin-category-activity-600", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.541 0.155 140)", p3Value: "oklch(0.541 0.183 140)", description: "Activity ramp, step 600.", usedBy: [], sourcePath: "color.json#categories.activity.steps.600" },
  { name: "category-activity-700", cssVar: "--opsin-category-activity-700", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.452 0.141 140)", p3Value: "oklch(0.452 0.166 140)", description: "Activity ramp, step 700.", usedBy: [], sourcePath: "color.json#categories.activity.steps.700" },
  { name: "category-activity-800", cssVar: "--opsin-category-activity-800", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.362 0.118 140)", p3Value: "oklch(0.362 0.139 140)", description: "Activity ramp, step 800.", usedBy: [], sourcePath: "color.json#categories.activity.steps.800" },
  { name: "category-activity-900", cssVar: "--opsin-category-activity-900", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.276 0.092 140)", p3Value: "oklch(0.276 0.108 140)", description: "Activity ramp, step 900.", usedBy: [], sourcePath: "color.json#categories.activity.steps.900" },
  { name: "category-activity-950", cssVar: "--opsin-category-activity-950", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.208 0.07 140)", p3Value: "oklch(0.208 0.083 140)", description: "Activity ramp, step 950.", usedBy: [], sourcePath: "color.json#categories.activity.steps.950" },
  { name: "category-activity-surface", cssVar: "--opsin-category-activity-surface", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.972 0.022 140)", darkValue: "oklch(0.276 0.092 140)", p3Value: "oklch(0.972 0.026 140)", p3DarkValue: "oklch(0.276 0.108 140)", description: "The tinted background a component in this ramp sits on.", usedBy: [], sourcePath: "color.json#categories.activity.roles.surface" },
  { name: "category-activity-line", cssVar: "--opsin-category-activity-line", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.541 0.155 140)", darkValue: "oklch(0.806 0.106 140)", p3Value: "oklch(0.541 0.183 140)", p3DarkValue: "oklch(0.806 0.125 140)", description: "The boundary, icon stroke or chart mark. The lightest value in the ramp that clears the non-text floor against `surface`.", usedBy: ["trend-sparkline"], sourcePath: "color.json#categories.activity.roles.line" },
  { name: "category-activity-ink", cssVar: "--opsin-category-activity-ink", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.362 0.118 140)", darkValue: "oklch(0.941 0.038 140)", p3Value: "oklch(0.362 0.139 140)", p3DarkValue: "oklch(0.941 0.045 140)", description: "Text and text-sized icons on `surface`. Clears the text floor against `surface`.", usedBy: ["metric-tile", "range-bar", "result-card", "score-dial"], sourcePath: "color.json#categories.activity.roles.ink" },
  { name: "category-activity-accent", cssVar: "--opsin-category-activity-accent", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.7 0.16 140)", darkValue: "oklch(0.714 0.141 140)", p3DarkValue: "oklch(0.714 0.166 140)", description: "The identity fill: a bar fill, a dial track, a legend dot. Chosen for recognition, not for contrast. It must be bounded by `line` or labelled in `ink`; it is never the only thing that carries the meaning.", usedBy: ["log-sheet"], sourcePath: "color.json#categories.activity.roles.accent" },
  { name: "category-nutrition-50", cssVar: "--opsin-category-nutrition-50", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.972 0.02 70)", p3Value: "oklch(0.972 0.023 70)", description: "Nutrition ramp, step 50.", usedBy: [], sourcePath: "color.json#categories.nutrition.steps.50" },
  { name: "category-nutrition-100", cssVar: "--opsin-category-nutrition-100", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.941 0.034 70)", p3Value: "oklch(0.941 0.04 70)", description: "Nutrition ramp, step 100.", usedBy: [], sourcePath: "color.json#categories.nutrition.steps.100" },
  { name: "category-nutrition-200", cssVar: "--opsin-category-nutrition-200", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.884 0.059 70)", p3Value: "oklch(0.884 0.069 70)", description: "Nutrition ramp, step 200.", usedBy: [], sourcePath: "color.json#categories.nutrition.steps.200" },
  { name: "category-nutrition-300", cssVar: "--opsin-category-nutrition-300", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.806 0.092 70)", p3Value: "oklch(0.806 0.109 70)", description: "Nutrition ramp, step 300.", usedBy: [], sourcePath: "color.json#categories.nutrition.steps.300" },
  { name: "category-nutrition-400", cssVar: "--opsin-category-nutrition-400", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.714 0.123 70)", p3Value: "oklch(0.714 0.145 70)", description: "Nutrition ramp, step 400.", usedBy: [], sourcePath: "color.json#categories.nutrition.steps.400" },
  { name: "category-nutrition-500", cssVar: "--opsin-category-nutrition-500", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.622 0.135 70)", p3Value: "oklch(0.622 0.155 70)", description: "Nutrition ramp, step 500.", usedBy: [], sourcePath: "color.json#categories.nutrition.steps.500" },
  { name: "category-nutrition-600", cssVar: "--opsin-category-nutrition-600", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.541 0.118 70)", p3Value: "oklch(0.541 0.135 70)", description: "Nutrition ramp, step 600.", usedBy: [], sourcePath: "color.json#categories.nutrition.steps.600" },
  { name: "category-nutrition-700", cssVar: "--opsin-category-nutrition-700", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.452 0.099 70)", p3Value: "oklch(0.452 0.113 70)", description: "Nutrition ramp, step 700.", usedBy: [], sourcePath: "color.json#categories.nutrition.steps.700" },
  { name: "category-nutrition-800", cssVar: "--opsin-category-nutrition-800", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.362 0.08 70)", p3Value: "oklch(0.362 0.091 70)", description: "Nutrition ramp, step 800.", usedBy: [], sourcePath: "color.json#categories.nutrition.steps.800" },
  { name: "category-nutrition-900", cssVar: "--opsin-category-nutrition-900", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.276 0.062 70)", p3Value: "oklch(0.276 0.071 70)", description: "Nutrition ramp, step 900.", usedBy: [], sourcePath: "color.json#categories.nutrition.steps.900" },
  { name: "category-nutrition-950", cssVar: "--opsin-category-nutrition-950", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.208 0.049 70)", p3Value: "oklch(0.208 0.056 70)", description: "Nutrition ramp, step 950.", usedBy: [], sourcePath: "color.json#categories.nutrition.steps.950" },
  { name: "category-nutrition-surface", cssVar: "--opsin-category-nutrition-surface", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.972 0.02 70)", darkValue: "oklch(0.276 0.062 70)", p3Value: "oklch(0.972 0.023 70)", p3DarkValue: "oklch(0.276 0.071 70)", description: "The tinted background a component in this ramp sits on.", usedBy: [], sourcePath: "color.json#categories.nutrition.roles.surface" },
  { name: "category-nutrition-line", cssVar: "--opsin-category-nutrition-line", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.541 0.118 70)", darkValue: "oklch(0.806 0.092 70)", p3Value: "oklch(0.541 0.135 70)", p3DarkValue: "oklch(0.806 0.109 70)", description: "The boundary, icon stroke or chart mark. The lightest value in the ramp that clears the non-text floor against `surface`.", usedBy: ["trend-sparkline"], sourcePath: "color.json#categories.nutrition.roles.line" },
  { name: "category-nutrition-ink", cssVar: "--opsin-category-nutrition-ink", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.362 0.08 70)", darkValue: "oklch(0.941 0.034 70)", p3Value: "oklch(0.362 0.091 70)", p3DarkValue: "oklch(0.941 0.04 70)", description: "Text and text-sized icons on `surface`. Clears the text floor against `surface`.", usedBy: ["metric-tile", "range-bar", "result-card", "score-dial"], sourcePath: "color.json#categories.nutrition.roles.ink" },
  { name: "category-nutrition-accent", cssVar: "--opsin-category-nutrition-accent", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.75 0.14 70)", darkValue: "oklch(0.714 0.123 70)", p3DarkValue: "oklch(0.714 0.145 70)", description: "The identity fill: a bar fill, a dial track, a legend dot. Chosen for recognition, not for contrast. It must be bounded by `line` or labelled in `ink`; it is never the only thing that carries the meaning.", usedBy: ["log-sheet"], sourcePath: "color.json#categories.nutrition.roles.accent" },
  { name: "category-mind-50", cssVar: "--opsin-category-mind-50", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.972 0.018 310)", p3Value: "oklch(0.972 0.02 310)", description: "Mind ramp, step 50.", usedBy: [], sourcePath: "color.json#categories.mind.steps.50" },
  { name: "category-mind-100", cssVar: "--opsin-category-mind-100", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.941 0.034 310)", p3Value: "oklch(0.941 0.04 310)", description: "Mind ramp, step 100.", usedBy: [], sourcePath: "color.json#categories.mind.steps.100" },
  { name: "category-mind-200", cssVar: "--opsin-category-mind-200", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.884 0.059 310)", p3Value: "oklch(0.884 0.069 310)", description: "Mind ramp, step 200.", usedBy: [], sourcePath: "color.json#categories.mind.steps.200" },
  { name: "category-mind-300", cssVar: "--opsin-category-mind-300", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.806 0.092 310)", p3Value: "oklch(0.806 0.109 310)", description: "Mind ramp, step 300.", usedBy: [], sourcePath: "color.json#categories.mind.steps.300" },
  { name: "category-mind-400", cssVar: "--opsin-category-mind-400", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.714 0.123 310)", p3Value: "oklch(0.714 0.145 310)", description: "Mind ramp, step 400.", usedBy: [], sourcePath: "color.json#categories.mind.steps.400" },
  { name: "category-mind-500", cssVar: "--opsin-category-mind-500", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.622 0.14 310)", p3Value: "oklch(0.622 0.165 310)", description: "Mind ramp, step 500.", usedBy: [], sourcePath: "color.json#categories.mind.steps.500" },
  { name: "category-mind-600", cssVar: "--opsin-category-mind-600", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.541 0.136 310)", p3Value: "oklch(0.541 0.16 310)", description: "Mind ramp, step 600.", usedBy: [], sourcePath: "color.json#categories.mind.steps.600" },
  { name: "category-mind-700", cssVar: "--opsin-category-mind-700", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.452 0.123 310)", p3Value: "oklch(0.452 0.145 310)", description: "Mind ramp, step 700.", usedBy: [], sourcePath: "color.json#categories.mind.steps.700" },
  { name: "category-mind-800", cssVar: "--opsin-category-mind-800", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.362 0.104 310)", p3Value: "oklch(0.362 0.122 310)", description: "Mind ramp, step 800.", usedBy: [], sourcePath: "color.json#categories.mind.steps.800" },
  { name: "category-mind-900", cssVar: "--opsin-category-mind-900", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.276 0.081 310)", p3Value: "oklch(0.276 0.096 310)", description: "Mind ramp, step 900.", usedBy: [], sourcePath: "color.json#categories.mind.steps.900" },
  { name: "category-mind-950", cssVar: "--opsin-category-mind-950", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.208 0.062 310)", p3Value: "oklch(0.208 0.073 310)", description: "Mind ramp, step 950.", usedBy: [], sourcePath: "color.json#categories.mind.steps.950" },
  { name: "category-mind-surface", cssVar: "--opsin-category-mind-surface", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.972 0.018 310)", darkValue: "oklch(0.276 0.081 310)", p3Value: "oklch(0.972 0.02 310)", p3DarkValue: "oklch(0.276 0.096 310)", description: "The tinted background a component in this ramp sits on.", usedBy: [], sourcePath: "color.json#categories.mind.roles.surface" },
  { name: "category-mind-line", cssVar: "--opsin-category-mind-line", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.541 0.136 310)", darkValue: "oklch(0.806 0.092 310)", p3Value: "oklch(0.541 0.16 310)", p3DarkValue: "oklch(0.806 0.109 310)", description: "The boundary, icon stroke or chart mark. The lightest value in the ramp that clears the non-text floor against `surface`.", usedBy: ["trend-sparkline"], sourcePath: "color.json#categories.mind.roles.line" },
  { name: "category-mind-ink", cssVar: "--opsin-category-mind-ink", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.362 0.104 310)", darkValue: "oklch(0.941 0.034 310)", p3Value: "oklch(0.362 0.122 310)", p3DarkValue: "oklch(0.941 0.04 310)", description: "Text and text-sized icons on `surface`. Clears the text floor against `surface`.", usedBy: ["metric-tile", "range-bar", "result-card", "score-dial"], sourcePath: "color.json#categories.mind.roles.ink" },
  { name: "category-mind-accent", cssVar: "--opsin-category-mind-accent", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.62 0.14 310)", darkValue: "oklch(0.714 0.123 310)", p3DarkValue: "oklch(0.714 0.145 310)", description: "The identity fill: a bar fill, a dial track, a legend dot. Chosen for recognition, not for contrast. It must be bounded by `line` or labelled in `ink`; it is never the only thing that carries the meaning.", usedBy: ["log-sheet"], sourcePath: "color.json#categories.mind.roles.accent" },
  { name: "category-labs-50", cssVar: "--opsin-category-labs-50", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.972 0.015 210)", p3Value: "oklch(0.972 0.018 210)", description: "Labs ramp, step 50.", usedBy: [], sourcePath: "color.json#categories.labs.steps.50" },
  { name: "category-labs-100", cssVar: "--opsin-category-labs-100", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.941 0.026 210)", p3Value: "oklch(0.941 0.031 210)", description: "Labs ramp, step 100.", usedBy: [], sourcePath: "color.json#categories.labs.steps.100" },
  { name: "category-labs-200", cssVar: "--opsin-category-labs-200", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.884 0.046 210)", p3Value: "oklch(0.884 0.055 210)", description: "Labs ramp, step 200.", usedBy: [], sourcePath: "color.json#categories.labs.steps.200" },
  { name: "category-labs-300", cssVar: "--opsin-category-labs-300", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.806 0.073 210)", p3Value: "oklch(0.806 0.086 210)", description: "Labs ramp, step 300.", usedBy: [], sourcePath: "color.json#categories.labs.steps.300" },
  { name: "category-labs-400", cssVar: "--opsin-category-labs-400", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.714 0.097 210)", p3Value: "oklch(0.714 0.114 210)", description: "Labs ramp, step 400.", usedBy: [], sourcePath: "color.json#categories.labs.steps.400" },
  { name: "category-labs-500", cssVar: "--opsin-category-labs-500", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.622 0.108 210)", p3Value: "oklch(0.622 0.13 210)", description: "Labs ramp, step 500.", usedBy: [], sourcePath: "color.json#categories.labs.steps.500" },
  { name: "category-labs-600", cssVar: "--opsin-category-labs-600", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.541 0.094 210)", p3Value: "oklch(0.541 0.125 210)", description: "Labs ramp, step 600.", usedBy: [], sourcePath: "color.json#categories.labs.steps.600" },
  { name: "category-labs-700", cssVar: "--opsin-category-labs-700", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.452 0.079 210)", p3Value: "oklch(0.452 0.105 210)", description: "Labs ramp, step 700.", usedBy: [], sourcePath: "color.json#categories.labs.steps.700" },
  { name: "category-labs-800", cssVar: "--opsin-category-labs-800", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.362 0.063 210)", p3Value: "oklch(0.362 0.084 210)", description: "Labs ramp, step 800.", usedBy: [], sourcePath: "color.json#categories.labs.steps.800" },
  { name: "category-labs-900", cssVar: "--opsin-category-labs-900", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.276 0.049 210)", p3Value: "oklch(0.276 0.065 210)", description: "Labs ramp, step 900.", usedBy: [], sourcePath: "color.json#categories.labs.steps.900" },
  { name: "category-labs-950", cssVar: "--opsin-category-labs-950", namespace: "color", tier: "primitive", group: "category", value: "oklch(0.208 0.038 210)", p3Value: "oklch(0.208 0.051 210)", description: "Labs ramp, step 950.", usedBy: [], sourcePath: "color.json#categories.labs.steps.950" },
  { name: "category-labs-surface", cssVar: "--opsin-category-labs-surface", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.972 0.015 210)", darkValue: "oklch(0.276 0.049 210)", p3Value: "oklch(0.972 0.018 210)", p3DarkValue: "oklch(0.276 0.065 210)", description: "The tinted background a component in this ramp sits on.", usedBy: [], sourcePath: "color.json#categories.labs.roles.surface" },
  { name: "category-labs-line", cssVar: "--opsin-category-labs-line", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.541 0.094 210)", darkValue: "oklch(0.806 0.073 210)", p3Value: "oklch(0.541 0.125 210)", p3DarkValue: "oklch(0.806 0.086 210)", description: "The boundary, icon stroke or chart mark. The lightest value in the ramp that clears the non-text floor against `surface`.", usedBy: ["trend-sparkline"], sourcePath: "color.json#categories.labs.roles.line" },
  { name: "category-labs-ink", cssVar: "--opsin-category-labs-ink", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.362 0.063 210)", darkValue: "oklch(0.941 0.026 210)", p3Value: "oklch(0.362 0.084 210)", p3DarkValue: "oklch(0.941 0.031 210)", description: "Text and text-sized icons on `surface`. Clears the text floor against `surface`.", usedBy: ["metric-tile", "range-bar", "result-card", "score-dial"], sourcePath: "color.json#categories.labs.roles.ink" },
  { name: "category-labs-accent", cssVar: "--opsin-category-labs-accent", namespace: "color", tier: "semantic", group: "category", value: "oklch(0.6 0.11 210)", darkValue: "oklch(0.714 0.097 210)", p3DarkValue: "oklch(0.714 0.114 210)", description: "The identity fill: a bar fill, a dial track, a legend dot. Chosen for recognition, not for contrast. It must be bounded by `line` or labelled in `ink`; it is never the only thing that carries the meaning.", usedBy: ["log-sheet"], sourcePath: "color.json#categories.labs.roles.accent" },
  { name: "status-steady-50", cssVar: "--opsin-status-steady-50", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.972 0.015 178)", p3Value: "oklch(0.972 0.018 178)", description: "Steady ramp, step 50.", usedBy: [], sourcePath: "color.json#status.steady.steps.50" },
  { name: "status-steady-100", cssVar: "--opsin-status-steady-100", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.941 0.026 178)", p3Value: "oklch(0.941 0.031 178)", description: "Steady ramp, step 100.", usedBy: [], sourcePath: "color.json#status.steady.steps.100" },
  { name: "status-steady-200", cssVar: "--opsin-status-steady-200", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.884 0.046 178)", p3Value: "oklch(0.884 0.055 178)", description: "Steady ramp, step 200.", usedBy: [], sourcePath: "color.json#status.steady.steps.200" },
  { name: "status-steady-300", cssVar: "--opsin-status-steady-300", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.806 0.073 178)", p3Value: "oklch(0.806 0.086 178)", description: "Steady ramp, step 300.", usedBy: [], sourcePath: "color.json#status.steady.steps.300" },
  { name: "status-steady-400", cssVar: "--opsin-status-steady-400", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.714 0.097 178)", p3Value: "oklch(0.714 0.114 178)", description: "Steady ramp, step 400.", usedBy: [], sourcePath: "color.json#status.steady.steps.400" },
  { name: "status-steady-500", cssVar: "--opsin-status-steady-500", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.622 0.11 178)", p3Value: "oklch(0.622 0.13 178)", description: "Steady ramp, step 500.", usedBy: [], sourcePath: "color.json#status.steady.steps.500" },
  { name: "status-steady-600", cssVar: "--opsin-status-steady-600", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.541 0.1 178)", p3Value: "oklch(0.541 0.126 178)", description: "Steady ramp, step 600.", usedBy: [], sourcePath: "color.json#status.steady.steps.600" },
  { name: "status-steady-700", cssVar: "--opsin-status-steady-700", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.452 0.084 178)", p3Value: "oklch(0.452 0.114 178)", description: "Steady ramp, step 700.", usedBy: [], sourcePath: "color.json#status.steady.steps.700" },
  { name: "status-steady-800", cssVar: "--opsin-status-steady-800", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.362 0.067 178)", p3Value: "oklch(0.362 0.091 178)", description: "Steady ramp, step 800.", usedBy: [], sourcePath: "color.json#status.steady.steps.800" },
  { name: "status-steady-900", cssVar: "--opsin-status-steady-900", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.276 0.052 178)", p3Value: "oklch(0.276 0.071 178)", description: "Steady ramp, step 900.", usedBy: [], sourcePath: "color.json#status.steady.steps.900" },
  { name: "status-steady-950", cssVar: "--opsin-status-steady-950", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.208 0.041 178)", p3Value: "oklch(0.208 0.055 178)", description: "Steady ramp, step 950.", usedBy: [], sourcePath: "color.json#status.steady.steps.950" },
  { name: "status-steady-surface", cssVar: "--opsin-status-steady-surface", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.972 0.015 178)", darkValue: "oklch(0.276 0.052 178)", p3Value: "oklch(0.972 0.018 178)", p3DarkValue: "oklch(0.276 0.071 178)", description: "The tinted background a component in this ramp sits on.", usedBy: ["alert-banner", "status-pill"], sourcePath: "color.json#status.steady.roles.surface" },
  { name: "status-steady-line", cssVar: "--opsin-status-steady-line", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.541 0.1 178)", darkValue: "oklch(0.806 0.073 178)", p3Value: "oklch(0.541 0.126 178)", p3DarkValue: "oklch(0.806 0.086 178)", description: "The boundary, icon stroke or chart mark. The lightest value in the ramp that clears the non-text floor against `surface`.", usedBy: ["alert-banner", "range-bar", "status-pill"], sourcePath: "color.json#status.steady.roles.line" },
  { name: "status-steady-ink", cssVar: "--opsin-status-steady-ink", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.362 0.067 178)", darkValue: "oklch(0.941 0.026 178)", p3Value: "oklch(0.362 0.091 178)", p3DarkValue: "oklch(0.941 0.031 178)", description: "Text and text-sized icons on `surface`. Clears the text floor against `surface`.", usedBy: ["alert-banner", "range-bar", "score-dial", "status-pill"], sourcePath: "color.json#status.steady.roles.ink" },
  { name: "status-steady-accent", cssVar: "--opsin-status-steady-accent", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.64 0.11 178)", darkValue: "oklch(0.714 0.097 178)", p3DarkValue: "oklch(0.714 0.114 178)", description: "The identity fill: a bar fill, a dial track, a legend dot. Chosen for recognition, not for contrast. It must be bounded by `line` or labelled in `ink`; it is never the only thing that carries the meaning.", usedBy: ["score-dial"], sourcePath: "color.json#status.steady.roles.accent" },
  { name: "status-watch-50", cssVar: "--opsin-status-watch-50", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.972 0.02 82)", p3Value: "oklch(0.972 0.023 82)", description: "Watch ramp, step 50.", usedBy: [], sourcePath: "color.json#status.watch.steps.50" },
  { name: "status-watch-100", cssVar: "--opsin-status-watch-100", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.941 0.034 82)", p3Value: "oklch(0.941 0.04 82)", description: "Watch ramp, step 100.", usedBy: [], sourcePath: "color.json#status.watch.steps.100" },
  { name: "status-watch-200", cssVar: "--opsin-status-watch-200", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.884 0.059 82)", p3Value: "oklch(0.884 0.069 82)", description: "Watch ramp, step 200.", usedBy: [], sourcePath: "color.json#status.watch.steps.200" },
  { name: "status-watch-300", cssVar: "--opsin-status-watch-300", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.806 0.092 82)", p3Value: "oklch(0.806 0.109 82)", description: "Watch ramp, step 300.", usedBy: [], sourcePath: "color.json#status.watch.steps.300" },
  { name: "status-watch-400", cssVar: "--opsin-status-watch-400", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.714 0.123 82)", p3Value: "oklch(0.714 0.145 82)", description: "Watch ramp, step 400.", usedBy: [], sourcePath: "color.json#status.watch.steps.400" },
  { name: "status-watch-500", cssVar: "--opsin-status-watch-500", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.622 0.129 82)", p3Value: "oklch(0.622 0.148 82)", description: "Watch ramp, step 500.", usedBy: [], sourcePath: "color.json#status.watch.steps.500" },
  { name: "status-watch-600", cssVar: "--opsin-status-watch-600", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.541 0.112 82)", p3Value: "oklch(0.541 0.129 82)", description: "Watch ramp, step 600.", usedBy: [], sourcePath: "color.json#status.watch.steps.600" },
  { name: "status-watch-700", cssVar: "--opsin-status-watch-700", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.452 0.094 82)", p3Value: "oklch(0.452 0.108 82)", description: "Watch ramp, step 700.", usedBy: [], sourcePath: "color.json#status.watch.steps.700" },
  { name: "status-watch-800", cssVar: "--opsin-status-watch-800", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.362 0.076 82)", p3Value: "oklch(0.362 0.087 82)", description: "Watch ramp, step 800.", usedBy: [], sourcePath: "color.json#status.watch.steps.800" },
  { name: "status-watch-900", cssVar: "--opsin-status-watch-900", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.276 0.059 82)", p3Value: "oklch(0.276 0.068 82)", description: "Watch ramp, step 900.", usedBy: [], sourcePath: "color.json#status.watch.steps.900" },
  { name: "status-watch-950", cssVar: "--opsin-status-watch-950", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.208 0.046 82)", p3Value: "oklch(0.208 0.054 82)", description: "Watch ramp, step 950.", usedBy: [], sourcePath: "color.json#status.watch.steps.950" },
  { name: "status-watch-surface", cssVar: "--opsin-status-watch-surface", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.972 0.02 82)", darkValue: "oklch(0.276 0.059 82)", p3Value: "oklch(0.972 0.023 82)", p3DarkValue: "oklch(0.276 0.068 82)", description: "The tinted background a component in this ramp sits on.", usedBy: ["alert-banner", "status-pill"], sourcePath: "color.json#status.watch.roles.surface" },
  { name: "status-watch-line", cssVar: "--opsin-status-watch-line", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.541 0.112 82)", darkValue: "oklch(0.806 0.092 82)", p3Value: "oklch(0.541 0.129 82)", p3DarkValue: "oklch(0.806 0.109 82)", description: "The boundary, icon stroke or chart mark. The lightest value in the ramp that clears the non-text floor against `surface`.", usedBy: ["alert-banner", "range-bar", "status-pill"], sourcePath: "color.json#status.watch.roles.line" },
  { name: "status-watch-ink", cssVar: "--opsin-status-watch-ink", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.362 0.076 82)", darkValue: "oklch(0.941 0.034 82)", p3Value: "oklch(0.362 0.087 82)", p3DarkValue: "oklch(0.941 0.04 82)", description: "Text and text-sized icons on `surface`. Clears the text floor against `surface`.", usedBy: ["alert-banner", "range-bar", "score-dial", "status-pill"], sourcePath: "color.json#status.watch.roles.ink" },
  { name: "status-watch-accent", cssVar: "--opsin-status-watch-accent", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.78 0.14 82)", darkValue: "oklch(0.714 0.123 82)", p3DarkValue: "oklch(0.714 0.145 82)", description: "The identity fill: a bar fill, a dial track, a legend dot. Chosen for recognition, not for contrast. It must be bounded by `line` or labelled in `ink`; it is never the only thing that carries the meaning.", usedBy: ["score-dial"], sourcePath: "color.json#status.watch.roles.accent" },
  { name: "status-attention-50", cssVar: "--opsin-status-attention-50", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.972 0.015 45)", p3Value: "oklch(0.972 0.019 45)", description: "Needs attention ramp, step 50.", usedBy: [], sourcePath: "color.json#status.attention.steps.50" },
  { name: "status-attention-100", cssVar: "--opsin-status-attention-100", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.941 0.032 45)", p3Value: "oklch(0.941 0.041 45)", description: "Needs attention ramp, step 100.", usedBy: [], sourcePath: "color.json#status.attention.steps.100" },
  { name: "status-attention-200", cssVar: "--opsin-status-attention-200", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.884 0.063 45)", p3Value: "oklch(0.884 0.074 45)", description: "Needs attention ramp, step 200.", usedBy: [], sourcePath: "color.json#status.attention.steps.200" },
  { name: "status-attention-300", cssVar: "--opsin-status-attention-300", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.806 0.099 45)", p3Value: "oklch(0.806 0.117 45)", description: "Needs attention ramp, step 300.", usedBy: [], sourcePath: "color.json#status.attention.steps.300" },
  { name: "status-attention-400", cssVar: "--opsin-status-attention-400", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.714 0.132 45)", p3Value: "oklch(0.714 0.156 45)", description: "Needs attention ramp, step 400.", usedBy: [], sourcePath: "color.json#status.attention.steps.400" },
  { name: "status-attention-500", cssVar: "--opsin-status-attention-500", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.622 0.15 45)", p3Value: "oklch(0.622 0.177 45)", description: "Needs attention ramp, step 500.", usedBy: [], sourcePath: "color.json#status.attention.steps.500" },
  { name: "status-attention-600", cssVar: "--opsin-status-attention-600", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.541 0.145 45)", p3Value: "oklch(0.541 0.172 45)", description: "Needs attention ramp, step 600.", usedBy: [], sourcePath: "color.json#status.attention.steps.600" },
  { name: "status-attention-700", cssVar: "--opsin-status-attention-700", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.452 0.13 45)", p3Value: "oklch(0.452 0.148 45)", description: "Needs attention ramp, step 700.", usedBy: [], sourcePath: "color.json#status.attention.steps.700" },
  { name: "status-attention-800", cssVar: "--opsin-status-attention-800", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.362 0.105 45)", p3Value: "oklch(0.362 0.119 45)", description: "Needs attention ramp, step 800.", usedBy: [], sourcePath: "color.json#status.attention.steps.800" },
  { name: "status-attention-900", cssVar: "--opsin-status-attention-900", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.276 0.082 45)", p3Value: "oklch(0.276 0.093 45)", description: "Needs attention ramp, step 900.", usedBy: [], sourcePath: "color.json#status.attention.steps.900" },
  { name: "status-attention-950", cssVar: "--opsin-status-attention-950", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.208 0.065 45)", p3Value: "oklch(0.208 0.074 45)", description: "Needs attention ramp, step 950.", usedBy: [], sourcePath: "color.json#status.attention.steps.950" },
  { name: "status-attention-surface", cssVar: "--opsin-status-attention-surface", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.972 0.015 45)", darkValue: "oklch(0.276 0.082 45)", p3Value: "oklch(0.972 0.019 45)", p3DarkValue: "oklch(0.276 0.093 45)", description: "The tinted background a component in this ramp sits on.", usedBy: ["alert-banner", "status-pill"], sourcePath: "color.json#status.attention.roles.surface" },
  { name: "status-attention-line", cssVar: "--opsin-status-attention-line", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.541 0.145 45)", darkValue: "oklch(0.806 0.099 45)", p3Value: "oklch(0.541 0.172 45)", p3DarkValue: "oklch(0.806 0.117 45)", description: "The boundary, icon stroke or chart mark. The lightest value in the ramp that clears the non-text floor against `surface`.", usedBy: ["alert-banner", "range-bar", "status-pill"], sourcePath: "color.json#status.attention.roles.line" },
  { name: "status-attention-ink", cssVar: "--opsin-status-attention-ink", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.362 0.105 45)", darkValue: "oklch(0.941 0.032 45)", p3Value: "oklch(0.362 0.119 45)", p3DarkValue: "oklch(0.941 0.041 45)", description: "Text and text-sized icons on `surface`. Clears the text floor against `surface`.", usedBy: ["alert-banner", "range-bar", "score-dial", "status-pill"], sourcePath: "color.json#status.attention.roles.ink" },
  { name: "status-attention-accent", cssVar: "--opsin-status-attention-accent", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.66 0.15 45)", darkValue: "oklch(0.714 0.132 45)", p3DarkValue: "oklch(0.714 0.156 45)", description: "The identity fill: a bar fill, a dial track, a legend dot. Chosen for recognition, not for contrast. It must be bounded by `line` or labelled in `ink`; it is never the only thing that carries the meaning.", usedBy: ["score-dial"], sourcePath: "color.json#status.attention.roles.accent" },
  { name: "status-urgent-50", cssVar: "--opsin-status-urgent-50", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.972 0.014 27)", p3Value: "oklch(0.972 0.018 27)", description: "Urgent ramp, step 50.", usedBy: [], sourcePath: "color.json#status.urgent.steps.50" },
  { name: "status-urgent-100", cssVar: "--opsin-status-urgent-100", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.941 0.03 27)", p3Value: "oklch(0.941 0.039 27)", description: "Urgent ramp, step 100.", usedBy: [], sourcePath: "color.json#status.urgent.steps.100" },
  { name: "status-urgent-200", cssVar: "--opsin-status-urgent-200", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.884 0.061 27)", p3Value: "oklch(0.884 0.079 27)", description: "Urgent ramp, step 200.", usedBy: [], sourcePath: "color.json#status.urgent.steps.200" },
  { name: "status-urgent-300", cssVar: "--opsin-status-urgent-300", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.806 0.11 27)", p3Value: "oklch(0.806 0.142 27)", description: "Urgent ramp, step 300.", usedBy: [], sourcePath: "color.json#status.urgent.steps.300" },
  { name: "status-urgent-400", cssVar: "--opsin-status-urgent-400", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.714 0.176 27)", p3Value: "oklch(0.714 0.208 27)", description: "Urgent ramp, step 400.", usedBy: [], sourcePath: "color.json#status.urgent.steps.400" },
  { name: "status-urgent-500", cssVar: "--opsin-status-urgent-500", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.622 0.2 27)", p3Value: "oklch(0.622 0.236 27)", description: "Urgent ramp, step 500.", usedBy: [], sourcePath: "color.json#status.urgent.steps.500" },
  { name: "status-urgent-600", cssVar: "--opsin-status-urgent-600", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.541 0.194 27)", p3Value: "oklch(0.541 0.229 27)", description: "Urgent ramp, step 600.", usedBy: [], sourcePath: "color.json#status.urgent.steps.600" },
  { name: "status-urgent-700", cssVar: "--opsin-status-urgent-700", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.452 0.176 27)", p3Value: "oklch(0.452 0.208 27)", description: "Urgent ramp, step 700.", usedBy: [], sourcePath: "color.json#status.urgent.steps.700" },
  { name: "status-urgent-800", cssVar: "--opsin-status-urgent-800", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.362 0.148 27)", p3Value: "oklch(0.362 0.168 27)", description: "Urgent ramp, step 800.", usedBy: [], sourcePath: "color.json#status.urgent.steps.800" },
  { name: "status-urgent-900", cssVar: "--opsin-status-urgent-900", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.276 0.115 27)", p3Value: "oklch(0.276 0.129 27)", description: "Urgent ramp, step 900.", usedBy: [], sourcePath: "color.json#status.urgent.steps.900" },
  { name: "status-urgent-950", cssVar: "--opsin-status-urgent-950", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.208 0.088 27)", p3Value: "oklch(0.208 0.1 27)", description: "Urgent ramp, step 950.", usedBy: [], sourcePath: "color.json#status.urgent.steps.950" },
  { name: "status-urgent-surface", cssVar: "--opsin-status-urgent-surface", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.972 0.014 27)", darkValue: "oklch(0.276 0.115 27)", p3Value: "oklch(0.972 0.018 27)", p3DarkValue: "oklch(0.276 0.129 27)", description: "The tinted background a component in this ramp sits on.", usedBy: ["alert-banner", "status-pill"], sourcePath: "color.json#status.urgent.roles.surface" },
  { name: "status-urgent-line", cssVar: "--opsin-status-urgent-line", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.541 0.194 27)", darkValue: "oklch(0.806 0.11 27)", p3Value: "oklch(0.541 0.229 27)", p3DarkValue: "oklch(0.806 0.142 27)", description: "The boundary, icon stroke or chart mark. The lightest value in the ramp that clears the non-text floor against `surface`.", usedBy: ["alert-banner", "range-bar", "status-pill"], sourcePath: "color.json#status.urgent.roles.line" },
  { name: "status-urgent-ink", cssVar: "--opsin-status-urgent-ink", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.362 0.148 27)", darkValue: "oklch(0.941 0.03 27)", p3Value: "oklch(0.362 0.168 27)", p3DarkValue: "oklch(0.941 0.039 27)", description: "Text and text-sized icons on `surface`. Clears the text floor against `surface`.", usedBy: ["alert-banner", "range-bar", "score-dial", "status-pill"], sourcePath: "color.json#status.urgent.roles.ink" },
  { name: "status-urgent-accent", cssVar: "--opsin-status-urgent-accent", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.56 0.2 27)", darkValue: "oklch(0.714 0.176 27)", p3DarkValue: "oklch(0.714 0.208 27)", description: "The identity fill: a bar fill, a dial track, a legend dot. Chosen for recognition, not for contrast. It must be bounded by `line` or labelled in `ink`; it is never the only thing that carries the meaning.", usedBy: ["score-dial"], sourcePath: "color.json#status.urgent.roles.accent" },
  { name: "status-unknown-50", cssVar: "--opsin-status-unknown-50", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.972 0.003 250)", description: "Unknown ramp, step 50.", usedBy: [], sourcePath: "color.json#absence.unknown.steps.50" },
  { name: "status-unknown-100", cssVar: "--opsin-status-unknown-100", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.941 0.005 250)", p3Value: "oklch(0.941 0.006 250)", description: "Unknown ramp, step 100.", usedBy: [], sourcePath: "color.json#absence.unknown.steps.100" },
  { name: "status-unknown-200", cssVar: "--opsin-status-unknown-200", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.884 0.008 250)", p3Value: "oklch(0.884 0.01 250)", description: "Unknown ramp, step 200.", usedBy: [], sourcePath: "color.json#absence.unknown.steps.200" },
  { name: "status-unknown-300", cssVar: "--opsin-status-unknown-300", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.806 0.013 250)", p3Value: "oklch(0.806 0.016 250)", description: "Unknown ramp, step 300.", usedBy: [], sourcePath: "color.json#absence.unknown.steps.300" },
  { name: "status-unknown-400", cssVar: "--opsin-status-unknown-400", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.714 0.018 250)", p3Value: "oklch(0.714 0.021 250)", description: "Unknown ramp, step 400.", usedBy: [], sourcePath: "color.json#absence.unknown.steps.400" },
  { name: "status-unknown-500", cssVar: "--opsin-status-unknown-500", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.622 0.02 250)", p3Value: "oklch(0.622 0.024 250)", description: "Unknown ramp, step 500.", usedBy: [], sourcePath: "color.json#absence.unknown.steps.500" },
  { name: "status-unknown-600", cssVar: "--opsin-status-unknown-600", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.541 0.019 250)", p3Value: "oklch(0.541 0.023 250)", description: "Unknown ramp, step 600.", usedBy: [], sourcePath: "color.json#absence.unknown.steps.600" },
  { name: "status-unknown-700", cssVar: "--opsin-status-unknown-700", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.452 0.018 250)", p3Value: "oklch(0.452 0.021 250)", description: "Unknown ramp, step 700.", usedBy: [], sourcePath: "color.json#absence.unknown.steps.700" },
  { name: "status-unknown-800", cssVar: "--opsin-status-unknown-800", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.362 0.015 250)", p3Value: "oklch(0.362 0.017 250)", description: "Unknown ramp, step 800.", usedBy: [], sourcePath: "color.json#absence.unknown.steps.800" },
  { name: "status-unknown-900", cssVar: "--opsin-status-unknown-900", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.276 0.012 250)", p3Value: "oklch(0.276 0.014 250)", description: "Unknown ramp, step 900.", usedBy: [], sourcePath: "color.json#absence.unknown.steps.900" },
  { name: "status-unknown-950", cssVar: "--opsin-status-unknown-950", namespace: "color", tier: "primitive", group: "status", value: "oklch(0.208 0.009 250)", p3Value: "oklch(0.208 0.01 250)", description: "Unknown ramp, step 950.", usedBy: [], sourcePath: "color.json#absence.unknown.steps.950" },
  { name: "status-unknown-surface", cssVar: "--opsin-status-unknown-surface", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.972 0.003 250)", darkValue: "oklch(0.276 0.012 250)", p3DarkValue: "oklch(0.276 0.014 250)", description: "The tinted background a component in this ramp sits on.", usedBy: [], sourcePath: "color.json#absence.unknown.roles.surface" },
  { name: "status-unknown-line", cssVar: "--opsin-status-unknown-line", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.541 0.019 250)", darkValue: "oklch(0.806 0.013 250)", p3Value: "oklch(0.541 0.023 250)", p3DarkValue: "oklch(0.806 0.016 250)", description: "The boundary, icon stroke or chart mark. The lightest value in the ramp that clears the non-text floor against `surface`.", usedBy: [], sourcePath: "color.json#absence.unknown.roles.line" },
  { name: "status-unknown-ink", cssVar: "--opsin-status-unknown-ink", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.362 0.015 250)", darkValue: "oklch(0.941 0.005 250)", p3Value: "oklch(0.362 0.017 250)", p3DarkValue: "oklch(0.941 0.006 250)", description: "Text and text-sized icons on `surface`. Clears the text floor against `surface`.", usedBy: [], sourcePath: "color.json#absence.unknown.roles.ink" },
  { name: "status-unknown-accent", cssVar: "--opsin-status-unknown-accent", namespace: "color", tier: "semantic", group: "status", value: "oklch(0.72 0.02 250)", darkValue: "oklch(0.714 0.018 250)", p3DarkValue: "oklch(0.714 0.021 250)", description: "The identity fill: a bar fill, a dial track, a legend dot. Chosen for recognition, not for contrast. It must be bounded by `line` or labelled in `ink`; it is never the only thing that carries the meaning.", usedBy: [], sourcePath: "color.json#absence.unknown.roles.accent" },
  { name: "material-canvas-tint", cssVar: "--opsin-material-canvas-tint", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-0)", darkValue: "var(--opsin-neutral-950)", description: "Rung 0 (canvas): the tint over what is behind it. The application background. Nothing is behind it, so nothing shows through it.", usedBy: ["surface"], resolvedValue: "oklch(1 0 0)", darkResolvedValue: "oklch(0.145 0.005 250)", reducedTransparencyValue: "var(--opsin-material-canvas-opaque)", sourcePath: "material.json#ladder.canvas.tint" },
  { name: "material-canvas-tint-alpha", cssVar: "--opsin-material-canvas-tint-alpha", namespace: "material", tier: "semantic", group: "material", value: "1", description: "Rung 0 (canvas): how opaque that tint is.", usedBy: ["surface"], reducedTransparencyValue: "1", sourcePath: "material.json#ladder.canvas.tint-alpha" },
  { name: "material-canvas-blur", cssVar: "--opsin-material-canvas-blur", namespace: "material", tier: "semantic", group: "material", value: "0px", description: "Rung 0 (canvas): backdrop blur radius.", usedBy: ["surface"], reducedTransparencyValue: "0px", sourcePath: "material.json#ladder.canvas.blur" },
  { name: "material-canvas-saturation", cssVar: "--opsin-material-canvas-saturation", namespace: "material", tier: "semantic", group: "material", value: "1", description: "Rung 0 (canvas): backdrop saturation multiplier.", usedBy: ["surface"], reducedTransparencyValue: "1", sourcePath: "material.json#ladder.canvas.saturation" },
  { name: "material-canvas-border", cssVar: "--opsin-material-canvas-border", namespace: "material", tier: "semantic", group: "material", value: "none", description: "Rung 0 (canvas): the boundary.", usedBy: ["surface"], sourcePath: "material.json#ladder.canvas.border" },
  { name: "material-canvas-shadow", cssVar: "--opsin-material-canvas-shadow", namespace: "material", tier: "semantic", group: "material", value: "none", description: "Rung 0 (canvas): the shadow that separates it from what is behind.", usedBy: ["surface"], sourcePath: "material.json#ladder.canvas.shadow" },
  { name: "material-canvas-scrim", cssVar: "--opsin-material-canvas-scrim", namespace: "material", tier: "semantic", group: "material", value: "0", description: "Rung 0 (canvas): the minimum scrim opacity needed for text on this rung to clear the contrast floor.", usedBy: ["surface"], sourcePath: "material.json#ladder.canvas.scrim" },
  { name: "material-canvas-opaque", cssVar: "--opsin-material-canvas-opaque", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-0)", darkValue: "var(--opsin-neutral-950)", description: "Rung 0 (canvas): the opaque substitute used under prefers-reduced-transparency and where backdrop-filter is unsupported.", usedBy: ["surface"], resolvedValue: "oklch(1 0 0)", darkResolvedValue: "oklch(0.145 0.005 250)", sourcePath: "material.json#ladder.canvas.opaque" },
  { name: "material-card-tint", cssVar: "--opsin-material-card-tint", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-0)", darkValue: "var(--opsin-neutral-900)", description: "Rung 1 (card): the tint over what is behind it. The default home for a health value. Opaque, bounded by a line rather than a shadow, and the rung every ResultCard, MetricTile and RangeBar sits on.", usedBy: ["surface"], resolvedValue: "oklch(1 0 0)", darkResolvedValue: "oklch(0.205 0.006 250)", reducedTransparencyValue: "var(--opsin-material-card-opaque)", sourcePath: "material.json#ladder.card.tint" },
  { name: "material-card-tint-alpha", cssVar: "--opsin-material-card-tint-alpha", namespace: "material", tier: "semantic", group: "material", value: "1", description: "Rung 1 (card): how opaque that tint is.", usedBy: ["surface"], reducedTransparencyValue: "1", sourcePath: "material.json#ladder.card.tint-alpha" },
  { name: "material-card-blur", cssVar: "--opsin-material-card-blur", namespace: "material", tier: "semantic", group: "material", value: "0px", description: "Rung 1 (card): backdrop blur radius.", usedBy: ["surface"], reducedTransparencyValue: "0px", sourcePath: "material.json#ladder.card.blur" },
  { name: "material-card-saturation", cssVar: "--opsin-material-card-saturation", namespace: "material", tier: "semantic", group: "material", value: "1", description: "Rung 1 (card): backdrop saturation multiplier.", usedBy: ["surface"], reducedTransparencyValue: "1", sourcePath: "material.json#ladder.card.saturation" },
  { name: "material-card-border", cssVar: "--opsin-material-card-border", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-200)", darkValue: "var(--opsin-neutral-800)", description: "Rung 1 (card): the boundary.", usedBy: ["surface"], resolvedValue: "oklch(0.929 0.004 250)", darkResolvedValue: "oklch(0.269 0.007 250)", sourcePath: "material.json#ladder.card.border" },
  { name: "material-card-shadow", cssVar: "--opsin-material-card-shadow", namespace: "material", tier: "semantic", group: "material", value: "none", description: "Rung 1 (card): the shadow that separates it from what is behind.", usedBy: ["surface"], sourcePath: "material.json#ladder.card.shadow" },
  { name: "material-card-scrim", cssVar: "--opsin-material-card-scrim", namespace: "material", tier: "semantic", group: "material", value: "0", description: "Rung 1 (card): the minimum scrim opacity needed for text on this rung to clear the contrast floor.", usedBy: ["surface"], sourcePath: "material.json#ladder.card.scrim" },
  { name: "material-card-opaque", cssVar: "--opsin-material-card-opaque", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-0)", darkValue: "var(--opsin-neutral-900)", description: "Rung 1 (card): the opaque substitute used under prefers-reduced-transparency and where backdrop-filter is unsupported.", usedBy: ["surface"], resolvedValue: "oklch(1 0 0)", darkResolvedValue: "oklch(0.205 0.006 250)", sourcePath: "material.json#ladder.card.opaque" },
  { name: "material-raised-tint", cssVar: "--opsin-material-raised-tint", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-0)", darkValue: "var(--opsin-neutral-800)", description: "Rung 2 (raised): the tint over what is behind it. Menus, popovers, tooltips, a dragged card. Still opaque: the shadow, not translucency, is what says 'above'.", usedBy: ["surface"], resolvedValue: "oklch(1 0 0)", darkResolvedValue: "oklch(0.269 0.007 250)", reducedTransparencyValue: "var(--opsin-material-raised-opaque)", sourcePath: "material.json#ladder.raised.tint" },
  { name: "material-raised-tint-alpha", cssVar: "--opsin-material-raised-tint-alpha", namespace: "material", tier: "semantic", group: "material", value: "1", description: "Rung 2 (raised): how opaque that tint is.", usedBy: ["surface"], reducedTransparencyValue: "1", sourcePath: "material.json#ladder.raised.tint-alpha" },
  { name: "material-raised-blur", cssVar: "--opsin-material-raised-blur", namespace: "material", tier: "semantic", group: "material", value: "0px", description: "Rung 2 (raised): backdrop blur radius.", usedBy: ["surface"], reducedTransparencyValue: "0px", sourcePath: "material.json#ladder.raised.blur" },
  { name: "material-raised-saturation", cssVar: "--opsin-material-raised-saturation", namespace: "material", tier: "semantic", group: "material", value: "1", description: "Rung 2 (raised): backdrop saturation multiplier.", usedBy: ["surface"], reducedTransparencyValue: "1", sourcePath: "material.json#ladder.raised.saturation" },
  { name: "material-raised-border", cssVar: "--opsin-material-raised-border", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-200)", darkValue: "var(--opsin-neutral-700)", description: "Rung 2 (raised): the boundary.", usedBy: ["surface"], resolvedValue: "oklch(0.929 0.004 250)", darkResolvedValue: "oklch(0.371 0.008 250)", sourcePath: "material.json#ladder.raised.border" },
  { name: "material-raised-shadow", cssVar: "--opsin-material-raised-shadow", namespace: "material", tier: "semantic", group: "material", value: "0 1px 2px oklch(0 0 0 / 0.06), 0 4px 12px oklch(0 0 0 / 0.06)", description: "Rung 2 (raised): the shadow that separates it from what is behind.", usedBy: ["surface"], sourcePath: "material.json#ladder.raised.shadow" },
  { name: "material-raised-scrim", cssVar: "--opsin-material-raised-scrim", namespace: "material", tier: "semantic", group: "material", value: "0", description: "Rung 2 (raised): the minimum scrim opacity needed for text on this rung to clear the contrast floor.", usedBy: ["surface"], sourcePath: "material.json#ladder.raised.scrim" },
  { name: "material-raised-opaque", cssVar: "--opsin-material-raised-opaque", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-0)", darkValue: "var(--opsin-neutral-800)", description: "Rung 2 (raised): the opaque substitute used under prefers-reduced-transparency and where backdrop-filter is unsupported.", usedBy: ["surface"], resolvedValue: "oklch(1 0 0)", darkResolvedValue: "oklch(0.269 0.007 250)", sourcePath: "material.json#ladder.raised.opaque" },
  { name: "material-sheet-tint", cssVar: "--opsin-material-sheet-tint", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-0)", darkValue: "var(--opsin-neutral-900)", description: "Rung 3 (sheet): the tint over what is behind it. A bottom sheet or side panel the reader can dismiss by dragging. The blur keeps enough of the page visible that the reader knows where they will return to.", usedBy: ["surface"], resolvedValue: "oklch(1 0 0)", darkResolvedValue: "oklch(0.205 0.006 250)", reducedTransparencyValue: "var(--opsin-material-sheet-opaque)", sourcePath: "material.json#ladder.sheet.tint" },
  { name: "material-sheet-tint-alpha", cssVar: "--opsin-material-sheet-tint-alpha", namespace: "material", tier: "semantic", group: "material", value: "0.82", darkValue: "0.78", description: "Rung 3 (sheet): how opaque that tint is.", usedBy: ["surface"], reducedTransparencyValue: "1", sourcePath: "material.json#ladder.sheet.tint-alpha" },
  { name: "material-sheet-blur", cssVar: "--opsin-material-sheet-blur", namespace: "material", tier: "semantic", group: "material", value: "20px", description: "Rung 3 (sheet): backdrop blur radius.", usedBy: ["surface"], reducedTransparencyValue: "0px", sourcePath: "material.json#ladder.sheet.blur" },
  { name: "material-sheet-saturation", cssVar: "--opsin-material-sheet-saturation", namespace: "material", tier: "semantic", group: "material", value: "1.6", description: "Rung 3 (sheet): backdrop saturation multiplier.", usedBy: ["surface"], reducedTransparencyValue: "1", sourcePath: "material.json#ladder.sheet.saturation" },
  { name: "material-sheet-border", cssVar: "--opsin-material-sheet-border", namespace: "material", tier: "semantic", group: "material", value: "oklch(0 0 0 / 0.08)", darkValue: "oklch(1 0 0 / 0.10)", description: "Rung 3 (sheet): the boundary.", usedBy: ["surface"], sourcePath: "material.json#ladder.sheet.border" },
  { name: "material-sheet-shadow", cssVar: "--opsin-material-sheet-shadow", namespace: "material", tier: "semantic", group: "material", value: "0 -1px 2px oklch(0 0 0 / 0.05)", description: "Rung 3 (sheet): the shadow that separates it from what is behind.", usedBy: ["surface"], sourcePath: "material.json#ladder.sheet.shadow" },
  { name: "material-sheet-scrim", cssVar: "--opsin-material-sheet-scrim", namespace: "material", tier: "semantic", group: "material", value: "0.82", description: "Rung 3 (sheet): the minimum scrim opacity needed for text on this rung to clear the contrast floor.", usedBy: ["surface"], sourcePath: "material.json#ladder.sheet.scrim" },
  { name: "material-sheet-opaque", cssVar: "--opsin-material-sheet-opaque", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-0)", darkValue: "var(--opsin-neutral-900)", description: "Rung 3 (sheet): the opaque substitute used under prefers-reduced-transparency and where backdrop-filter is unsupported.", usedBy: ["surface"], resolvedValue: "oklch(1 0 0)", darkResolvedValue: "oklch(0.205 0.006 250)", sourcePath: "material.json#ladder.sheet.opaque" },
  { name: "material-overlay-tint", cssVar: "--opsin-material-overlay-tint", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-0)", darkValue: "var(--opsin-neutral-900)", description: "Rung 4 (overlay): the tint over what is behind it. A pinned toolbar, a tab bar, a floating action bar — chrome that content scrolls beneath.", usedBy: ["surface"], resolvedValue: "oklch(1 0 0)", darkResolvedValue: "oklch(0.205 0.006 250)", reducedTransparencyValue: "var(--opsin-material-overlay-opaque)", sourcePath: "material.json#ladder.overlay.tint" },
  { name: "material-overlay-tint-alpha", cssVar: "--opsin-material-overlay-tint-alpha", namespace: "material", tier: "semantic", group: "material", value: "0.74", darkValue: "0.7", description: "Rung 4 (overlay): how opaque that tint is.", usedBy: ["surface"], reducedTransparencyValue: "1", sourcePath: "material.json#ladder.overlay.tint-alpha" },
  { name: "material-overlay-blur", cssVar: "--opsin-material-overlay-blur", namespace: "material", tier: "semantic", group: "material", value: "28px", description: "Rung 4 (overlay): backdrop blur radius.", usedBy: ["surface"], reducedTransparencyValue: "0px", sourcePath: "material.json#ladder.overlay.blur" },
  { name: "material-overlay-saturation", cssVar: "--opsin-material-overlay-saturation", namespace: "material", tier: "semantic", group: "material", value: "1.8", description: "Rung 4 (overlay): backdrop saturation multiplier.", usedBy: ["surface"], reducedTransparencyValue: "1", sourcePath: "material.json#ladder.overlay.saturation" },
  { name: "material-overlay-border", cssVar: "--opsin-material-overlay-border", namespace: "material", tier: "semantic", group: "material", value: "oklch(0 0 0 / 0.10)", darkValue: "oklch(1 0 0 / 0.12)", description: "Rung 4 (overlay): the boundary.", usedBy: ["surface"], sourcePath: "material.json#ladder.overlay.border" },
  { name: "material-overlay-shadow", cssVar: "--opsin-material-overlay-shadow", namespace: "material", tier: "semantic", group: "material", value: "0 8px 32px oklch(0 0 0 / 0.12)", description: "Rung 4 (overlay): the shadow that separates it from what is behind.", usedBy: ["surface"], sourcePath: "material.json#ladder.overlay.shadow" },
  { name: "material-overlay-scrim", cssVar: "--opsin-material-overlay-scrim", namespace: "material", tier: "semantic", group: "material", value: "0.74", description: "Rung 4 (overlay): the minimum scrim opacity needed for text on this rung to clear the contrast floor.", usedBy: ["surface"], sourcePath: "material.json#ladder.overlay.scrim" },
  { name: "material-overlay-opaque", cssVar: "--opsin-material-overlay-opaque", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-0)", darkValue: "var(--opsin-neutral-900)", description: "Rung 4 (overlay): the opaque substitute used under prefers-reduced-transparency and where backdrop-filter is unsupported.", usedBy: ["surface"], resolvedValue: "oklch(1 0 0)", darkResolvedValue: "oklch(0.205 0.006 250)", sourcePath: "material.json#ladder.overlay.opaque" },
  { name: "material-scrim-tint", cssVar: "--opsin-material-scrim-tint", namespace: "material", tier: "semantic", group: "material", value: "var(--opsin-neutral-950)", darkValue: "var(--opsin-neutral-1000)", description: "Rung 5 (scrim): the tint over what is behind it. The dimming layer behind a modal dialog or a consent sheet. Its job is to remove the page from consideration, not to look like glass.", usedBy: ["surface"], resolvedValue: "oklch(0.145 0.005 250)", darkResolvedValue: "oklch(0 0 0)", reducedTransparencyValue: "var(--opsin-material-scrim-opaque)", sourcePath: "material.json#ladder.scrim.tint" },
  { name: "material-scrim-tint-alpha", cssVar: "--opsin-material-scrim-tint-alpha", namespace: "material", tier: "semantic", group: "material", value: "0.44", darkValue: "0.6", description: "Rung 5 (scrim): how opaque that tint is.", usedBy: ["surface"], reducedTransparencyValue: "1", sourcePath: "material.json#ladder.scrim.tint-alpha" },
  { name: "material-scrim-blur", cssVar: "--opsin-material-scrim-blur", namespace: "material", tier: "semantic", group: "material", value: "2px", description: "Rung 5 (scrim): backdrop blur radius.", usedBy: ["surface"], reducedTransparencyValue: "0px", sourcePath: "material.json#ladder.scrim.blur" },
  { name: "material-scrim-saturation", cssVar: "--opsin-material-scrim-saturation", namespace: "material", tier: "semantic", group: "material", value: "1", description: "Rung 5 (scrim): backdrop saturation multiplier.", usedBy: ["surface"], reducedTransparencyValue: "1", sourcePath: "material.json#ladder.scrim.saturation" },
  { name: "material-scrim-border", cssVar: "--opsin-material-scrim-border", namespace: "material", tier: "semantic", group: "material", value: "none", description: "Rung 5 (scrim): the boundary.", usedBy: ["surface"], sourcePath: "material.json#ladder.scrim.border" },
  { name: "material-scrim-shadow", cssVar: "--opsin-material-scrim-shadow", namespace: "material", tier: "semantic", group: "material", value: "none", description: "Rung 5 (scrim): the shadow that separates it from what is behind.", usedBy: ["surface"], sourcePath: "material.json#ladder.scrim.shadow" },
  { name: "material-scrim-scrim", cssVar: "--opsin-material-scrim-scrim", namespace: "material", tier: "semantic", group: "material", value: "0.44", description: "Rung 5 (scrim): the minimum scrim opacity needed for text on this rung to clear the contrast floor.", usedBy: ["surface"], sourcePath: "material.json#ladder.scrim.scrim" },
  { name: "material-scrim-opaque", cssVar: "--opsin-material-scrim-opaque", namespace: "material", tier: "semantic", group: "material", value: "oklch(0.205 0.006 250 / 0.72)", darkValue: "oklch(0 0 0 / 0.8)", description: "Rung 5 (scrim): the opaque substitute used under prefers-reduced-transparency and where backdrop-filter is unsupported.", usedBy: ["surface"], sourcePath: "material.json#ladder.scrim.opaque" },
  { name: "ease-spring-snap", cssVar: "--opsin-ease-spring-snap", namespace: "motion", tier: "semantic", group: "ease", value: "linear(0, 0.0715, 0.2271, 0.4053, 0.5722, 0.7119, 0.8198, 0.8978, 0.9505, 0.9836, 1.0025, 1.0118, 1.015, 1.0147, 1.0126, 1.01, 1.0073, 1.0051, 1.0033, 1.0019, 1)", description: "Direct manipulation only: a switch the reader just flipped, a segmented control, a pressed button settling. It overshoots by 1.5% — enough to feel physical, not enough to look playful — which is the largest overshoot in the system but not the only one: `spring-settle` overshoots by 0.88%. Only `spring-calm` and `spring-sheet` reach their target without passing it.", usedBy: [], reducedMotionValue: "linear", sourcePath: "motion.json#springs.spring-snap.easing" },
  { name: "duration-spring-snap", cssVar: "--opsin-duration-spring-snap", namespace: "motion", tier: "semantic", group: "duration", value: "283ms", description: "Settle time for the spring-snap spring, measured from its own parameters.", usedBy: [], reducedMotionValue: "0ms", sourcePath: "motion.json#springs.spring-snap.durationMs" },
  { name: "ease-spring-settle", cssVar: "--opsin-ease-spring-settle", namespace: "motion", tier: "semantic", group: "ease", value: "linear(0, 0.0742, 0.2328, 0.4113, 0.5758, 0.7116, 0.8157, 0.8905, 0.9412, 0.9736, 0.9928, 1.003, 1.0076, 1.0088, 1.0082, 1.0068, 1.0053, 1.0038, 1.0026, 1.0017, 1)", description: "The workhorse for chrome: popovers, tooltips, menus, chips appearing and disappearing.", usedBy: [], reducedMotionValue: "linear", sourcePath: "motion.json#springs.spring-settle.easing" },
  { name: "duration-spring-settle", cssVar: "--opsin-duration-spring-settle", namespace: "motion", tier: "semantic", group: "duration", value: "382ms", description: "Settle time for the spring-settle spring, measured from its own parameters.", usedBy: [], reducedMotionValue: "100ms", sourcePath: "motion.json#springs.spring-settle.durationMs" },
  { name: "ease-spring-calm", cssVar: "--opsin-ease-spring-calm", namespace: "motion", tier: "semantic", group: "ease", value: "linear(0, 0.0829, 0.2457, 0.4157, 0.5642, 0.6832, 0.774, 0.841, 0.8893, 0.9236, 0.9476, 0.9643, 0.9757, 0.9836, 0.9889, 0.9926, 0.995, 0.9967, 0.9978, 0.9985, 1)", description: "A health value that changes while it is already on screen: a bar re-filling from one reading to the next, a dial travelling between two values the reader has already been shown. Never a first paint and never a first reveal — a value arrives at its final figure, with no count-up, no dial sweep and no line drawing itself in (health/motion-in-health-ui rule 2). Slightly overdamped (zeta just over 1) so it never overshoots and never bounces.", usedBy: [], reducedMotionValue: "linear", sourcePath: "motion.json#springs.spring-calm.easing" },
  { name: "duration-spring-calm", cssVar: "--opsin-duration-spring-calm", namespace: "motion", tier: "semantic", group: "duration", value: "550ms", description: "Settle time for the spring-calm spring, measured from its own parameters.", usedBy: [], reducedMotionValue: "0ms", sourcePath: "motion.json#springs.spring-calm.durationMs" },
  { name: "ease-spring-sheet", cssVar: "--opsin-ease-spring-sheet", namespace: "motion", tier: "semantic", group: "ease", value: "linear(0, 0.0881, 0.2576, 0.431, 0.5798, 0.6971, 0.7854, 0.8497, 0.8958, 0.9282, 0.9508, 0.9664, 0.9771, 0.9845, 0.9895, 0.9929, 0.9952, 0.9967, 0.9978, 0.9985, 1)", description: "Large surfaces travelling a long distance: sheets, dialogs, full-screen pushes. Overdamped, because a sheet that bounces at the top of its travel reads as a dropped object.", usedBy: ["sheet"], reducedMotionValue: "linear", sourcePath: "motion.json#springs.spring-sheet.easing" },
  { name: "duration-spring-sheet", cssVar: "--opsin-duration-spring-sheet", namespace: "motion", tier: "semantic", group: "duration", value: "483ms", description: "Settle time for the spring-sheet spring, measured from its own parameters.", usedBy: ["sheet"], reducedMotionValue: "120ms", sourcePath: "motion.json#springs.spring-sheet.durationMs" },
  { name: "ease-standard", cssVar: "--opsin-ease-standard", namespace: "motion", tier: "semantic", group: "ease", value: "cubic-bezier(0.2, 0, 0, 1)", description: "Non-spring transitions where a spring would be overkill: colour, opacity, border. Fast out, slow in.", usedBy: ["button", "care-card", "consent-sheet", "dialog", "sheet", "skeleton"], reducedMotionValue: "linear", sourcePath: "motion.json#easings.ease-standard" },
  { name: "ease-enter", cssVar: "--opsin-ease-enter", namespace: "motion", tier: "semantic", group: "ease", value: "cubic-bezier(0.05, 0.7, 0.1, 1)", description: "Something arriving from off-screen or from nothing. Decelerating, because an arrival should feel like it is coming to rest.", usedBy: [], sourcePath: "motion.json#easings.ease-enter" },
  { name: "ease-exit", cssVar: "--opsin-ease-exit", namespace: "motion", tier: "semantic", group: "ease", value: "cubic-bezier(0.3, 0, 0.8, 0.15)", description: "Something leaving. Accelerating and shorter than its enter, because a reader does not need to watch a dismissal finish.", usedBy: [], sourcePath: "motion.json#easings.ease-exit" },
  { name: "duration-instant", cssVar: "--opsin-duration-instant", namespace: "motion", tier: "semantic", group: "duration", value: "80ms", description: "State change with no travel: hover tint, focus ring, checkbox tick.", usedBy: [], sourcePath: "motion.json#durations.duration-instant" },
  { name: "duration-fast", cssVar: "--opsin-duration-fast", namespace: "motion", tier: "semantic", group: "duration", value: "140ms", description: "Small elements moving a small distance.", usedBy: ["button", "care-card", "consent-sheet", "dialog", "skeleton"], sourcePath: "motion.json#durations.duration-fast" },
  { name: "duration-base", cssVar: "--opsin-duration-base", namespace: "motion", tier: "semantic", group: "duration", value: "220ms", description: "The default for chrome that is not spring-driven.", usedBy: ["dialog", "sheet"], sourcePath: "motion.json#durations.duration-base" },
  { name: "duration-slow", cssVar: "--opsin-duration-slow", namespace: "motion", tier: "semantic", group: "duration", value: "360ms", description: "Layout change: a list reflowing, a card expanding.", usedBy: [], sourcePath: "motion.json#durations.duration-slow" },
  { name: "duration-deliberate", cssVar: "--opsin-duration-deliberate", namespace: "motion", tier: "semantic", group: "duration", value: "560ms", description: "The ceiling. Used for a first-run reveal or a consent sheet, where the point is that the reader notices. Nothing may exceed it.", usedBy: [], sourcePath: "motion.json#durations.duration-deliberate" },
  { name: "font-sans", cssVar: "--opsin-font-sans", namespace: "type", tier: "semantic", group: "font", value: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", description: "The sans family stack.", usedBy: [], sourcePath: "type.json#family.sans" },
  { name: "font-mono", cssVar: "--opsin-font-mono", namespace: "type", tier: "semantic", group: "font", value: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace", description: "The mono family stack.", usedBy: [], sourcePath: "type.json#family.mono" },
  { name: "font-numeric", cssVar: "--opsin-font-numeric", namespace: "type", tier: "semantic", group: "font", value: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", description: "The numeric family stack.", usedBy: ["result-card", "value"], sourcePath: "type.json#family.numeric" },
  { name: "text-large-title-size", cssVar: "--opsin-text-large-title-size", namespace: "type", tier: "semantic", group: "text", value: "2.125rem", description: "The one number or one word a screen exists to show. A dial's reading, a result's headline value.", usedBy: [], sourcePath: "type.json#scale.largeTitle.size" },
  { name: "text-large-title-leading", cssVar: "--opsin-text-large-title-leading", namespace: "type", tier: "semantic", group: "text", value: "1.206", description: "Line height for largeTitle, unitless so it scales with the size.", usedBy: [], sourcePath: "type.json#scale.largeTitle.leading" },
  { name: "text-large-title-tracking", cssVar: "--opsin-text-large-title-tracking", namespace: "type", tier: "semantic", group: "text", value: "-0.011em", description: "Letter spacing for largeTitle.", usedBy: [], sourcePath: "type.json#scale.largeTitle.tracking" },
  { name: "text-large-title-weight", cssVar: "--opsin-text-large-title-weight", namespace: "type", tier: "semantic", group: "text", value: "700", description: "Font weight for largeTitle.", usedBy: [], sourcePath: "type.json#scale.largeTitle.weight" },
  { name: "text-title1-size", cssVar: "--opsin-text-title1-size", namespace: "type", tier: "semantic", group: "text", value: "1.75rem", description: "Screen title.", usedBy: ["result-card", "value"], sourcePath: "type.json#scale.title1.size" },
  { name: "text-title1-leading", cssVar: "--opsin-text-title1-leading", namespace: "type", tier: "semantic", group: "text", value: "1.214", description: "Line height for title1, unitless so it scales with the size.", usedBy: ["result-card", "value"], sourcePath: "type.json#scale.title1.leading" },
  { name: "text-title1-tracking", cssVar: "--opsin-text-title1-tracking", namespace: "type", tier: "semantic", group: "text", value: "-0.009em", description: "Letter spacing for title1.", usedBy: ["result-card", "value"], sourcePath: "type.json#scale.title1.tracking" },
  { name: "text-title1-weight", cssVar: "--opsin-text-title1-weight", namespace: "type", tier: "semantic", group: "text", value: "700", description: "Font weight for title1.", usedBy: ["result-card", "value"], sourcePath: "type.json#scale.title1.weight" },
  { name: "text-title2-size", cssVar: "--opsin-text-title2-size", namespace: "type", tier: "semantic", group: "text", value: "1.375rem", description: "Section title; the floor for a primary health value inside a card.", usedBy: [], sourcePath: "type.json#scale.title2.size" },
  { name: "text-title2-leading", cssVar: "--opsin-text-title2-leading", namespace: "type", tier: "semantic", group: "text", value: "1.273", description: "Line height for title2, unitless so it scales with the size.", usedBy: [], sourcePath: "type.json#scale.title2.leading" },
  { name: "text-title2-tracking", cssVar: "--opsin-text-title2-tracking", namespace: "type", tier: "semantic", group: "text", value: "-0.006em", description: "Letter spacing for title2.", usedBy: [], sourcePath: "type.json#scale.title2.tracking" },
  { name: "text-title2-weight", cssVar: "--opsin-text-title2-weight", namespace: "type", tier: "semantic", group: "text", value: "600", description: "Font weight for title2.", usedBy: [], sourcePath: "type.json#scale.title2.weight" },
  { name: "text-title3-size", cssVar: "--opsin-text-title3-size", namespace: "type", tier: "semantic", group: "text", value: "1.25rem", description: "Card title.", usedBy: ["dialog", "empty-state", "result-card", "sheet", "value"], sourcePath: "type.json#scale.title3.size" },
  { name: "text-title3-leading", cssVar: "--opsin-text-title3-leading", namespace: "type", tier: "semantic", group: "text", value: "1.25", description: "Line height for title3, unitless so it scales with the size.", usedBy: ["dialog", "empty-state", "result-card", "sheet", "value"], sourcePath: "type.json#scale.title3.leading" },
  { name: "text-title3-tracking", cssVar: "--opsin-text-title3-tracking", namespace: "type", tier: "semantic", group: "text", value: "-0.004em", description: "Letter spacing for title3.", usedBy: ["dialog", "empty-state", "result-card", "sheet", "value"], sourcePath: "type.json#scale.title3.tracking" },
  { name: "text-title3-weight", cssVar: "--opsin-text-title3-weight", namespace: "type", tier: "semantic", group: "text", value: "600", description: "Font weight for title3.", usedBy: ["dialog", "empty-state", "result-card", "sheet", "value"], sourcePath: "type.json#scale.title3.weight" },
  { name: "text-headline-size", cssVar: "--opsin-text-headline-size", namespace: "type", tier: "semantic", group: "text", value: "1.0625rem", description: "An emphasised line of body text — a status sentence, a question in a form.", usedBy: ["alert-banner", "button", "callout", "card", "care-card", "empty-state", "field", "range-bar", "reading-input", "result-card", "score-dial", "surface", "trend-sparkline"], sourcePath: "type.json#scale.headline.size" },
  { name: "text-headline-leading", cssVar: "--opsin-text-headline-leading", namespace: "type", tier: "semantic", group: "text", value: "1.294", description: "Line height for headline, unitless so it scales with the size.", usedBy: ["alert-banner", "button", "callout", "card", "care-card", "empty-state", "field", "range-bar", "reading-input", "result-card", "score-dial", "surface", "trend-sparkline"], sourcePath: "type.json#scale.headline.leading" },
  { name: "text-headline-tracking", cssVar: "--opsin-text-headline-tracking", namespace: "type", tier: "semantic", group: "text", value: "-0.003em", description: "Letter spacing for headline.", usedBy: ["alert-banner", "button", "callout", "card", "care-card", "empty-state", "field", "range-bar", "reading-input", "result-card", "score-dial", "surface", "trend-sparkline"], sourcePath: "type.json#scale.headline.tracking" },
  { name: "text-headline-weight", cssVar: "--opsin-text-headline-weight", namespace: "type", tier: "semantic", group: "text", value: "600", description: "Font weight for headline.", usedBy: ["alert-banner", "button", "callout", "card", "care-card", "empty-state", "field", "range-bar", "reading-input", "result-card", "score-dial", "surface", "trend-sparkline"], sourcePath: "type.json#scale.headline.weight" },
  { name: "text-body-size", cssVar: "--opsin-text-body-size", namespace: "type", tier: "semantic", group: "text", value: "1.0625rem", description: "Everything a reader reads as prose. The anchor of the scale.", usedBy: ["alert-banner", "callout", "card", "care-card", "consent-sheet", "dialog", "disclaimer-note", "empty-state", "field", "range-bar", "reading-input", "relative-time", "result-card", "score-dial", "sheet", "term", "trend-sparkline", "value"], sourcePath: "type.json#scale.body.size" },
  { name: "text-body-leading", cssVar: "--opsin-text-body-leading", namespace: "type", tier: "semantic", group: "text", value: "1.294", description: "Line height for body, unitless so it scales with the size.", usedBy: ["alert-banner", "callout", "card", "care-card", "consent-sheet", "dialog", "disclaimer-note", "empty-state", "field", "range-bar", "reading-input", "relative-time", "result-card", "score-dial", "sheet", "skeleton", "term", "trend-sparkline", "value"], sourcePath: "type.json#scale.body.leading" },
  { name: "text-body-tracking", cssVar: "--opsin-text-body-tracking", namespace: "type", tier: "semantic", group: "text", value: "-0.003em", description: "Letter spacing for body.", usedBy: ["alert-banner", "callout", "card", "care-card", "consent-sheet", "dialog", "disclaimer-note", "empty-state", "field", "range-bar", "reading-input", "relative-time", "result-card", "score-dial", "sheet", "term", "trend-sparkline", "value"], sourcePath: "type.json#scale.body.tracking" },
  { name: "text-body-weight", cssVar: "--opsin-text-body-weight", namespace: "type", tier: "semantic", group: "text", value: "400", description: "Font weight for body.", usedBy: ["alert-banner", "callout", "card", "care-card", "consent-sheet", "dialog", "disclaimer-note", "empty-state", "field", "range-bar", "reading-input", "relative-time", "result-card", "score-dial", "sheet", "term", "trend-sparkline", "value"], sourcePath: "type.json#scale.body.weight" },
  { name: "text-callout-size", cssVar: "--opsin-text-callout-size", namespace: "type", tier: "semantic", group: "text", value: "1rem", description: "Secondary prose inside a card or a callout.", usedBy: [], sourcePath: "type.json#scale.callout.size" },
  { name: "text-callout-leading", cssVar: "--opsin-text-callout-leading", namespace: "type", tier: "semantic", group: "text", value: "1.313", description: "Line height for callout, unitless so it scales with the size.", usedBy: [], sourcePath: "type.json#scale.callout.leading" },
  { name: "text-callout-tracking", cssVar: "--opsin-text-callout-tracking", namespace: "type", tier: "semantic", group: "text", value: "-0.002em", description: "Letter spacing for callout.", usedBy: [], sourcePath: "type.json#scale.callout.tracking" },
  { name: "text-callout-weight", cssVar: "--opsin-text-callout-weight", namespace: "type", tier: "semantic", group: "text", value: "400", description: "Font weight for callout.", usedBy: [], sourcePath: "type.json#scale.callout.weight" },
  { name: "text-subheadline-size", cssVar: "--opsin-text-subheadline-size", namespace: "type", tier: "semantic", group: "text", value: "0.9375rem", description: "Supporting line under a title; the unit beside a value.", usedBy: ["alert-banner", "button", "care-card", "empty-state", "metric-tile", "score-dial"], sourcePath: "type.json#scale.subheadline.size" },
  { name: "text-subheadline-leading", cssVar: "--opsin-text-subheadline-leading", namespace: "type", tier: "semantic", group: "text", value: "1.333", description: "Line height for subheadline, unitless so it scales with the size.", usedBy: ["alert-banner", "button", "care-card", "empty-state", "metric-tile", "score-dial"], sourcePath: "type.json#scale.subheadline.leading" },
  { name: "text-subheadline-tracking", cssVar: "--opsin-text-subheadline-tracking", namespace: "type", tier: "semantic", group: "text", value: "-0.001em", description: "Letter spacing for subheadline.", usedBy: ["alert-banner", "button", "care-card", "empty-state", "metric-tile", "score-dial"], sourcePath: "type.json#scale.subheadline.tracking" },
  { name: "text-subheadline-weight", cssVar: "--opsin-text-subheadline-weight", namespace: "type", tier: "semantic", group: "text", value: "400", description: "Font weight for subheadline.", usedBy: ["alert-banner", "button", "care-card", "empty-state", "metric-tile", "score-dial"], sourcePath: "type.json#scale.subheadline.weight" },
  { name: "text-footnote-size", cssVar: "--opsin-text-footnote-size", namespace: "type", tier: "semantic", group: "text", value: "0.8125rem", description: "Provenance: who measured this, when, with what.", usedBy: ["alert-banner", "card", "consent-sheet", "log-sheet", "range-bar", "result-card", "score-dial", "sheet", "status-pill", "surface", "trend-sparkline"], sourcePath: "type.json#scale.footnote.size" },
  { name: "text-footnote-leading", cssVar: "--opsin-text-footnote-leading", namespace: "type", tier: "semantic", group: "text", value: "1.385", description: "Line height for footnote, unitless so it scales with the size.", usedBy: ["alert-banner", "card", "consent-sheet", "log-sheet", "range-bar", "result-card", "score-dial", "sheet", "status-pill", "surface", "trend-sparkline"], sourcePath: "type.json#scale.footnote.leading" },
  { name: "text-footnote-tracking", cssVar: "--opsin-text-footnote-tracking", namespace: "type", tier: "semantic", group: "text", value: "0em", description: "Letter spacing for footnote.", usedBy: ["alert-banner", "card", "consent-sheet", "log-sheet", "range-bar", "result-card", "score-dial", "sheet", "status-pill", "surface", "trend-sparkline"], sourcePath: "type.json#scale.footnote.tracking" },
  { name: "text-footnote-weight", cssVar: "--opsin-text-footnote-weight", namespace: "type", tier: "semantic", group: "text", value: "400", description: "Font weight for footnote.", usedBy: ["alert-banner", "card", "consent-sheet", "log-sheet", "range-bar", "result-card", "score-dial", "sheet", "status-pill", "surface", "trend-sparkline"], sourcePath: "type.json#scale.footnote.weight" },
  { name: "text-caption1-size", cssVar: "--opsin-text-caption1-size", namespace: "type", tier: "semantic", group: "text", value: "0.75rem", description: "Axis labels, legend text, timestamps.", usedBy: ["consent-sheet", "metric-tile", "range-bar", "skeleton", "status-pill", "trend-sparkline"], sourcePath: "type.json#scale.caption1.size" },
  { name: "text-caption1-leading", cssVar: "--opsin-text-caption1-leading", namespace: "type", tier: "semantic", group: "text", value: "1.333", description: "Line height for caption1, unitless so it scales with the size.", usedBy: ["consent-sheet", "metric-tile", "range-bar", "skeleton", "status-pill", "trend-sparkline"], sourcePath: "type.json#scale.caption1.leading" },
  { name: "text-caption1-tracking", cssVar: "--opsin-text-caption1-tracking", namespace: "type", tier: "semantic", group: "text", value: "0.002em", description: "Letter spacing for caption1.", usedBy: ["consent-sheet", "metric-tile", "range-bar", "skeleton", "status-pill", "trend-sparkline"], sourcePath: "type.json#scale.caption1.tracking" },
  { name: "text-caption1-weight", cssVar: "--opsin-text-caption1-weight", namespace: "type", tier: "semantic", group: "text", value: "400", description: "Font weight for caption1.", usedBy: ["consent-sheet", "metric-tile", "range-bar", "skeleton", "status-pill", "trend-sparkline"], sourcePath: "type.json#scale.caption1.weight" },
  { name: "text-caption2-size", cssVar: "--opsin-text-caption2-size", namespace: "type", tier: "semantic", group: "text", value: "0.6875rem", description: "The smallest text the system permits, and only for text that repeats a label already present elsewhere. Never the only place a fact appears.", usedBy: [], sourcePath: "type.json#scale.caption2.size" },
  { name: "text-caption2-leading", cssVar: "--opsin-text-caption2-leading", namespace: "type", tier: "semantic", group: "text", value: "1.182", description: "Line height for caption2, unitless so it scales with the size.", usedBy: [], sourcePath: "type.json#scale.caption2.leading" },
  { name: "text-caption2-tracking", cssVar: "--opsin-text-caption2-tracking", namespace: "type", tier: "semantic", group: "text", value: "0.005em", description: "Letter spacing for caption2.", usedBy: [], sourcePath: "type.json#scale.caption2.tracking" },
  { name: "text-caption2-weight", cssVar: "--opsin-text-caption2-weight", namespace: "type", tier: "semantic", group: "text", value: "500", description: "Font weight for caption2.", usedBy: [], sourcePath: "type.json#scale.caption2.weight" },
  { name: "numerals", cssVar: "--opsin-numerals", namespace: "type", tier: "semantic", group: "numerals", value: "tabular-nums", description: "Every component that renders a number sets this, so a changing value does not shift its own layout.", usedBy: [], sourcePath: "type.json#numerals.fontVariantNumeric" },
  { name: "space-0", cssVar: "--opsin-space-0", namespace: "space", tier: "primitive", group: "space", value: "0rem", description: "0px.", usedBy: [], sourcePath: "space.json#scale.0" },
  { name: "space-1", cssVar: "--opsin-space-1", namespace: "space", tier: "primitive", group: "space", value: "0.25rem", description: "Gap between an icon and its label.", usedBy: ["button", "care-card", "empty-state", "field", "log-sheet", "range-bar", "result-card", "score-dial", "sheet", "status-pill", "trend-sparkline"], sourcePath: "space.json#scale.1" },
  { name: "space-2", cssVar: "--opsin-space-2", namespace: "space", tier: "primitive", group: "space", value: "0.5rem", description: "Gap between tightly related lines; minimum separation between two interactive targets.", usedBy: ["alert-banner", "button", "callout", "care-card", "consent-sheet", "dialog", "disclaimer-note", "empty-state", "field", "log-sheet", "metric-tile", "range-bar", "reading-input", "relative-time", "result-card", "score-dial", "sheet", "skeleton", "status-pill", "surface", "term", "trend-sparkline"], sourcePath: "space.json#scale.2" },
  { name: "space-3", cssVar: "--opsin-space-3", namespace: "space", tier: "primitive", group: "space", value: "0.75rem", description: "Inner padding of a compact control.", usedBy: ["alert-banner", "button", "dialog", "disclaimer-note", "field", "log-sheet", "metric-tile", "reading-input", "result-card", "sheet", "status-pill", "surface", "value"], sourcePath: "space.json#scale.3" },
  { name: "space-4", cssVar: "--opsin-space-4", namespace: "space", tier: "primitive", group: "space", value: "1rem", description: "The default gap between elements inside a card.", usedBy: ["alert-banner", "callout", "care-card", "consent-sheet", "dialog", "empty-state", "log-sheet", "metric-tile", "result-card", "sheet", "surface"], sourcePath: "space.json#scale.4" },
  { name: "space-5", cssVar: "--opsin-space-5", namespace: "space", tier: "primitive", group: "space", value: "1.25rem", description: "Card inner padding on a phone.", usedBy: ["alert-banner", "button", "care-card", "consent-sheet", "dialog", "empty-state", "result-card", "sheet"], sourcePath: "space.json#scale.5" },
  { name: "space-6", cssVar: "--opsin-space-6", namespace: "space", tier: "primitive", group: "space", value: "1.5rem", description: "Card inner padding on a wide screen; gap between cards.", usedBy: ["card", "dialog", "disclaimer-note", "empty-state", "field", "log-sheet", "skeleton", "trend-sparkline"], sourcePath: "space.json#scale.6" },
  { name: "space-8", cssVar: "--opsin-space-8", namespace: "space", tier: "primitive", group: "space", value: "2rem", description: "Gap between sections within a screen.", usedBy: ["disclaimer-note", "empty-state", "range-bar", "reading-input", "sheet"], sourcePath: "space.json#scale.8" },
  { name: "space-10", cssVar: "--opsin-space-10", namespace: "space", tier: "primitive", group: "space", value: "2.5rem", description: "Space above a section heading.", usedBy: ["sheet", "skeleton"], sourcePath: "space.json#scale.10" },
  { name: "space-12", cssVar: "--opsin-space-12", namespace: "space", tier: "primitive", group: "space", value: "3rem", description: "Gap between major regions of a screen.", usedBy: ["trend-sparkline"], sourcePath: "space.json#scale.12" },
  { name: "space-16", cssVar: "--opsin-space-16", namespace: "space", tier: "primitive", group: "space", value: "4rem", description: "Top of a screen below the safe area; the space a consent sheet leaves above its first question.", usedBy: ["dialog", "skeleton"], sourcePath: "space.json#scale.16" },
  { name: "space-20", cssVar: "--opsin-space-20", namespace: "space", tier: "primitive", group: "space", value: "5rem", description: "Empty-state vertical rhythm.", usedBy: [], sourcePath: "space.json#scale.20" },
  { name: "space-24", cssVar: "--opsin-space-24", namespace: "space", tier: "primitive", group: "space", value: "6rem", description: "The largest step. Beyond this, use a layout, not a gap.", usedBy: [], sourcePath: "space.json#scale.24" },
  { name: "space-px", cssVar: "--opsin-space-px", namespace: "space", tier: "primitive", group: "space", value: "0.0625rem", description: "Hairline borders only.", usedBy: [], sourcePath: "space.json#scale.px" },
  { name: "space-0-5", cssVar: "--opsin-space-0-5", namespace: "space", tier: "primitive", group: "space", value: "0.125rem", description: "Optical nudges. Not a layout step.", usedBy: ["result-card", "score-dial", "status-pill", "term"], sourcePath: "space.json#scale.0.5" },
  { name: "target-minimum", cssVar: "--opsin-target-minimum", namespace: "space", tier: "semantic", group: "target", value: "2.75rem", description: "The opsinjs floor for any interactive control, applied to the hit area rather than to the visible box.", usedBy: ["alert-banner", "button", "card", "care-card", "consent-sheet", "dialog", "disclaimer-note", "empty-state", "field", "metric-tile", "reading-input", "result-card", "sheet"], sourcePath: "space.json#targets.minimum" },
  { name: "target-comfortable", cssVar: "--opsin-target-comfortable", namespace: "space", tier: "semantic", group: "target", value: "3rem", description: "The default for a primary action in the product theme.", usedBy: [], sourcePath: "space.json#targets.comfortable" },
  { name: "target-generous", cssVar: "--opsin-target-generous", namespace: "space", tier: "semantic", group: "target", value: "3.5rem", description: "A single primary action on a consent, escalation or emergency surface, where a mis-tap has a real cost.", usedBy: [], sourcePath: "space.json#targets.generous" },
  { name: "target-separation", cssVar: "--opsin-target-separation", namespace: "space", tier: "semantic", group: "target", value: "0.5rem", description: "The minimum gap between two adjacent targets whose visible boxes are smaller than 44px.", usedBy: ["alert-banner", "card", "care-card", "consent-sheet", "result-card"], sourcePath: "space.json#targets.separation" },
  { name: "gutter-phone", cssVar: "--opsin-gutter-phone", namespace: "space", tier: "semantic", group: "gutter", value: "16px", description: "The screen gutter in the phone responsive mode.", usedBy: [], sourcePath: "space.json#gutters.phone" },
  { name: "gutter-tablet", cssVar: "--opsin-gutter-tablet", namespace: "space", tier: "semantic", group: "gutter", value: "24px", description: "The screen gutter in the tablet responsive mode.", usedBy: [], sourcePath: "space.json#gutters.tablet" },
  { name: "gutter-wide", cssVar: "--opsin-gutter-wide", namespace: "space", tier: "semantic", group: "gutter", value: "32px", description: "The screen gutter in the wide responsive mode.", usedBy: [], sourcePath: "space.json#gutters.wide" },
  { name: "measure-tight", cssVar: "--opsin-measure-tight", namespace: "space", tier: "semantic", group: "measure", value: "45ch", description: "A caption or a legend.", usedBy: [], sourcePath: "space.json#measure.tight" },
  { name: "measure-comfortable", cssVar: "--opsin-measure-comfortable", namespace: "space", tier: "semantic", group: "measure", value: "66ch", description: "The maximum line length for prose anywhere in the product, including a disclaimer nobody wants to read.", usedBy: [], sourcePath: "space.json#measure.comfortable" },
  { name: "measure-wide", cssVar: "--opsin-measure-wide", namespace: "space", tier: "semantic", group: "measure", value: "80ch", description: "Code and machine output only.", usedBy: [], sourcePath: "space.json#measure.wide" },
  { name: "safe-top", cssVar: "--opsin-safe-top", namespace: "space", tier: "semantic", group: "safe", value: "env(safe-area-inset-top, 0px)", description: "The top safe-area inset, for installed web apps where browser chrome does not protect the edge.", usedBy: [], sourcePath: "space.json#safeArea.top" },
  { name: "safe-right", cssVar: "--opsin-safe-right", namespace: "space", tier: "semantic", group: "safe", value: "env(safe-area-inset-right, 0px)", description: "The right safe-area inset, for installed web apps where browser chrome does not protect the edge.", usedBy: [], sourcePath: "space.json#safeArea.right" },
  { name: "safe-bottom", cssVar: "--opsin-safe-bottom", namespace: "space", tier: "semantic", group: "safe", value: "env(safe-area-inset-bottom, 0px)", description: "The bottom safe-area inset, for installed web apps where browser chrome does not protect the edge.", usedBy: [], sourcePath: "space.json#safeArea.bottom" },
  { name: "safe-left", cssVar: "--opsin-safe-left", namespace: "space", tier: "semantic", group: "safe", value: "env(safe-area-inset-left, 0px)", description: "The left safe-area inset, for installed web apps where browser chrome does not protect the edge.", usedBy: [], sourcePath: "space.json#safeArea.left" },
  { name: "radius-base", cssVar: "--opsin-radius-base", namespace: "shape", tier: "semantic", group: "radius", value: "0.875rem", description: "The one radius the whole ladder is derived from.", usedBy: [], sourcePath: "shape.json#base" },
  { name: "radius-none", cssVar: "--opsin-radius-none", namespace: "shape", tier: "semantic", group: "radius", value: "0rem", description: "Full-bleed media and anything that meets a screen edge.", usedBy: [], sourcePath: "shape.json#ladder.radius-none" },
  { name: "radius-xs", cssVar: "--opsin-radius-xs", namespace: "shape", tier: "semantic", group: "radius", value: "0.25rem", description: "The floor for a nested corner. Tags inside a chip, a swatch inside a legend.", usedBy: [], sourcePath: "shape.json#ladder.radius-xs" },
  { name: "radius-sm", cssVar: "--opsin-radius-sm", namespace: "shape", tier: "semantic", group: "radius", value: "0.4375rem", description: "Inputs and small controls inside a card.", usedBy: [], sourcePath: "shape.json#ladder.radius-sm" },
  { name: "radius-md", cssVar: "--opsin-radius-md", namespace: "shape", tier: "semantic", group: "radius", value: "0.875rem", description: "The default. Buttons, chips, status pills, cards.", usedBy: [], sourcePath: "shape.json#ladder.radius-md" },
  { name: "radius-lg", cssVar: "--opsin-radius-lg", namespace: "shape", tier: "semantic", group: "radius", value: "1.3125rem", description: "Cards on a phone, where the card is nearly the width of the screen.", usedBy: [], sourcePath: "shape.json#ladder.radius-lg" },
  { name: "radius-xl", cssVar: "--opsin-radius-xl", namespace: "shape", tier: "semantic", group: "radius", value: "1.75rem", description: "Sheets and dialogs. Applied to the leading edge only when the surface meets a screen edge on the other side.", usedBy: [], sourcePath: "shape.json#ladder.radius-xl" },
  { name: "corner-shape", cssVar: "--opsin-corner-shape", namespace: "shape", tier: "semantic", group: "corner-shape", value: "superellipse(4)", description: "The squircle curvature. Degrades to `round` where corner-shape is unsupported.", usedBy: [], sourcePath: "shape.json#cornerShape.value" },
  { name: "border-hairline", cssVar: "--opsin-border-hairline", namespace: "shape", tier: "semantic", group: "border", value: "1px", description: "Every boundary in the system by default.", usedBy: [], sourcePath: "shape.json#borders.hairline.px" },
  { name: "border-emphasis", cssVar: "--opsin-border-emphasis", namespace: "shape", tier: "semantic", group: "border", value: "2px", description: "The boundary of a surface carrying `attention` or `urgent`, where the boundary is one of the three non-colour carriers of the status.", usedBy: [], sourcePath: "shape.json#borders.emphasis.px" },
  { name: "border-focus", cssVar: "--opsin-border-focus", namespace: "shape", tier: "semantic", group: "border", value: "2px", description: "The focus ring. Always 2px with a 2px offset, always in a colour measured against both the surface and the page behind it, and never removed — see /docs/accessibility/keyboard-and-focus.", usedBy: [], sourcePath: "shape.json#borders.focus.px" },
  { name: "border-focus-offset", cssVar: "--opsin-border-focus-offset", namespace: "shape", tier: "semantic", group: "border", value: "2px", description: "Offset for the focus boundary.", usedBy: [], sourcePath: "shape.json#borders.focus.offsetPx" },
]

export const TOKEN_META: {
  generatedAt: string | null
  sourceHash: string
  count: number
  namespaces: TokenNamespace[]
} = {
  generatedAt: "8cf8a1222661",
  sourceHash: "8cf8a1222661",
  count: 331,
  namespaces: ["color", "material", "motion", "type", "space", "shape"] as TokenNamespace[],
}

/** The clinical to plain-English glossary, sorted A-Z. Mirrored in lib/generated/glossary.json. */
export const GLOSSARY: GeneratedGlossaryEntry[] = [
  {
    "term": "acute",
    "plain": "sudden, or short-lasting",
    "showBoth": "first-use",
    "reason": "Often misread as 'severe'. It describes how quickly something started, not how bad it is.",
    "category": "general",
    "related": [
      "chronic"
    ]
  },
  {
    "term": "adherence",
    "plain": "taking a medicine the way it was prescribed",
    "showBoth": "plain-only",
    "reason": "'Compliance' frames the reader as obedient or not; 'adherence' is better but still clinical. Write what actually happened instead.",
    "category": "medication"
  },
  {
    "term": "adverse effect",
    "plain": "an unwanted effect of a medicine",
    "showBoth": "first-use",
    "reason": "'Adverse' is not everyday English. 'Side effect' is understood, but it can make a serious effect sound minor, so say what the effect is.",
    "category": "medication"
  },
  {
    "term": "benign",
    "plain": "not cancer",
    "showBoth": "always",
    "reason": "This word appears on reports and is one of the few whose plain meaning is genuinely reassuring, so the reader should be able to match the two.",
    "category": "results",
    "related": [
      "malignant"
    ]
  },
  {
    "term": "biomarker",
    "plain": "something measurable in your body that says something about your health",
    "showBoth": "first-use",
    "reason": "Common in product copy, almost never understood outside research.",
    "category": "results"
  },
  {
    "term": "blood pressure",
    "plain": "the pressure of blood pushing against the walls of your arteries, written as two numbers",
    "showBoth": "first-use",
    "reason": "The words are familiar but the two-number format is not. Always explain which number is which where both are shown.",
    "category": "cardio",
    "related": [
      "systolic",
      "diastolic",
      "hypertension"
    ]
  },
  {
    "term": "BMI",
    "plain": "a number worked out from your height and weight",
    "showBoth": "always",
    "reason": "The abbreviation is widespread and the calculation is not. Anywhere BMI is shown, say that it does not distinguish muscle from fat and is a poor guide for some people.",
    "category": "body"
  },
  {
    "term": "bradycardia",
    "plain": "a slower than usual heart rate",
    "showBoth": "first-use",
    "reason": "Appears in device output. Also note that a slow resting heart rate is expected in many fit people.",
    "category": "cardio",
    "related": [
      "tachycardia"
    ]
  },
  {
    "term": "cholesterol",
    "plain": "a fatty substance carried in your blood",
    "showBoth": "first-use",
    "reason": "Widely known as a word, widely misunderstood as a single number — most reports give several.",
    "category": "labs",
    "related": [
      "LDL",
      "HDL",
      "triglycerides"
    ]
  },
  {
    "term": "chronic",
    "plain": "long-lasting, or ongoing",
    "showBoth": "first-use",
    "reason": "Often heard as 'severe'. It describes duration.",
    "category": "general",
    "related": [
      "acute"
    ]
  },
  {
    "term": "contraindication",
    "plain": "a reason this treatment is not safe for you",
    "showBoth": "plain-only",
    "reason": "A word with no everyday equivalent that readers guess at. Never show it.",
    "category": "medication"
  },
  {
    "term": "diastolic",
    "plain": "the pressure between heartbeats — the lower of the two blood pressure numbers",
    "showBoth": "always",
    "reason": "The reader's own record shows the clinical word, so both are needed to match them up.",
    "category": "cardio",
    "related": [
      "systolic",
      "blood pressure"
    ]
  },
  {
    "term": "eGFR",
    "plain": "an estimate of how well your kidneys are filtering",
    "showBoth": "always",
    "reason": "Appears on results with no explanation. The word 'estimated' matters and should never be dropped.",
    "category": "labs"
  },
  {
    "term": "false positive",
    "plain": "a result that says something was found when it was not there",
    "showBoth": "first-use",
    "reason": "Essential for interpreting any screening result honestly, and impossible to explain after the fact if the first screen did not mention it.",
    "category": "general",
    "related": [
      "screening"
    ]
  },
  {
    "term": "fasting",
    "plain": "not eating or drinking anything except water for a set time before a test",
    "showBoth": "first-use",
    "reason": "Readers frequently assume water is included. Say the time and say that water is allowed.",
    "category": "labs"
  },
  {
    "term": "HbA1c",
    "plain": "your average blood sugar over about the last three months",
    "showBoth": "always",
    "reason": "One of the most common results a consumer app displays and one of the least understood. Also flag that it is reported in two different units worldwide.",
    "category": "labs",
    "related": [
      "mmol/mol",
      "reference range"
    ]
  },
  {
    "term": "HDL",
    "plain": "one of the types of cholesterol measured in a blood test",
    "showBoth": "always",
    "reason": "Frequently described to readers as 'good cholesterol'. Avoid that shorthand: it invites the reader to treat one number as a verdict.",
    "category": "labs",
    "related": [
      "LDL",
      "cholesterol"
    ]
  },
  {
    "term": "hypertension",
    "plain": "blood pressure that stays higher than the usual range",
    "showBoth": "first-use",
    "reason": "Frequently confused with 'tension' in the sense of stress.",
    "category": "cardio",
    "related": [
      "blood pressure"
    ]
  },
  {
    "term": "hypoglycaemia",
    "plain": "blood sugar that has dropped below the range you were given",
    "showBoth": "always",
    "reason": "Time-critical. The reader may already know it as 'a hypo', and both forms must be recognisable.",
    "category": "labs"
  },
  {
    "term": "in range",
    "plain": "inside the range this test uses for comparison",
    "showBoth": "plain-only",
    "reason": "The replacement for 'normal'. Always name whose range it is: a laboratory's range, a device maker's range, or a range a clinician set for this person.",
    "category": "results",
    "related": [
      "reference range"
    ]
  },
  {
    "term": "LDL",
    "plain": "one of the types of cholesterol measured in a blood test",
    "showBoth": "always",
    "reason": "Usually captioned 'bad cholesterol'. Same objection as HDL: it turns one number into a moral judgement.",
    "category": "labs",
    "related": [
      "HDL",
      "cholesterol"
    ]
  },
  {
    "term": "malignant",
    "plain": "cancer",
    "showBoth": "always",
    "reason": "Never soften this and never show it without a route to a person. See /docs/health/emergency-and-escalation.",
    "category": "results",
    "related": [
      "benign"
    ]
  },
  {
    "term": "mg/dL",
    "plain": "milligrams per decilitre — a unit used for blood test results",
    "showBoth": "always",
    "reason": "See mmol/L. Converting between the two is a correctness surface, not a display preference.",
    "category": "units",
    "related": [
      "mmol/L"
    ]
  },
  {
    "term": "mmol/L",
    "plain": "millimoles per litre — a unit used for blood test results",
    "showBoth": "always",
    "reason": "The same measurement is reported in mmol/L in some countries and mg/dL in others, and the numbers are not close. Never show a value without its unit.",
    "category": "units",
    "related": [
      "mg/dL"
    ]
  },
  {
    "term": "oedema",
    "plain": "swelling caused by fluid building up",
    "showBoth": "first-use",
    "reason": "Spelled two ways depending on country; the plain wording avoids the problem entirely.",
    "category": "general"
  },
  {
    "term": "out of range",
    "plain": "outside the range this test uses for comparison",
    "showBoth": "plain-only",
    "reason": "The replacement for 'abnormal'. It states a fact about a comparison and leaves the interpretation to whoever is entitled to make it.",
    "category": "results",
    "related": [
      "reference range",
      "in range"
    ]
  },
  {
    "term": "prognosis",
    "plain": "what is likely to happen next",
    "showBoth": "plain-only",
    "reason": "A word no component should ever need. If a product is showing a prognosis, a clinician wrote it.",
    "category": "general"
  },
  {
    "term": "reference range",
    "plain": "the range a test result is compared against",
    "showBoth": "always",
    "reason": "The most important term in this glossary. A reference range is a comparison, not a target, and it belongs to a laboratory or a device rather than to the reader. Always name whose range it is and never call it a normal range.",
    "category": "results",
    "related": [
      "in range",
      "out of range"
    ]
  },
  {
    "term": "remission",
    "plain": "a period when the signs of an illness have reduced or gone",
    "showBoth": "first-use",
    "reason": "Often heard as 'cured'. The plain wording keeps the distinction.",
    "category": "general"
  },
  {
    "term": "resting heart rate",
    "plain": "how many times your heart beats a minute when you are at rest",
    "showBoth": "first-use",
    "reason": "Understood as words but frequently confused with the heart rate shown during activity. Say when it was measured.",
    "category": "cardio",
    "related": [
      "tachycardia",
      "bradycardia"
    ]
  },
  {
    "term": "screening",
    "plain": "a test offered to people with no symptoms, to look for a possible problem early",
    "showBoth": "first-use",
    "reason": "Readers commonly assume a screening test is diagnostic. It is not, and the difference determines what the result means.",
    "category": "general",
    "related": [
      "false positive"
    ]
  },
  {
    "term": "SpO2",
    "plain": "an estimate of how much oxygen your blood is carrying",
    "showBoth": "always",
    "reason": "Shown by consumer devices as a bare percentage. The word 'estimate' is not optional: the measurement is affected by movement, cold hands and skin tone, and the product must say so.",
    "category": "cardio"
  },
  {
    "term": "systolic",
    "plain": "the pressure while your heart beats — the higher of the two blood pressure numbers",
    "showBoth": "always",
    "reason": "See diastolic.",
    "category": "cardio",
    "related": [
      "diastolic",
      "blood pressure"
    ]
  },
  {
    "term": "tachycardia",
    "plain": "a faster than usual heart rate",
    "showBoth": "first-use",
    "reason": "Appears in device output with no explanation and reliably alarms people.",
    "category": "cardio",
    "related": [
      "bradycardia"
    ]
  },
  {
    "term": "titration",
    "plain": "changing a dose in small steps until it is right for you",
    "showBoth": "plain-only",
    "reason": "No everyday equivalent; the plain wording is complete on its own.",
    "category": "medication"
  },
  {
    "term": "triglycerides",
    "plain": "a type of fat measured in a blood test",
    "showBoth": "always",
    "reason": "Appears on the same report as cholesterol and is routinely mistaken for it.",
    "category": "labs",
    "related": [
      "cholesterol"
    ]
  }
]

/** Words banned across the system, with the replacement and the reason. */
export const BANNED_WORDS: GeneratedBannedWord[] = [
  {
    "word": "abnormal",
    "instead": "outside the usual range",
    "reason": "The counterpart of the same problem, and the version that frightens people."
  },
  {
    "word": "bad",
    "instead": "the specific finding, stated plainly",
    "reason": "Carries a verdict the system is not entitled to give."
  },
  {
    "word": "diagnosis",
    "instead": "say what the reading is and who can interpret it",
    "reason": "opsinjs components never diagnose. Using the word implies they do."
  },
  {
    "word": "don't worry",
    "instead": "state what the reading means and what happens next",
    "reason": "Reassurance the system cannot back up, and it reads as a reason to worry."
  },
  {
    "word": "failed",
    "instead": "outside the range we expected",
    "reason": "A reading is not a test the reader sat."
  },
  {
    "word": "just",
    "instead": "delete it",
    "reason": "'Just a bit high' minimises a reading the reader may need to act on."
  },
  {
    "word": "negative",
    "instead": "the test did not find <what it looked for>",
    "reason": "Same collision, in the other direction."
  },
  {
    "word": "normal",
    "instead": "in the usual range, or the expected range for you",
    "reason": "Outside a reference range is not abnormal in the everyday sense of the word, and inside one is not a clean bill of health. 'Normal' also carries a judgement about the person rather than about the reading. This word is banned outright across the system, including in code identifiers."
  },
  {
    "word": "poor",
    "instead": "lower than the range for you",
    "reason": "Judges the person, not the measurement."
  },
  {
    "word": "positive",
    "instead": "the test found <what it found>",
    "reason": "In everyday English 'positive' means good news. In a test result it usually means the opposite, and the collision is dangerous."
  }
]

/**
 * How severe a warning is. The three classes and their sentences are declared in
 * `tokens/errors.json`'s own `policy.severity` block, not here.
 */
export type GeneratedErrorSeverity = "safety" | "correctness" | "hygiene"

/** One development-mode warning code, as authored in `tokens/errors.json`. */
export interface GeneratedErrorCode {
  /** The stable code, `OPSIN-NNNN`. Permanent: never reused, never renumbered. */
  code: string
  severity: GeneratedErrorSeverity
  /** One line naming the mistake, for a table a reader scans by eye. */
  title: string
  /**
   * The message template. `{name}` spans are filled at runtime by
   * `warnOnce()` in `lib/opsinjs.ts`, which carries its own copy of this table
   * because it is the file `shadcn add` copies into a consumer's project.
   */
  message: string
  /** The docs page that prevents the mistake: a page id, no leading slash. */
  docs: string
  /** The `{name}` spans in `message`, first appearance first. */
  params: string[]
}

/**
 * Every code the system can emit, in allocation order.
 *
 * The scheme is flat - `OPSIN-0001` upwards - and deliberately not grouped
 * into ranges: see `content/docs/project/decisions/0015-error-codes-are-flat.mdx`.
 */
export const OPSIN_ERROR_CODES: GeneratedErrorCode[] = [
  {
    "code": "OPSIN-0001",
    "severity": "safety",
    "title": "Both a category and a status were given to one surface",
    "message": "<{component}> received both `category=\"{category}\"` and `status=\"{status}\"`. A surface carries one axis. Set the category on the surface and render the status as a StatusPill inside it.",
    "docs": "health/two-colour-axes",
    "params": [
      "component",
      "category",
      "status"
    ]
  },
  {
    "code": "OPSIN-0002",
    "severity": "safety",
    "title": "A status was rendered without a word",
    "message": "<{component}> has `status=\"{status}\"` and no accessible label. Status is carried by colour, icon and word together; colour alone does not survive grayscale, colour-vision deficiency or a black-and-white printout.",
    "docs": "health/clinical-status-semantics",
    "params": [
      "component",
      "status"
    ]
  },
  {
    "code": "OPSIN-0003",
    "severity": "safety",
    "title": "A value was rendered without a unit",
    "message": "<Value> received `{value}` with no `unit`. A bare number in a health context is ambiguous between unit systems: the same digits are one reading in mmol/L and a very different one in mg/dL, and nothing on the surface tells the reader which was meant. Pass the unit the reading was measured in.",
    "docs": "health/unit-systems",
    "params": [
      "value"
    ]
  },
  {
    "code": "OPSIN-0004",
    "severity": "safety",
    "title": "A reference range was rendered without a source",
    "message": "<{component}> was given a `range` with no `rangeSource`. Name whose range it is — a laboratory, a device maker, or a clinician — because a range is a comparison somebody chose and not a fact about the reader.",
    "docs": "health/reference-ranges",
    "params": [
      "component"
    ]
  },
  {
    "code": "OPSIN-0005",
    "severity": "safety",
    "title": "More than one urgent surface on a screen",
    "message": "{count} surfaces on this screen have `status=\"urgent\"`. The escalation budget is one. When everything is urgent, nothing is.",
    "docs": "health/alarm-fatigue",
    "params": [
      "count"
    ]
  },
  {
    "code": "OPSIN-0006",
    "severity": "safety",
    "title": "A banned word appeared in a component's copy",
    "message": "The string \"{text}\" contains \"{word}\", which this system does not use. Write \"{replacement}\" instead.",
    "docs": "content/plain-english-a-z",
    "params": [
      "text",
      "word",
      "replacement"
    ]
  },
  {
    "code": "OPSIN-0007",
    "severity": "safety",
    "title": "A health value was animated",
    "message": "<{component}> is animating a health value with `{token}`. A value that overshoots has displayed, for one frame, a number that is not true. Use `spring-calm`, or render the final value immediately.",
    "docs": "health/motion-in-health-ui",
    "params": [
      "component",
      "token"
    ]
  },
  {
    "code": "OPSIN-0008",
    "severity": "correctness",
    "title": "A raw colour value was passed where a token is required",
    "message": "<{component}> received `{prop}=\"{value}\"`. Components take a category or a status, never a colour. A raw value cannot be re-derived for dark mode, for Display-P3, or for a reader who has asked for more contrast.",
    "docs": "foundations/token-architecture",
    "params": [
      "component",
      "prop",
      "value"
    ]
  },
  {
    "code": "OPSIN-0009",
    "severity": "correctness",
    "title": "A primitive token was referenced from a component",
    "message": "`{token}` is a primitive-tier token. Components consume roles. Primitives may be re-tuned in a minor release; roles are covered by the versioning policy.",
    "docs": "foundations/token-architecture",
    "params": [
      "token"
    ]
  },
  {
    "code": "OPSIN-0010",
    "severity": "correctness",
    "title": "An unknown category was requested",
    "message": "`category=\"{category}\"` is not one of {known}. Adding a category means adding a ramp, not passing a new string.",
    "docs": "theming/category-palettes",
    "params": [
      "category",
      "known"
    ]
  },
  {
    "code": "OPSIN-0011",
    "severity": "correctness",
    "title": "`unknown` was used as a status level",
    "message": "`unknown` is the absence of an assertion, not a fifth level. Use it when there is no reading or no range; do not use it to mean 'probably fine'.",
    "docs": "health/uncertainty-and-staleness",
    "params": []
  },
  {
    "code": "OPSIN-0012",
    "severity": "correctness",
    "title": "A trend was drawn from too few points",
    "message": "<TrendSparkline> received {count} points and `minimumWindow` is {minimum}. Two readings are not a trend, and drawing one implies a direction the data does not support.",
    "docs": "health/trends-and-change",
    "params": [
      "count",
      "minimum"
    ]
  },
  {
    "code": "OPSIN-0013",
    "severity": "correctness",
    "title": "A chart's y-axis was truncated",
    "message": "<{component}> has `yAxisMin={min}` on a health value. Truncating the axis exaggerates change; a 2% move drawn across the full height of a card reads as a crisis.",
    "docs": "foundations/data-visualisation/chart-anatomy",
    "params": [
      "component",
      "min"
    ]
  },
  {
    "code": "OPSIN-0014",
    "severity": "correctness",
    "title": "Category colours were used as chart series colours",
    "message": "This chart is colouring {count} series from the category ramps. Category colours identify what a reading is about; using them for series turns an identity into an arbitrary label.",
    "docs": "foundations/data-visualisation/chart-colour",
    "params": [
      "count"
    ]
  },
  {
    "code": "OPSIN-0015",
    "severity": "correctness",
    "title": "A touch target is below the floor",
    "message": "<{component}> renders a {width}x{height} hit area. The floor is 44x44, applied to the hit area rather than to the visible box.",
    "docs": "accessibility/target-size-and-motor",
    "params": [
      "component",
      "width",
      "height"
    ]
  },
  {
    "code": "OPSIN-0016",
    "severity": "correctness",
    "title": "A stale reading was rendered as current",
    "message": "<{component}> was given a reading from {age} ago with no staleness treatment. A number with no time attached is read as 'now'.",
    "docs": "health/uncertainty-and-staleness",
    "params": [
      "component",
      "age"
    ]
  },
  {
    "code": "OPSIN-0017",
    "severity": "hygiene",
    "title": "More than three translucent surfaces are composited",
    "message": "{count} translucent material rungs are visible at once; the budget is 3. Beyond three the blur cost is measurable on mid-range devices and the backdrop is unreadable anyway.",
    "docs": "foundations/materials/performance-budget",
    "params": [
      "count"
    ]
  },
  {
    "code": "OPSIN-0018",
    "severity": "hygiene",
    "title": "A deprecated token was referenced",
    "message": "`{token}` was deprecated in {version} and is replaced by `{replacement}`. It will be removed in {removal}.",
    "docs": "project/deprecations",
    "params": [
      "token",
      "version",
      "replacement",
      "removal"
    ]
  },
  {
    "code": "OPSIN-0019",
    "severity": "hygiene",
    "title": "The token stylesheet was not loaded",
    "message": "`--opsin-tokens-generated` is not set on :root. app/tokens.generated.css has not been imported, or `pnpm run generate` has not run, and every component is falling back to authored defaults.",
    "docs": "theming/tailwind-v4",
    "params": []
  },
  {
    "code": "OPSIN-0020",
    "severity": "hygiene",
    "title": "Two theme providers are mounted",
    "message": "More than one theme provider is writing the `dark` class. Two providers race on first paint and produce a flash of the wrong theme.",
    "docs": "handbook/dark-mode",
    "params": []
  },
  {
    "code": "OPSIN-0021",
    "severity": "safety",
    "title": "A status outside the four levels was passed",
    "message": "<{component}> received `status=\"{status}\"`, which is not one of the four levels. The vocabulary is fixed at steady, watch, attention and urgent; a component that accepted a fifth would be inventing a verdict. Nothing was rendered.",
    "docs": "health/clinical-status-semantics",
    "params": [
      "component",
      "status"
    ]
  }
]

/** What a code promises, what it never does, and what each severity means. */
export const OPSIN_ERROR_POLICY: {
  format: string
  stability: string
  environment: string
  message: string
  severity: { name: GeneratedErrorSeverity; description: string }[]
} = {
  "format": "OPSIN-NNNN",
  "stability": "A code is permanent. It is never reused, never renumbered and never removed — a retired code is marked `retired: true` and keeps its row, because the code will outlive this release in somebody's log aggregator.",
  "environment": "Warnings are emitted in development only, once per offending call site, through console.warn. Nothing in this list throws, and nothing in this list is emitted in production: a health product must not be made to crash by a documentation-quality complaint.",
  "message": "Every message states what was passed, why it is wrong, and the one thing to do instead. A message that only says what is wrong makes the reader search this table, which is a worse version of putting the answer in the message.",
  "severity": [
    {
      "name": "safety",
      "description": "A defect that can mislead a reader about their own health. Treat as a bug, not as a lint warning."
    },
    {
      "name": "correctness",
      "description": "The component will render something, but not what the author meant."
    },
    {
      "name": "hygiene",
      "description": "Works today, will not survive an upgrade."
    }
  ]
}
