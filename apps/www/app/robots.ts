import type { MetadataRoute } from "next"

import { site } from "@/lib/routes"

/**
 * robots.txt.
 *
 * ONE path is disallowed: `/view`. Everything else on this site is meant to be
 * read, by people and by machines, and the machine surfaces are advertised
 * rather than hidden.
 *
 * Why `/view` and nothing else. `/view/[base]/[style]/[kind]/[name]` is the
 * chrome-less preview shell that `<ComponentPreview>` and `<IframePreview>`
 * embed. Every one of those URLs is a duplicate of content that already has a
 * canonical home on a documentation page, rendered without navigation, without
 * headings and without the safety prose that gives it meaning. Indexed, they
 * would compete with the pages they belong to and would show a health component
 * stripped of the guidance that makes it safe to copy. They are also the
 * Playwright screenshot target, so their number grows with the base × style
 * matrix rather than with the corpus.
 *
 * `/playground`, `/colors`, `/tokens`, `/icons`, `/showcase` and `/official` are
 * deliberately NOT disallowed. They are real destinations with real content, and
 * `/official` in particular has to be indexable: an anti-impersonation page
 * nobody can find is decoration.
 *
 * The `.md` twins of documentation pages are likewise not disallowed. An agent
 * fetching `/docs/health/alarm-fatigue.md` should get it. They are kept out of
 * the sitemap instead, so they are reachable without being advertised as a
 * second copy of the corpus.
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
  const disallow = ["/view"]

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
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
        disallow,
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  }
}
