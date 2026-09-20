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
}

const withMDX = createMDX()

export default withMDX(config)
