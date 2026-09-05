/**
 * check-versions.mts - every dependency version in the two manifests is exact.
 *
 *   node scripts/check-versions.mts
 *
 * AGENTS.md §5 says it in words: "Every version in apps/www/package.json was
 * resolved live and corresponds to a build that actually ran green ...
 * `typescript` is `5.9.3` and never `^5` ... Do not float a range to 'get the
 * latest'." Until this file existed that was a convention, and a convention is
 * what `prettier: "^3.8.3"` quietly drifted through: the caret had already
 * resolved to 3.9.6, so the manifest named one version and the installed tree
 * held another, with nothing anywhere reporting the difference.
 *
 * WHY EXACTNESS EARNS A GATE HERE and not in most repositories. Nothing in this
 * workspace is published (ADR 0002 - distribution is shadcn copy-in), so a
 * range buys none of the transitive-dedupe benefit it exists for. What it does
 * buy is a tree that differs between two machines that ran the same install on
 * different days, in a repository whose entire output is generated files and
 * measured numbers diffed for drift. `next`, `react` and `typescript` in
 * particular are pinned to versions a green build was observed on.
 *
 * WHAT IS ALLOWED. `npm:` aliases keep their own exact version after the `@`
 * (`fumadocs-ui` is `npm:@fumadocs/base-ui@16.15.4`), `workspace:` and `link:`
 * are local protocols with no registry range to float, and `engines`,
 * `packageManager` and `peerDependencies` are not scanned - a peer range is a
 * compatibility statement rather than an install instruction.
 *
 * DEPENDENCIES: none. Reads two JSON files and exits.
 */

const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/check-versions.mts needs Node 24 or newer.",
      `  You are on Node ${process.versions.node}.`,
      "",
    ].join("\n"),
  )
  process.exit(1)
}

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const ROOT_DIR = join(APP_DIR, "..", "..")

/** The manifests this repository owns. Both are checked, together. */
const MANIFESTS = [
  { label: "package.json", file: join(ROOT_DIR, "package.json") },
  { label: "apps/www/package.json", file: join(APP_DIR, "package.json") },
]

/**
 * The blocks that describe what gets installed.
 *
 * `peerDependencies` is deliberately absent: a peer range says which versions a
 * package works WITH, and narrowing one to a single version is a different and
 * usually wrong statement.
 */
const SCANNED_BLOCKS = ["dependencies", "devDependencies", "optionalDependencies"]

/** Local protocols, which name a path rather than a registry range. */
const LOCAL_PROTOCOLS = ["workspace:", "link:", "file:"]

interface Offence {
  readonly manifest: string
  readonly block: string
  readonly name: string
  readonly specifier: string
  readonly reason: string
}

/** The part of a specifier that has to be an exact version. */
function versionPart(specifier: string): string {
  if (!specifier.startsWith("npm:")) return specifier
  const body = specifier.slice("npm:".length)
  const at = body.lastIndexOf("@")
  /* `npm:@scope/name` with no version at all is a range meaning "latest". */
  return at <= 0 ? "" : body.slice(at + 1)
}

function inspect(specifier: string): string | undefined {
  if (LOCAL_PROTOCOLS.some((protocol) => specifier.startsWith(protocol))) return undefined

  const version = versionPart(specifier)
  if (version === "") return "names no version, so it installs whatever is latest today"
  if (version === "*" || version === "latest" || version === "next") {
    return `is \`${version}\`, which is whatever was published most recently`
  }
  if (/^[\^~]/.test(version)) {
    return `floats with \`${version[0] as string}\` - AGENTS.md §5: do not float a range to "get the latest"`
  }
  if (/[\s|]|^[<>=]/.test(version)) return "is a range rather than one version"
  if (version.includes("x") || version.includes("X")) return "uses a wildcard segment"
  return undefined
}

function main(): void {
  const offences: Offence[] = []
  let scanned = 0

  for (const manifest of MANIFESTS) {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(readFileSync(manifest.file, "utf8")) as Record<string, unknown>
    } catch (error) {
      console.error(
        `check-versions: ${manifest.label} could not be read - ${(error as Error).message}`,
      )
      process.exit(1)
    }

    for (const block of SCANNED_BLOCKS) {
      const entries = parsed[block]
      if (!entries || typeof entries !== "object") continue
      for (const [name, specifier] of Object.entries(entries as Record<string, string>)) {
        if (typeof specifier !== "string") continue
        scanned += 1
        const reason = inspect(specifier)
        if (reason) {
          offences.push({ manifest: manifest.label, block, name, specifier, reason })
        }
      }
    }
  }

  if (offences.length > 0) {
    console.error(
      [
        "",
        `check-versions: ${offences.length} floated version(s) across ${MANIFESTS.length} manifests.`,
        "",
        ...offences.flatMap((offence) => [
          `  ${offence.manifest} → ${offence.block}.${offence.name}: "${offence.specifier}"`,
          `    ${offence.reason}`,
        ]),
        "",
        "  Pin each to the version pnpm-lock.yaml already resolved - read it from the",
        "  lockfile rather than guessing, because a caret that has been in the tree a",
        "  while has usually moved past the version it names. Change the `specifier:`",
        "  line in pnpm-lock.yaml in the same edit or --frozen-lockfile fails.",
        "",
      ].join("\n"),
    )
    process.exit(1)
  }

  console.log(
    `check-versions: ${scanned} dependency versions across ${MANIFESTS.length} manifests - all exact.`,
  )
}

main()
