/**
 * The accent layer, read once and shared (ADR 0029).
 *
 * `tokens/accent.json` declares three accent themes, normal, vibes and stryk,
 * each defining the same nine named accents in both modes. Two scripts read it,
 * and they must agree on every value and every pair, so the reading lives here:
 *
 *   scripts/build-tokens.mts    emits the default accent as tokens, the
 *                               attribute blocks into @opsinjs/tokens's
 *                               tokens.css, the accent themes as data in its
 *                               src/accents.ts, and REFUSES to emit a value that fails its floor
 *                               or an accent hue too near a status hue. That
 *                               refusal is what makes `pnpm check` fail in CI.
 *   scripts/check-contrast.mts  measures the same pairs and publishes the
 *                               figures in lib/generated/accents.json, which the
 *                               reference page is generated from.
 *
 * Erasable syntax only, because node runs this file by stripping its types.
 */

import { readFileSync } from "node:fs"

/** What a pair is for. Only two uses exist here: no accent role carries large text. */
export type AccentUse = "body" | "nonText"

/** The floors a theme is held to. `standard` is the system floor; `enhanced` is stryk's. */
export type AccentFloorName = "standard" | "enhanced"

export const ACCENT_FLOORS: Record<AccentFloorName, Record<AccentUse, { apca: number; wcag: number }>> = {
  /* The published opsinjs floor, the same numbers packages/color/src/apca.ts and
     packages/color/src/wcag.ts export, restated here so this module needs no import. */
  standard: {
    body: { apca: 75, wcag: 4.5 },
    nonText: { apca: 45, wcag: 3 },
  },
  /* stryk's promise: every label clears WCAG 2.2 AAA (SC 1.4.6, 7:1) and APCA
     Lc 85, and every boundary and ring clears 4.5:1 and Lc 60. */
  enhanced: {
    body: { apca: 85, wcag: 7 },
    nonText: { apca: 60, wcag: 4.5 },
  },
}

export interface AccentRole {
  /** The role's key in tokens/accent.json, such as `actionForeground`. */
  id: string
  /** `--opsin-accent-action-foreground`. */
  cssVar: string
  /** The product role packages/react/styles/roles.css points at it, such as `--primary-foreground`. */
  productRole: string
  use: string
}

export type AccentMode = "light" | "dark"

export interface AccentEntry {
  /** Role id to a literal CSS colour: an oklch() value or `transparent`. */
  light: Record<string, string>
  dark: Record<string, string>
}

export interface AccentTheme {
  id: string
  label: string
  isDefault: boolean
  defaultAccent: string
  floors: AccentFloorName
  summary: string
  prefersContrastMore: boolean
  /** `--opsin-chrome-*` to a literal, per mode. Empty for a theme that keeps the chrome. */
  chrome: Record<AccentMode, Record<string, string>>
  borderFocus?: string
  flattenMaterials: boolean
  accents: Map<string, AccentEntry>
}

export interface AccentPlan {
  roles: AccentRole[]
  order: string[]
  labels: Record<string, string>
  hues: Record<string, number | null>
  themes: AccentTheme[]
  themeAttribute: string
  accentAttribute: string
  statusHues: number[]
  minimumHueDistance: number
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }
type JsonObject = { [key: string]: Json }

function isObject(node: unknown): node is JsonObject {
  return typeof node === "object" && node !== null && !Array.isArray(node)
}

function kebab(input: string): string {
  return input.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}

export function readAccentSource(file: string): JsonObject | undefined {
  let text: string
  try {
    text = readFileSync(file, "utf8")
  } catch {
    return undefined
  }
  const parsed: unknown = JSON.parse(text)
  return isObject(parsed) ? parsed : undefined
}

/**
 * Builds the typed plan. `neutral` resolves a ladder step such as `neutral-950`
 * to its literal colour; the caller owns where the ladder comes from. Any value
 * that is neither a step, `transparent`, nor an oklch() literal is an error,
 * because a value this module cannot read is a value nobody can measure.
 */
