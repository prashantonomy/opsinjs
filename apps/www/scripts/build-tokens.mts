/**
 * build-tokens.mts - tokens/*.json to the CSS token layer, the typed token map,
 * the machine-readable glossary and the theme registry payload.
 *
 *   node scripts/build-tokens.mts            # write
 *   node scripts/build-tokens.mts --check    # write nothing; fail on drift
 *
 * WRITES
 *   app/tokens.generated.css               committed; @import-ed by app/globals.css
 *   lib/generated/tokens.ts                committed; lib/tokens.ts is the reader
 *   lib/generated/glossary.json            committed; data behind <Term> and the A-Z
 *   registry/generated/themes/opsinjs-default.json   a shadcn-spec registry:theme item
 *
 * NEVER WRITES app/globals.css. globals.css owns exactly one line about this
 * file - the @import - and the two are separately owned on purpose (addendum A7).
 *
 * THE CUSTOM-PROPERTY NAMES COME FROM THE SOURCE, NOT FROM THIS SCRIPT. Each
 * token file declares a `cssNaming` block - `--opsin-{axis}-{name}-{role}`,
 * `--opsin-material-{rung}-{property}`, `--opsin-text-{name}-size` and so on -
 * and the emitters below implement exactly those templates. Where a source key
 * already carries its own prefix (`ease-standard`, `duration-fast`,
 * `radius-xs`), the prefix is stripped before the template is applied, so
 * `easings["ease-standard"]` becomes `--opsin-ease-standard` and not
 * `--opsin-ease-ease-standard`.
 *
 * Multi-word names are kebab-cased: type.json's `largeTitle` becomes
 * `--opsin-text-large-title-size`. Every other custom property in the system is
 * kebab-case, and a single camelCase family would be the one nobody could guess.
 *
 * DETERMINISM. Every byte this script writes must be reproducible from the
 * sources alone: `pnpm check:generated` regenerates and then diffs. So there is
 * no timestamp anywhere in the output. Provenance is carried by a content hash
 * of tokens/*.json instead, which changes when - and only when - the source does.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/build-tokens.mts needs Node 24 or newer.",
      `  You are on Node ${process.versions.node}.`,
      "",
      "  These scripts are plain .mts run by node itself - no tsx, no ts-node -",
      "  which relies on native TypeScript type stripping. That is a Node 24",
      "  baseline, and it is why engines.node is >=24.0.0 in both package.json",
      "  files. Install Node 24 (nvm install 24) and run this again.",
      "",
    ].join("\n"),
  )
  process.exit(1)
}

import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const TOKENS_DIR = join(APP_DIR, "tokens")
const OUT_CSS = join(APP_DIR, "app", "tokens.generated.css")
const OUT_TS = join(APP_DIR, "lib", "generated", "tokens.ts")
const OUT_GLOSSARY = join(APP_DIR, "lib", "generated", "glossary.json")

/**
 * The theme payload lands in registry/generated/, NOT in public/.
 *
 * Next serves public/ at the site root and a static file there beats a route
 * handler at the same path - verified on Next 16.3.4 by the author of
 * app/r/themes/[preset]/route.ts, who found that a file at public/r/themes/
 * silently prevents that route from ever running, taking the provenance
 * envelope with it. That route reads this directory first for exactly this
 * reason. Do not move this output into public/.
 */
const OUT_THEME = join(APP_DIR, "registry", "generated", "themes", "opsinjs-default.json")

const PREFIX = "--opsin-"

/**
 * Selector families. `.opsin-product` is the product theme scope: the (view)
 * routes and every <ComponentPreview> render under it, so a token declared only
 * on :root would be missing from precisely the surfaces this system exists for.
 */
const LIGHT_SELECTOR = ":root,\n.opsin-product"
const DARK_SELECTOR = ".dark,\n.opsin-product.dark"

/* ------------------------------------------------------------------ *
 * Types                                                               *
 * ------------------------------------------------------------------ */

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }
type JsonObject = { [key: string]: Json }

interface TokenLeaf {
  /** Dot path into its source file, for tracing a value back to the line that set it. */
  path: string
  /** The CSS custom property. */
  cssVar: string
  /** The family: category | status | neutral | material | ease | duration | radius | space | text ... */
  namespace: string
  /** Source file stem. */
  group: string
  /** Tier: `primitive` is a ramp step; `semantic` is what components consume. */
  tier: "primitive" | "semantic"
  /** Light-theme value as emitted. May be a var() reference. */
  value: string
  /** Literal value when `value` is a var() reference this script could resolve. */
  resolved?: string
  dark?: string
  darkResolved?: string
  p3?: string
  p3Dark?: string
  /** What this token controls. The column that turns a list into a decision aid. */
  description?: string
  /** The reduced-motion fallback, for tokens that have one. */
  reducedMotion?: string
}

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */

function readJson(file: string): JsonObject | undefined {
  let raw: string
  try {
    raw = readFileSync(file, "utf8")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined
    throw error
  }
  try {
    const parsed = JSON.parse(raw) as Json
    return isObject(parsed) ? parsed : undefined
  } catch (error) {
    console.error(`build-tokens: ${file} is not valid JSON - ${(error as Error).message}`)
    process.exit(1)
  }
}

function exists(file: string): boolean {
  try {
    statSync(file)
    return true
  } catch {
    return false
  }
}

function isObject(node: unknown): node is JsonObject {
  return typeof node === "object" && node !== null && !Array.isArray(node)
}

function obj(node: Json | undefined): JsonObject | undefined {
  return isObject(node) ? node : undefined
}

