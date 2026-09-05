/**
 * GET /llms.mdx/<slug> — one page as markdown.
 *
 * Nobody requests this URL directly. `next.config.mjs` rewrites
 * `/…/:path*.md` here, so appending `.md` to any documentation URL returns
 * that page's markdown at a URL a person can guess and a crawler can follow.
 * It is a rewrite, not a redirect: the canonical HTML URL is untouched and
 * there is no duplicate-content penalty, which is also why the `.md` twins are
 * kept out of the sitemap.
 *
 * WHAT "PROCESSED" MEANS. The body is `await page.data.getText("processed")`:
 * remark has run, imports are gone, headings carry explicit ids and code and
 * tables are markdown. It is not the same as rendered — the boolean form of
 * `includeProcessedMarkdown` leaves JSX elements in place, attributes and all
 * (measured, see `app/_machine/corpus.ts`). The raw form would additionally
 * carry the import statements and the unresolved frontmatter, so processed is
 * still the right answer; the honest framing of what survives is in the notice
 * `jsxNotice()` adds. `page.data.content` does not exist in fumadocs 16;
 * `source.config.ts` sets `postprocess: { includeProcessedMarkdown: true }` to
 * make the processed form available at all.
 *
 * The response carries YAML frontmatter — status, kind, evidence, aliases, the
 * doctrine pages that govern the page and the canonical URL — because a page
 * retrieved by a search is read alone, with none of the site around it.
 *
 * It also carries `x-opsinjs-status` and, on a page that documents a component
 * or a screen, that subject's own `x-opsinjs-implemented`, so a HEAD request
 * answers about this page rather than about the system.
 */

import { SITE_URL, provenance, text } from "@/app/_machine/contracts"
import { pageHeaders, renderPage } from "@/app/_machine/corpus"
import { source } from "@/lib/source"

export const dynamic = "force-static"
export const dynamicParams = true

const MARKDOWN = "text/markdown; charset=utf-8"

export function generateStaticParams(): { slug: string[] }[] {
  return source.generateParams()
}

export async function GET(
  _request: Request,
  context: RouteContext<"/llms.mdx/[[...slug]]">
): Promise<Response> {
  const { slug } = await context.params
  const page = source.getPage(slug)

  if (!page) {
    // A miss here is somebody guessing a URL, so answer with the map rather
    // than an empty 404: the index, the shards and the registry roster are the
    // three places the answer actually is. The existence sentence is
    // `provenance().notice`, the one place that count is computed, rather than
    // a fourth hand-written variant — a guessed URL is the moment a reader is
    // least able to tell a stale claim from a measured one.
    const requested =
      slug && slug.length > 0 ? `/${slug.join("/")}` : "the documentation index"
    return text(
      [
        `# Not found`,
        "",
        `There is no opsinjs documentation page at \`${requested}\`.`,
        "",
        "Where to look instead:",
        "",
        `- ${SITE_URL}/llms.txt — every page, grouped, with a one-line description each`,
        `- ${SITE_URL}/llms-full.txt — the whole corpus as one file`,
        `- ${SITE_URL}/r/index.json — every component id, its status, and whether anything is installable`,
        "",
        provenance().notice,
        "",
        "If you are looking for a component and cannot find its page, the roster above is the definitive answer — do not infer an API from the absence.",
      ].join("\n"),
      { status: 404, contentType: MARKDOWN }
    )
  }

  /* The twin is a page about one subject, so it answers about that subject:
     `pageHeaders()` supplies this page's `x-opsinjs-status` and, where the
     page documents a component or a screen, that subject's own
     `x-opsinjs-implemented`. Without it every twin carried the system-scoped
     `true`, and `HEAD /docs/components/toast.md` told a tool that a reserved
     name with no code was built. `x-opsinjs-implemented-count` still carries
     the system answer on the same response. */
  return text(await renderPage(page), {
    contentType: MARKDOWN,
    headers: pageHeaders(page),
  })
}
