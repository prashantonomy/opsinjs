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
/**
 * Security headers, on every response.
 *
 * THE SCRIPT POLICY ALLOWS INLINE SCRIPT, AND HAS TO. Every page is statically
 * generated, so there is no request to mint a nonce for, and the inline scripts
 * differ per page (Next's flight data, the theme script the provider mounts,
 * the /view preferences script), so a hash list cannot name them. What the
 * policy still buys: no script, style, font, image or connection from any other
 * origin, no plugins, no `<base>` rewriting, no form posting elsewhere, and no
 * framing by another site. The site loads nothing from another origin today,
 * so `'self'` is the whole allowlist. A new third-party origin is a change here
 * first.
 *
 * `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN` say the same thing
 * for old and new browsers. The docs frame their own /view previews, which is
 * the one framing they need. `'unsafe-eval'` appears under `next dev` only,
 * because React's development build evaluates code to rebuild stack traces.
 * `clipboard-write` stays on for the copy buttons; every other powerful feature
 * is off.
 */
const scriptSources = ["'self'", "'unsafe-inline'"]
if (process.env.NODE_ENV === "development") scriptSources.push("'unsafe-eval'")

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src ${scriptSources.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "serial=()",
      "hid=()",
      "bluetooth=()",
      "midi=()",
      "display-capture=()",
      "browsing-topics=()",
      "clipboard-write=(self)",
    ].join(", "),
  },
]

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
      { source: "/:path*", headers: SECURITY_HEADERS },
      /* The registry is fetched across origins by the shadcn CLI and by agents.
         Static items already carry this header from the platform; saying it
         here gives the dynamically rendered answers, such as a 404 for an
         unknown name, the same one. Nothing on this site uses credentials. */
      {
        source: "/r/:path*",
        headers: [{ key: "access-control-allow-origin", value: "*" }],
      },
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