function arr(node: Json | undefined): JsonObject[] {
  return Array.isArray(node) ? node.filter(isObject) : []
}

function str(node: Json | undefined): string | undefined {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  return undefined
}

function num(node: Json | undefined): number | undefined {
  return typeof node === "number" ? node : undefined
}

/** Keys that are documentation rather than data. */
function isMetaKey(key: string): boolean {
  return key.startsWith("$")
}

/**
 * camelCase and snake_case to kebab-case. Numbers keep their own segment.
 *
 * A full stop becomes a hyphen. space.json has half-steps keyed `0.5`, `1.5`
 * and `2.5`, and `--opsin-space-0.5` is NOT a valid custom property: after
 * `--opsin-space-0` the `.5` is a fresh token, so a CSS parser reports
 * "Unexpected token Number" and the declaration is dropped — silently, which
 * is the worst outcome for a spacing token. Tailwind solves the same problem
 * by escaping the stop (`--spacing-0\.5`), but an escaped name has to be
 * escaped again at every `var()` call site, which is a trap in a token nobody
 * will look twice at. `--opsin-space-0-5` is plain, valid and greppable.
 */
function kebab(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_\s.]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
}

/** Strips a leading `<family>-` from a source key so a template is not applied twice. */
function unprefix(name: string, family: string): string {
  return name.startsWith(`${family}-`) ? name.slice(family.length + 1) : name
}

function writeIfChanged(file: string, contents: string): boolean {
  mkdirSync(dirname(file), { recursive: true })
  let current: string | undefined
  try {
    current = readFileSync(file, "utf8")
  } catch {
    current = undefined
  }
  if (current === contents) return false
  writeFileSync(file, contents, "utf8")
  return true
}

function q(value: string): string {
  return JSON.stringify(value)
}

/* ================================================================== *
 * Emitters, one per token file. Each implements that file's own       *
 * `cssNaming` templates.                                              *
 * ================================================================== */

/* ---------------------------- colour ------------------------------ */

/**
 * color.json carries two axes and a neutral ramp. Each chromatic ramp has eleven
 * primitive steps and four semantic roles, and the roles are a mapping onto
 * steps that differs between themes - `surface` is step 50 in light and step 900
 * in dark, `accent` is the design seed in light and step 400 in dark.
 *
 * Both tiers are emitted. Components consume roles; the steps exist because the
 * colour pages, <ColorScale> and the theme generator all need the whole ramp,
 * and because a role is only checkable against the step it claims to be.
 */
function emitColor(source: JsonObject, out: TokenLeaf[]): void {
  const roles = obj(source.roles)
  const mapping = obj(roles?.mapping)
  const roleOrder = Array.isArray(roles?.order)
    ? (roles.order as Json[]).map((entry) => String(entry))
    : ["surface", "line", "ink", "accent"]
  const definitions = obj(roles?.definitions) ?? {}
  const axisNames = obj(obj(source.cssNaming)?.axis) ?? {}

  /* The neutral ramp: theme-invariant absolute values. */
  const neutralSteps = obj(obj(source.neutral)?.steps)
  if (neutralSteps) {
    for (const [step, entry] of Object.entries(neutralSteps)) {
      if (isMetaKey(step)) continue
      const node = obj(entry)
      const value = str(node?.srgb)
      if (!value) continue
      out.push({
        path: `neutral.steps.${step}`,
        cssVar: `${PREFIX}neutral-${step}`,
        namespace: "neutral",
        group: "color",
        tier: "primitive",
        value,
        p3: str(node?.p3),
        description: `Neutral ramp, step ${step}.`,
      })
    }
  }

  /* The two chromatic axes, plus absence, which is emitted under the status
     axis so a component can switch on one variable name. It is deliberately not
     a fifth status level - see the note in color.json. */
  for (const section of ["categories", "status", "absence"]) {
    const group = obj(source[section])
    if (!group) continue
    const axis = str(axisNames[section]) ?? section

    for (const [name, entry] of Object.entries(group)) {
      if (isMetaKey(name)) continue
      const ramp = obj(entry)
      if (!ramp) continue
      const steps = obj(ramp.steps)
      const seed = obj(ramp.seed)
      const label = str(ramp.label) ?? str(ramp.word) ?? name
      const slug = kebab(name)

      if (steps) {
        for (const [step, stepEntry] of Object.entries(steps)) {
          if (isMetaKey(step)) continue
          const node = obj(stepEntry)
          const value = str(node?.srgb)
          if (!value) continue
          out.push({
            path: `${section}.${name}.steps.${step}`,
            cssVar: `${PREFIX}${axis}-${slug}-${step}`,
            namespace: axis,
            group: "color",
            tier: "primitive",
            value,
            p3: str(node?.p3),
            description: `${label} ramp, step ${step}.`,
          })
        }
      }

      const resolveRole = (theme: "light" | "dark"): Record<string, JsonObject | undefined> => {
        const themeMapping = obj(mapping?.[theme]) ?? {}
        const resolved: Record<string, JsonObject | undefined> = {}
        for (const role of roleOrder) {
          const target = themeMapping[role]
          const key = str(target)
          if (key === "seed") resolved[role] = seed
          else if (key !== undefined) resolved[role] = obj(steps?.[key])
        }
        return resolved
      }

      const light = resolveRole("light")
      const dark = resolveRole("dark")

      for (const role of roleOrder) {
        const lightNode = light[role]
        const value = str(lightNode?.srgb)
        if (!value) continue
        const darkNode = dark[role]
        out.push({
          path: `${section}.${name}.roles.${role}`,
          cssVar: `${PREFIX}${axis}-${slug}-${role}`,
          namespace: axis,
          group: "color",
          tier: "semantic",
          value,
          dark: str(darkNode?.srgb),
          p3: str(lightNode?.p3),
          p3Dark: str(darkNode?.p3),
          description: str(definitions[role]) ?? `${label}: the ${role} role.`,
        })
      }
    }
  }
}

