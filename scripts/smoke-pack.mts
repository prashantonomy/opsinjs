/**
 * smoke-pack.mts installs the four packages the way a consumer would and uses
 * them. It is the one check that exercises what npm will actually serve: the
 * packed tarballs, their `exports` maps, their `files` lists and their
 * dependency ranges, outside this workspace.
 *
 *   pnpm build:packages && node scripts/smoke-pack.mts
 *
 * WHAT IT DOES
 *   1. `pnpm pack` each package into a temporary directory, which also turns
 *      every `workspace:` range into the real version, exactly as publishing does.
 *   2. Creates a throwaway project there and installs the four tarballs with
 *      npm, plus react and react-dom, so resolution follows npm's rules rather
 *      than pnpm's workspace links.
 *   3. In that project, under plain Node: imports every entry point, checks that
 *      every component file in the package is exported by name from the entry
 *      point and from its own subpath, server-renders a set of components, and
 *      checks that each stylesheet resolves and carries what it should.
 *
 * It needs the network for react, react-dom and the packages' own dependencies.
 * It exits non-zero on the first thing a consumer would trip over.
 */

import { execFileSync } from "node:child_process"
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("../", import.meta.url))
const PACKAGES = ["tokens", "color", "react", "opsinjs"]
const REACT_VERSION = "19.3.0"

const work = mkdtempSync(join(tmpdir(), "opsinjs-smoke-"))
const keep = process.argv.includes("--keep")

function run(command: string, args: string[], cwd: string): string {
  return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
}

