/**
 * The typed read model over the generated token map.
 *
 * Every token table, the `/tokens` browser, `<TokenTable>`, `<TokenSwatch>` and
 * the generated reference pages read through here. Nothing hand-writes a token
 * value anywhere in the application, and nothing imports
 * `lib/generated/tokens.ts` directly, so the day the generated shape changes
 * there is one file to fix.
 *
 * Relative `.ts` imports and erasable syntax only: the scripts import this.
 */

import type {
  GeneratedToken,
  TokenNamespace,
  TokenTier,
} from "./generated/tokens.ts"
import { TOKENS, TOKEN_META } from "./generated/tokens.ts"
import { formatHex, parseColor } from "./color/oklch.ts"

export type { GeneratedToken, TokenNamespace, TokenTier }

export const TOKEN_NAMESPACES: TokenNamespace[] = [
  "color",
  "material",
  "motion",
  "type",
  "space",
  "shape",
]

export const TOKEN_NAMESPACE_LABELS: Record<TokenNamespace, string> = {
  color: "Colour",
  material: "Materials",
  motion: "Motion",
  type: "Typography",
  space: "Space and density",
  shape: "Shape",
}

export const TOKEN_TIER_LABELS: Record<TokenTier, string> = {
  primitive: "Primitive",
  semantic: "Semantic",
  component: "Component",
}

export const TOKEN_TIER_DESCRIPTIONS: Record<TokenTier, string> = {
  primitive:
    "A raw value on a scale. May be re-tuned in a minor release. A component that references one has taken a dependency the versioning policy does not cover.",
  semantic:
    "A role: what the value is FOR. This is the tier components consume, and the tier semver covers.",
  component:
    "Scoped to one component's internals. Documented on that component's page, not here.",
}

/**
 * Whether the generated layer has actually been produced.
 *
 * Everything that renders a token table checks this first and shows
 * `<NoDataYet script="build-tokens.mts" />` when it is false, rather than an
 * empty table that reads as "there are no tokens".
 */
export function tokensAreGenerated(): boolean {
  return TOKEN_META.generatedAt !== null && TOKENS.length > 0
}

export function tokenMeta() {
  return TOKEN_META
}

export function getTokens(): GeneratedToken[] {
  return TOKENS
}

export function getToken(name: string): GeneratedToken | undefined {
  const needle = name.replace(/^--opsin-/, "")
  return TOKENS.find((token) => token.name === needle || token.cssVar === name)
}

export function byNamespace(namespace: TokenNamespace): GeneratedToken[] {
  return TOKENS.filter((token) => token.namespace === namespace)
}

export function byTier(tier: TokenTier): GeneratedToken[] {
  return TOKENS.filter((token) => token.tier === tier)
}

/** Tokens grouped for a table: namespace → group → tokens, in emit order. */
export function grouped(
  namespace?: TokenNamespace
): { group: string; tokens: GeneratedToken[] }[] {
  const scope = namespace ? byNamespace(namespace) : TOKENS
  const groups: string[] = []
  for (const token of scope)
    if (!groups.includes(token.group)) groups.push(token.group)
  return groups.map((group) => ({
    group,
    tokens: scope.filter((token) => token.group === group),
  }))
}

/**
 * Every token one component consumes. The query behind section 17 of a
 * component page, and the reason `usedBy` is populated at generation time
 * rather than inferred at render time.
 */
export function tokensUsedBy(component: string): GeneratedToken[] {
  return TOKENS.filter((token) => token.usedBy.includes(component))
}

/** Substring match over name, description and value. The `/tokens` browser's filter. */
export function searchTokens(
  query: string,
  tokens: GeneratedToken[] = TOKENS
): GeneratedToken[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return tokens
  return tokens.filter((token) =>
    [
      token.name,
      token.cssVar,
      token.description,
      token.value,
      token.group,
    ].some((field) => field.toLowerCase().includes(needle))
  )
}

export function deprecatedTokens(): GeneratedToken[] {
  return TOKENS.filter((token) => token.deprecated !== undefined)
}

/** The formats the `/tokens` and `/colors` browsers can copy a value in. */
export type TokenFormat = "oklch" | "display-p3" | "hex" | "var" | "class"

export const TOKEN_FORMAT_LABELS: Record<TokenFormat, string> = {
  oklch: "OKLCH",
  "display-p3": "Display-P3",
  hex: "Hex",
  var: "CSS variable",
  class: "Tailwind class",
}

/**
 * Render a token in one of the copyable formats.
 *
 * Two deliberate refusals. `hex` returns the authored value unchanged for
 * anything that is not a parseable colour, rather than producing a hex string
 * for a duration; and it is a LOSSY conversion for anything outside sRGB, which
 * is exactly why the colour browser shows the OKLCH value first and offers hex
 * second. `class` returns the Tailwind arbitrary-property form rather than
 * guessing a utility name — a wrong utility name copied out of documentation is
 * worse than an ugly correct one.
 */
export function formatToken(
  token: GeneratedToken,
  format: TokenFormat
): string {
  switch (format) {
    case "var":
      return `var(${token.cssVar})`
    case "class":
      return `[--opsin:${token.cssVar}]`
    case "display-p3":
      return token.p3Value ?? token.value
    case "hex": {
      const parsed = parseColor(token.value)
      return parsed ? formatHex(parsed) : token.value
    }
    case "oklch":
    default:
      return token.value
  }
}