/* --------------------------- material ----------------------------- */

/**
 * material.json's ladder is six named rungs. `tint` and `opaqueFallback` are
 * declared as custom-property NAMES rather than as values, so they are emitted
 * as var() references: the material layer is defined in terms of the neutral
 * ramp and stays correct when the ramp is re-tuned.
 */
function emitMaterial(source: JsonObject, out: TokenLeaf[]): void {
  for (const rung of arr(source.ladder)) {
    const name = str(rung.name)
    if (!name) continue
    const slug = kebab(name)
    const base = `${PREFIX}material-${slug}`
    const use = str(rung.use)
    const rungNumber = num(rung.rung)
    const label = `Rung ${rungNumber ?? "?"} (${name})`

    const push = (
      property: string,
      value: string | undefined,
      description: string,
      extra?: Partial<TokenLeaf>,
    ) => {
      if (value === undefined) return
      out.push({
        path: `ladder.${name}.${property}`,
        cssVar: `${base}-${property}`,
        namespace: "material",
        group: "material",
        tier: "semantic",
        value,
        description,
        ...extra,
      })
    }

    const asVar = (node: Json | undefined): string | undefined => {
      const text = str(node)
      if (text === undefined) return undefined
      return text.startsWith("--") ? `var(${text})` : text
    }

    const tint = obj(rung.tint)
    push("tint", asVar(tint?.light), `${label}: the tint over what is behind it. ${use ?? ""}`.trim(), {
      dark: asVar(tint?.dark),
    })
    push("tint-alpha", str(rung.tintAlpha), `${label}: how opaque that tint is.`)
    const blur = num(rung.blurPx)
    push("blur", blur === undefined ? undefined : `${blur}px`, `${label}: backdrop blur radius.`)
    push("saturation", str(rung.saturation), `${label}: backdrop saturation multiplier.`)
    push("border", str(rung.border), `${label}: the boundary.`)
    push("shadow", str(rung.shadow), `${label}: the shadow that separates it from what is behind.`)
    push(
      "scrim",
      str(rung.minScrimOpacity),
      `${label}: the minimum scrim opacity needed for text on this rung to clear the contrast floor.`,
    )
    const fallback = obj(rung.opaqueFallback)
    push(
      "opaque",
      asVar(fallback?.light),
      `${label}: the opaque substitute used under prefers-reduced-transparency and where backdrop-filter is unsupported.`,
      { dark: asVar(fallback?.dark) },
    )
  }
}

/* ---------------------------- motion ------------------------------ */

/**
 * Springs are sampled into a `linear()` easing by the token author, not here:
 * the spring parameters and the resulting stop list both live in motion.json, so
 * the curve a page plots and the curve the browser runs are the same numbers.
 *
 * Every token that declares a `reducedMotion` fallback has it emitted inside
 * `@media (prefers-reduced-motion: reduce)`, per the policy in motion.json. That
 * is per token rather than a global `animation: none` because a reader who asks
 * for reduced motion still needs to know that a value changed.
 */
function emitMotion(source: JsonObject, out: TokenLeaf[]): void {
  const springs = obj(source.springs) ?? {}
  for (const [name, entry] of Object.entries(springs)) {
    if (isMetaKey(name)) continue
    const spring = obj(entry)
    const easing = str(spring?.easing)
    const slug = kebab(unprefix(name, "ease"))
    const reduced = obj(spring?.reducedMotion)
    if (easing) {
      out.push({
        path: `springs.${name}.easing`,
        cssVar: `${PREFIX}ease-${slug}`,
        namespace: "ease",
        group: "motion",
        tier: "semantic",
        value: easing,
        description: str(spring?.use),
        reducedMotion: str(reduced?.easing),
      })
    }
    const duration = num(spring?.durationMs)
    if (duration !== undefined) {
      const reducedMs = num(reduced?.durationMs)
      out.push({
        path: `springs.${name}.durationMs`,
        cssVar: `${PREFIX}duration-${slug}`,
        namespace: "duration",
        group: "motion",
        tier: "semantic",
        value: `${duration}ms`,
        description: `Settle time for the ${name} spring, measured from its own parameters.`,
        reducedMotion: reducedMs === undefined ? undefined : `${reducedMs}ms`,
      })
    }
  }

  const easings = obj(source.easings) ?? {}
  for (const [name, entry] of Object.entries(easings)) {
    if (isMetaKey(name)) continue
    const easing = obj(entry)
    const value = str(easing?.value)
    if (!value) continue
    const reduced = obj(easing?.reducedMotion)
    out.push({
      path: `easings.${name}`,
      cssVar: `${PREFIX}ease-${kebab(unprefix(name, "ease"))}`,
      namespace: "ease",
      group: "motion",
      tier: "semantic",
      value,
      description: str(easing?.use),
      reducedMotion: str(reduced?.value),
    })
  }

  const durations = obj(source.durations) ?? {}
  for (const [name, entry] of Object.entries(durations)) {
    if (isMetaKey(name)) continue
    const duration = obj(entry)
    const ms = num(duration?.ms)
    if (ms === undefined) continue
    const reduced = obj(duration?.reducedMotion)
    const reducedMs = num(reduced?.ms)
    out.push({
      path: `durations.${name}`,
      cssVar: `${PREFIX}duration-${kebab(unprefix(name, "duration"))}`,
      namespace: "duration",
      group: "motion",
      tier: "semantic",
      value: `${ms}ms`,
      description: str(duration?.use),
      reducedMotion: reducedMs === undefined ? undefined : `${reducedMs}ms`,
    })
  }
}