try {
  /* 1. Pack. */
  const tarballs: Record<string, string> = {}
  for (const dir of PACKAGES) {
    const before = new Set(readdirSync(work))
    run("pnpm", ["pack", "--pack-destination", work], join(ROOT, "packages", dir))
    const created = readdirSync(work).filter((file) => file.endsWith(".tgz") && !before.has(file))
    if (created.length !== 1) throw new Error(`pnpm pack in packages/${dir} produced ${created.length} tarballs`)
    tarballs[dir] = join(work, created[0] as string)
    console.log(`smoke-pack: packed ${created[0]}`)
  }

  /* 2. A consumer project. */
  const app = join(work, "app")
  run("mkdir", ["-p", app], work)
  writeFileSync(
    join(app, "package.json"),
    `${JSON.stringify(
      {
        name: "opsinjs-smoke-consumer",
        private: true,
        type: "module",
        dependencies: {
          "@opsinjs/tokens": `file:${tarballs.tokens}`,
          "@opsinjs/color": `file:${tarballs.color}`,
          "@opsinjs/react": `file:${tarballs.react}`,
          opsinjs: `file:${tarballs.opsinjs}`,
          react: REACT_VERSION,
          "react-dom": REACT_VERSION,
        },
      },
      null,
      2,
    )}\n`,
  )
  run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], app)
  console.log("smoke-pack: installed the tarballs with npm")

  /* 3. Use them. Written as a plain .mjs file so nothing but Node runs it. */
  writeFileSync(
    join(app, "consume.mjs"),
    String.raw`
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createElement as h } from "react"
import { renderToString } from "react-dom/server"

import * as ui from "@opsinjs/react"
import { Button as ButtonFromSubpath } from "@opsinjs/react/button"
import * as tokens from "@opsinjs/tokens"
import * as color from "@opsinjs/color"
import * as umbrella from "opsinjs"
import * as umbrellaTokens from "opsinjs/tokens"
import * as umbrellaColor from "opsinjs/color"

const failures = []
const expect = (ok, message) => { if (!ok) failures.push(message) }

/* Every component file is exported by name, from the entry and its subpath. */
const reactRoot = dirname(fileURLToPath(import.meta.resolve("@opsinjs/react/package.json")))
const ids = readdirSync(join(reactRoot, "dist", "components"))
  .filter((file) => file.endsWith(".js"))
  .map((file) => file.slice(0, -3))
const pascal = (id) => id.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("")
for (const id of ids) {
  expect(typeof ui[pascal(id)] === "function" || typeof ui[pascal(id)] === "object", "@opsinjs/react does not export " + pascal(id))
  const sub = await import("@opsinjs/react/" + id)
  expect(pascal(id) in sub, "@opsinjs/react/" + id + " does not export " + pascal(id))
  expect(!("default" in sub), "@opsinjs/react/" + id + " still has a default export")
}
expect(ids.length >= 60, "expected at least 60 components, found " + ids.length)
expect(ButtonFromSubpath === ui.Button, "the subpath and the entry point give different Button modules")
expect(umbrella.Button === ui.Button, "opsinjs does not re-export @opsinjs/react")
expect(typeof ui.cn === "function" && typeof ui.warnOnce === "function", "the substrate is not exported")
expect(Array.isArray(ui.CLINICAL_STATUSES) && ui.CLINICAL_STATUSES.includes("urgent"), "CLINICAL_STATUSES is missing")

/* Tokens and colour. */
expect(Array.isArray(tokens.TOKENS) && tokens.TOKENS.length > 100, "@opsinjs/tokens TOKENS is empty")
expect(tokens.ACCENT_ATTRIBUTE === "data-accent", "@opsinjs/tokens ACCENT_ATTRIBUTE is wrong")
expect(umbrellaTokens.TOKENS === tokens.TOKENS, "opsinjs/tokens does not re-export @opsinjs/tokens")
expect(Math.round(color.contrastRatio("#000000", "#ffffff")) === 21, "@opsinjs/color contrastRatio is wrong")
expect(typeof color.apcaContrast === "function", "@opsinjs/color apcaContrast is missing")
expect(umbrellaColor.contrastRatio === color.contrastRatio, "opsinjs/color does not re-export @opsinjs/color")

/* Server rendering, the way a Next.js server component would. */
const renders = [
  ["Button", h(ui.Button, { variant: "primary" }, "Save reading")],
  ["StatusPill", h(ui.StatusPill, { status: "attention" })],
  ["Value", h(ui.Value, { value: 128, unit: "mmHg", precision: 0 })],
  ["Badge", h(ui.Badge, null, "3")],
  ["Divider", h(ui.Divider, null)],
  ["Spinner", h(ui.Spinner, { label: "Loading" })],
  ["VisuallyHidden", h(ui.VisuallyHidden, null, "hidden")],
  ["RangeBar", h(ui.RangeBar, { label: "Example", value: 14, unit: "mg/dL", precision: 0, range: { low: 10, high: 20, source: ui.EXAMPLE_SOURCE }, status: "steady" })],
]
for (const [name, element] of renders) {
  try {
    const html = renderToString(element)
    expect(html.length > 0, name + " rendered nothing")
  } catch (error) {
    failures.push(name + " threw while rendering: " + error.message)
  }
}
expect(renderToString(h(ui.StatusPill, { status: "urgent" })).includes("data-status"), "StatusPill lost its data-status attribute")

/* Stylesheets resolve and carry what they should. */
const css = (specifier) => readFileSync(fileURLToPath(import.meta.resolve(specifier)), "utf8")
const styles = css("@opsinjs/react/styles.css")
expect(styles.includes("--opsin-status-urgent-ink"), "styles.css does not carry the tokens")
expect(styles.includes(".text-opsin-headline"), "styles.css does not carry the component utilities")
expect(!/(^|[{}])\*,\s*::after,\s*::before/.test(styles) && !styles.includes("box-sizing:border-box;border:0 solid"), "styles.css carries Tailwind preflight")
expect(css("@opsinjs/react/tailwind.css").includes("@source"), "tailwind.css has no @source")
expect(css("@opsinjs/react/base.css").includes("--opsin-target-minimum"), "base.css lost the target floor")
expect(css("@opsinjs/tokens/tokens.css").includes("--opsin-tokens-generated"), "tokens.css lost its provenance hash")
expect(JSON.parse(css("@opsinjs/tokens/tokens.json")).tokens.length > 100, "tokens.json is empty")
expect(css("opsinjs/styles.css").includes("@opsinjs/react/styles.css"), "opsinjs/styles.css does not forward")

if (failures.length > 0) {
  console.error("smoke-pack: " + failures.length + " problem(s) a consumer would hit:\n  " + failures.join("\n  "))
  process.exit(1)
}
console.log("smoke-pack: " + ids.length + " components exported, " + renders.length + " rendered on the server, five stylesheets resolved")
`,
  )
  process.stdout.write(run("node", ["consume.mjs"], app))
} catch (error) {
  const failure = error as { stdout?: string; stderr?: string; message: string }
  console.error(failure.stdout ?? "", failure.stderr ?? "", failure.message)
  process.exitCode = 1
} finally {
  if (keep) console.log(`smoke-pack: kept ${work}`)
  else rmSync(work, { recursive: true, force: true })
}
