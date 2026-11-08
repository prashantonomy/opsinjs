/**
 * build-tokens.mts - tokens/*.json to the CSS token layer, the typed token map,
 * the machine-readable glossary and the theme registry payload.
 *
 *   node scripts/build-tokens.mts            # write
 *   node scripts/build-tokens.mts --check    # write nothing; fail on drift
 *
 * WRITES
 *   packages/tokens/tokens.css             committed; @opsinjs/tokens/tokens.css
 *   packages/tokens/tokens.json            committed; the same tokens as data
 *   packages/tokens/src/index.ts           committed; the same tokens and the
 *                                          accent themes as typed exports
 *   lib/generated/tokens.ts                committed; lib/tokens.ts is the reader
 *   lib/generated/glossary.json            committed; data behind <Term> and the A-Z
 *   lib/generated/units.json               committed; the reviewable copy of the unit table
 *   packages/tokens/src/accents.ts         committed; the accent themes as data
 *
 * AND REFUSES, rather than writes, an accent value from tokens/accent.json
 * that falls below its contrast floor or sits nearer a status hue than the
 * rule allows. `--check` runs the same refusal, so a bad accent fails
 * `pnpm check` in CI as well as `pnpm run generate` at a desk.
 *
 * AND REPLACES NAMED REGIONS IN TWO HAND-WRITTEN FILES
 *   packages/react/src/opsinjs.ts          THREE regions: the OPSIN_ERRORS table
 *                                          warnOnce() reads, the Unit/UNITS table
 *                                          every rendered measurement reads, and
 *                                          the BANNED_WORDS table a component's
 *                                          copy is checked against
 *   content/docs/reference/error-codes.mdx  the published table of every code
 *
 * Those regions come from tokens/errors.json, tokens/units.json and the banned
 * list in tokens/glossary.json, which are authored data rather than token
 * sources. The substrate copies are not in
 * lib/generated/ on purpose: that directory belongs to the documentation site
 * and is not part of @opsinjs/react, and a warning channel - or a spoken unit
 * form - that compiles here and fails in a consumer's project is worse than
 * none.
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
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

import { apcaContrast } from "../../../packages/color/src/apca.ts"
import { contrastRatio } from "../../../packages/color/src/wcag.ts"
import {
  ACCENT_FLOORS,
  accentPairs,
  buildAccentPlan,
  defaultTheme,
  hueViolations,
  type AccentMode,
  type AccentPlan,
  type AccentTheme,
} from "./accent-plan.mts"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const REPO_DIR = join(APP_DIR, "..", "..")
const TOKENS_PKG = join(REPO_DIR, "packages", "tokens")
const REACT_PKG = join(REPO_DIR, "packages", "react")
const TOKENS_DIR = join(APP_DIR, "tokens")
const OUT_CSS = join(TOKENS_PKG, "tokens.css")
/* The published token data for @opsinjs/tokens: one JSON file and one typed
   module. They carry what a consumer needs to read a token and nothing the
   documentation adds to it, so there is no `usedBy` and no source path. */
const OUT_TOKENS_JSON = join(TOKENS_PKG, "tokens.json")
const OUT_TOKENS_TS = join(TOKENS_PKG, "src", "index.ts")
const OUT_TS = join(APP_DIR, "lib", "generated", "tokens.ts")
const OUT_GLOSSARY = join(APP_DIR, "lib", "generated", "glossary.json")
const OUT_UNITS = join(APP_DIR, "lib", "generated", "units.json")

/**
 * Two READ-ONLY inputs, for the `usedBy` column only. They are deliberately not
 * in the hashed source list below: `--opsin-tokens-generated` records which
 * TOKEN sources produced this layer, and folding component files into it would
 * make every component edit rewrite the provenance value of every theme.
 */
const PRODUCT_CSS = join(REACT_PKG, "styles", "theme.css")
const BASES_DIR = join(REACT_PKG, "src", "components")

/* The accent themes as data, for the documentation's pickers and the preview
   shell. Small and separate from tokens.ts on purpose: a client component that
   imports it should not pull the whole token table into the browser. */
const OUT_ACCENTS_TS = join(TOKENS_PKG, "src", "accents.ts")

/**
 * Two outputs that are REGIONS of a file somebody else writes prose in, not
 * whole generated files.
 *
 * `packages/react/src/opsinjs.ts` is the substrate every component imports,
 * published inside @opsinjs/react. It carries the error table because
 * `warnOnce()` lives there and the package has no `lib/generated/`; the rest
 * of the file is hand-written and stays hand-written.
 *
 * `content/docs/reference/error-codes.mdx` is the page a reader lands on with a
 * code in their hand. Its table is the whole of `tokens/errors.json` and not
 * one row of it is authored, per ADR 0006.
 *
 * Both paths ARE in `check:generated`'s diff list in apps/www/package.json,
 * so a region that drifts is caught twice: by that diff, and by
 * `node scripts/build-tokens.mts --check`. The script in package.json is the
 * authority on what the diff covers.
 */
const OUT_SUBSTRATE = join(REACT_PKG, "src", "opsinjs.ts")
const OUT_ERROR_CODES = join(APP_DIR, "content", "docs", "reference", "error-codes.mdx")

const SUBSTRATE_REGION_BEGIN = "/* opsinjs:errors:begin"
const SUBSTRATE_REGION_END = "/* opsinjs:errors:end */"
const MDX_REGION_BEGIN = "{/* opsinjs:errors:begin"
const MDX_REGION_END = "{/* opsinjs:errors:end */}"

/**
 * The unit table's own region inside packages/react/src/opsinjs.ts, and the reserved space it
 * grows into the first time this script runs with tokens/units.json present.
 *
 * packages/react/src/opsinjs.ts shipped with a comment block saying the unit table was
 * deliberately not there yet and reserving the space for it. That block is the
 * anchor: `installUnitsRegion` below replaces it with an empty pair of markers,
 * once, and every run after that is an ordinary three-way splice like the error
 * table's. Anchoring on a sentence rather than appending is what stops a second
 * copy of the table appearing in a file that already ships one - and a second
 * spoken unit form that can disagree with the first is precisely the drift this
 * pipeline exists to prevent.
 */
const UNITS_REGION_BEGIN = "/* opsinjs:units:begin"
const UNITS_REGION_END = "/* opsinjs:units:end */"
const UNITS_PLACEHOLDER_ANCHOR = "The unit table is deliberately NOT here yet"

/**
 * The banned-word table's own region inside packages/react/src/opsinjs.ts, and the reserved
 * space it grows into the first time this script runs after the anchor lands.
 *
 * packages/react/src/opsinjs.ts ships the `GeneratedBannedWord` interface and, below it, a
 * comment block saying the table is deliberately not there yet and reserving the
 * space for it. That block is the anchor: `installBannedRegion` below replaces it
 * with an empty pair of markers, once, and every run after that is an ordinary
 * three-way splice like the error table's. Anchoring on a sentence rather than
 * appending stops a second copy of the table appearing in a file that already
 * ships one, and a component that prints a word the doctrine bans outright is
 * precisely the drift this pipeline exists to prevent.
 */