export function buildAccentPlan(
  source: JsonObject,
  neutral: (step: string) => string | undefined,
): AccentPlan {
  const errors: string[] = []
  const naming = isObject(source.cssNaming) ? source.cssNaming : {}
  const prefix = typeof naming.prefix === "string" ? naming.prefix : "--opsin-accent-"
  const rules = isObject(source.rules) ? source.rules : {}
  const rolesSource = isObject(source.roles) ? source.roles : {}
  const accentsSource = isObject(source.accents) ? source.accents : {}
  const themesSource = isObject(source.themes) ? source.themes : {}

  const roles: AccentRole[] = Object.entries(rolesSource)
    .filter(([key]) => !key.startsWith("$"))
    .map(([id, node]) => {
      const entry = isObject(node) ? node : {}
      return {
        id,
        cssVar: `${prefix}${kebab(id)}`,
        productRole: typeof entry.productRole === "string" ? entry.productRole : "",
        use: typeof entry.use === "string" ? entry.use : "",
      }
    })

  const order = Array.isArray(accentsSource.order)
    ? accentsSource.order.filter((value): value is string => typeof value === "string")
    : []
  const labels: Record<string, string> = {}
  const hues: Record<string, number | null> = {}
  for (const id of order) {
    const node = accentsSource[id]
    const entry = isObject(node) ? node : {}
    labels[id] = typeof entry.label === "string" ? entry.label : id
    hues[id] = typeof entry.hue === "number" ? entry.hue : null
  }

  const resolve = (raw: Json | undefined, where: string): string => {
    if (typeof raw !== "string") {
      errors.push(`${where} is missing`)
      return "transparent"
    }
    if (raw === "transparent") return raw
    if (raw.startsWith("oklch(")) return raw
    const literal = neutral(raw)
    if (literal === undefined) {
      errors.push(`${where} is "${raw}", which is not a neutral step, transparent or an oklch() literal`)
      return "transparent"
    }
    return literal
  }

  const themes: AccentTheme[] = []
  for (const [id, node] of Object.entries(themesSource)) {
    if (id.startsWith("$") || !isObject(node)) continue
    const accentNodes = isObject(node.accents) ? node.accents : {}
    const accents = new Map<string, AccentEntry>()
    for (const accent of order) {
      const accentNode = accentNodes[accent]
      if (!isObject(accentNode)) {
        errors.push(`themes.${id}.accents.${accent} is missing; every theme defines all nine`)
        continue
      }
      const entry: AccentEntry = { light: {}, dark: {} }
      for (const mode of ["light", "dark"] as const) {
        const values = isObject(accentNode[mode]) ? (accentNode[mode] as JsonObject) : {}
        for (const role of roles) {
          entry[mode][role.id] = resolve(values[role.id], `themes.${id}.accents.${accent}.${mode}.${role.id}`)
        }
      }
      accents.set(accent, entry)
    }

    const chrome: Record<AccentMode, Record<string, string>> = { light: {}, dark: {} }
    const chromeNode = isObject(node.chrome) ? node.chrome : undefined
    if (chromeNode) {
      for (const mode of ["light", "dark"] as const) {
        const values = isObject(chromeNode[mode]) ? (chromeNode[mode] as JsonObject) : {}
        for (const [role, raw] of Object.entries(values)) {
          chrome[mode][`--opsin-chrome-${kebab(role)}`] = resolve(raw, `themes.${id}.chrome.${mode}.${role}`)
        }
      }
    }
    const overrides = isObject(node.overrides) ? node.overrides : {}
    const floors = node.floors === "enhanced" ? "enhanced" : "standard"
    const defaultAccent = typeof node.defaultAccent === "string" ? node.defaultAccent : order[0] ?? ""
    if (!order.includes(defaultAccent)) errors.push(`themes.${id}.defaultAccent "${defaultAccent}" is not one of the nine`)

    themes.push({
      id,
      label: typeof node.label === "string" ? node.label : id,
      isDefault: node.default === true,
      defaultAccent,
      floors,
      summary: typeof node.summary === "string" ? node.summary : "",
      prefersContrastMore: node.prefersContrastMore === true,
      chrome,
      borderFocus: typeof overrides.borderFocus === "string" ? overrides.borderFocus : undefined,
      flattenMaterials: overrides.flattenMaterials === true,
      accents,
    })
  }

  if (themes.filter((theme) => theme.isDefault).length !== 1) {
    errors.push("exactly one accent theme must be marked `default: true`")
  }
  if (themes.filter((theme) => theme.prefersContrastMore).length > 1) {
    errors.push("at most one accent theme may answer prefers-contrast: more")
  }

  if (errors.length > 0) {
    throw new Error(["tokens/accent.json cannot be read:", ...errors.map((line) => `  ${line}`)].join("\n"))
  }

  return {
    roles,
    order,
    labels,
    hues,
    themes,
    themeAttribute: typeof naming.themeAttribute === "string" ? naming.themeAttribute : "data-accent-theme",
    accentAttribute: typeof naming.accentAttribute === "string" ? naming.accentAttribute : "data-accent",
    statusHues: Array.isArray(rules.statusHues)
      ? rules.statusHues.filter((value): value is number => typeof value === "number")
      : [],
    minimumHueDistance: typeof rules.minimumHueDistance === "number" ? rules.minimumHueDistance : 0,
  }
}

/** The theme a page renders when it sets no attribute. */
export function defaultTheme(plan: AccentPlan): AccentTheme {
  const found = plan.themes.find((theme) => theme.isDefault) ?? plan.themes[0]
  if (!found) throw new Error("tokens/accent.json declares no accent theme")
  return found
}