/* ----------------------------- shape ------------------------------ */

function emitShape(source: JsonObject, out: TokenLeaf[]): void {
  const base = obj(source.base)
  const baseRem = num(base?.rem)
  if (baseRem !== undefined) {
    out.push({
      path: "base",
      cssVar: `${PREFIX}radius-base`,
      namespace: "radius",
      group: "shape",
      tier: "semantic",
      value: `${baseRem}rem`,
      description: "The one radius the whole ladder is derived from.",
    })
  }

  for (const rung of arr(source.ladder)) {
    const name = str(rung.name)
    const rem = num(rung.rem)
    if (!name || rem === undefined) continue
    out.push({
      path: `ladder.${name}`,
      cssVar: `${PREFIX}radius-${kebab(unprefix(name, "radius"))}`,
      namespace: "radius",
      group: "shape",
      tier: "semantic",
      value: `${rem}rem`,
      description: str(rung.use),
    })
  }

  const cornerShape = obj(source.cornerShape)
  const cornerValue = str(cornerShape?.value)
  if (cornerValue) {
    out.push({
      path: "cornerShape.value",
      cssVar: `${PREFIX}corner-shape`,
      namespace: "corner-shape",
      group: "shape",
      tier: "semantic",
      value: cornerValue,
      description: `The squircle curvature. Degrades to \`${str(cornerShape?.fallback) ?? "round"}\` where corner-shape is unsupported.`,
    })
  }

  const borders = obj(source.borders) ?? {}
  for (const [name, entry] of Object.entries(borders)) {
    if (isMetaKey(name)) continue
    const border = obj(entry)
    const px = num(border?.px)
    if (px === undefined) continue
    out.push({
      path: `borders.${name}.px`,
      cssVar: `${PREFIX}border-${kebab(name)}`,
      namespace: "border",
      group: "shape",
      tier: "semantic",
      value: `${px}px`,
      description: str(border?.use),
    })
    const offset = num(border?.offsetPx)
    if (offset !== undefined) {
      out.push({
        path: `borders.${name}.offsetPx`,
        cssVar: `${PREFIX}border-${kebab(name)}-offset`,
        namespace: "border",
        group: "shape",
        tier: "semantic",
        value: `${offset}px`,
        description: `Offset for the ${name} boundary.`,
      })
    }
  }
}

/* ----------------------------- space ------------------------------ */

function emitSpace(source: JsonObject, out: TokenLeaf[]): void {
  const scale = obj(source.scale) ?? {}
  for (const [step, entry] of Object.entries(scale)) {
    if (isMetaKey(step)) continue
    const node = obj(entry)
    const rem = num(node?.rem)
    if (rem === undefined) continue
    const px = num(node?.px)
    out.push({
      path: `scale.${step}`,
      cssVar: `${PREFIX}space-${kebab(step)}`,
      namespace: "space",
      group: "space",
      tier: "primitive",
      value: `${rem}rem`,
      description: str(node?.use) ?? (px === undefined ? undefined : `${px}px.`),
    })
  }

  const targets = obj(source.targets) ?? {}
  for (const [name, entry] of Object.entries(targets)) {
    if (isMetaKey(name)) continue
    const node = obj(entry)
    const rem = num(node?.rem)
    if (rem === undefined) continue
    out.push({
      path: `targets.${name}`,
      cssVar: `${PREFIX}target-${kebab(name)}`,
      namespace: "target",
      group: "space",
      tier: "semantic",
      value: `${rem}rem`,
      description: str(node?.use) ?? str(node?.standard),
    })
  }

  const gutters = obj(source.gutters) ?? {}
  for (const [mode, entry] of Object.entries(gutters)) {
    if (isMetaKey(mode)) continue
    const node = obj(entry)
    const px = num(node?.px)
    if (px === undefined) continue
    out.push({
      path: `gutters.${mode}`,
      cssVar: `${PREFIX}gutter-${kebab(mode)}`,
      namespace: "gutter",
      group: "space",
      tier: "semantic",
      value: `${px}px`,
      description: `The screen gutter in the ${mode} responsive mode.`,
    })
  }

  const measure = obj(source.measure) ?? {}
  for (const [name, entry] of Object.entries(measure)) {
    if (isMetaKey(name)) continue
    const node = obj(entry)
    const ch = num(node?.ch)
    if (ch === undefined) continue
    out.push({
      path: `measure.${name}`,
      cssVar: `${PREFIX}measure-${kebab(name)}`,
      namespace: "measure",
      group: "space",
      tier: "semantic",
      value: `${ch}ch`,
      description: str(node?.use),
    })
  }

  const safeArea = obj(source.safeArea) ?? {}
  for (const [edge, entry] of Object.entries(safeArea)) {
    if (isMetaKey(edge)) continue
    const value = str(entry)
    if (!value) continue
    out.push({
      path: `safeArea.${edge}`,
      cssVar: `${PREFIX}safe-${kebab(edge)}`,
      namespace: "safe",
      group: "space",
      tier: "semantic",
      value,
      description: `The ${edge} safe-area inset, for installed web apps where browser chrome does not protect the edge.`,
    })
  }
}

/* ------------------------------ type ------------------------------ */