const BANNED_REGION_BEGIN = "/* opsinjs:banned:begin"
const BANNED_REGION_END = "/* opsinjs:banned:end */"
const BANNED_PLACEHOLDER_ANCHOR = "The banned-word table is deliberately NOT here yet"

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
        `build-tokens: ${relative(REPO_DIR, file)} is missing and cannot be regenerated.`,
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
 * "Unexpected token Number" and silently drops the declaration. A silent drop
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

  /* The chrome roles: the page, the card, the muted fill and its ink, the
     hairline, the input boundary, the focus ring and the primary action colour.
     color.json's chrome block names a neutral ladder step where one exists and
     states an explicit oklch only where none does, so a bare step name is
     resolved here to that step's srgb string and the emitted token carries a
     colour rather than a name a consumer would resolve again. Emitting these is
     what makes the audited page the rendered page. */
  const chromeRoles = obj(obj(source.chrome)?.roles)
  if (chromeRoles && neutralSteps) {
    const resolveChrome = (raw: string | undefined): string | undefined => {
      if (!raw) return undefined
      const step = unprefix(raw, "neutral")
      if (step === raw) return raw
      return str(obj(neutralSteps[step])?.srgb)
    }
    for (const [role, entry] of Object.entries(chromeRoles)) {
      if (isMetaKey(role)) continue
      const node = obj(entry)
      const value = resolveChrome(str(node?.light))
      if (!value) continue
      out.push({
        path: `chrome.roles.${role}`,
        cssVar: `${PREFIX}chrome-${kebab(role)}`,
        namespace: "chrome",
        group: "color",
        tier: "semantic",
        value,
        dark: resolveChrome(str(node?.dark)),
        description: `Chrome role ${role}, resolved to the ladder step it names.`,
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
 * undefined value. Seven custom properties were therefore never emitted at
 * all, in silence. The four rungs that actually have a boundary were exactly
 * the four with no border token, and the three rungs whose whole point is an
 * alpha were exactly the three with no tint-alpha token. Do not narrow any of
 * these back to a bare `str()` or `obj()`: the source is right and the reader
 * was wrong.
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
     * Reads a property in either of the two shapes material.json uses and
     * returns the pair. One shape is a bare scalar, meaning "the same in both
     * themes". The other is `{ light, dark }`, meaning "these differ". A
     * `{ light, dark }` value emits into the light block and the dark block
     * exactly as `tint` always did; a scalar emits into the light block only,
     * which is what makes the dark block "redeclares only what actually
     * differs" true.
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
         the colour out of whatever is behind the surface. That is a different
         effect, not a removed one. 1 is the identity, which is what "no
         treatment" means here. */
      reducedTransparency: degrades ? "1" : undefined,
    })
    const border = themed(rung.border, asVar)
    push("border", border.light, `${label}: the boundary.`, { dark: border.dark })
    /* Per theme where the rung says so. A drop that seats a sheet on a white
       page is invisible on a near-black one, so a dark shadow is deeper, and
       a rung that publishes one string uses it in both themes. */
    const shadow = themed(rung.shadow, str)
    push("shadow", shadow.light, `${label}: the shadow that separates it from what is behind.`, {
      dark: shadow.dark,
    })
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

  const ladderRem = new Map<string, number>()
  for (const rung of arr(source.ladder)) {
    const name = str(rung.name)
    const rem = num(rung.rem)
    if (!name || rem === undefined) continue
    ladderRem.set(name, rem)
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

  // Concentric inner radii. shape.json authors these pairings and rule 3 defines
  // the formula: an inner radius is its outer ladder step minus the padding that
  // sits inside it, floored at radius-xs. The gap is expressed as gapSteps
  // multiples of Tailwind's --spacing so one emitted value stays correct at every
  // density, because --spacing is redeclared per density in @opsinjs/react's roles.css. The
  // outer rem is resolved from the ladder walked above so it cannot drift from the
  // ladder token, and the floor references var(--opsin-radius-xs) so a product that
  // re-bases the ladder gets a re-based floor.
  const concentricity = obj(source.concentricity)
  if (concentricity) {
    for (const entry of arr(concentricity.inner)) {
      const name = str(entry.name)
      const outer = str(entry.outer)
      const gapSteps = num(entry.gapSteps)
      if (!name || !outer || gapSteps === undefined) continue
      const outerRem = ladderRem.get(outer)
      if (outerRem === undefined) continue
      out.push({
        path: `concentricity.inner.${name}`,
        cssVar: `${PREFIX}radius-inner-${kebab(unprefix(name, "radius-inner"))}`,
        namespace: "radius",
        group: "shape",
        tier: "semantic",
        value: `max(calc(${outerRem}rem - ${gapSteps} * var(--spacing)), var(${PREFIX}radius-xs))`,
        description: str(entry.use),
      })
    }
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

  // The graphic caps are authored and emitted in rem, never in px, and that is
  // deliberate. This width bounds a picture that illustrates a reading, such as
  // the ScoreDial arc, and the arc was written in em so it grows with the
  // reader's root font size. A px cap would freeze the picture at one size while
  // the words beside it doubled, which is exactly the drift the em authoring was
  // meant to avoid, so the token carries the rem through untouched.
  const graphic = obj(source.graphic) ?? {}
  for (const [name, entry] of Object.entries(graphic)) {
    if (isMetaKey(name)) continue
    const node = obj(entry)
    const rem = num(node?.rem)
    if (rem === undefined) continue
    out.push({
      path: `graphic.${name}`,
      cssVar: `${PREFIX}graphic-${kebab(name)}`,
      namespace: "graphic",
      group: "space",
      tier: "semantic",
      value: `${rem}rem`,
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

/* ---------------------------- accent ------------------------------ */

/**
 * The plan this run read from tokens/accent.json, kept for main(), which emits
 * the attribute blocks, the theme items and the floor refusal from it. The
 * emitter below is what reads it, because it runs after color.json has put the
 * neutral ladder into `out` and the plan resolves its step names against that.
 */
let accentPlan: AccentPlan | undefined

function neutralLookup(out: TokenLeaf[]): (step: string) => string | undefined {
  return (step) => {
    const match = /^neutral-(\d+)$/.exec(step)
    if (!match) return undefined
    return out.find((token) => token.cssVar === `${PREFIX}neutral-${match[1]}`)?.value
  }
}

/**
 * The default accent, as tokens. `--opsin-accent-<role>` carries the default
 * theme's default accent in both modes, in the same `:root` and `.dark` blocks
 * as every other token, so a page that sets no attribute renders it and the
 * registry's default theme item carries it. The other themes and accents are
 * attribute blocks, emitted by emitAccentCss() further down.
 */
function emitAccent(source: JsonObject, out: TokenLeaf[]): void {
  const plan = buildAccentPlan(source, neutralLookup(out))
  accentPlan = plan
  const theme = defaultTheme(plan)
  const entry = theme.accents.get(theme.defaultAccent)
  if (!entry) return
  for (const role of plan.roles) {
    out.push({
      path: `themes.${theme.id}.accents.${theme.defaultAccent}.light.${role.id}`,
      cssVar: role.cssVar,
      namespace: "accent",
      group: "color",
      tier: "semantic",
      value: entry.light[role.id] ?? "transparent",
      dark: entry.dark[role.id] ?? "transparent",
      description: `${role.use} Read as ${role.productRole}.`,
    })
  }
}

/** The page and the card every theme sits on unless it brings chrome of its own. */
function chromeGrounds(tokens: TokenLeaf[]): Record<AccentMode, { page: string; card: string }> {
  const find = (cssVar: string) => tokens.find((token) => token.cssVar === cssVar)
  const background = find(`${PREFIX}chrome-background`)
  const card = find(`${PREFIX}chrome-card`)
  return {
    light: { page: background?.value ?? "oklch(1 0 0)", card: card?.value ?? "oklch(1 0 0)" },
    dark: {
      page: background?.dark ?? background?.value ?? "oklch(0 0 0)",
      card: card?.dark ?? card?.value ?? "oklch(0 0 0)",
    },
  }
}

/**
 * Every accent pair below its floor, and every accent hue too near a status
 * hue. An empty list is the only answer that lets the run continue.
 */
function accentFailures(plan: AccentPlan, tokens: TokenLeaf[]): string[] {
  const problems = hueViolations(plan)
  for (const pair of accentPairs(plan, chromeGrounds(tokens))) {
    if (pair.exempt) continue
    const floor = ACCENT_FLOORS[pair.floors][pair.use]
    const lc = Math.abs(apcaContrast(pair.foreground, pair.background))
    const ratio = contrastRatio(pair.foreground, pair.background)
    if (lc < floor.apca || ratio < floor.wcag) {
      problems.push(
        `${pair.id}: ${pair.pair} measures APCA Lc ${lc.toFixed(1)} and WCAG ${ratio.toFixed(2)}:1 ` +
          `against a ${pair.floors} ${pair.use} floor of Lc ${floor.apca} and ${floor.wcag}:1 ` +
          `(${pair.foreground} on ${pair.background}).`,
      )
    }
  }
  return problems
}

/**
 * What a theme sets beyond its accent: its own chrome, a wider focus ring, and
 * for a theme that flattens materials, every rung's reduced-transparency swap
 * and no shadow. Declared on the theme's own blocks only, never on an accent.
 */
function themeDeclarations(theme: AccentTheme, mode: AccentMode, tokens: TokenLeaf[]): string[] {
  const lines = Object.entries(theme.chrome[mode]).map(([cssVar, value]) => `${cssVar}: ${value};`)
  if (lines.length > 0) {
    /* A token defined as a reference to a chrome token is resolved where it is
       declared, which is `:root`. Re-declared here, it resolves against this
       theme's chrome on the scope's own element, so a material border follows
       the theme's edge even when the theme starts below `<html>`. */
    for (const token of tokens) {
      const raw = mode === "dark" ? (token.dark ?? token.value) : token.value
      if (raw.includes(`var(${PREFIX}chrome-`)) lines.push(`${token.cssVar}: ${raw};`)
    }
  }
  if (theme.borderFocus) lines.push(`${PREFIX}border-focus: ${theme.borderFocus};`)
  if (theme.flattenMaterials) {
    for (const token of tokens) {
      if (token.group !== "material") continue
      if (token.cssVar.endsWith("-shadow")) lines.push(`${token.cssVar}: none;`)
      else if (token.reducedTransparency !== undefined) {
        lines.push(`${token.cssVar}: ${token.reducedTransparency};`)
      }
    }
  }
  return lines
}

function accentDeclarations(plan: AccentPlan, theme: AccentTheme, accent: string, mode: AccentMode): string[] {
  const entry = theme.accents.get(accent)
  if (!entry) return []
  return plan.roles.map((role) => `${role.cssVar}: ${entry[mode][role.id]};`)
}

/**
 * Three spellings of "this scope, in dark mode", because `.dark` and the accent
 * attributes may sit on one element or on two: the same element, `.dark` above
 * the scope, or `.dark` inside it. The attributes themselves are expected on
 * one element, ideally `<html>`.
 */
function darkScopes(scope: string): string[] {
  return [`.dark${scope}`, `.dark ${scope}`, `${scope} .dark`]
}

/**
 * The attribute blocks. Specificity does the layering, and every step was
 * checked rather than assumed:
 *
 *   `[data-accent="x"]`                              (0,1,0) light, default theme
 *   `.dark[data-accent="x"]` and its two siblings    (0,2,0) dark, default theme
 *   `[data-accent-theme="t"]`                        (0,1,0) light, a theme's default accent
 *   `.dark[data-accent-theme="t"]` and siblings      (0,2,0) dark
 *   `[data-accent-theme="t"][data-accent="x"]`       (0,2,0) light
 *   `.dark[data-accent-theme="t"][data-accent="x"]`  (0,3,0) dark
 *
 * Each dark block outranks or follows the light block it shadows, so a light
 * value never leaks into dark. The base `:root` and `.dark` blocks above carry
 * the default accent, and `.opsin-product.dark` at (0,2,0) is outranked by
 * source order, because these blocks come after it.
 *
 * The theme that answers `prefers-contrast: more` is emitted a second time
 * inside that query, with selectors that match whatever theme the page chose,
 * last in the file, so the reader's request for contrast wins over the
 * product's choice of look.
 */
function emitAccentCss(plan: AccentPlan, tokens: TokenLeaf[]): string {
  const themeAttr = plan.themeAttribute
  const accentAttr = plan.accentAttribute
  const themeScope = (id: string) => `[${themeAttr}="${id}"]`
  const accentScope = (id: string) => `[${accentAttr}="${id}"]`
  const blocks: string[] = [
    "/* Accent themes, from tokens/accent.json (ADR 0029). A page picks a theme",
    `   with ${themeAttr} and an accent with ${accentAttr}, on <html> or on any`,
    "   element that starts a scope; with neither it renders the default theme's",
    "   default accent declared above. @opsinjs/react's roles.css points the product roles",
    "   (--primary, --brand, --brand-ink, --ring and the rest) at these tokens and",
    "   re-declares them on any element carrying either attribute, so a scope",
    "   resolves its own values rather than inheriting its ancestor's. */",
  ]
  const pair = (light: string[], dark: string[], lightLines: string[], darkLines: string[]) => {
    blocks.push(cssBlock(light.join(",\n"), lightLines), cssBlock(dark.join(",\n"), darkLines))
  }

  for (const theme of plan.themes) {
    const scope = themeScope(theme.id)
    pair(
      [scope],
      darkScopes(scope),
      [...themeDeclarations(theme, "light", tokens), ...accentDeclarations(plan, theme, theme.defaultAccent, "light")],
      [...themeDeclarations(theme, "dark", tokens), ...accentDeclarations(plan, theme, theme.defaultAccent, "dark")],
    )
    for (const accent of plan.order) {
      const combined = theme.isDefault ? accentScope(accent) : `${scope}${accentScope(accent)}`
      pair(
        [combined],
        darkScopes(combined),
        accentDeclarations(plan, theme, accent, "light"),
        accentDeclarations(plan, theme, accent, "dark"),
      )
    }
  }

  const contrast = plan.themes.find((theme) => theme.prefersContrastMore)
  if (contrast) {
    const anyTheme = `[${themeAttr}]`
    const inner: string[] = [
      cssBlock(
        [":root", ".opsin-product", anyTheme].join(",\n"),
        [
          ...themeDeclarations(contrast, "light", tokens),
          ...accentDeclarations(plan, contrast, contrast.defaultAccent, "light"),
        ],
      ),
      cssBlock(
        [".dark", ".opsin-product.dark", ...darkScopes(anyTheme)].join(",\n"),
        [
          ...themeDeclarations(contrast, "dark", tokens),
          ...accentDeclarations(plan, contrast, contrast.defaultAccent, "dark"),
        ],
      ),
    ]
    for (const accent of plan.order) {
      const alone = accentScope(accent)
      const withTheme = `${anyTheme}${alone}`
      inner.push(
        cssBlock([alone, withTheme].join(",\n"), accentDeclarations(plan, contrast, accent, "light")),
        cssBlock([...darkScopes(alone), ...darkScopes(withTheme)].join(",\n"), accentDeclarations(plan, contrast, accent, "dark")),
      )
    }
    blocks.push(
      `/* A reader who asks the system for more contrast gets ${contrast.id}, whatever`,
      "   theme the product chose, and keeps the accent they picked, because every",
      "   theme defines the same nine. */",
      "@media (prefers-contrast: more) {",
      inner.map((block) => indent(block)).join("\n\n"),
      "}",
    )
  }
  return `${blocks.join("\n")}\n`
}

/**
 * packages/tokens/src/accents.ts: the themes, the nine accents and a swatch for each,
 * which is all a picker needs. The values are the light and dark accent fills,
 * the colour a reader sees on a ticked box or, in vibes and stryk, the action.
 */
/**
 * The token table as published data, for @opsinjs/tokens.
 *
 * One record per custom property, with the fields a consumer needs to read a
 * token: its name, its property, where it sits, its light, dark and Display-P3
 * values, and what it controls. The documentation's own fields (`usedBy`, the
 * source path, the resolved literals) stay in lib/generated/tokens.ts, because
 * they describe this repository rather than the token.
 */
function publishedTokens(tokens: TokenLeaf[]): Record<string, string>[] {
  return tokens.map((token) => {
    const row: Record<string, string> = {
      name: token.cssVar.replace(PREFIX, ""),
      cssVar: token.cssVar,
      namespace: token.group,
      tier: token.tier,
      group: token.namespace,
      value: token.value,
    }
    if (token.dark !== undefined) row.darkValue = token.dark
    if (token.p3 !== undefined) row.p3Value = token.p3
    if (token.p3Dark !== undefined) row.p3DarkValue = token.p3Dark
    row.description = token.description ?? describe(token)
    return row
  })
}

function emitTokensJson(tokens: TokenLeaf[], hash: string): string {
  return `${JSON.stringify({ sourceHash: hash, tokens: publishedTokens(tokens) }, null, 2)}\n`
}

function emitTokensModule(tokens: TokenLeaf[], hash: string): string {
  const rows = publishedTokens(tokens)
    .map((row) => `  { ${Object.entries(row).map(([key, value]) => `${key}: ${q(value)}`).join(", ")} },`)
    .join("\n")
  return [
    "/* GENERATED FILE - DO NOT EDIT.",
    " *",
    " * Source:    apps/www/tokens/*.json",
    " * Generator: apps/www/scripts/build-tokens.mts   (`pnpm run generate`)",
    " * Gate:      `pnpm check:generated` regenerates this file and fails on a diff.",
    " *",
    " * The same tokens tokens.css declares, as data. A value may be a var()",
    " * reference to another token, exactly as it appears in the stylesheet.",
    " */",
    "",
    'export * from "./accents.ts"',
    "",
    "/** The source file a token came from. */",
    `export type TokenNamespace = ${[...new Set(tokens.map((token) => token.group))].map(q).join(" | ") || "string"}`,
    "",
    "/** `primitive` is a step on a ramp; `semantic` is a role a component reads. */",
    'export type TokenTier = "primitive" | "semantic"',
    "",
    "export interface Token {",
    "  /** The name without the prefix: `status-urgent-ink`. */",
    "  name: string",
    "  /** The custom property: `--opsin-status-urgent-ink`. */",
    "  cssVar: string",
    "  namespace: TokenNamespace",
    "  tier: TokenTier",
    "  /** The family within the namespace: `status`, `category`, `neutral`. */",
    "  group: string",
    "  /** The light value, as it appears in CSS. May be a var() reference. */",
    "  value: string",
    "  /** The dark value, when it differs from the light one. */",
    "  darkValue?: string",
    "  /** The Display-P3 value, applied inside `@supports (color-gamut: p3)`. */",
    "  p3Value?: string",
    "  /** The Display-P3 value for the dark theme. */",
    "  p3DarkValue?: string",
    "  /** What the token controls. */",
    "  description: string",
    "}",
    "",
    "/** A hash of the token sources, the same value tokens.css carries on --opsin-tokens-generated. */",
    `export const TOKEN_SOURCE_HASH = ${q(hash)}`,
    "",
    "export const TOKENS: readonly Token[] = [",
    rows,
    "]",
    "",
  ].join("\n")
}

function emitAccentsModule(plan: AccentPlan, hash: string): string {
  const themes = plan.themes.map((theme) => ({
    id: theme.id,
    label: theme.label,
    summary: theme.summary,
    isDefault: theme.isDefault,
    defaultAccent: theme.defaultAccent,
    floors: theme.floors,
    prefersContrastMore: theme.prefersContrastMore,
  }))
  const accents = plan.order.map((id) => ({ id, label: plan.labels[id] ?? id, hue: plan.hues[id] ?? null }))
  const swatches: Record<string, Record<string, { light: string; dark: string }>> = {}
  for (const theme of plan.themes) {
    swatches[theme.id] = {}
    for (const accent of plan.order) {
      const entry = theme.accents.get(accent)
      if (!entry) continue
      ;(swatches[theme.id] as Record<string, { light: string; dark: string }>)[accent] = {
        light: entry.light.fill ?? "transparent",
        dark: entry.dark.fill ?? "transparent",
      }
    }
  }
  const fallback = defaultTheme(plan)
  return [
    "/* GENERATED FILE - DO NOT EDIT.",
    " *",
    " * Source:    apps/www/tokens/accent.json",
    " * Generator: apps/www/scripts/build-tokens.mts   (`pnpm run generate`)",
    " * Gate:      `pnpm check:generated` regenerates this file and fails on a diff.",
    " *",
    " * The accent themes as data, for a theme picker. Set ACCENT_THEME_ATTRIBUTE",
    " * and ACCENT_ATTRIBUTE on any element to theme what is inside it. The",
    " * colours themselves are tokens in tokens.css; nothing here is a value a",
    " * component should paint with.",
    " */",
    "",
    `export const ACCENT_SOURCE_HASH = ${JSON.stringify(hash)}`,
    "",
    `export const ACCENT_THEME_ATTRIBUTE = ${JSON.stringify(plan.themeAttribute)}`,
    `export const ACCENT_ATTRIBUTE = ${JSON.stringify(plan.accentAttribute)}`,
    "",
    "export interface GeneratedAccentTheme {",
    "  id: string",
    "  label: string",
    "  summary: string",
    "  isDefault: boolean",
    "  defaultAccent: string",
    '  floors: "standard" | "enhanced"',
    "  prefersContrastMore: boolean",
    "}",
    "",
    "export interface GeneratedAccent {",
    "  id: string",
    "  label: string",
    "  /** The OKLCH hue, or null for the one accent with none. */",
    "  hue: number | null",
    "}",
    "",
    `export const ACCENT_THEMES: GeneratedAccentTheme[] = ${JSON.stringify(themes, null, 2)}`,
    "",
    `export const ACCENTS: GeneratedAccent[] = ${JSON.stringify(accents, null, 2)}`,
    "",
    "/** Theme id, then accent id, to the accent fill in each mode. */",
    `export const ACCENT_SWATCHES: Record<string, Record<string, { light: string; dark: string }>> = ${JSON.stringify(swatches, null, 2)}`,
    "",
    "/** What a page renders when it sets no attribute. */",
    `export const DEFAULT_ACCENT_THEME = ${JSON.stringify(fallback.id)}`,
    `export const DEFAULT_ACCENT = ${JSON.stringify(fallback.defaultAccent)}`,
    "",
  ].join("\n")
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
     `packages/react/src/status.ts` hand-writes OPSIN-0001's code, its docs id and a message,
     because `axisConflict()` is the never-mix rule as a FUNCTION and that file
     is required to have no imports at all - the scripts load it under plain
     node. Its message is deliberately not identical: errors.json's opens with
     `<{component}>`, and `axisConflict()` has no component name to interpolate.
     What must never drift is which code it claims and where it sends a reader,
     so that is asserted here rather than left to be noticed. */
  const axis = codes.find((entry) => entry.code === "OPSIN-0001")
  if (axis !== undefined) {
    const statusSource = mustRead(
      join(REACT_PKG, "src", "status.ts"),
      "it hand-writes OPSIN-0001 and has to be checked against tokens/errors.json",
    )
    const claimsCode = statusSource.includes(`"${axis.code}"`)
    const claimsDocs = axis.docs === "" || statusSource.includes(`"${axis.docs}"`)
    if (!claimsCode || !claimsDocs) {
      console.error(
        [
          "build-tokens: packages/react/src/status.ts and tokens/errors.json disagree about OPSIN-0001.",
          `  errors.json: code ${axis.code}, docs ${axis.docs || "(none)"}`,
          `  status.ts: ${claimsCode ? "code found" : "code NOT found"}, ${claimsDocs ? "docs id found" : "docs id NOT found"}`,
          "",
          "  `axisConflict()` in packages/react/src/status.ts is the never-mix rule as a function and",
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
 * The unit table                                                      *
 *                                                                     *
 * tokens/units.json is authored data rather than a token source - it   *
 * declares no custom property - and it is here for the same reason     *
 * errors.json is: several places need one answer and none of them may  *
 * drift. What it answers is how a unit is SPOKEN. A screen reader      *
 * handed `mmHg` improvises, and "em em aitch gee" is a failure.        *
 *                                                                     *
 * WHAT THIS BUILDER REFUSES TO EMIT, and the refusal is the point: a   *
 * reference range, a threshold, a plausibility bound, a "typical"      *
 * value, or a default precision, for any metric in any population. A   *
 * unit table says what a number is measured in; it never says what a   *
 * number should be. `FORBIDDEN_UNIT_KEYS` below is that sentence as a  *
 * gate, so the file cannot quietly become clinical content one pull    *
 * request at a time.                                                   *
 * ------------------------------------------------------------------ */

/** An exact rational, as integers, so a conversion never depends on a float. */
interface Rational {
  n: bigint
  d: bigint
}

/** How a unit reaches its family's base unit: `base = value * n/d + on/od`. */
interface ToBase {
  unit: string
  scale: Rational
  offset: Rational
  basis: string
}

interface UnitRow {
  id: string
  symbol: string
  spoken: string
  plural: string
  measures: string
  joined?: true
  toBase?: ToBase
}

/** One ordered pair, composed by the generator and never authored directly. */
interface UnitConversionRow {
  from: string
  to: string
  scale: Rational
  offset: Rational
  basis: string[]
}

interface RefusedRow {
  between: [string, string]
  reason: string
  docs: string
}

interface UnitTable {
  policy: { key: string; text: string }[]
  units: UnitRow[]
  conversions: UnitConversionRow[]
  refused: RefusedRow[]
}

/**
 * Keys a unit row may never carry, and the whole safety argument for this file.
 *
 * Every one of these is a statement about what a reading SHOULD be, and none of
 * them is a property of a unit. `mmol/L` is used for glucose, cholesterol and
 * several other analytes whose ranges have nothing in common, so a `low` on the
 * unit would be wrong for all but one of them - and wrong in a place nobody
 * would think to look, because it would be sitting in a file called "units".
 *
 * `precision` and `decimals` are in the list for a different reason and it is
 * worth stating separately: they are not unsafe, they are simply not a property
 * of a unit either. health/numbers-units-precision rule 2 is canonical -
 * "Precision is a property of the metric, not of the value" - and a per-unit
 * default would silently make two metrics reported in the same unit agree about
 * something they do not agree about.
 */
const FORBIDDEN_UNIT_KEYS = [
  "low",
  "high",
  "min",
  "max",
  "minimum",
  "maximum",
  "range",
  "usualRange",
  "reference",
  "threshold",
  "bound",
  "plausible",
  "typical",
  "default",
  "precision",
  "decimals",
  "decimalPlaces",
]

/** Greatest common divisor, for reducing a composed conversion to lowest terms. */
function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a
  let y = b < 0n ? -b : b
  while (y !== 0n) {
    const t = x % y
    x = y
    y = t
  }
  return x === 0n ? 1n : x
}

/** Lowest terms, denominator always above zero, so one value has one spelling. */
function reduce(value: Rational): Rational {
  const sign = value.d < 0n ? -1n : 1n
  const n = value.n * sign
  const d = value.d * sign
  const g = gcd(n, d)
  return { n: n / g, d: d / g }
}

/**
 * A reduced rational as two safe integers.
 *
 * BigInt is used all the way through the composition because the intermediate
 * products overflow a double: composing stone against pound multiplies
 * 635029318 by 100000000, which is 6.35e16 and past 2^53, so a float would lose
 * the exactness that is the only reason these numbers are allowed in the file
 * at all. The reduced result is small - stone to pound is 14/1 - and this is
 * where that is checked rather than assumed.
 */
function safeInts(value: Rational, label: string): { n: number; d: number } {
  const limit = BigInt(Number.MAX_SAFE_INTEGER)
  if (value.n > limit || value.n < -limit || value.d > limit || value.d < -limit) {
    console.error(
      [
        `build-tokens: the conversion ${label} does not reduce to exact integers.`,
        `  Reduced to ${value.n}/${value.d}, which is past Number.MAX_SAFE_INTEGER.`,
        "",
        "  Every conversion in tokens/units.json is an exact definition and is",
        "  emitted as an exact fraction. A value that cannot survive the trip",
        "  through a double would be an approximation wearing a definition's",
        "  provenance, which is worse than having no conversion at all. Author the",
        "  pair with smaller integers, or remove it and add a refusedConversions",
        "  row saying why it is not there.",
      ].join("\n"),
    )
    process.exit(1)
  }
  return { n: Number(value.n), d: Number(value.d) }
}

function rationalFrom(
  node: JsonObject,
  numeratorKey: string,
  denominatorKey: string,
  fallback: Rational,
): Rational {
  const n = num(node[numeratorKey])
  const d = num(node[denominatorKey])
  if (n === undefined && d === undefined) return fallback
  return { n: BigInt(n ?? 0), d: BigInt(d ?? 1) }
}

function buildUnits(source: JsonObject | undefined): UnitTable {
  if (!source) return { policy: [], units: [], conversions: [], refused: [] }

  const policy: { key: string; text: string }[] = []
  for (const [key, value] of Object.entries(obj(source.policy) ?? {})) {
    if (isMetaKey(key)) continue
    const text = str(value)
    if (text !== undefined) policy.push({ key, text })
  }

  const units: UnitRow[] = []
  const malformed: string[] = []
  const forbidden: string[] = []

  for (const row of arr(source.units)) {
    const id = str(row.id)
    const symbol = str(row.symbol)
    const spoken = str(row.spoken)
    const plural = str(row.plural)
    const measures = str(row.measures)
    /* Only the literal boolean `true` sets this. A string "true" or a 1 is not
       an author saying the symbol attaches to the number, so it stays absent. */
    const joined = row.joined === true ? (true as const) : undefined

    for (const key of FORBIDDEN_UNIT_KEYS) {
      if (Object.hasOwn(row, key)) forbidden.push(`${id ?? symbol ?? "a row"} carries \`${key}\``)
    }

    /* A row missing any of the five is not a unit this table can use, and none
       of the five has an honest default. A missing `spoken` is the worst of
       them: it is the one thing this file exists to carry, and a row without it
       would silently fall back to letting a screen reader improvise - which is
       the failure, restored, from inside the fix. */
    if (!id || !symbol || !spoken || !plural || !measures) {
      malformed.push(
        `${id ?? symbol ?? "a row with no id"} is missing ` +
          [
            !id ? "`id`" : "",
            !symbol ? "`symbol`" : "",
            !spoken ? "`spoken`" : "",
            !plural ? "`plural`" : "",
            !measures ? "`measures`" : "",
          ]
            .filter(Boolean)
            .join(", "),
      )
      continue
    }

    const toBaseNode = obj(row.toBase)
    let toBase: ToBase | undefined
    if (toBaseNode) {
      const unit = str(toBaseNode.unit)
      const basis = str(toBaseNode.basis)
      if (!unit || !basis) {
        malformed.push(`${id} has a \`toBase\` with no \`unit\` or no \`basis\``)
        continue
      }
      const scale = rationalFrom(toBaseNode, "numerator", "denominator", { n: 1n, d: 1n })
      const offset = rationalFrom(toBaseNode, "offsetNumerator", "offsetDenominator", {
        n: 0n,
        d: 1n,
      })
      if (scale.d === 0n || offset.d === 0n || scale.n === 0n) {
        malformed.push(`${id} has a \`toBase\` with a zero numerator or denominator`)
        continue
      }
      toBase = { unit, scale: reduce(scale), offset: reduce(offset), basis }
    }

    units.push({ id, symbol, spoken, plural, measures, joined, toBase })
  }

  if (forbidden.length > 0) {
    console.error(
      [
        "build-tokens: tokens/units.json carries a key that says what a reading should be.",
        ...forbidden.map((entry) => `  ${entry}`),
        "",
        "  A unit table says what a number is MEASURED IN. It never says what a",
        "  number should be, for any metric, in any population - not a reference",
        "  range, not a threshold, not a plausibility bound, not a 'typical' value.",
        "  That line is the entire safety argument for this file existing, and this",
        "  gate is that sentence. Whoever owns the threshold owns it; opsinjs is a",
        "  presentation layer and does not.",
        "",
        "  `precision` and `decimals` are refused for a different reason: decimal",
        "  places belong to the MEASUREMENT, not to the unit. Two metrics reported",
        "  in mmol/L do not share a number of decimal places. See",
        "  health/numbers-units-precision, rule 2, which is canonical.",
      ].join("\n"),
    )
    process.exit(1)
  }

  if (malformed.length > 0) {
    console.error(
      [
        "build-tokens: tokens/units.json has a row this table cannot use.",
        ...malformed.map((entry) => `  ${entry}`),
        "",
        "  `id`, `symbol`, `spoken`, `plural` and `measures` are all required. A row",
        "  without `spoken` is the defect this file exists to prevent: a screen",
        "  reader handed a symbol with no spoken form invents a pronunciation, and",
        "  'em em aitch gee' is not a blood pressure.",
      ].join("\n"),
    )
    process.exit(1)
  }

  /* Two rows claiming one id, or one symbol, is the mistake this file cannot
     survive. The emitted lookup is keyed by symbol, so the second row would
     silently replace the first and a reading would be announced in a unit
     nobody chose. */
  for (const [field, values] of [
    ["id", units.map((unit) => unit.id)],
    ["symbol", units.map((unit) => unit.symbol)],
  ] as const) {
    const repeated = [...new Set(values.filter((v, i, all) => all.indexOf(v) !== i))]
    if (repeated.length > 0) {
      console.error(
        [
          `build-tokens: tokens/units.json declares a ${field} more than once.`,
          ...repeated.map((value) => `  ${q(value)}`),
          "",
          `  Every ${field} names exactly one unit. The emitted table is looked up by`,
          "  symbol, so a repeat means a reading is spoken in a unit nobody chose.",
        ].join("\n"),
      )
      process.exit(1)
    }
  }

  const byId = new Map(units.map((unit) => [unit.id, unit]))
  const bySymbol = new Map(units.map((unit) => [unit.symbol, unit]))

  /* A base unit has to declare itself as its own base, at 1/1 with no offset.
     Writing it out rather than inferring it is what makes the family visible in
     the source: a reader of units.json can see which unit the others are
     defined against without running anything. */
  const brokenBase: string[] = []
  for (const unit of units) {
    if (!unit.toBase) continue
    const base = byId.get(unit.toBase.unit)
    if (!base) {
      brokenBase.push(`${unit.id} converts to ${q(unit.toBase.unit)}, which is not a unit here`)
      continue
    }
    if (!base.toBase || base.toBase.unit !== base.id) {
      brokenBase.push(
        `${unit.id} converts to ${base.id}, which does not declare itself as its own base`,
      )
      continue
    }
    if (unit.id === base.id && (unit.toBase.scale.n !== 1n || unit.toBase.scale.d !== 1n || unit.toBase.offset.n !== 0n)) {
      brokenBase.push(`${unit.id} is its own base but does not convert to itself at 1/1 with no offset`)
    }
  }
  if (brokenBase.length > 0) {
    console.error(
      [
        "build-tokens: tokens/units.json has a conversion family that does not close.",
        ...brokenBase.map((entry) => `  ${entry}`),
        "",
        "  Every unit with a `toBase` names one base unit, and that base unit names",
        "  itself at numerator 1, denominator 1 and no offset. The generator composes",
        "  every other pair from those two facts, so a family that does not close",
        "  would emit conversions with nothing underneath them.",
      ].join("\n"),
    )
    process.exit(1)
  }

  /* THE CLOSURE. Authoring is one row per unit - how to reach the base - and
     the generator does the rest, in both directions, exactly. Authoring pairs
     by hand would mean n(n-1) rows kept in step with each other, and the first
     one to fall out of step would be a conversion that disagrees with its own
     inverse.

       base = a * (na/da) + (oa/oda)
       b    = (base - ob/odb) * (db/nb)

     so, composing and collecting:

       scale  = (na * db) / (da * nb)
       offset = (oa*odb - ob*oda) * db / (oda * odb * nb)  */
  const conversions: UnitConversionRow[] = []
  for (const from of units) {
    if (!from.toBase) continue
    for (const to of units) {
      if (!to.toBase || to.id === from.id) continue
      if (to.toBase.unit !== from.toBase.unit) continue
      const a = from.toBase
      const b = to.toBase
      const scale = reduce({ n: a.scale.n * b.scale.d, d: a.scale.d * b.scale.n })
      const offset = reduce({
        n: (a.offset.n * b.offset.d - b.offset.n * a.offset.d) * b.scale.d,
        d: a.offset.d * b.offset.d * b.scale.n,
      })
      /* Both bases are named, and in this order, because a reader checking a
         number wants to see the two definitions it was composed from rather
         than a single sentence somebody wrote about the pair. */
      const basis = from.id === a.unit ? [b.basis] : to.id === b.unit ? [a.basis] : [a.basis, b.basis]
      conversions.push({ from: from.symbol, to: to.symbol, scale, offset, basis })
    }
  }
  conversions.sort((x, y) => x.from.localeCompare(y.from, "en") || x.to.localeCompare(y.to, "en"))

  const refused: RefusedRow[] = []
  const unknownRefusal: string[] = []
  for (const row of arr(source.refusedConversions)) {
    const between = Array.isArray(row.between) ? (row.between as Json[]).map(String) : []
    const reason = str(row.reason)
    const docs = str(row.docs) ?? ""
    const [first, second] = between
    if (between.length !== 2 || !first || !second || !reason) {
      unknownRefusal.push("a row with no `between` pair or no `reason`")
      continue
    }
    for (const symbol of [first, second]) {
      if (!bySymbol.has(symbol)) unknownRefusal.push(`${q(symbol)} is not a unit in this file`)
    }
    refused.push({ between: [first, second], reason, docs })
  }

  /* A pair cannot be both convertible and refused. If it ever were, which of
     the two a component believed would depend on which list it read first -
     and one of the two answers is a number on somebody's screen. */
  for (const row of refused) {
    const [first, second] = row.between
    const clash = conversions.find(
      (conversion) =>
        (conversion.from === first && conversion.to === second) ||
        (conversion.from === second && conversion.to === first),
    )
    if (clash) {
      unknownRefusal.push(
        `${q(first)} to ${q(second)} is both refused and reachable through a shared base unit`,
      )
    }
  }

  if (unknownRefusal.length > 0) {
    console.error(
      [
        "build-tokens: tokens/units.json has a refusedConversions row that does not hold.",
        ...unknownRefusal.map((entry) => `  ${entry}`),
        "",
        "  A refusal names two units that ARE in this file and says why the pair is",
        "  not arithmetic. A refusal naming a unit that is not here documents",
        "  nothing, and a pair that is both refused and reachable would leave a",
        "  component to pick between two answers about somebody's reading.",
      ].join("\n"),
    )
    process.exit(1)
  }

  units.sort((a, b) => a.id.localeCompare(b.id, "en"))
  refused.sort(
    (a, b) =>
      a.between[0].localeCompare(b.between[0], "en") ||
      a.between[1].localeCompare(b.between[1], "en"),
  )

  return { policy, units, conversions, refused }
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

function emitCss(tokens: TokenLeaf[], hash: string, accentCss = ""): string {
  const parts: string[] = [
    "/* GENERATED FILE - DO NOT EDIT.",
    " *",
    " * Source:    tokens/*.json",
    " * Generator: scripts/build-tokens.mts   (`pnpm run generate`)",
    " * Gate:      `pnpm check:generated` regenerates this file and fails on a diff.",
    " *",
    " * This is @opsinjs/tokens/tokens.css. Load it before @opsinjs/react's role",
    " * layer, which reads these properties; @opsinjs/react/styles.css and",
    " * @opsinjs/react/tailwind.css already do. Every property is declared on",
    " * `:root` and on `.opsin-product`, and the dark values on `.dark`.",
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

  if (accentCss !== "") parts.push(accentCss)

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
 * Who consumes a token                                                *
 * ------------------------------------------------------------------ */

/**
 * The `usedBy` column is derived here, from the shipped component sources, and
 * it is the one column in the token tables that answers "is changing this a
 * local adjustment or a system event".
 *
 * TWO WAYS A COMPONENT REACHES A TOKEN, and a scan that reads only the first
 * one is worse than no scan at all, because it looks measured while reporting
 * nothing for the colour tokens:
 *
 *   1. Literally, as `var(--opsin-…)` in a style object or a CSS file. Eight
 *      properties across the base layer are written this way.
 *   2. Through a Tailwind utility, which @opsinjs/react's theme.css bridges back to the
 *      token in its `@theme inline` block: `bg-status-urgent-surface` resolves
 *      `--color-status-urgent-surface`, which is `var(--opsin-status-urgent-surface)`.
 *      This is how almost every status, category, type, space and radius token
 *      is actually consumed, and none of those files contains the string
 *      `--opsin-` for them.
 *
 * So the bridge is parsed first and inverted: each `@theme inline` declaration
 * whose value references a token yields the utility fragment a class name ends
 * with (`--color-status-urgent-surface` -> `status-urgent-surface`), and the
 * type ramp's four sub-keys (`--text-opsin-body--line-height` and friends)
 * collapse onto the one fragment `opsin-body`, because `text-opsin-body` sets
 * all four at once.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not read comments, so a file that
 * discusses a utility without using it is not credited. It does not invent a
 * consumer for a class name assembled at runtime - but it does not have to,
 * because Tailwind cannot see one either, which is why every component here
 * keeps a static map of whole class names. A `var()` interrupted by a template
 * hole (`var(--opsin-material-${rung}-tint)`) is matched as a wildcard, since
 * every rung the prop admits is genuinely read. Examples and screens are out of
 * scope: this column names the components that read a token, not the demos.
 *
 * An empty result is therefore a real statement - no shipped component reads
 * this token directly - and for a primitive that is the expected state, because
 * components consume roles and roles reference primitives.
 */
function themeBridge(): Map<string, Set<string>> {
  const fragments = new Map<string, Set<string>>()
  const source = exists(PRODUCT_CSS) ? readFileSync(PRODUCT_CSS, "utf8") : ""
  const lines = source.split("\n")
  const start = lines.findIndex((line) => line.trim().startsWith("@theme"))
  if (start === -1) return fragments

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    if (line.trim() === "}") break
    const declaration = /^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/.exec(line)
    if (!declaration) continue
    const referenced = [...(declaration[2] ?? "").matchAll(/var\(\s*(--opsin-[a-z0-9-]+)/g)].map(
      (match) => match[1] as string,
    )
    if (referenced.length === 0) continue
    /* `--text-opsin-body--line-height` is the line-height sub-key of the one
       utility `text-opsin-body`; split at the double dash before dropping the
       namespace, or the sub-keys become fragments no class name can match. */
    const key = (declaration[1] ?? "").slice(2).split("--")[0] ?? ""
    const fragment = key.split("-").slice(1).join("-")
    if (fragment === "") continue
    const set = fragments.get(fragment) ?? new Set<string>()
    for (const cssVar of referenced) set.add(cssVar)
    fragments.set(fragment, set)
  }
  return fragments
}

/** Blanks comments so a mention is never mistaken for a use. */
function withoutComments(code: string): string {
  let out = ""
  let index = 0
  while (index < code.length) {
    if (code.startsWith("/*", index)) {
      const end = code.indexOf("*/", index + 2)
      index = end === -1 ? code.length : end + 2
      out += " "
      continue
    }
    if (code.startsWith("//", index)) {
      const end = code.indexOf("\n", index)
      index = end === -1 ? code.length : end
      out += " "
      continue
    }
    out += code[index]
    index += 1
  }
  return out
}

function sourceFilesUnder(dir: string): string[] {
  if (!exists(dir)) return []
  const found: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      found.push(...sourceFilesUnder(full))
      continue
    }
    if (/\.(tsx|ts|css)$/.test(entry.name)) found.push(full)
  }
  return found
}

function scanUsedBy(tokens: TokenLeaf[]): Map<string, string[]> {
  const consumers = new Map<string, Set<string>>()
  const fragments = themeBridge()
  const known = new Set(tokens.map((token) => token.cssVar))

  for (const file of sourceFilesUnder(BASES_DIR)) {
    const id = file.split("/").pop()?.replace(/\.(tsx|ts|css)$/, "") ?? ""
    if (id === "") continue
    /* A template hole becomes `*`, so `var(--opsin-material-${rung}-tint)`
       survives as a matchable pattern instead of truncating at the brace. */
    const code = withoutComments(readFileSync(file, "utf8")).replace(/\$\{[^{}]*\}/g, "*")

    const credit = (cssVar: string): void => {
      const set = consumers.get(cssVar) ?? new Set<string>()
      set.add(id)
      consumers.set(cssVar, set)
    }

    for (const match of code.matchAll(/--opsin-[a-z0-9*-]+/g)) {
      const pattern = match[0]
      if (!pattern.includes("*")) {
        if (known.has(pattern)) credit(pattern)
        continue
      }
      const expanded = new RegExp(
        `^${pattern.split("*").map(escapeRegExp).join("[a-z0-9-]+")}$`,
      )
      for (const cssVar of known) if (expanded.test(cssVar)) credit(cssVar)
    }

    const words = new Set(
      code.split(/[^a-z0-9-]+/).filter((word) => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/.test(word)),
    )
    for (const [fragment, cssVars] of fragments) {
      let hit = false
      for (const word of words) {
        if (word === fragment || word.endsWith(`-${fragment}`)) {
          hit = true
          break
        }
      }
      if (!hit) continue
      for (const cssVar of cssVars) if (known.has(cssVar)) credit(cssVar)
    }
  }

  const usedBy = new Map<string, string[]>()
  for (const [cssVar, ids] of consumers) usedBy.set(cssVar, [...ids].sort())
  return usedBy
}

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&")
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

  const usedBy = scanUsedBy(tokens)

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
      fields.push(`usedBy: [${(usedBy.get(token.cssVar) ?? []).map(q).join(", ")}]`)
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
   * Which registry components consume it. The THIRD column, and the one that
   * turns a token list into a decision aid.
   *
   * Derived by scanning the @opsinjs/react components for two things: the token's custom
   * property written literally, and any Tailwind utility that its theme.css
   * bridges back to it in \`@theme inline\` - which is how the status, category,
   * type, space and radius tokens are really consumed. Empty means no shipped
   * component reads this token, which for a primitive is the expected state:
   * components consume roles, and roles reference primitives. Examples and
   * screens are out of scope, so a token used only by a demo reads empty too.
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
   * \`warnOnce()\` in \`packages/react/src/opsinjs.ts\`, which carries its own copy of this table
   * because that file is published in @opsinjs/react and this one is not.
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
 * into ranges: see \`decisions/0015-error-codes-are-flat.md\` at the repository root.
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
        `build-tokens: ${relative(REPO_DIR, file)} has lost its generated region markers.`,
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
 * The error table as TypeScript, for the region inside `packages/react/src/opsinjs.ts`.
 *
 * WHY THIS TABLE IS EMITTED TWICE, AND WHY THE SECOND COPY IS NOT IN
 * `lib/generated/`. `packages/react/src/opsinjs.ts` is published inside @opsinjs/react, which
 * reaches a project that has none of this repository - no `tokens/`, no
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
 * The shipped copy of the unit table                                  *
 * ------------------------------------------------------------------ */

/**
 * Grows the reserved space in packages/react/src/opsinjs.ts into a pair of region markers.
 *
 * Runs once, on the first generate after tokens/units.json lands, and is a
 * no-op ever after: the moment the begin marker exists, this returns the file
 * untouched and `spliceRegion` does the ordinary three-way splice.
 *
 * WHY AN ANCHOR RATHER THAN AN APPEND. packages/react/src/opsinjs.ts shipped with a comment
 * block reserving this space, in this position, with the sentence "Leave the
 * space; do not fill it from memory" - the table belongs above the error region
 * and below the shared shapes, and appending would put it wherever the file
 * happens to end. Anchoring on the block's own first line puts the generated
 * table exactly where the file said it should go, and does it without a human
 * hand-editing a file that another worker may be inside.
 *
 * A missing anchor is fatal for the same reason a missing marker is: silently
 * recovering would put a second unit table in a file that may already ship one,
 * and two spoken forms for one symbol is the drift this pipeline exists to
 * prevent.
 */
function installUnitsRegion(file: string, current: string): string {
  if (current.includes(UNITS_REGION_BEGIN)) return current

  const anchor = current.indexOf(UNITS_PLACEHOLDER_ANCHOR)
  const open = anchor === -1 ? -1 : current.lastIndexOf("/*", anchor)
  const close = anchor === -1 ? -1 : current.indexOf("*/", anchor)
  if (anchor === -1 || open === -1 || close === -1) {
    console.error(
      [
        `build-tokens: ${relative(REPO_DIR, file)} has neither the unit-table region nor the space reserved for it.`,
        `  Expected either a line beginning ${q(UNITS_REGION_BEGIN)}, or the comment`,
        `  block whose first line reads ${q(UNITS_PLACEHOLDER_ANCHOR)}.`,
        "",
        "  tokens/units.json is emitted into that file because it is one of the two",
        "  modules @opsinjs/react publishes, and a spoken unit",
        "  form that exists here and not there would make every installed component",
        "  read a symbol out letter by letter. Restore either the markers - an empty",
        "  region between them is fine, this script fills it - or the reserved block,",
        "  and run `pnpm run generate` again.",
      ].join("\n"),
    )
    process.exit(1)
  }

  return (
    current.slice(0, open) +
    `${UNITS_REGION_BEGIN}. Replaced by scripts/build-tokens.mts from tokens/units.json */\n\n${UNITS_REGION_END}` +
    current.slice(close + 2)
  )
}

/**
 * Grows the reserved space in packages/react/src/opsinjs.ts into a pair of banned-word region
 * markers.
 *
 * Runs once, on the first generate after the anchor comment landed, and is a
 * no-op ever after: the moment the begin marker exists, this returns the file
 * untouched and `spliceRegion` does the ordinary three-way splice. It works
 * exactly like `installUnitsRegion`, and it is a separate function only because
 * the anchor sentence and the markers differ.
 *
 * The anchor is the comment block whose first line reads "The banned-word table
 * is deliberately NOT here yet", which sits below the `GeneratedBannedWord`
 * interface and above the example data. Anchoring on it keeps the generated
 * table in that position, without a human hand-editing a file another worker may
 * be inside, and it leaves the interface alone: the interface ships persistently
 * outside the region, so this region carries the data and nothing else.
 *
 * A missing anchor is fatal for the same reason a missing marker is: silently
 * recovering would put a second banned-word table in a file that may already
 * ship one, and a component free to print a barred word is the drift this
 * pipeline exists to prevent.
 */
function installBannedRegion(file: string, current: string): string {
  if (current.includes(BANNED_REGION_BEGIN)) return current

  const anchor = current.indexOf(BANNED_PLACEHOLDER_ANCHOR)
  const open = anchor === -1 ? -1 : current.lastIndexOf("/*", anchor)
  const close = anchor === -1 ? -1 : current.indexOf("*/", anchor)
  if (anchor === -1 || open === -1 || close === -1) {
    console.error(
      [
        `build-tokens: ${relative(REPO_DIR, file)} has neither the banned-word region nor the space reserved for it.`,
        `  Expected either a line beginning ${q(BANNED_REGION_BEGIN)}, or the comment`,
        `  block whose first line reads ${q(BANNED_PLACEHOLDER_ANCHOR)}.`,
        "",
        "  tokens/glossary.json's banned list is emitted into that file because it is",
        "  one of the two modules @opsinjs/react publishes, and a",
        "  word this pipeline bars here but not there would let an installed component",
        "  print the one word the doctrine bans outright. Restore either the markers, an",
        "  empty region between them is fine, this script fills it, or the reserved",
        "  block, and run `pnpm run generate` again.",
      ].join("\n"),
    )
    process.exit(1)
  }

  return (
    current.slice(0, open) +
    `${BANNED_REGION_BEGIN}. Replaced by scripts/build-tokens.mts from tokens/glossary.json */\n\n${BANNED_REGION_END}` +
    current.slice(close + 2)
  )
}

/**
 * The banned-word table as TypeScript, for the region inside `packages/react/src/opsinjs.ts`.
 *
 * Emitted into the file that TRAVELS, for the same reason the error and unit
 * tables are: `lib/generated/` is not part of @opsinjs/react, and a component
 * installed into somebody else's project still has to know that a word such as
 * "normal" is one its copy must not use. The reviewable copy, with the authored
 * policy prose attached, is the `banned` list in lib/generated/glossary.json;
 * this is the copy a warning channel reads at runtime.
 *
 * Only the `BANNED_WORDS` const is emitted here. The `GeneratedBannedWord`
 * interface it is typed against ships persistently above this region in
 * packages/react/src/opsinjs.ts, so emitting it a second time would declare the name twice.
 * That is a departure from this subtask's plan, which asked for the interface as
 * well; wave 1 shipped the interface outside the region, so the code wins and
 * this emits the rows alone. The rows come from the same `glossary.banned`
 * object that fills lib/generated/tokens.ts, so the two copies cannot drift.
 */
function emitSubstrateBanned(banned: BannedWord[]): string {
  const rows = banned
    .map((row) =>
      [
        "  {",
        `    word: ${q(row.word)},`,
        `    instead: ${q(row.instead)},`,
        `    reason: ${q(row.reason)},`,
        "  },",
      ].join("\n"),
    )
    .join("\n")

  return `/** Words a component's copy must not use, with the replacement and the reason. Generated from \`tokens/glossary.json\`. */
export const BANNED_WORDS: GeneratedBannedWord[] = [
${rows}
]`
}

/** A rational as the two integer fields the emitted table carries. */
function conversionInts(row: UnitConversionRow): {
  n: number
  d: number
  on: number
  od: number
} {
  const label = `${row.from} to ${row.to}`
  const scale = safeInts(row.scale, label)
  const offset = safeInts(row.offset, label)
  return { n: scale.n, d: scale.d, on: offset.n, od: offset.d }
}

/**
 * The unit table as TypeScript, for the region inside `packages/react/src/opsinjs.ts`.
 *
 * Emitted into the file that TRAVELS, for the same reason the error table is:
 * `lib/generated/` is not part of @opsinjs/react, and a component installed
 * into somebody else's project still has to know that `mmHg` is spoken
 * "millimetres of mercury". The copy in lib/generated/units.json is the
 * reviewable one, with the authored policy prose attached; this one is the one
 * that renders.
 *
 * The lookup map is derived from the array at module load rather than emitted
 * a second time. Two literal copies of the same twenty rows is two copies that
 * can disagree about a unit, and this file is generated precisely so that
 * cannot happen.
 */
function emitSubstrateUnits(table: UnitTable): string {
  const unitRows = table.units
    .map((unit) =>
      [
        "  {",
        `    id: ${q(unit.id)},`,
        `    symbol: ${q(unit.symbol)},`,
        `    spoken: ${q(unit.spoken)},`,
        `    plural: ${q(unit.plural)},`,
        `    measures: ${q(unit.measures)},`,
        ...(unit.joined === true ? ["    joined: true,"] : []),
        "  },",
      ].join("\n"),
    )
    .join("\n")

  const conversionRows = table.conversions
    .map((row) => {
      const ints = conversionInts(row)
      return [
        "  {",
        `    from: ${q(row.from)},`,
        `    to: ${q(row.to)},`,
        `    numerator: ${ints.n},`,
        `    denominator: ${ints.d},`,
        `    offsetNumerator: ${ints.on},`,
        `    offsetDenominator: ${ints.od},`,
        `    basis: [${row.basis.map(q).join(", ")}],`,
        "  },",
      ].join("\n")
    })
    .join("\n")

  const refusedRows = table.refused
    .map((row) =>
      [
        "  {",
        `    between: [${q(row.between[0])}, ${q(row.between[1])}],`,
        `    reason: ${q(row.reason)},`,
        `    docs: ${q(row.docs)},`,
        "  },",
      ].join("\n"),
    )
    .join("\n")

  return `/**
 * One unit: what it is called, what a reader sees, and how it is SPOKEN.
 *
 * The spoken form is the whole reason this table exists. A screen reader handed
 * \`mmHg\` improvises a pronunciation, and "one twenty over eighty em em aitch
 * gee" is a failure rather than a quirk.
 *
 * There is no reference range here, no threshold, no plausibility bound and no
 * default precision. A unit table says what a number is measured in; it never
 * says what a number should be. Decimal places belong to the MEASUREMENT and
 * travel with it from the product - health/numbers-units-precision, rule 2.
 *
 * \`joined\` is typography, not a claim about a reading: it records that a symbol
 * sits against the number with no space, as everyday English writes 98% and
 * 36.8°C. Which symbols take it is settled by
 * content/docs/content/grammar-and-mechanics.mdx, not by this table.
 */
export interface Unit {
  /** Stable key. Never the display symbol: \`°C\` is \`celsius\`. */
  id: string
  /** What a reader sees beside the number. Looked up by exactly this string. */
  symbol: string
  /** How to say it for exactly one of the thing. British English. */
  spoken: string
  /** How to say it for every other count, zero included. British English. */
  plural: string
  /** What is being measured, dimensionally. Never what a reading should be. */
  measures: string
  /** Whether the symbol attaches to the number with no space, as in 98% and 36.8°C. Absent means a space. */
  joined?: true
}

/** Every unit this system can speak, sorted by id. Generated from \`tokens/units.json\`. */
export const UNITS: Unit[] = [
${unitRows}
]

/**
 * The lookup \`findUnit()\` reads, derived from \`UNITS\` rather than emitted twice.
 *
 * Keyed by the exact symbol, case included. There is no fuzzy matching, because
 * a table that guesses which unit somebody meant is a table that will one day
 * guess wrong about a concentration.
 */
export const UNITS_BY_SYMBOL: Record<string, Unit> = Object.fromEntries(
  UNITS.map((unit) => [unit.symbol, unit]),
)

/**
 * An exact conversion between two units of the same kind.
 *
 * Applied as \`to = from * numerator / denominator + offsetNumerator /
 * offsetDenominator\`. Every field is an integer, and that is deliberate: these
 * are definitions rather than measurements, and a definition stored as a
 * rounded decimal is an approximation wearing a definition's provenance.
 *
 * \`basis\` names the definition each factor comes from. A conversion with no
 * basis does not belong in this system: opsinjs does not own a clinical number,
 * and the ones it does carry are the ones that are true by definition rather
 * than by measurement.
 */
export interface UnitConversion {
  /** Symbol converted from. */
  from: string
  /** Symbol converted to. */
  to: string
  numerator: number
  denominator: number
  offsetNumerator: number
  offsetDenominator: number
  /** Where each factor comes from, in the order they were composed. */
  basis: string[]
}

/** Every convertible ordered pair, composed by the generator. Never authored by hand. */
export const UNIT_CONVERSIONS: UnitConversion[] = [
${conversionRows}
]

/**
 * A pair people expect to be arithmetic and is not, with the reason.
 *
 * This list is the load-bearing half of the unit table. An omitted conversion
 * has to render as an explicit "we do not have this", never as a substituted
 * default, and a component that wants to explain WHY reads its reason here.
 */
export interface RefusedConversion {
  /** The two symbols, as authored. */
  between: [string, string]
  /** Why the pair is not a mathematical fact. Shown to a developer, not to a reader. */
  reason: string
  /** The docs page id that sets out the non-goal. */
  docs: string
}

/** Conversions this system refuses to publish, and why. Generated from \`tokens/units.json\`. */
export const REFUSED_CONVERSIONS: RefusedConversion[] = [
${refusedRows}
]

/**
 * The unit a symbol names, or \`undefined\` when this system has never heard of it.
 *
 * \`undefined\` rather than a fabricated entry, because the caller's honest
 * response to an unknown symbol is to render it as written - awkward to listen
 * to, but true - and never to guess at a pronunciation.
 */
export function findUnit(symbol: string): Unit | undefined {
  return Object.prototype.hasOwnProperty.call(UNITS_BY_SYMBOL, symbol)
    ? UNITS_BY_SYMBOL[symbol]
    : undefined
}

/**
 * How a screen reader should say this unit for this count.
 *
 * \`count\` is the value as DISPLAYED, after any rounding, because the words
 * follow what is on the screen rather than what was in the database. English
 * takes the singular for exactly one and the plural for everything else, zero
 * included: "0 kilograms", "1 kilogram", "1.5 kilograms".
 *
 * The known limit, stated rather than hidden: a value shown as "1.0" because
 * its measurement has one decimal place is still counted as one and is spoken
 * "1.0 kilogram". Both wordings are defensible in English and neither is
 * unsafe. The larger limit is that these words are British English in every
 * locale; \`tokens/units.json\` has no translations yet and does not pretend to.
 */
export function spokenUnit(symbol: string, count: number): string | undefined {
  const unit = findUnit(symbol)
  if (unit === undefined) return undefined
  return Math.abs(count) === 1 ? unit.spoken : unit.plural
}

/** The authored conversion between two symbols, or \`undefined\` when there is none. */
export function unitConversion(from: string, to: string): UnitConversion | undefined {
  return UNIT_CONVERSIONS.find((row) => row.from === from && row.to === to)
}

/**
 * One value in another unit, or \`undefined\` when this system does not own the factor.
 *
 * \`undefined\` is the whole contract. mmol/L to mg/dL is not here, and it is
 * not here because the factor depends on the molar mass of the substance being
 * measured rather than on either unit - so a component that substituted a
 * default would be converting cholesterol with the factor for glucose. Render
 * "we do not have this"; never a number.
 */
export function convertUnit(value: number, from: string, to: string): number | undefined {
  const conversion = unitConversion(from, to)
  if (conversion === undefined) return undefined
  return (
    (value * conversion.numerator) / conversion.denominator +
    conversion.offsetNumerator / conversion.offsetDenominator
  )
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
 * The generated half of `content/docs/reference/error-codes.mdx`.
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
    `  → https://opsinjs.pensievelabs.org/docs/${first.docs}`,
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
    const docs = entry.docs === "" ? "None" : `[${entry.docs}](../${entry.docs}.mdx)`
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
 * Main                                                                *
 * ------------------------------------------------------------------ */

const EMITTERS: Record<string, (source: JsonObject, out: TokenLeaf[]) => void> = {
  color: emitColor,
  material: emitMaterial,
  motion: emitMotion,
  type: emitType,
  space: emitSpace,
  shape: emitShape,
  accent: emitAccent,
}

/**
 * Emission order. It is why the generated CSS reads colour, material, motion,
 * type, space, shape, accent. Accent is last so that adding it moved no token
 * that was already emitted, and because it resolves its steps against the
 * neutral ladder colour has already put in place.
 */
const TOKEN_FILES = ["color", "material", "motion", "type", "space", "shape", "accent"]

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
     lib/generated/tokens.ts, OPSIN_ERRORS inside packages/react/src/opsinjs.ts where warnOnce()
     can reach it in a consumer's project, and the table on the handbook page.
     Parsing it here rather than only hashing it also means a syntactically
     broken errors.json now fails the build with a line number instead of
     quietly emptying the warning channel. */
  const errorsFile = join(TOKENS_DIR, "errors.json")
  const errorsSource = readJson(errorsFile)
  if (exists(errorsFile)) rawSources.push(readFileSync(errorsFile, "utf8"))
  const errors = buildErrors(errorsSource)

  /* tokens/units.json is the same shape of thing as errors.json: authored data
     that declares no custom property, so it is neither in TOKEN_FILES nor in
     EMITTERS, and it is hashed LAST so that adding it moved no existing entry
     in this list. It emits two ways - lib/generated/units.json for review, and
     the Unit/UNITS region inside packages/react/src/opsinjs.ts, which is the copy
     @opsinjs/react publishes and therefore the copy that renders. */
  const unitsFile = join(TOKENS_DIR, "units.json")
  const unitsSource = readJson(unitsFile)
  if (exists(unitsFile)) rawSources.push(readFileSync(unitsFile, "utf8"))
  const units = buildUnits(unitsSource)

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

  /* THE ACCENT REFUSAL. An accent value below its floor, or an accent hue too
     near a status hue, is refused here rather than written, in `--check` as
     well, so the build that would publish it fails instead. The figures are
     measured with the same lib/color modules scripts/check-contrast.mts uses,
     and over the same pairs, because both read them from accent-plan.mts. */
  if (accentPlan) {
    const problems = accentFailures(accentPlan, tokens)
    if (problems.length > 0) {
      console.error(
        [
          `build-tokens: ${problems.length} accent problem(s) in tokens/accent.json.`,
          ...problems.map((line) => `  ${line}`),
          "",
          "  Change the accent value, not the floor. The floors are what the accent",
          "  page and ADR 0029 promise.",
        ].join("\n"),
      )
      process.exit(1)
    }
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

  /* The substrate carries THREE generated regions and they are spliced in
     sequence, errors first, then units, then banned words, over one read of the
     file. Reading it twice would splice a later region into a copy that no longer
     matches what an earlier splice produced, and the later write would silently
     drop the earlier one. Each splice below therefore reads the output of the one
     before it, never the file on disk.

     The unit region is only touched when there is something to put in it or a
     region already exists. A tree with no tokens/units.json keeps the reserved
     comment block exactly as it is, which is the honest zero state: an empty
     UNITS array claims this system has looked and found no units, and it has
     not looked. The banned region has no such zero state, because tokens/
     glossary.json ships in every clone, so it is spliced unconditionally. */
  const substrateSource = mustRead(
    OUT_SUBSTRATE,
    "It is the shared substrate every registry item ships; restore it from git.",
  )
  const withErrors = spliceRegion(
    OUT_SUBSTRATE,
    substrateSource,
    SUBSTRATE_REGION_BEGIN,
    SUBSTRATE_REGION_END,
    emitSubstrateErrors(errors),
  )
  const withUnits =
    exists(unitsFile) || withErrors.includes(UNITS_REGION_BEGIN)
      ? spliceRegion(
          OUT_SUBSTRATE,
          installUnitsRegion(OUT_SUBSTRATE, withErrors),
          UNITS_REGION_BEGIN,
          UNITS_REGION_END,
          emitSubstrateUnits(units),
        )
      : withErrors

  const substrate = spliceRegion(
    OUT_SUBSTRATE,
    installBannedRegion(OUT_SUBSTRATE, withUnits),
    BANNED_REGION_BEGIN,
    BANNED_REGION_END,
    emitSubstrateBanned(glossary.banned),
  )

  const outputs = [
    { file: OUT_CSS, contents: emitCss(tokens, hash, accentPlan ? emitAccentCss(accentPlan, tokens) : "") },
    { file: OUT_TOKENS_JSON, contents: emitTokensJson(tokens, hash) },
    { file: OUT_TOKENS_TS, contents: emitTokensModule(tokens, hash) },
    { file: OUT_TS, contents: emitTs(tokens, glossary, errors, hash) },
    { file: OUT_SUBSTRATE, contents: substrate },
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
    {
      file: OUT_UNITS,
      contents: `${JSON.stringify(
        {
          $comment:
            "GENERATED FILE - DO NOT EDIT. Source: tokens/units.json. Generator: scripts/build-tokens.mts (`pnpm run generate`). Gate: `pnpm check:generated`. This is the reviewable copy, with the authored policy attached; the copy that renders is the Unit/UNITS region inside packages/react/src/opsinjs.ts, because lib/generated/ is not part of @opsinjs/react. SAFETY: there is no reference range, threshold, plausibility bound, 'typical' value or default precision in this file, for any metric in any population. A unit table says what a number is measured in; it never says what a number should be. `generatedAt` carries the token source hash rather than a build time, because this file is guarded by a byte-for-byte drift gate.",
          generatedAt: hash,
          sourceHash: hash,
          counts: {
            units: units.units.length,
            conversions: units.conversions.length,
            refusedConversions: units.refused.length,
          },
          policy: Object.fromEntries(units.policy.map((entry) => [entry.key, entry.text])),
          units: units.units.map((unit) => ({
            id: unit.id,
            symbol: unit.symbol,
            spoken: unit.spoken,
            plural: unit.plural,
            measures: unit.measures,
            base: unit.toBase?.unit,
            basis: unit.toBase?.basis,
          })),
          conversions: units.conversions.map((row) => {
            const ints = conversionInts(row)
            return {
              from: row.from,
              to: row.to,
              numerator: ints.n,
              denominator: ints.d,
              offsetNumerator: ints.on,
              offsetDenominator: ints.od,
              basis: row.basis,
            }
          }),
          refusedConversions: units.refused,
        },
        null,
        2,
      )}\n`,
    },
    ...(accentPlan ? [{ file: OUT_ACCENTS_TS, contents: emitAccentsModule(accentPlan, hash) }] : []),
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
          ...drifted.map((output) => `  ${relative(REPO_DIR, output.file)}`),
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
        `${glossary.banned.length} banned words, ${errors.codes.length} error codes, ` +
        `${units.units.length} units with ${units.conversions.length} conversions ` +
        `and ${units.refused.length} refusals.`,
      `  ${[...byGroup.entries()].map(([group, count]) => `${count} ${group}`).join(" | ")}`,
      ...outputs.map(
        (output) =>
          `  ${written.has(output.file) ? "wrote    " : "unchanged"} ` +
          relative(REPO_DIR, output.file),
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
