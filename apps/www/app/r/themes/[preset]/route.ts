/**
 * GET /r/themes/<preset>.json — a theme-only registry item.
 *
 * A theme item carries `cssVars` and nothing else: no files, no dependencies.
 * Installing it gives a consuming project the variables and none of the
 * components that read them, and that split is deliberate (locked decision 9):
 * the tokens stand on their own, which is why this was the first surface here
 * that anybody could install. Component source installs separately, one id at a
 * time, from `/r/<id>.json`.
 *
 * WHERE THE PAYLOAD COMES FROM. `scripts/build-tokens.mts` compiles
 * `tokens/*.json` into a committed theme payload; `pnpm check:generated` fails
 * if it drifts from its source. This route reads that artefact from disk
 * rather than importing a module, for two reasons. Every published number on
 * this site has to be generated rather than typed, and reading the artefact is
 * how this route inherits that guarantee instead of re-deriving values at
 * request time. And it degrades honestly: before the generator has run, the
 * answer is a 404 that names the script to run, not a theme assembled from
 * defaults that nobody measured.
 *
 * READ THIS BEFORE MOVING THE GENERATOR'S OUTPUT. Next serves `public/` at the
 * site root, and a static file there BEATS a route handler at the same path —
 * verified on Next 16.3.4: with `public/r/registry.json` present, the request
 * never reaches `app/r/registry.json/route.ts` and no warning is printed. So
 * the generated theme payloads must land somewhere that is not served, or this
 * route stops running and the envelope below (the schema URL, the provenance
 * block, the note saying what a theme install does and does not bring with it)
 * silently disappears from the response. `registry/generated/themes` is the
 * primary location for that reason. `public/r/themes` is still checked, so that a
 * payload written to the old place is at least found by
 * `generateStaticParams` — but if it is there, the static file is what a
 * reader receives.
 *
 * Preset codes are namespaced `opsinjs-*` so they cannot collide with shadcn's
 * own preset names.
 */

import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

import {
  REGISTRY_ITEM_SCHEMA_URL,
  SITE_NAME,
  absoluteUrl,
  implementedComponents,
  json,
  provenance,
} from "@/app/_machine/contracts"

export const dynamic = "force-static"
export const dynamicParams = true

/**
 * Two statically scoped directories, searched in order.
 *
 * Both `path.join` calls are written out in full at each call site rather than
 * looped over. Turbopack traces filesystem access statically, and a `readdir`
 * whose argument it cannot resolve to a fixed subtree makes it include the
 * WHOLE project — every source file and the entire public folder — in the
 * server output. It says so as a build warning rather than failing, which is
 * exactly the kind of thing that gets ignored until a deployment size limit
 * catches it.
 */
const GENERATED_THEME_DIR = path.join(
  process.cwd(),
  "registry",
  "generated",
  "themes"
)
const PUBLIC_THEME_DIR = path.join(process.cwd(), "public", "r", "themes")

function presetNames(entries: string[]): string[] {
  return entries
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => entry.replace(/\.json$/, ""))
}

async function listPresets(): Promise<string[]> {
  const found = new Set<string>()
  try {
    for (const name of presetNames(await readdir(GENERATED_THEME_DIR))) {
      found.add(name)
    }
  } catch {
    // The generator has not run, or does not write here.
  }
  try {
    for (const name of presetNames(await readdir(PUBLIC_THEME_DIR))) {
      found.add(name)
    }
  } catch {
    // Likewise.
  }
  return [...found].sort()
}

async function readPreset(preset: string): Promise<string | null> {
  const file = `${preset}.json`
  try {
    return await readFile(path.join(GENERATED_THEME_DIR, file), "utf8")
  } catch {
    // Fall through to the legacy location.
  }
  try {
    return await readFile(path.join(PUBLIC_THEME_DIR, file), "utf8")
  } catch {
    return null
  }
}

export async function generateStaticParams(): Promise<{ preset: string }[]> {
  const presets = await listPresets()
  return presets.map((preset) => ({ preset: `${preset}.json` }))
}

/** Accept both `opsinjs-calm` and `opsinjs-calm.json`. */
function normalise(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/\.json$/i, "")
    .trim()
}

function isSafePreset(preset: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/i.test(preset)
}

/**
 * What installing a theme gives a reader, and what it does not.
 *
 * The sentence this replaces ended "Components are not implemented", which was
 * the true half of the point on the day it was typed and became a false
 * statement on a machine surface the moment the first component landed — served
 * on the same object as a `provenance()` block reporting a non-zero
 * `implementedCount`, which is the shape of contradiction every surface in this
 * app exists to prevent. The part worth keeping survives either way: a theme
 * item installs variables and no component source, so it says that, and reads
 * the rest off the built set rather than asserting it.
 */
function themeNote(): string {
  const built = implementedComponents().length
  const carried =
    "Tokens are real and generated. This item installs the CSS variables and nothing else — no component source, no dependencies."
  return built === 0
    ? `${carried} No opsinjs component is implemented yet, so nothing in the registry consumes these variables today.`
    : `${carried} ${built} opsinjs component${built === 1 ? "" : "s"} consume them and install separately, one id at a time, from /r/<id>.json.`
}

export async function GET(
  _request: Request,
  context: RouteContext<"/r/themes/[preset]">
): Promise<Response> {
  const preset = normalise((await context.params).preset)

  if (!isSafePreset(preset)) {
    return json(
      {
        error: "invalid-preset",
        preset,
        message:
          "A preset name is lowercase alphanumeric with hyphens. Shipped opsinjs presets are namespaced `opsinjs-*`.",
      },
      { status: 400 }
    )
  }

  const raw = await readPreset(preset)
  if (raw === null) {
    const available = await listPresets()
    return json(
      {
        error: available.length === 0 ? "not-generated-yet" : "unknown-preset",
        preset,
        available,
        message:
          available.length === 0
            ? "No theme payloads have been generated. Run `pnpm run generate` (scripts/build-tokens.mts) to compile tokens/*.json into a theme payload."
            : `${SITE_NAME} has no preset called "${preset}".`,
        source: "tokens/*.json via scripts/build-tokens.mts",
      },
      { status: 404 }
    )
  }

  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch (error) {
    return json(
      {
        error: "malformed-theme",
        preset,
        message: `The generated payload for "${preset}" is not valid JSON: ${String(error)}. It is read from registry/generated/themes, or from public/r/themes if it is still written to the old location. Regenerate it with scripts/build-tokens.mts rather than repairing it by hand.`,
      },
      { status: 500 }
    )
  }

  if (typeof payload !== "object" || payload === null) {
    return json(
      { error: "malformed-theme", preset, message: "Expected a JSON object." },
      { status: 500 }
    )
  }

  // Serve the generated payload, filling in only the envelope fields a
  // registry item needs. Never invent or adjust a token value here — the
  // generator owns every number.
  const item = payload as Record<string, unknown>
  return json({
    $schema: REGISTRY_ITEM_SCHEMA_URL,
    name: typeof item.name === "string" ? item.name : preset,
    type: typeof item.type === "string" ? item.type : "registry:theme",
    title: typeof item.title === "string" ? item.title : preset,
    description:
      typeof item.description === "string"
        ? item.description
        : `The ${preset} theme: opsinjs colour, material, motion, type, space and shape tokens as CSS variables.`,
    author: SITE_NAME,
    ...item,
    meta: {
      ...(typeof item.meta === "object" && item.meta !== null ? item.meta : {}),
      opsinjs: {
        ...provenance(),
        kind: "theme",
        note: themeNote(),
        catalogue: absoluteUrl("/r/index.json"),
      },
    },
  })
}
