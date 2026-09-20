/**
 * GET /og?title=&description=&status=&section= is the social card service.
 *
 * One image service for the whole site, referenced from `generateMetadata`,
 * rather than an `opengraph-image.tsx` beside each route. Two reasons: an
 * optional catch-all route with promise-shaped `params` is the exact place
 * Next 16's image conventions are most awkward, and a single service means the
 * cards cannot drift apart as pages are added.
 *
 * A DELIBERATE ABSENCE OF COLOUR. The release phases this card shows are
 * planned, shipped and deprecated, and it would be natural for the card to
 * colour them the way a status is coloured elsewhere on this site. It does
 * not. Clinical status owns that vocabulary across steady, watch, attention
 * and urgent, where `unknown` is the absence of an assertion rather than a
 * fifth level. Reusing that vocabulary for "this component is shipped" would
 * teach the reader to read a colour that means "somebody needs to do
 * something about their own health" as "a library is not finished". That is
 * the never-mix-the-axes rule applied to the system's own marketing surface,
 * and it is worth more here than a livelier picture: the card is greyscale,
 * with one filled chip for `shipped` and outlines for everything else.
 *
 * MOST CARDS NOW CARRY NO CHIP AT ALL. A release phase belongs to a component
 * page, and `lib/routes.ts` omits an absent status from the query, so the
 * pages that are not components send none and the chip below is simply not
 * drawn. That is the truthful card for a doctrine page: it documents a rule,
 * and a rule is not shipped.
 *
 * Fonts are the runtime default. No font is fetched at request time, so the
 * card cannot fail because a font CDN did.
 */

import { ImageResponse } from "next/og"

import { SITE_NAME } from "@/app/_machine/contracts"

export const runtime = "nodejs"

const WIDTH = 1200
const HEIGHT = 630

const INK = "#0a0a0a"
const MUTED = "#6b7280"
const LINE = "#d4d4d4"
const PAPER = "#fafafa"

function clip(value: string | null, limit: number): string {
  if (!value) return ""
  const cleaned = value.replace(/\s+/g, " ").trim()
  return cleaned.length > limit ? `${cleaned.slice(0, limit - 1)}…` : cleaned
}

export function GET(request: Request): Response {
  const params = new URL(request.url).searchParams

  const title = clip(params.get("title"), 90) || SITE_NAME
  const description = clip(params.get("description"), 150)
  const section = clip(params.get("section"), 40)
  const status = clip(params.get("status"), 20).toLowerCase()

  const filled = status === "shipped"

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: PAPER,
        padding: "72px 80px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        {section ? (
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: MUTED,
              marginBottom: 28,
            }}
          >
            {section}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            fontSize: title.length > 46 ? 66 : 82,
            lineHeight: 1.08,
            color: INK,
            letterSpacing: -2,
            fontWeight: 700,
          }}
        >
          {title}
        </div>

        {description ? (
          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.4,
              color: MUTED,
              marginTop: 28,
              maxWidth: 900,
            }}
          >
            {description}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `2px solid ${LINE}`,
          paddingTop: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 30,
            fontWeight: 700,
            color: INK,
            letterSpacing: -0.5,
          }}
        >
          {SITE_NAME}
          <span style={{ color: MUTED, fontWeight: 400, marginLeft: 18 }}>
            health design system
          </span>
        </div>

        {status ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 24,
              letterSpacing: 1,
              textTransform: "uppercase",
              padding: "10px 22px",
              borderRadius: 999,
              border: `2px solid ${filled ? INK : LINE}`,
              backgroundColor: filled ? INK : "transparent",
              color: filled ? PAPER : MUTED,
            }}
          >
            {status}
          </div>
        ) : null}
      </div>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "cache-control":
          "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  )
}
