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
 * AND REPLACES ONE NAMED REGION IN TWO HAND-WRITTEN FILES
 *   lib/opsinjs.ts                         the OPSIN_ERRORS table warnOnce() reads
 *   content/docs/handbook/error-codes.mdx  the published table of every code
 *
 * Both regions come from tokens/errors.json, which is authored data rather than
 * a token source. The substrate copy is not in lib/generated/ on purpose: that
 * directory does not travel with `shadcn add`, and a warning channel that
 * compiles here and fails in a consumer's project is worse than none.
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

/**
 * Two outputs that are REGIONS of a file somebody else writes prose in, not
 * whole generated files.
 *
 * `lib/opsinjs.ts` is the substrate every distributed component imports and
 * `shadcn add` copies into a consumer's project. It carries the error table
 * because `warnOnce()` lives there and a consumer has no `lib/generated/`; the
 * rest of the file is hand-written and stays hand-written.
 *
 * `content/docs/handbook/error-codes.mdx` is the page a reader lands on with a
 * code in their hand. Its table is the whole of `tokens/errors.json` and not
 * one row of it is authored, per ADR 0006.
 *
 * Neither path is in `check:generated`'s diff list in package.json - that list
 * names `lib/generated`, `registry/generated`, `app/tokens.generated.css` and
 * the two reference directories - so `node scripts/build-tokens.mts --check` is
 * what covers them, exactly as it covers registry/generated/themes.
 */
const OUT_SUBSTRATE = join(APP_DIR, "lib", "opsinjs.ts")
const OUT_ERROR_CODES = join(APP_DIR, "content", "docs", "handbook", "error-codes.mdx")

const SUBSTRATE_REGION_BEGIN = "/* opsinjs:errors:begin"
const SUBSTRATE_REGION_END = "/* opsinjs:errors:end */"
const MDX_REGION_BEGIN = "{/* opsinjs:errors:begin"
const MDX_REGION_END = "{/* opsinjs:errors:end */}"

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
  /**
   * The reduced-transparency fallback, for tokens that have one. Only the
   * material ladder sets it: `prefers-reduced-transparency` is a statement
   * about surfaces, and no colour, type, space or shape token changes under it.
   */
  reducedTransparency?: string
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

/**
 * Reads a file that must be there. Used only for the two committed files this
 * script splices a region into: both are tracked, so an absent one means the
 * working tree is broken rather than that the honest zero state has been
 * reached, and guessing at the content would write a file with no prose in it.
 */
