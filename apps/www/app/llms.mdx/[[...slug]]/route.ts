/**
 * GET /llms.mdx/<slug> returns one page as markdown.
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
 * tables are markdown. It is not the same as rendered. The boolean form of
 * `includeProcessedMarkdown` leaves JSX elements in place, attributes and all
 * (measured, see `app/_machine/corpus.ts`). The raw form would additionally
 * carry the import statements and the unresolved frontmatter, so processed is
 * still the right answer; the honest framing of what survives is in the notice
 * `jsxNotice()` adds. `page.data.content` does not exist in fumadocs 16;
 * `source.config.ts` sets `postprocess: { includeProcessedMarkdown: true }` to
 * make the processed form available at all.
 *
 * The response carries YAML frontmatter naming status, kind, evidence, aliases,
 * the doctrine pages that govern the page and the canonical URL. It does so
 * because a page retrieved by a search is read alone, with none of the site
 * around it.
 *
 * It also carries `x-opsinjs-status` and, on a page that documents a component
 * or a screen, that subject's own `x-opsinjs-implemented`, so a HEAD request
 * answers about this page rather than about the system.
 *
 * AND IT CARRIES A CANONICAL HEADER. This is the same text as the HTML page,
 * at its own URL, four hundred times over. The rewrite means the HTML URL is
 * untouched, which was always true and was never the whole story: a crawler
 * that follows the `<link rel="alternate" type="text/markdown">` the page
 * advertises, or simply guesses the convention, arrives at a document with no
 * indication that it is a second copy of something. Keeping the twins out of
 * the sitemap withholds an invitation; it does not answer the question.
 *
 * `Link: <...>; rel="canonical"` is the answer, and it is the one Google
 * documents for an alternate representation that lives at its own URL: the
 * element form works only in HTML, so a markdown document has to say it in a
 * header. The twins stay fetchable, which is the entire point of them, and the
 * signals consolidate onto the page a reader should land on.
 */

import { SITE_URL, absoluteUrl, provenance, text } from "@/app/_machine/contracts"
import { pageHeaders, renderPage } from "@/app/_machine/corpus"
import { source } from "@/lib/source"

export const dynamic = "force-static"
export const dynamicParams = true

const MARKDOWN = "text/markdown; charset=utf-8"

/** Lower-case slugs joined by slashes, which is every page path this site has. */
const DOCS_PATH = /^(\/[a-z0-9][a-z0-9-]{0,63}){1,6}$/

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
    // a fourth hand-written variant. A guessed URL is the moment a reader is
    // least able to tell a stale claim from a measured one.
    //
    // The path is repeated only when it has the shape of a documentation path.
    // Anything else is text a stranger wrote into a URL, and this answer is
    // read by agents, so it must not carry words that are not ours.
    const path = slug && slug.length > 0 ? `/${slug.join("/")}` : ""
    const where = !path
      ? "the documentation index"
      : DOCS_PATH.test(path)
        ? `\`${path}\``
        : "that address"
    return text(
      [
        `# Not found`,
        "",
        `There is no opsinjs documentation page at ${where}.`,
        "",
        "Where to look instead:",
        "",
        `- ${SITE_URL}/llms.txt covers every page, grouped, with a one-line description each.`,
        `- ${SITE_URL}/llms-full.txt is the whole corpus as one file.`,
        `- ${SITE_URL}/r/index.json covers every component id, its status, and whether anything is installable.`,
        "",
        provenance().notice,
        "",
        "If you are looking for a component and cannot find its page, the roster above is the definitive answer. Do not infer an API from the absence.",
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
    headers: {
      ...pageHeaders(page),
      /* `page.url` is the HTML page this file is a twin of, built by fumadocs
         from the same `baseUrl` every other link on the site uses, so the
         canonical cannot drift from the route it names. It goes through
         `absoluteUrl` rather than being concatenated, so that the index twin
         names the front door with the same spelling the front door uses. */
      link: `<${absoluteUrl(page.url)}>; rel="canonical"`,
    },
  })
}
