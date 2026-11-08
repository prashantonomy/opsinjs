/**
 * clean.mts removes the directories it is given, relative to the working
 * directory. Each package's build runs it on `dist` first, so a file deleted
 * from `src` never survives into a published tarball.
 *
 *   node ../../scripts/clean.mts dist
 */

import { rmSync } from "node:fs"
import { resolve } from "node:path"

for (const target of process.argv.slice(2)) {
  rmSync(resolve(process.cwd(), target), { recursive: true, force: true })
}
