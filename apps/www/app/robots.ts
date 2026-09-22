import type { MetadataRoute } from "next"

import { site } from "@/lib/routes"

/**
 * robots.txt.
 *
 * NOTHING IS DISALLOWED, and that is a change rather than an oversight.
 *
 * `/view` used to be. `/view/[base]/[style]/[kind]/[name]` is the chrome-less
 * preview shell that `<ComponentPreview>` and `<IframePreview>` embed, every
 * one of those URLs duplicates content that already has a canonical home on a
 * documentation page, and the number of them grows with the base by style
 * matrix rather than with the corpus. All of that is still true. Disallowing
 * them was still the wrong instrument, for a reason that is easy to miss and
 * produces exactly the outcome the rule was written to prevent.
 *
 * A DISALLOWED URL CANNOT BE READ, INCLUDING ITS `noindex`. The preview route
 * already answers `robots: { index: false, follow: false }` in its own
 * metadata, which is the directive that actually keeps a page out of an index.
 * A crawler forbidden from fetching the URL never sees that tag. What it does
 * instead, when something links to the URL, is index the address on its own:
 * no title, no description, the URL as the headline. Every `<ComponentPreview>`
 * caption links its preview with `target="_blank"`, so those links exist, and
 * the pairing was producing bare `/view/...` rows rather than suppressing them.
 *
 * Google says the same thing in the other direction about canonicalisation: do
 * not use robots.txt for it. The tools that consolidate a duplicate are
 * `noindex` on a page and `rel="canonical"` on an alternate representation, and
 * both require the crawler to be allowed to read the thing first.
 *
 * So the whole site is crawlable and the directives that matter are carried
 * where a crawler can see them:
 *
 *   - `/view/**` carries `noindex, nofollow` in its own page metadata.
 *   - The machine surfaces (`/r/**`, the `llms-*.txt` shards, `/api/**` and the
 *     feed) carry `X-Robots-Tag: noindex` from `next.config.mjs`.
 *   - The `.md` twin of a documentation page carries a `Link: rel="canonical"`
 *     header pointing at the HTML page it is a twin of, which is what Google
 *     asks for on an alternate representation at its own URL.
 *
 * `/playground`, `/colors`, `/tokens`, `/icons`, `/showcase` and `/official`
 * were never disallowed and still are not. They are real destinations with real
 * content, and `/official` in particular has to be indexable: an
 * anti-impersonation page nobody can find is decoration.
 *
 * AI crawlers get an explicit allow rather than being left to the wildcard. This
 * site is written to be read by assistants: the whole `llms.txt` shard scheme,
 * the processed-markdown twins and the registry exist for them, and a component
 * that does not exist yet is a question an assistant will otherwise answer by
 * inventing an API.
 *
 * The literal `/docs` string is absent here on purpose, but note that this file
 * is one of the four allowlisted exceptions to the "no hardcoded /docs" rule
 * (AGENTS.md §8) precisely because robots directives are configuration and
 * cannot go through `lib/routes.ts`.
 *
 * Finally, nothing here points at `/llms.txt`: there is no standard robots.txt
 * directive for it and inventing one would be noise in a file whose entire value
 * is that every parser reads it the same way. The curated index is discoverable
 * the way it was designed to be. It sits at a well-known path, and the site
 * footer, `/official` and the Agents section of the documentation link to it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-User",
          "Claude-SearchBot",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
          "meta-externalagent",
          "Bytespider",
          "CCBot",
          "cohere-ai",
        ],
        allow: "/",
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  }
}
