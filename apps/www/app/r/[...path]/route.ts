/**
 * Every /r URL that is not /r/index.json or /r/docs.json answers 410 Gone.
 *
 * Until ADR 0030 these paths were a shadcn registry: `/r/<name>.json` was a
 * component's source, `/r/registry.json` the catalog, and `/r/themes/<preset>`
 * and `/r/styles/<style>/<name>` the theme and style items. opsinjs now ships
 * as npm packages, so the registry is retired rather than left serving source
 * nobody maintains. 410 rather than 404 says the resource existed and was
 * removed on purpose, and the body tells a person or a CLI what replaced it.
 */

import { absoluteUrl, json } from "@/app/_machine/contracts"
import { docsPath, site } from "@/lib/routes"

export const dynamic = "force-static"

export function generateStaticParams(): { path: string[] }[] {
  return [{ path: ["registry.json"] }]
}

export async function GET(): Promise<Response> {
  return json(
    {
      error: "gone",
      message: `The opsinjs shadcn registry is retired. opsinjs ships as npm packages: npm install ${site.packageName}`,
      install: `npm install ${site.packageName}`,
      package: site.npmUrl,
      docs: absoluteUrl(docsPath("getting-started")),
    },
    { status: 410, headers: { "cache-control": "public, max-age=3600" } },
  )
}