function emitType(source: JsonObject, out: TokenLeaf[]): void {
  const family = obj(source.family) ?? {}
  for (const [name, entry] of Object.entries(family)) {
    if (isMetaKey(name)) continue
    const value = str(entry)
    if (!value) continue
    out.push({
      path: `family.${name}`,
      cssVar: `${PREFIX}font-${kebab(name)}`,
      namespace: "font",
      group: "type",
      tier: "semantic",
      value,
      description: `The ${name} family stack.`,
    })
  }

  for (const step of arr(source.scale)) {
    const name = str(step.name)
    if (!name) continue
    const slug = kebab(name)
    const use = str(step.use)
    const rem = num(step.rem)
    const leading = num(step.leading)
    const tracking = num(step.trackingEm)
    const weight = num(step.weight)

    const push = (property: string, value: string | undefined, description: string) => {
      if (value === undefined) return
      out.push({
        path: `scale.${name}.${property}`,
        cssVar: `${PREFIX}text-${slug}-${property}`,
        namespace: "text",
        group: "type",
        tier: "semantic",
        value,
        description,
      })
    }

    push("size", rem === undefined ? undefined : `${rem}rem`, use ?? `The ${name} step.`)
    push(
      "leading",
      leading === undefined ? undefined : String(leading),
      `Line height for ${name}, unitless so it scales with the size.`,
    )
    push(
      "tracking",
      tracking === undefined ? undefined : `${tracking}em`,
      `Letter spacing for ${name}.`,
    )
    push("weight", weight === undefined ? undefined : String(weight), `Font weight for ${name}.`)
  }

  const numerals = obj(source.numerals)
  const variantNumeric = str(numerals?.fontVariantNumeric)
  if (variantNumeric) {
    out.push({
      path: "numerals.fontVariantNumeric",
      cssVar: `${PREFIX}numerals`,
      namespace: "numerals",
      group: "type",
      tier: "semantic",
      value: variantNumeric,
      description:
        "Every component that renders a number sets this, so a changing value does not shift its own layout.",
    })
  }
}

/* ------------------------------------------------------------------ *
 * Glossary                                                            *
 * ------------------------------------------------------------------ */

interface GlossaryEntry {
  term: string
  plain: string
  definition?: string
  showBoth?: string
  reason?: string
  category?: string
  related?: string[]
}

interface BannedWord {
  word: string
  instead: string
  reason: string
}

function buildGlossary(source: JsonObject | undefined): {
  terms: GlossaryEntry[]
  banned: BannedWord[]
} {
  if (!source) return { terms: [], banned: [] }

  const terms: GlossaryEntry[] = []
  for (const row of arr(source.terms)) {
    const term = str(row.term)
    const plain = str(row.plain)
    if (!term || !plain) continue
    const related = Array.isArray(row.related)
      ? (row.related as Json[]).map((entry) => String(entry))
      : undefined
    terms.push({
      term,
      plain,
      definition: str(row.definition),
      showBoth: str(row.showBoth),
      reason: str(row.reason),
      category: str(row.category),
      related: related && related.length > 0 ? related : undefined,
    })
  }
  terms.sort((a, b) => a.term.localeCompare(b.term, "en"))

  const banned: BannedWord[] = []
  for (const row of arr(source.banned)) {
    const word = str(row.word)
    if (!word) continue
    banned.push({
      word,
      instead: str(row.instead) ?? "",
      reason: str(row.reason) ?? "",
    })
  }
  banned.sort((a, b) => a.word.localeCompare(b.word, "en"))

  return { terms, banned }
}

/* ------------------------------------------------------------------ *
 * CSS                                                                 *
 * ------------------------------------------------------------------ */

function cssBlock(selector: string, declarations: string[]): string {
  if (declarations.length === 0) return ""
  return `${selector} {\n${declarations.map((line) => `  ${line}`).join("\n")}\n}`
}

function indent(block: string): string {
  return block
    .split("\n")
    .map((line) => (line.length > 0 ? `  ${line}` : line))
    .join("\n")
}