function mustRead(file: string, why: string): string {
  try {
    return readFileSync(file, "utf8")
  } catch {
    console.error(
      [
        `build-tokens: ${file.replace(APP_DIR, "")} is missing and cannot be regenerated.`,
        `  ${why}`,
      ].join("\n"),
    )
    process.exit(1)
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
 *
 * EVERY PROPERTY HERE IS READ THROUGH `themed()`, and that is not tidiness.
 * material.json writes a property in one of two shapes and the shape varies by
 * rung: `border` is the string `"none"` on canvas and scrim and a
 * `{ light, dark }` object on card, raised, sheet and overlay; `tintAlpha` is
 * the number `1` on the three opaque rungs and a `{ light, dark }` object on the
 * three translucent ones. This function used to read those two with a bare
 * `str()`, which returns undefined for an object, and `push()` drops an
 * undefined value — so seven custom properties were never emitted at all, in
 * silence. The four rungs that actually have a boundary were exactly the four
 * with no border token, and the three rungs whose whole point is an alpha were
 * exactly the three with no tint-alpha token. Do not narrow any of these back to
 * a bare `str()` or `obj()`: the source is right and the reader was wrong.
 */
function emitMaterial(source: JsonObject, out: TokenLeaf[]): void {
  /* Whether the ladder's own reduced-transparency policy is declared beside it.
     The degradation below is that policy, so it is not emitted for a token file
     that has not asked for it. */
  const degrades = obj(source.reducedTransparency) !== undefined

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

    /**
     * Reads a property in either of the two shapes material.json uses — a bare
     * scalar meaning "the same in both themes", or `{ light, dark }` meaning
     * "these differ" — and returns the pair. A `{ light, dark }` value emits
     * into the light block and the dark block exactly as `tint` always did;
     * a scalar emits into the light block only, which is what makes the dark
     * block "redeclares only what actually differs" true.
     */
    const themed = (
      node: Json | undefined,
      convert: (value: Json | undefined) => string | undefined,
    ): { light: string | undefined; dark: string | undefined } => {
      const pair = obj(node)
      if (pair !== undefined && ("light" in pair || "dark" in pair)) {
        return { light: convert(pair.light), dark: convert(pair.dark) }
      }
      return { light: convert(node), dark: undefined }
    }

    /* The opaque fallback is read first because the tint's reduced-transparency
       value is a reference to it. A rung that declared no fallback would get no
       degradation rather than a var() pointing at nothing. */
    const fallback = themed(rung.opaqueFallback, asVar)
    const opaqueRef = fallback.light === undefined ? undefined : `var(${base}-opaque)`

    const tint = themed(rung.tint, asVar)
    push("tint", tint.light, `${label}: the tint over what is behind it. ${use ?? ""}`.trim(), {
      dark: tint.dark,
      reducedTransparency: degrades ? opaqueRef : undefined,
    })
    const tintAlpha = themed(rung.tintAlpha, str)
    push("tint-alpha", tintAlpha.light, `${label}: how opaque that tint is.`, {
      dark: tintAlpha.dark,
      /* A fallback composited at 0.74 is still translucent, so the alpha has to
         go with the tint or the swap achieves nothing. */
      reducedTransparency: degrades ? "1" : undefined,
    })
    const blur = num(rung.blurPx)
    push("blur", blur === undefined ? undefined : `${blur}px`, `${label}: backdrop blur radius.`, {
      reducedTransparency: degrades ? "0px" : undefined,
    })
    push("saturation", str(rung.saturation), `${label}: backdrop saturation multiplier.`, {
      /* 1, not 0. This is a multiplier applied to the backdrop, so 0 would drain
         the colour out of whatever is behind the surface — a different effect,
         not a removed one. 1 is the identity, which is what "no treatment"
         means here. */
      reducedTransparency: degrades ? "1" : undefined,
    })
    const border = themed(rung.border, asVar)
    push("border", border.light, `${label}: the boundary.`, { dark: border.dark })
    push("shadow", str(rung.shadow), `${label}: the shadow that separates it from what is behind.`)
    push(
      "scrim",
      str(rung.minScrimOpacity),
      `${label}: the minimum scrim opacity needed for text on this rung to clear the contrast floor.`,
    )
    push(
      "opaque",
      fallback.light,
      `${label}: the opaque substitute used under prefers-reduced-transparency and where backdrop-filter is unsupported.`,
      { dark: fallback.dark },
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
 * Error codes                                                         *
 *                                                                     *
 * tokens/errors.json is not a token source - it declares no custom     *
 * property - but it is authored data with exactly the same problem the *
 * tokens have: three places need it and none of them may drift. This   *
 * script is where the one source becomes all three.                    *
 * ------------------------------------------------------------------ */

interface ErrorCode {
  code: string
  severity: string
  title: string
  /** The message template, `{placeholder}` tokens and all. */
  message: string
  /** A docs page id - `health/two-colour-axes`, no leading slash and no `/docs/`. */
  docs: string
  /** The `{placeholder}` names in `message`, first appearance first, deduplicated. */
  params: string[]
}

interface ErrorSeverity {
  name: string
  description: string
}

interface ErrorTable {
  policy: {
    format: string
    stability: string
    environment: string
    message: string
    severity: ErrorSeverity[]
  }
  codes: ErrorCode[]
}

/**
 * The parameter names a message expects, in the order a reader meets them.
 *
 * The source has no `params` array: the parameters exist only as `{braced}`
 * spans inside `message`, which is the right place for them - a list that has
 * to be kept in step with a string by hand is a list that will not be. They
 * are extracted here instead, so the runtime can name the ones a caller failed
 * to supply and the docs table can show what a code needs.
 */
function placeholders(message: string): string[] {
  const found: string[] = []
  for (const match of message.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)) {
    const name = match[1] as string
    if (!found.includes(name)) found.push(name)
  }
  return found
}

function buildErrors(source: JsonObject | undefined): ErrorTable {
  const policySource = obj(source?.policy)
  const severity: ErrorSeverity[] = []
  for (const [name, description] of Object.entries(obj(policySource?.severity) ?? {})) {
    if (isMetaKey(name)) continue
    const text = str(description)
    if (text === undefined) continue
    severity.push({ name, description: text })
  }

  /* Source order is the numbering order, and the numbering is the point: the
     codes are allocated in sequence and a code is permanent. Nothing is sorted
     anywhere below, so every emitted table reads the way the file does. */
  const codes: ErrorCode[] = []
  const malformed: string[] = []
  for (const row of arr(source?.codes)) {
    const code = str(row.code)
    const message = str(row.message)
    /* A row with no code or no message cannot be warned with, and inventing a
       placeholder for it would put a code in the published table that the
       runtime would never emit.

       It is not skipped silently, though, and that distinction is the whole of
       this block. A code is a permanent public identifier; a misspelt `code` or
       `mesage` key would drop it from all three emitted tables with exit 0, so
       the identifier would simply cease to exist and the only symptom would be a
       warning that never fires. Collected and reported below. */
    if (code === undefined || message === undefined) {
      malformed.push(
        code ?? (str(row.title) ? `the row titled "${str(row.title)}"` : "a row with no code"),
      )
      continue
    }
    codes.push({
      code,
      severity: str(row.severity) ?? "",
      title: str(row.title) ?? "",
      message,
      docs: str(row.docs) ?? "",
      params: placeholders(message),
    })
  }

  if (malformed.length > 0) {
    console.error(
      [
        "build-tokens: tokens/errors.json has a row that is missing `code` or `message`.",
        ...malformed.map((entry) => `  ${entry}`),
        "",
        "  Both keys are required. A row without them is dropped from the generated",
        "  table, from the substrate that ships to consumers, and from the published",
        "  handbook page - so a permanent public identifier would disappear and the",
        "  only symptom would be a warning that never fires. Check the spelling of",
        "  the keys.",
      ].join("\n"),
    )
    process.exit(1)
  }

  /* THE SECOND WORDING OF OPSIN-0001, AND WHY IT IS ALLOWED TO EXIST.
     `lib/status.ts` hand-writes OPSIN-0001's code, its docs id and a message,
     because `axisConflict()` is the never-mix rule as a FUNCTION and that file
     is required to have no imports at all - the scripts load it under plain
     node. Its message is deliberately not identical: errors.json's opens with
     `<{component}>`, and `axisConflict()` has no component name to interpolate.
     What must never drift is which code it claims and where it sends a reader,
     so that is asserted here rather than left to be noticed. */
  const axis = codes.find((entry) => entry.code === "OPSIN-0001")
  if (axis !== undefined) {
    const statusSource = mustRead(
      join(APP_DIR, "lib", "status.ts"),
      "it hand-writes OPSIN-0001 and has to be checked against tokens/errors.json",
    )
    const claimsCode = statusSource.includes(`"${axis.code}"`)
    const claimsDocs = axis.docs === "" || statusSource.includes(`"${axis.docs}"`)
    if (!claimsCode || !claimsDocs) {
      console.error(
        [
          "build-tokens: lib/status.ts and tokens/errors.json disagree about OPSIN-0001.",
          `  errors.json: code ${axis.code}, docs ${axis.docs || "(none)"}`,
          `  lib/status.ts: ${claimsCode ? "code found" : "code NOT found"}, ${claimsDocs ? "docs id found" : "docs id NOT found"}`,
          "",
          "  `axisConflict()` in lib/status.ts is the never-mix rule as a function and",
          "  hand-writes the code and the docs id, because that file may have no",
          "  imports. Its MESSAGE is allowed to differ - it has no component name to",
          "  interpolate - but the code it claims and the page it sends a reader to",
          "  are the same rule and must match.",
        ].join("\n"),
      )
      process.exit(1)
    }
  }

  /* A code appearing twice is the one mistake this file cannot survive. The
     substrate emits a Record keyed by code, so the second row would silently
     replace the first and the warning a component raises would be about a
     different defect from the one the published table describes. */
  const duplicates = codes
    .map((entry) => entry.code)
    .filter((code, index, all) => all.indexOf(code) !== index)
  if (duplicates.length > 0) {
    console.error(
      [
        "build-tokens: tokens/errors.json declares a code more than once.",
        ...[...new Set(duplicates)].map((code) => `  ${code}`),
        "",
        "  A code is permanent and names exactly one defect. Give the second row",
        "  the next unallocated number instead.",
      ].join("\n"),
    )
    process.exit(1)
  }

  /* The severity union in the generated TypeScript is emitted from
     policy.severity, so a value that block does not declare would produce a
     table that does not typecheck - several steps away from the edit that
     caused it, and in a file nobody is meant to read. */
  const known = new Set(severity.map((entry) => entry.name))
  const unknown = codes.filter((entry) => !known.has(entry.severity))
  if (severity.length > 0 && unknown.length > 0) {
    console.error(
      [
        "build-tokens: tokens/errors.json uses a severity that policy.severity does not declare.",
        ...unknown.map((entry) => `  ${entry.code} is ${q(entry.severity)}`),
        `  Declared: ${[...known].map(q).join(", ")}.`,
        "",
        "  Add the severity to policy.severity, with the sentence that says what it",
        "  means, or correct the row.",
      ].join("\n"),
    )
    process.exit(1)
  }

  return {
    policy: {
      format: str(policySource?.format) ?? "",
      stability: str(policySource?.stability) ?? "",
      environment: str(policySource?.environment) ?? "",
      message: str(policySource?.message) ?? "",
      severity,
    },
    codes,
  }
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

  const transparency = tokens
    .filter((token) => token.reducedTransparency !== undefined)
    .map((token) => `${token.cssVar}: ${token.reducedTransparency};`)
  if (transparency.length > 0) {
    parts.push(
      "/* Reduced transparency. A stated operating-system preference, not a hint,",
      "   and honoured by swapping each rung to its opaque fallback rather than by",
      "   removing the surface - the layering still has to communicate what is on",
      "   top of what.",
      "",
      "   Four properties move and no others. `-tint` becomes `-opaque`, and since",
      "   `-opaque` is itself theme-aware one declaration is correct in both",
      "   themes. `-tint-alpha` becomes 1, because a fallback composited at 0.74",
      "   is still translucent and the swap would achieve nothing. `-blur` becomes",
      "   0px. `-saturation` becomes 1 rather than 0: it multiplies the backdrop,",
      "   so 0 would drain the colour out of whatever is behind rather than leave",
      "   it alone, and 1 is the identity. `-border`, `-shadow` and `-scrim` are",
      "   deliberately untouched: they are what carries the layering once the",
      "   translucency is gone, and moving them would move the layout too.",
      "",
      "   Emitted for all six rungs rather than only the three with",
      "   `translucent: true`. For canvas, card and raised the declarations are",
      "   identical to the values above, so the block is a no-op for them; what it",
      "   buys is that a component may read `var(--opsin-material-<rung>-blur)` for",
      "   ANY rung and be right, with no conditional and no table of which rungs",
      "   are translucent this month.",
      "",
      "   Both selectors are repeated for the reason the P3 block gives:",
      "   `.opsin-product.dark` is (0,2,0) and outranks a bare `:root`, so a",
      "   light-only block placed here would leave the dark theme translucent. */",
      "@media (prefers-reduced-transparency: reduce) {",
      [
        indent(cssBlock(LIGHT_SELECTOR, transparency)),
        indent(cssBlock(DARK_SELECTOR, transparency)),
      ].join("\n\n"),
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
  errors: ErrorTable,
  hash: string,
): string {
  /* The shape below is the contract declared in the committed placeholder that
     lib/tokens.ts is typed against. Field names differ from this script's
     internal ones in one place worth naming: `namespace` here is the SOURCE
     FILE (color, motion, space...) and `group` is the family within it (status,
     category, ladder), which is the order the token tables read in. */
  const namespaces = [...new Set(tokens.map((token) => token.group))]

  /* The severity union comes from policy.severity's own keys rather than from
     a list in this script, so adding a severity is one edit in one file. An
     empty policy block degrades to `string` instead of `never`, which would
     make every row in the table fail to typecheck. */
  const severityUnion =
    errors.policy.severity.length > 0
      ? errors.policy.severity.map((entry) => q(entry.name)).join(" | ")
      : "string"

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
      if (token.reducedTransparency !== undefined)
        fields.push(`reducedTransparencyValue: ${q(token.reducedTransparency)}`)
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
  /**
   * The value this token takes under \`prefers-reduced-transparency: reduce\`.
   * Only the material ladder has one: reduced transparency is a statement about
   * surfaces, so no colour, type, space or shape token moves under it.
   */
  reducedTransparencyValue?: string
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

/**
 * How severe a warning is. The three classes and their sentences are declared in
 * \`tokens/errors.json\`'s own \`policy.severity\` block, not here.
 */
export type GeneratedErrorSeverity = ${severityUnion}

/** One development-mode warning code, as authored in \`tokens/errors.json\`. */
export interface GeneratedErrorCode {
  /** The stable code, \`OPSIN-NNNN\`. Permanent: never reused, never renumbered. */
  code: string
  severity: GeneratedErrorSeverity
  /** One line naming the mistake, for a table a reader scans by eye. */
  title: string
  /**
   * The message template. \`{name}\` spans are filled at runtime by
   * \`warnOnce()\` in \`lib/opsinjs.ts\`, which carries its own copy of this table
   * because it is the file \`shadcn add\` copies into a consumer's project.
   */
  message: string
  /** The docs page that prevents the mistake: a page id, no leading slash. */
  docs: string
  /** The \`{name}\` spans in \`message\`, first appearance first. */
  params: string[]
}

/**
 * Every code the system can emit, in allocation order.
 *
 * The scheme is flat - \`OPSIN-0001\` upwards - and deliberately not grouped
 * into ranges: see \`content/docs/project/decisions/0015-error-codes-are-flat.mdx\`.
 */
export const OPSIN_ERROR_CODES: GeneratedErrorCode[] = ${JSON.stringify(errors.codes, null, 2)}

/** What a code promises, what it never does, and what each severity means. */
export const OPSIN_ERROR_POLICY: {
  format: string
  stability: string
  environment: string
  message: string
  severity: { name: GeneratedErrorSeverity; description: string }[]
} = ${JSON.stringify(errors.policy, null, 2)}
`
}

/** A last-resort description, so the second column of a token table is never empty. */
function describe(token: TokenLeaf): string {
  return `The ${token.namespace} token ${token.cssVar.replace(PREFIX, "")}.`
}

/* ------------------------------------------------------------------ *
 * The shipped copy of the error table                                 *
 * ------------------------------------------------------------------ */

/**
 * Replaces the region between two markers, keeping everything either side.
 *
 * The same three-way splice `scripts/build-reference.mts` performs on the
 * generated MDX pages, for the same reason: two of this script's outputs are
 * files a person owns and writes prose in, and only a named region of each is
 * derived from `tokens/errors.json`. The begin line is reused exactly as the
 * file has it rather than rewritten, so the wording of the marker belongs to
 * the file it sits in.
 *
 * A missing marker is fatal rather than recoverable. The alternative - append
 * the region, or rewrite the whole file - would silently produce a second copy
 * of the error table in a file that already ships one, and a duplicate table is
 * exactly the drift this pipeline exists to prevent.
 */
function spliceRegion(
  file: string,
  current: string,
  beginPrefix: string,
  endMarker: string,
  region: string,
): string {
  const beginAt = current.indexOf(beginPrefix)
  const endAt = current.indexOf(endMarker)
  if (beginAt === -1 || endAt === -1 || endAt < beginAt) {
    console.error(
      [
        `build-tokens: ${file.replace(APP_DIR, "")} has lost its generated region markers.`,
        `  Expected a line beginning ${q(beginPrefix)} and, after it, ${q(endMarker)}.`,
        "",
        "  The error table in that file is generated from tokens/errors.json. Restore",
        "  both markers - an empty region between them is fine, this script fills it -",
        "  and run `pnpm run generate` again.",
      ].join("\n"),
    )
    process.exit(1)
  }
  const lineEnd = current.indexOf("\n", beginAt)
  const beginLine = lineEnd === -1 ? current.slice(beginAt) : current.slice(beginAt, lineEnd)
  const head = current.slice(0, beginAt)
  const tail = current.slice(endAt + endMarker.length)
  return `${head}${beginLine}\n\n${region.trim()}\n\n${endMarker}${tail}`
}

/**
 * The error table as TypeScript, for the region inside `lib/opsinjs.ts`.
 *
 * WHY THIS TABLE IS EMITTED TWICE, AND WHY THE SECOND COPY IS NOT IN
 * `lib/generated/`. `lib/opsinjs.ts` is one of the two files
 * `scripts/build-registry.mts` appends to every registry item, so `shadcn add`
 * copies it into a project that has none of this repository - no `tokens/`, no
 * `lib/generated/`, no generator. `warnOnce()` lives in that file and needs the
 * message templates, so an import of `lib/generated/tokens.ts` would compile
 * here and fail in every consumer. The table is therefore generated INTO the
 * file that travels, from the same source, in the same run. Two emitted copies
 * cannot drift from each other; a hand-kept second copy could.
 */
function emitSubstrateErrors(errors: ErrorTable): string {
  const severityUnion =
    errors.policy.severity.length > 0
      ? errors.policy.severity.map((entry) => q(entry.name)).join(" | ")
      : "string"

  /* An empty source is a real state - `tokens/errors.json` may not exist in a
     clone that has not been generated - and `export type X =` with nothing
     after it is a syntax error, so the zero case widens to `string` instead of
     narrowing to `never`. */
  const codeUnion =
    errors.codes.length > 0
      ? errors.codes.map((entry) => `\n  | ${q(entry.code)}`).join("")
      : " string"

  const rows = errors.codes
    .map((entry) =>
      [
        `  ${q(entry.code)}: {`,
        `    code: ${q(entry.code)},`,
        `    severity: ${q(entry.severity)},`,
        `    title: ${q(entry.title)},`,
        `    message: ${q(entry.message)},`,
        `    docs: ${q(entry.docs)},`,
        `    params: [${entry.params.map(q).join(", ")}],`,
        "  },",
      ].join("\n"),
    )
    .join("\n")

  return `/**
 * How severe a warning is.
 *
 * The three classes are declared in \`tokens/errors.json\`'s \`policy.severity\`
 * block, which also carries the sentence that says what each one means:
${errors.policy.severity.map((entry) => ` *   ${entry.name} - ${entry.description}`).join("\n")}
 */
export type OpsinErrorSeverity = ${severityUnion}

/**
 * Every warning code opsinjs can emit.
 *
 * Flat, allocated in sequence, and permanent: a code is never reused, never
 * renumbered and never removed. The union is what makes \`warnOnce("OPSIN-0004")\`
 * a compile error when the code does not exist, which is the difference between
 * a stable code and a string somebody typed.
 */
export type OpsinErrorCode =${codeUnion}

/** One warning code: what it is called, how severe it is, and the page that prevents it. */
export interface OpsinError {
  /** The stable code. Search by this, never by the message text. */
  code: OpsinErrorCode
  severity: OpsinErrorSeverity
  /** One line naming the mistake. */
  title: string
  /** The message template. \`{name}\` spans are filled from \`warnOnce\`'s \`params\`. */
  message: string
  /** The docs page id that prevents the mistake, without a leading slash. */
  docs: string
  /** The \`{name}\` spans in \`message\`, first appearance first. */
  params: string[]
}

/** The table \`warnOnce()\` reads. Generated from \`tokens/errors.json\`. */
export const OPSIN_ERRORS: Record<OpsinErrorCode, OpsinError> = {
${rows}
}`
}

/* ------------------------------------------------------------------ *
 * The error-code table as MDX                                         *
 * ------------------------------------------------------------------ */

/**
 * Escapes one table cell for MDX.
 *
 * Applied to every authored string that lands in a table cell - the titles and
 * the severity sentences. Two characters need care, and only outside a code
 * span, because MDX parses neither JSX nor expressions inside one: `<` starts
 * an element and `{` starts an expression.
 *
 * `<` becomes `&lt;` rather than `\<` for a second reason. `assert-ia.mts`
 * reads a `<` followed by a capital as a JSX tag and fails the build on it
 * (MDX001), and a backslash in front of the angle bracket does not change what
 * its regular expression sees. That the titles do not contain one today is not
 * a reason to leave it out: the messages in the same file do (`<Value>`,
 * `<TrendSparkline>`), which is why they are shown only inside a fenced block,
 * where MDX parses nothing at all, and why a title that gains one tomorrow has
 * to keep working rather than fail the build.
 *
 * The pipe moves in both contexts: GFM ends a cell on it even inside code.
 */
function mdxCell(text: string): string {
  return text
    .split(/(`[^`]*`)/g)
    .map((part) => {
      if (part.length >= 2 && part.startsWith("`") && part.endsWith("`")) {
        return part.replace(/\|/g, "\\|")
      }
      return part
        .replace(/\|/g, "\\|")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/([{}])/g, "\\$1")
    })
    .join("")
}

/**
 * The generated half of `content/docs/handbook/error-codes.mdx`.
 *
 * It renders the whole table rather than a sample of it. A handbook page whose
 * table is a selection is a page a reader has to leave to answer the question
 * they arrived with, and the question they arrived with is always "what is this
 * code". The worked example is the real OPSIN-0001 row, template braces and
 * all, so nothing on the page is a message that the runtime cannot emit.
 */
function emitErrorCodesRegion(errors: ErrorTable): string {
  if (errors.codes.length === 0) {
    return '<NoDataYet script="scripts/build-tokens.mts" />\n\nNo codes are declared in `tokens/errors.json` yet.'
  }

  const first = errors.codes[0] as ErrorCode
  const example = [
    "```text",
    `[opsinjs] ${first.code} (${first.severity}): ${first.message}`,
    `  → https://opsinjs.dev/docs/${first.docs}`,
    "```",
  ].join("\n")

  const counts = new Map<string, number>()
  for (const entry of errors.codes) {
    counts.set(entry.severity, (counts.get(entry.severity) ?? 0) + 1)
  }
  const severityRows = errors.policy.severity.map(
    (entry) =>
      `| \`${entry.name}\` | ${counts.get(entry.name) ?? 0} | ${mdxCell(entry.description)} |`,
  )

  const codeRows = errors.codes.map((entry) => {
    const params =
      entry.params.length === 0 ? "none" : entry.params.map((name) => `\`${name}\``).join(", ")
    const docs = entry.docs === "" ? "—" : `[${entry.docs}](../${entry.docs}.mdx)`
    return `| \`${entry.code}\` | ${entry.severity} | ${mdxCell(entry.title)} | ${params} | ${docs} |`
  })

  return [
    "A warning is one `console.warn` call, and it looks like this. The braces are",
    "filled from what the component passed; this is the template as authored, so",
    "what you see below is what the code emits and not a paraphrase of it.",
    "",
    example,
    "",
    "### Severities",
    "",
    `${errors.policy.severity.length} classes, and they are a statement about consequence rather than about`,
    "how noisy the warning is.",
    "",
    "| Severity | Codes | What it means |",
    "| --- | --- | --- |",
    ...severityRows,
    "",
    "### Every code",
    "",
    `${errors.codes.length} codes, in allocation order. "Values in the message" names the`,
    "`{braced}` spans a component has to supply; a missing one is reported in the",
    "warning itself rather than swallowed.",
    "",
    "| Code | Severity | What went wrong | Values in the message | Prevented by |",
    "| --- | --- | --- | --- | --- |",
    ...codeRows,
  ].join("\n")
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

  /* tokens/errors.json is authored data rather than a token source: it declares
     no custom property, so it has no entry in EMITTERS and none in TOKEN_FILES.
     It is still hashed, in this position, after the glossary - a change to the
     warning table invalidates the generated layer like any other source change,
     and moving it in this list would rewrite every hash for no reason.

     What it does emit is three copies of one table, below: OPSIN_ERROR_CODES in
     lib/generated/tokens.ts, OPSIN_ERRORS inside lib/opsinjs.ts where warnOnce()
     can reach it in a consumer's project, and the table on the handbook page.
     Parsing it here rather than only hashing it also means a syntactically
     broken errors.json now fails the build with a line number instead of
     quietly emptying the warning channel. */
  const errorsFile = join(TOKENS_DIR, "errors.json")
  const errorsSource = readJson(errorsFile)
  if (exists(errorsFile)) rawSources.push(readFileSync(errorsFile, "utf8"))
  const errors = buildErrors(errorsSource)

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
    { file: OUT_TS, contents: emitTs(tokens, glossary, errors, hash) },
    {
      file: OUT_SUBSTRATE,
      contents: spliceRegion(
        OUT_SUBSTRATE,
        mustRead(
          OUT_SUBSTRATE,
          "It is the shared substrate every registry item ships; restore it from git.",
        ),
        SUBSTRATE_REGION_BEGIN,
        SUBSTRATE_REGION_END,
        emitSubstrateErrors(errors),
      ),
    },
    {
      file: OUT_ERROR_CODES,
      contents: spliceRegion(
        OUT_ERROR_CODES,
        mustRead(
          OUT_ERROR_CODES,
          "It is a hand-written handbook page with one generated region; restore it from git.",
        ),
        MDX_REGION_BEGIN,
        MDX_REGION_END,
        emitErrorCodesRegion(errors),
      ),
    },
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
        `${glossary.banned.length} banned words, ${errors.codes.length} error codes.`,
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
