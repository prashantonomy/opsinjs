/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source:    tokens/*.json
 * Generator: scripts/build-tokens.mts   (`pnpm run generate`)
 * Gate:      `pnpm check:generated` regenerates this file and fails on a diff.
 *
 * This is the committed placeholder: valid, typed, and empty. A clean clone
 * typechecks against it, every generated token table renders `<NoDataYet>`
 * naming the script that will fill it, and nothing anywhere prints a number
 * that nobody measured.
 *
 * SHAPE CONTRACT for scripts/build-tokens.mts — the generator must emit exactly
 * these exports, in this shape, because `lib/tokens.ts` is typed against them
 * and `app/tokens.generated.css` is emitted from the same pass:
 *
 *   TokenNamespace, TokenTier, GeneratedToken   the types below, verbatim
 *   TOKENS        GeneratedToken[]              every token, in emit order
 *   TOKEN_META    { generatedAt, sourceHash, count, namespaces }
 *
 * `sourceHash` is a hash of the `tokens/` directory and is also written into
 * `--opsin-tokens-generated` in the CSS, so a browser and a build can be
 * compared without guessing which one is stale.
 */

/** Which token source file a token came from. One namespace per file in `tokens/`. */
export type TokenNamespace = "color" | "material" | "motion" | "type" | "space" | "shape"

/**
 * The three tiers from /docs/foundations/token-architecture.
 *
 *   primitive  a raw value on a scale — `--opsin-category-heart-600`. May be
 *              re-tuned in a minor release. Components must never reference one.
 *   semantic   a role — `--opsin-status-urgent-ink`. Covered by the versioning
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
  /** The light-mode value, as it appears in CSS. */
  value: string
  /** The dark-mode value, when the token has one. */
  darkValue?: string
  /** The Display-P3 enhancement, emitted inside `@media (color-gamut: p3)`. */
  p3Value?: string
  /** What this token controls — the second column of every token table. */
  description: string
  /**
   * Which components and pages consume it. The THIRD column, and the one that
   * turns a token list into a decision aid: a reader can see that changing this
   * value changes RangeBar and nothing else.
   */
  usedBy: string[]
  deprecated?: { since: string; replacement: string; removal: string }
}

export const TOKENS: GeneratedToken[] = []

export const TOKEN_META: {
  generatedAt: string | null
  sourceHash: string
  count: number
  namespaces: TokenNamespace[]
} = {
  generatedAt: null,
  sourceHash: "placeholder",
  count: 0,
  namespaces: [],
}