function emitCss(tokens: TokenLeaf[], hash: string): string {
  const parts: string[] = [
    "/* GENERATED FILE - DO NOT EDIT.",
    " *",
    " * Source:    tokens/*.json",
    " * Generator: scripts/build-tokens.mts   (`pnpm run generate`)",
    " * Gate:      `pnpm check:generated` regenerates this file and fails on a diff.",
    " *",
    " * IMPORT POSITION IS LOAD-BEARING. app/globals.css must @import this file",
    " * AFTER its own authored opsinjs token layer and BEFORE the Display-P3",
    " * escalation. `:root` here and `:root` there have identical specificity, so",
    " * whichever is declared last wins, and these are the values derived from the",
    " * token source. The authored ones exist only so that a clean clone renders",
    " * before `pnpm generate` has run.",
    " *",
    " * Names come from each token file's own `cssNaming` block. Multi-word names",
    " * are kebab-cased: type.json's `largeTitle` is `--opsin-text-large-title-size`.",
    " *",
    " * No timestamp appears below, by design: the output has to be byte-identical",
    " * between runs or the drift gate would fail on every commit. Provenance is",
    " * the token source hash carried on --opsin-tokens-generated.",
    " */",
    "",
    "/* opsinjs:tokens:begin */",
    "",
  ]

  const light = [
    `${PREFIX}tokens-generated: ${hash};`,
    ...tokens.map((token) => `${token.cssVar}: ${token.value};`),
  ]
  parts.push(cssBlock(LIGHT_SELECTOR, light), "")

  const dark = tokens
    .filter((token) => token.dark !== undefined)
    .map((token) => `${token.cssVar}: ${token.dark};`)
  if (dark.length > 0) {
    parts.push(
      "/* The dark theme redeclares only what actually differs. A role whose value",
      "   is absent here is identical in both themes and is not a mistake. */",
      cssBlock(DARK_SELECTOR, dark),
      "",
    )
  }

  const p3Light = tokens
    .filter((token) => token.p3 !== undefined)
    .map((token) => `${token.cssVar}: ${token.p3};`)
  const p3Dark = tokens
    .filter((token) => token.p3Dark !== undefined)
    .map((token) => `${token.cssVar}: ${token.p3Dark};`)

  if (p3Light.length > 0 || p3Dark.length > 0) {
    const inner: string[] = []
    if (p3Light.length > 0) inner.push(indent(cssBlock(LIGHT_SELECTOR, p3Light)))
    if (p3Dark.length > 0) inner.push(indent(cssBlock(DARK_SELECTOR, p3Dark)))
    parts.push(
      "/* Display-P3 escalation: same hue, same lightness, more chroma. Measured",
      "   contrast is therefore unchanged - nothing about meaning changes with",
      "   gamut. Every class selector is repeated so the dark cascade survives:",
      "   `:root` and `.dark` have identical specificity, so a bare `:root` block",
      "   placed after the dark declarations would leak light chroma into dark. */",
      "@supports (color-gamut: p3) {",
      inner.join("\n\n"),
      "}",
      "",
    )
  }

  const reduced = tokens
    .filter((token) => token.reducedMotion !== undefined)
    .map((token) => `${token.cssVar}: ${token.reducedMotion};`)
  if (reduced.length > 0) {
    parts.push(
      "/* Reduced motion, per token rather than a global kill switch. A reader who",
      "   asks for reduced motion still needs to know that a value changed;",
      "   removing the cue entirely trades a vestibular problem for a comprehension",
      "   problem. Each token declares its own fallback in tokens/motion.json. */",
      "@media (prefers-reduced-motion: reduce) {",
      indent(cssBlock(LIGHT_SELECTOR, reduced)),
      "}",
      "",
    )
  }

  parts.push("/* opsinjs:tokens:end */")
  return `${parts.join("\n")}\n`
}

/* ------------------------------------------------------------------ *
 * TypeScript                                                          *
 * ------------------------------------------------------------------ */

