/**
 * GET /rss.xml is the changelog feed.
 *
 * One item per changelog entry, newest first. The changelog is a folder of
 * narrative pages rather than a single append-only file, which is what makes a
 * feed possible at all: each entry has its own URL, its own markdown twin and
 * its own date.
 *
 * WHY A DESIGN SYSTEM NEEDS ONE. Versioning here covers the JavaScript API, the
 * rendered DOM, the `data-*` attributes and the CSS custom properties. A change
 * that a consuming team has to act on can therefore be a renamed variable with
 * no import to update and no type error to catch. A feed is the cheapest way
 * for somebody who copied the source into their own repository to find out that
 * the thing they copied has moved.
 *
 * Entries are dated from the frontmatter `reviewed` date. An undated entry is
 * still published, sorted after the dated ones, because a visible entry with
 * no timestamp is better than a silently dropped release note. While the changelog is empty the feed is valid
 * and says so in its description, rather than 404ing and looking broken.
 */

import {
  DOCS_VERSION,
  GENERATED_AT,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  text,
} from "@/app/_machine/contracts"
import {
  allPages,
  metaOf,
  pageUrl,
  type CorpusPage,
} from "@/app/_machine/corpus"

export const dynamic = "force-static"

const FEED_PATH = "/rss.xml"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** ISO 8601 in frontmatter, RFC 822 on the wire. */
function toRfc822(value: string | undefined): string | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toUTCString()
}

function entryDate(page: CorpusPage): string | undefined {
  const meta = metaOf(page)
  return toRfc822(meta.reviewed)
}

function isChangelogEntry(page: CorpusPage): boolean {
  return (
    page.slugs[0] === "project" &&
    page.slugs[1] === "changelog" &&
    page.slugs.length > 2
  )
}

export function GET(): Response {
  const entries = allPages()
    .filter(isChangelogEntry)
    .map((page) => ({ page, date: entryDate(page) }))
    .sort((a, b) => {
      if (a.date && b.date) return Date.parse(b.date) - Date.parse(a.date)
      if (a.date) return -1
      if (b.date) return 1
      return b.page.url.localeCompare(a.page.url)
    })

  const description = entries.length
    ? `Release notes for ${SITE_NAME}. Versioning covers the JavaScript API, the rendered DOM, data attributes and the CSS custom properties.`
    : `Release notes for ${SITE_NAME}. No component is implemented, so nothing has been released yet and this feed is empty by design rather than broken. It will carry an item per changelog entry once there is one.`

  const items = entries.map(({ page, date }) => {
    const meta = metaOf(page)
    const url = pageUrl(page)
    return [
      "    <item>",
      `      <title>${escapeXml(meta.title)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      ...(date ? [`      <pubDate>${escapeXml(date)}</pubDate>`] : []),
      ...(meta.description
        ? [`      <description>${escapeXml(meta.description)}</description>`]
        : []),
      "    </item>",
    ].join("\n")
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${SITE_NAME} changelog`)}</title>`,
    `    <link>${escapeXml(SITE_URL)}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    "    <language>en-GB</language>",
    `    <generator>${escapeXml(`${SITE_NAME}-docs ${DOCS_VERSION}`)}</generator>`,
    `    <lastBuildDate>${escapeXml(new Date(GENERATED_AT).toUTCString())}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(absoluteUrl(FEED_PATH))}" rel="self" type="application/rss+xml" />`,
    // <docs> is defined by RSS 2.0 as a link to the format's own
    // documentation, not to the publisher's. Pointing it anywhere else is a
    // small dishonesty on a site that exists to argue against those.
    "    <docs>https://www.rssboard.org/rss-specification</docs>",
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n")

  return text(xml, { contentType: "application/rss+xml; charset=utf-8" })
}
