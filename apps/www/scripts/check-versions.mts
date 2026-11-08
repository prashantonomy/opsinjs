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
 * WHY EXACTNESS EARNS A GATE HERE and not in most repositories. The docs site
 * and the tooling are never installed by anybody else, so a range buys none of
 * the transitive-dedupe benefit it exists for. What it does buy is a tree that
 * differs between two machines that ran the same install on different days, in
 * a repository whose entire output is generated files and measured numbers
 * diffed for drift. `next`, `react` and `typescript` in particular are pinned
 * to versions a green build was observed on.
 *
 * THE PUBLISHED PACKAGES ARE THE EXCEPTION, AND THE RULE INVERTS FOR THEM (ADR
 * 0030). A package's `dependencies` are installed into somebody else's tree,
 * where an exact pin forces a duplicate copy of every library the app already
 * has. So in `packages/*`, `dependencies` must be a caret range or
 * `workspace:^`, and `peerDependencies` must be a range. Their
 * `devDependencies` never leave this repository and stay exact.
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

import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const ROOT_DIR = join(APP_DIR, "..", "..")

/** The manifests this repository owns, checked together. */
const MANIFESTS = [
  { label: "package.json", file: join(ROOT_DIR, "package.json"), published: false },
  { label: "apps/www/package.json", file: join(APP_DIR, "package.json"), published: false },
  ...readdirSync(join(ROOT_DIR, "packages"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      label: `packages/${entry.name}/package.json`,
      file: join(ROOT_DIR, "packages", entry.name, "package.json"),
      published: true,
    })),
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

/**
 * A published package's runtime dependency: a caret range on a real version, or
 * `workspace:^`, which pnpm turns into a caret range at pack time.
 */
function inspectPublished(block: string, specifier: string): string | undefined {
  if (block === "devDependencies") return inspect(specifier)
  if (block === "peerDependencies") {
    return /^(\^|>=)\d/.test(specifier) ? undefined : "must be a range such as ^19.0.0, because a peer range says what the package works with"
  }
  if (specifier === "workspace:^") return undefined
  if (specifier.startsWith("workspace:")) {
    return "must be `workspace:^`, so the published range lets a consumer dedupe"
  }
  return /^\^\d+\.\d+\.\d+$/.test(specifier)
    ? undefined
    : "must be a caret range such as ^1.8.0, so a consumer's tree can share one copy"
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

    const blocks = manifest.published ? [...SCANNED_BLOCKS, "peerDependencies"] : SCANNED_BLOCKS
    for (const block of blocks) {
      const entries = parsed[block]
      if (!entries || typeof entries !== "object") continue
      for (const [name, specifier] of Object.entries(entries as Record<string, string>)) {
        if (typeof specifier !== "string") continue
        scanned += 1
        const reason = manifest.published ? inspectPublished(block, specifier) : inspect(specifier)
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
        `check-versions: ${offences.length} version(s) break the policy across ${MANIFESTS.length} manifests.`,
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
    `check-versions: ${scanned} dependency versions across ${MANIFESTS.length} manifests - the tooling exact, the packages' runtime ranges published as ranges.`,
  )
}

main()