function emitTs(
  tokens: TokenLeaf[],
  glossary: { terms: GlossaryEntry[]; banned: BannedWord[] },
  hash: string,
): string {
  /* The shape below is the contract declared in the committed placeholder that
     lib/tokens.ts is typed against. Field names differ from this script's
     internal ones in one place worth naming: `namespace` here is the SOURCE
     FILE (color, motion, space...) and `group` is the family within it (status,
     category, ladder), which is the order the token tables read in. */
  const namespaces = [...new Set(tokens.map((token) => token.group))]

  const rows = tokens
    .map((token) => {
      const fields = [
        `name: ${q(token.cssVar.replace(PREFIX, ""))}`,
        `cssVar: ${q(token.cssVar)}`,
        `namespace: ${q(token.group)}`,
        `tier: ${q(token.tier)}`,
        `group: ${q(token.namespace)}`,
        `value: ${q(token.value)}`,
      ]
      if (token.dark !== undefined) fields.push(`darkValue: ${q(token.dark)}`)
      if (token.p3 !== undefined) fields.push(`p3Value: ${q(token.p3)}`)
      if (token.p3Dark !== undefined) fields.push(`p3DarkValue: ${q(token.p3Dark)}`)
      fields.push(`description: ${q(token.description ?? describe(token))}`)
      fields.push("usedBy: []")
      if (token.resolved !== undefined) fields.push(`resolvedValue: ${q(token.resolved)}`)
      if (token.darkResolved !== undefined)
        fields.push(`darkResolvedValue: ${q(token.darkResolved)}`)
      if (token.reducedMotion !== undefined)
        fields.push(`reducedMotionValue: ${q(token.reducedMotion)}`)
      fields.push(`sourcePath: ${q(`${token.group}.json#${token.path}`)}`)
      return `  { ${fields.join(", ")} },`
    })
    .join("\n")

  return `/* eslint-disable */
/**
 * GENERATED FILE - DO NOT EDIT.
 *
 * Source:    tokens/*.json
 * Generator: scripts/build-tokens.mts   (\`pnpm run generate\`)
 * Gate:      \`pnpm check:generated\` regenerates this file and fails on a diff.
 *
 * lib/tokens.ts is the typed reader over this module; pages and MDX components
 * import that, never this. Editing a value here is not a change - it is a
 * conflict with tokens/*.json that the next \`pnpm generate\` deletes.
 *
 * WHY \`TOKEN_META.generatedAt\` IS NOT A TIMESTAMP. This file is guarded by a
 * byte-for-byte drift gate: CI regenerates it and fails on any diff. A build
 * time would therefore fail every run made on a different second from the
 * commit. It carries the token source hash instead - non-null once the
 * generator has actually run, and changing when, and only when, tokens/*.json
 * changes. \`tokensAreGenerated()\` reads it exactly as intended.
 */

/** Which token source file a token came from. One namespace per file in \`tokens/\`. */
export type TokenNamespace = "color" | "material" | "motion" | "type" | "space" | "shape"

/**
 * The three tiers from /docs/foundations/token-architecture.
 *
 *   primitive  a raw value on a scale - \`--opsin-category-heart-600\`. May be
 *              re-tuned in a minor release. Components must never reference one.
 *   semantic   a role - \`--opsin-status-urgent-ink\`. Covered by the versioning
 *              policy, which explicitly includes CSS custom properties.
 *   component  a token scoped to one component's internals.
 */
export type TokenTier = "primitive" | "semantic" | "component"

export interface GeneratedToken {
  /** The token's name without the prefix: \`status-urgent-ink\`. */
  name: string
  /** The full custom property: \`--opsin-status-urgent-ink\`. */
  cssVar: string
  namespace: TokenNamespace
  tier: TokenTier
  /** The sub-group within the namespace, for table headings: \`status\`, \`category\`, \`ladder\`. */
  group: string
  /** The light-mode value, as it appears in CSS. May be a \`var()\` reference. */
  value: string
  /** The dark-mode value, when the token has one. */
  darkValue?: string
  /** The Display-P3 enhancement, emitted inside \`@supports (color-gamut: p3)\`. */
  p3Value?: string
  /** The Display-P3 enhancement for the dark theme. */
  p3DarkValue?: string
  /** What this token controls - the second column of every token table. */
  description: string
  /**
   * Which components and pages consume it. The THIRD column, and the one that
   * turns a token list into a decision aid.
   *
   * Empty for every token today, and that is the honest answer rather than a
   * missing feature: nothing is built, so nothing consumes anything. The field
   * is populated from the component sources the moment the first one lands.
   */
  usedBy: string[]
  deprecated?: { since: string; replacement: string; removal: string }
  /** The literal behind \`value\` when it is a single \`var()\` reference. */
  resolvedValue?: string
  /** The literal behind \`darkValue\` when it is a \`var()\` reference. */
  darkResolvedValue?: string
  /** The value this token takes under \`prefers-reduced-motion: reduce\`. */
  reducedMotionValue?: string
  /** Where it was authored: \`color.json#status.urgent.roles.ink\`. */
  sourcePath?: string
}

/** One row of the clinical to plain-English glossary. */
export interface GeneratedGlossaryEntry {
  term: string
  plain: string
  definition?: string
  /** \`always\` | \`first-use\` | \`plain-only\` - when the clinical term must still appear. */
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
${rows}
]

export const TOKEN_META: {
  generatedAt: string | null
  sourceHash: string
  count: number
  namespaces: TokenNamespace[]
} = {
  generatedAt: ${q(hash)},
  sourceHash: ${q(hash)},
  count: ${tokens.length},
  namespaces: [${namespaces.map(q).join(", ")}] as TokenNamespace[],
}

/** The clinical to plain-English glossary, sorted A-Z. Mirrored in lib/generated/glossary.json. */
export const GLOSSARY: GeneratedGlossaryEntry[] = ${JSON.stringify(glossary.terms, null, 2)}

/** Words banned across the system, with the replacement and the reason. */
export const BANNED_WORDS: GeneratedBannedWord[] = ${JSON.stringify(glossary.banned, null, 2)}
`
}

/** A last-resort description, so the second column of a token table is never empty. */
function describe(token: TokenLeaf): string {
  return `The ${token.namespace} token ${token.cssVar.replace(PREFIX, "")}.`
}

/* ------------------------------------------------------------------ *
 * Theme registry item                                                 *
 * ------------------------------------------------------------------ */

function emitThemeItem(tokens: TokenLeaf[], hash: string): string {
  const strip = (name: string) => name.replace(/^--/, "")
  const light: Record<string, string> = {}
  const dark: Record<string, string> = {}
  for (const token of tokens) {
    light[strip(token.cssVar)] = token.resolved ?? token.value
    const darkValue = token.darkResolved ?? token.dark
    if (darkValue !== undefined) dark[strip(token.cssVar)] = darkValue
  }
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "opsinjs-default",
    type: "registry:theme",
    title: "opsinjs default theme",
    description:
      "The opsinjs token layer: category ramps, clinical status ramps, the material ladder, spring easings and the type, space and shape scales. Category colour and status colour are separate axes and never meet on one element.",
    meta: { generatedBy: "scripts/build-tokens.mts", tokenSourceHash: hash },
    cssVars: { light, dark },
  }
  return `${JSON.stringify(item, null, 2)}\n`
}

/* ------------------------------------------------------------------ *
 * Main                                                                *
 * ------------------------------------------------------------------ */

const EMITTERS: Record<string, (source: JsonObject, out: TokenLeaf[]) => void> = {
  color: emitColor,
  material: emitMaterial,
  motion: emitMotion,
  type: emitType,
  space: emitSpace,
  shape: emitShape,
}

/** Emission order. It is why the generated CSS reads colour, material, motion, type, space, shape. */
const TOKEN_FILES = ["color", "material", "motion", "type", "space", "shape"]

/** Resolves `var(--opsin-x)` to the literal it points at, so contrast can be measured. */
function resolveReferences(tokens: TokenLeaf[]): void {
  const byVar = new Map(tokens.map((token) => [token.cssVar, token]))
  const literal = (value: string | undefined, theme: "light" | "dark"): string | undefined => {
    if (value === undefined) return undefined
    const match = /^var\((--[a-z0-9-]+)\)$/i.exec(value.trim())
    if (!match) return undefined
    const target = byVar.get(match[1] as string)
    if (!target) return undefined
    const resolved = theme === "dark" ? (target.dark ?? target.value) : target.value
    return resolved.startsWith("var(") ? undefined : resolved
  }
  for (const token of tokens) {
    const light = literal(token.value, "light")
    if (light !== undefined) token.resolved = light
    const dark = literal(token.dark, "dark")
    if (dark !== undefined) token.darkResolved = dark
  }
}

