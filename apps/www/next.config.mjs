import { createMDX } from "fumadocs-mdx/next"

/**
 * Turbopack is the bundler. Do NOT add a `webpack` key here. Next 16 treats it
 * as a hard failure, not a warning.
 *
 * The `/:path*.md` rewrite is the `.md` twin of every documentation page: it
 * serves the PROCESSED markdown (JSX resolved into text) that agents read, at a
 * URL a human can guess by appending `.md`. It is a rewrite, not a redirect, so
 * the canonical HTML URL is unaffected.
 *
 * THE MATCHER IS ROOTED because the documentation is rooted: `DOCS_BASE` in
 * lib/routes.ts is empty, so a page lives at `/components/button` and its twin
 * at `/components/button.md`. The index twin is `/index.md`, since `/.md` is
 * not a path. Restoring a `/docs` prefix means changing `DOCS_BASE` and these
 * two sources together, and nothing else.
 *
 * The path literals below are the allowlisted exception to the "route
 * construction lives in lib/routes.ts" rule: Next's rewrite matcher is config,
 * evaluated before any module of ours is loaded.
 */
const config = {
  reactStrictMode: true,
  devIndicators: false,
  /**
   * `next dev` otherwise rewrites the `nextjs-agent-rules` block at the top of
   * `apps/www/AGENTS.md` on every start, and the text it writes contains two
   * U+2014 em dashes. `pnpm check:dashes` has no allowlist and fails the build
   * on both, so the choice was to de-dash that block by hand after every dev
   * restart or to stop Next writing it. The block is committed in its de-dashed
   * form and says the same thing; this keeps it that way.
   */
  agentRules: false,
  outputFileTracingIncludes: {
    "/[[...slug]]": ["./content/**/*"],
  },
  async rewrites() {
    return [
      { source: "/index.md", destination: "/llms.mdx" },
      { source: "/:path*.md", destination: "/llms.mdx/:path*" },
    ]
  },
  /**
   * `X-Robots-Tag: noindex` on the machine surfaces, and on nothing else.
   *
   * These paths are advertised, linked from the footer and from the Agents
   * section, and deliberately crawlable: an assistant fetching `/r/index.json`
   * or `/llms-health.txt` should get it, and `app/robots.ts` disallows nothing
   * for exactly that reason. Crawlable is not the same as indexable. Each of
   * them is a second representation of prose that already has a canonical home
   * on a documentation page, and a search result whose title is `/r/docs.json`
   * helps nobody and competes with the page it was built from.
   *
   * `noindex` is the right instrument rather than a `Disallow`, because a
   * crawler has to be allowed to fetch a URL in order to read the directive
   * that keeps it out of the index. Blocking the fetch is what produces the
   * bare URL-only result; permitting it and answering `noindex` is what
   * removes it. `follow` is left at its default, so the links inside
   * `llms.txt` still lead a crawler to the real pages.
   *
   * THE `.md` TWINS ARE NOT IN THIS LIST. They are an alternate representation
   * of one specific page rather than a machine index of the whole site, so they
   * get the treatment Google prescribes for that case: a `Link: rel="canonical"`
   * header naming the HTML page, set per request in the route handler because
   * only the handler knows which page it is serving. See
   * `app/llms.mdx/[[...slug]]/route.ts`.
   *
   * These literals are config, evaluated before any module of ours loads, which
   * is why they are written out here rather than built from `lib/routes.ts`.
   * They are the same allowlisted exception the rewrite sources above are.
   */
  async headers() {
    const noindex = [{ key: "x-robots-tag", value: "noindex" }]
    return [
      { source: "/llms.txt", headers: noindex },
      { source: "/llms-:shard.txt", headers: noindex },
      { source: "/r/:path*", headers: noindex },
      { source: "/api/:path*", headers: noindex },
      { source: "/rss.xml", headers: noindex },
    ]
  },
}

const withMDX = createMDX()

export default withMDX(config)
