import { createMDX } from "fumadocs-mdx/next"

/**
 * Turbopack is the bundler. Do NOT add a `webpack` key here — Next 16 treats it
 * as a hard failure, not a warning.
 *
 * The `/docs/:path*.md` rewrite is the `.md` twin of every documentation page:
 * it serves the PROCESSED markdown (JSX resolved into text) that agents read,
 * at a URL a human can guess by appending `.md`. It is a rewrite, not a
 * redirect, so the canonical HTML URL is unaffected.
 *
 * The literal `/docs/` strings below are the allowlisted exception to the
 * "route construction lives in lib/routes.ts" rule: Next's rewrite matcher is
 * config, evaluated before any module of ours is loaded.
 */
const config = {
  reactStrictMode: true,
  devIndicators: false,
  outputFileTracingIncludes: {
    "/docs/[[...slug]]": ["./content/**/*"],
  },
  async rewrites() {
    return [
      { source: "/docs/:path*.md", destination: "/llms.mdx/:path*" },
      { source: "/docs.md", destination: "/llms.mdx" },
    ]
  },
}

const withMDX = createMDX()

export default withMDX(config)