function main(): void {
  const checkOnly = process.argv.includes("--check")

  if (!exists(TOKENS_DIR)) {
    console.warn(
      [
        "build-tokens: tokens/ does not exist yet - writing an empty token layer.",
        "  This is the honest zero state, not a failure: a tree with no authored",
        "  tokens produces a valid, empty generated layer, and the authored",
        "  fallbacks in app/globals.css are what render.",
      ].join("\n"),
    )
  }

  const rawSources: string[] = []
  const tokens: TokenLeaf[] = []

  for (const stem of TOKEN_FILES) {
    const file = join(TOKENS_DIR, `${stem}.json`)
    const source = readJson(file)
    if (source === undefined) continue
    rawSources.push(readFileSync(file, "utf8"))
    const emitter = EMITTERS[stem]
    if (emitter) emitter(source, tokens)
  }

  const glossaryFile = join(TOKENS_DIR, "glossary.json")
  const glossarySource = readJson(glossaryFile)
  if (glossarySource) rawSources.push(readFileSync(glossaryFile, "utf8"))
  const glossary = buildGlossary(glossarySource)

  /* tokens/errors.json is authored data for handbook/error-codes rather than a
     token source. It is hashed, so a change to it invalidates the generated
     layer, but it emits no custom properties: the pages that document an error
     code import the JSON directly. */
  const errorsFile = join(TOKENS_DIR, "errors.json")
  if (exists(errorsFile)) rawSources.push(readFileSync(errorsFile, "utf8"))

  resolveReferences(tokens)

  /* Two tokens resolving to one custom property is a silent, expensive bug: the
     later declaration wins and the earlier token quietly stops existing. */
  const seen = new Map<string, string>()
  const duplicates: string[] = []
  for (const token of tokens) {
    const previous = seen.get(token.cssVar)
    if (previous !== undefined && previous !== token.path) {
      duplicates.push(`  ${token.cssVar} is declared by both ${previous} and ${token.path}`)
    }
    seen.set(token.cssVar, token.path)
  }
  if (duplicates.length > 0) {
    console.error(
      ["build-tokens: two tokens resolve to the same CSS custom property.", ...duplicates].join(
        "\n",
      ),
    )
    process.exit(1)
  }

  const hash =
    rawSources.length === 0
      ? "empty"
      : createHash("sha256").update(rawSources.join(" ")).digest("hex").slice(0, 12)

  /* The glossary index maps every string a reader or an agent might arrive
     with - the clinical term, its plain wording, its related terms - to the
     canonical term, so <Term> can resolve a lookup without scanning the list. */
  const index: Record<string, string> = {}
  for (const entry of glossary.terms) {
    for (const key of [entry.term, entry.plain, ...(entry.related ?? [])]) {
      const needle = key.trim().toLowerCase()
      if (needle.length > 0 && index[needle] === undefined) index[needle] = entry.term
    }
  }

  const outputs = [
    { file: OUT_CSS, contents: emitCss(tokens, hash) },
    { file: OUT_TS, contents: emitTs(tokens, glossary, hash) },
    {
      file: OUT_GLOSSARY,
      contents: `${JSON.stringify(
        {
          $comment:
            "GENERATED FILE - DO NOT EDIT. Source: tokens/glossary.json. Generator: scripts/build-tokens.mts (`pnpm run generate`). Gate: `pnpm check:generated`. PROVENANCE: every definition is original prose written for opsinjs; nothing is copied from the NHS A-Z or any other Crown-copyright source. `generatedAt` carries the token source hash rather than a build time, because this file is guarded by a byte-for-byte drift gate and a timestamp would fail it on every run.",
          generatedAt: hash,
          sourceHash: hash,
          counts: { terms: glossary.terms.length, banned: glossary.banned.length },
          terms: glossary.terms,
          banned: glossary.banned,
          index,
        },
        null,
        2,
      )}\n`,
    },
    { file: OUT_THEME, contents: emitThemeItem(tokens, hash) },
  ]

  if (checkOnly) {
    const drifted = outputs.filter((output) => {
      try {
        return readFileSync(output.file, "utf8") !== output.contents
      } catch {
        return true
      }
    })
    if (drifted.length > 0) {
      console.error(
        [
          "build-tokens --check: generated output is out of date.",
          ...drifted.map((output) => `  ${output.file.replace(APP_DIR, "")}`),
          "",
          "  Run `pnpm run generate` and commit the result.",
        ].join("\n"),
      )
      process.exit(1)
    }
    console.log("build-tokens --check: up to date.")
    return
  }

  const written = new Set<string>()
  for (const output of outputs) {
    if (writeIfChanged(output.file, output.contents)) written.add(output.file)
  }

  const byGroup = new Map<string, number>()
  for (const token of tokens) byGroup.set(token.group, (byGroup.get(token.group) ?? 0) + 1)

  console.log(
    [
      `build-tokens: ${tokens.length} tokens from ${rawSources.length} source files ` +
        `(hash ${hash}); ${glossary.terms.length} glossary terms, ` +
        `${glossary.banned.length} banned words.`,
      `  ${[...byGroup.entries()].map(([group, count]) => `${count} ${group}`).join(" | ")}`,
      ...outputs.map(
        (output) =>
          `  ${written.has(output.file) ? "wrote    " : "unchanged"} ` +
          output.file.replace(APP_DIR, ""),
      ),
    ].join("\n"),
  )

  if (tokens.length === 0) {
    console.warn(
      "  note: zero tokens. tokens/*.json is empty or absent, so the generated\n" +
        "  layer declares nothing and app/globals.css's authored values render.",
    )
  }
}

main()