/** An accent hue nearer a status hue than the rule allows. */
export function hueViolations(plan: AccentPlan): string[] {
  const problems: string[] = []
  for (const accent of plan.order) {
    const hue = plan.hues[accent]
    if (hue === null || hue === undefined) continue
    for (const status of plan.statusHues) {
      const raw = Math.abs(hue - status) % 360
      const distance = Math.min(raw, 360 - raw)
      if (distance < plan.minimumHueDistance) {
        problems.push(
          `${accent} sits at hue ${hue}, ${distance} degrees from the status hue ${status}; ` +
            `an accent keeps at least ${plan.minimumHueDistance} degrees from every status hue.`,
        )
      }
    }
  }
  return problems
}

export interface AccentPairSpec {
  /** `vibes.volt.light.action-foreground-on-action`. */
  id: string
  theme: string
  accent: string
  mode: AccentMode
  /** `action-foreground-on-action`. */
  key: string
  /** "the action label on the action fill". */
  pair: string
  use: AccentUse
  floors: AccentFloorName
  foreground: string
  background: string
  /**
   * Outside the floor's scope because something else carries the mark: a fill
   * that an edge bounds. Measured and published, never gated.
   */
  exempt: boolean
}

/** The page and the card a theme's accent lands on, per mode. */
function grounds(theme: AccentTheme, mode: AccentMode, base: Record<AccentMode, { page: string; card: string }>) {
  return {
    page: theme.chrome[mode]["--opsin-chrome-background"] ?? base[mode].page,
    card: theme.chrome[mode]["--opsin-chrome-card"] ?? base[mode].card,
  }
}

/**
 * Every pair an accent has to clear, for every theme, accent and mode. `base`
 * is the chrome page and card a theme with no chrome of its own sits on.
 */
export function accentPairs(
  plan: AccentPlan,
  base: Record<AccentMode, { page: string; card: string }>,
): AccentPairSpec[] {
  const pairs: AccentPairSpec[] = []
  for (const theme of plan.themes) {
    for (const accent of plan.order) {
      const entry = theme.accents.get(accent)
      if (!entry) continue
      for (const mode of ["light", "dark"] as const) {
        const roles = entry[mode]
        const ground = grounds(theme, mode, base)
        const push = (key: string, pair: string, use: AccentUse, foreground: string, background: string, exempt = false) => {
          pairs.push({
            id: `${theme.id}.${accent}.${mode}.${key}`,
            theme: theme.id,
            accent,
            mode,
            key,
            pair,
            use,
            floors: theme.floors,
            foreground,
            background,
            exempt,
          })
        }
        const action = roles.action ?? "transparent"
        const actionEdge = roles.actionEdge ?? "transparent"
        const fill = roles.fill ?? "transparent"
        const fillEdge = roles.fillEdge ?? "transparent"

        push("action-foreground-on-action", "the action label on the action fill", "body", roles.actionForeground ?? "", action)
        push("action-foreground-on-hover", "the action label on the hover fill", "body", roles.actionForeground ?? "", roles.actionHover ?? "")
        push("action-foreground-on-press", "the action label on the press fill", "body", roles.actionForeground ?? "", roles.actionPress ?? "")
        push("action-on-page", "the action fill on the page", "nonText", action, ground.page, actionEdge !== "transparent")
        push("action-on-card", "the action fill on a card", "nonText", action, ground.card, actionEdge !== "transparent")
        if (actionEdge !== "transparent") {
          push("action-edge-on-page", "the action rim on the page", "nonText", actionEdge, ground.page)
          push("action-edge-on-card", "the action rim on a card", "nonText", actionEdge, ground.card)
        }
        push("fill-foreground-on-fill", "a tick or a label on the accent fill", "body", roles.fillForeground ?? "", fill)
        push("fill-on-page", "the accent fill on the page", "nonText", fill, ground.page, fillEdge !== "transparent")
        push("fill-on-card", "the accent fill on a card", "nonText", fill, ground.card, fillEdge !== "transparent")
        if (fillEdge !== "transparent") {
          push("fill-edge-on-page", "the accent rim on the page", "nonText", fillEdge, ground.page)
          push("fill-edge-on-card", "the accent rim on a card", "nonText", fillEdge, ground.card)
        }
        push("ink-on-page", "accent text on the page", "body", roles.ink ?? "", ground.page)
        push("ink-on-card", "accent text on a card", "body", roles.ink ?? "", ground.card)
        push("ring-on-page", "the focus ring on the page", "nonText", roles.ring ?? "", ground.page)
        push("ring-on-card", "the focus ring on a card", "nonText", roles.ring ?? "", ground.card)
      }
    }
  }
  return pairs
}
