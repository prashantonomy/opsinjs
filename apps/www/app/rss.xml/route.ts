/**
 * GET /rss.xml is the changelog feed.
 *
 * One item per dated entry on the changelog page, newest first. An entry is an
 * H2 whose text is a date, such as "8 October 2026"; the item links to that
 * heading and carries its first paragraph as the description.
 *
 * WHY A DESIGN SYSTEM NEEDS ONE. Versioning here covers the JavaScript API, the
 * rendered DOM, the `data-*` attributes and the CSS custom properties. A change
 * that a consuming team has to act on can therefore be a renamed variable with
 * no import to update and no type error to catch. A feed is the cheapest way
 * for somebody who copied the source into their own repository to find out that
 * the thing they copied has moved. While the changelog has no dated entry the
 * feed is valid and says so in its description, rather than 404ing.
 */

import {
  DOCS_VERSION,
  GENERATED_AT,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  text,
} from "@/app/_machine/contracts"
import { allPages, pageUrl, type CorpusPage } from "@/app/_machine/corpus"

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

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
]

/** "8 October 2026" as a UTC date, or undefined when the heading is not a date. */
function headingDate(heading: string): Date | undefined {
  const match = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(heading.trim())
  if (!match) return undefined
  const month = MONTHS.indexOf((match[2] ?? "").toLowerCase())
  if (month === -1) return undefined
  return new Date(Date.UTC(Number(match[3]), month, Number(match[1])))
}

/** The heading's anchor, as the docs page renders it. */
function anchorOf(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/ /g, "-")
}

interface Entry {
  title: string
  date: Date
  description: string
  url: string
}

async function changelogEntries(page: CorpusPage): Promise<Entry[]> {
  const markdown = await page.data.getText("processed")
  return markdown
    .split(/^## /m)
    .slice(1)
    .flatMap((section) => {
      const [line = "", ...rest] = section.split("\n")
      /* Processed markdown writes a heading as `8 October 2026 [#8-october-2026]`,
         so the id is read from it rather than recomputed. */
      const idMatch = /\s*\[#([^\]]+)\]\s*$/.exec(line)
      const heading = idMatch ? line.slice(0, idMatch.index) : line
      const date = headingDate(heading)
      if (!date) return []
      const description =
        rest
          .join("\n")
          .trim()
          .split(/\n\s*\n/)[0]
          ?.replace(/\s+/g, " ") ?? ""
      return [
        {
          title: heading.trim(),
          date,
          description,
          url: `${pageUrl(page)}#${idMatch?.[1] ?? anchorOf(heading)}`,
        },
      ]
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

export async function GET(): Promise<Response> {
  const page = allPages().find(
    (candidate) => candidate.slugs.join("/") === "changelog"
  )
  const entries = page ? await changelogEntries(page) : []

  const description = entries.length
    ? `Release notes for ${SITE_NAME}. Versioning covers the JavaScript API, the rendered DOM, data attributes and the CSS custom properties.`
    : `Release notes for ${SITE_NAME}. The changelog has no dated entry yet, so this feed is empty by design rather than broken.`

  const items = entries.map((entry) =>
    [
      "    <item>",
      `      <title>${escapeXml(`${SITE_NAME} ${entry.title}`)}</title>`,
      `      <link>${escapeXml(entry.url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(entry.url)}</guid>`,
      `      <pubDate>${escapeXml(entry.date.toUTCString())}</pubDate>`,
      ...(entry.description
        ? [`      <description>${escapeXml(entry.description)}</description>`]
        : []),
      "    </item>",
    ].join("\n")
  )

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
