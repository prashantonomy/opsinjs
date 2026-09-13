/**
 * /api/feedback is the sink that does not exist yet, said out loud.
 *
 * `<Feedback>` on every page and the zero-result branch of search both post
 * here. There is no database behind this site and no analytics endpoint, so
 * this route stores nothing. It answers 501 Not Implemented and hands back a
 * ready-made GitHub issue URL with the page path, the docs version and the
 * comment already filled in.
 *
 * That is deliberate rather than a stub. A feedback widget that silently drops
 * what somebody typed is worse than no widget: it collects the report, shows a
 * thank-you, and loses it. A widget that says "this is not wired up, here is
 * the issue, pre-written, one click" is honest and still gets the report. The
 * status code makes the same statement to a monitor.
 *
 * NO PERSONAL DATA. The request body is validated, echoed into a URL, and
 * discarded. It is never written to disk and it is never logged. Anything a
 * reader types travels only to the GitHub issue they choose to open. A
 * patient-facing design system that leaked free text from its own feedback box
 * would have failed at the first thing it asks of everyone else.
 */

import {
  DOCS_VERSION,
  GITHUB_NEW_ISSUE_URL,
  GITHUB_URL,
  absoluteUrl,
  json,
} from "@/app/_machine/contracts"

export const dynamic = "force-dynamic"

const KINDS = ["page-feedback", "zero-result-search"] as const
type Kind = (typeof KINDS)[number]

const LIMITS = { comment: 2000, page: 512, query: 256, payload: 8192 }

const SHAPE = {
  method: "POST",
  contentType: "application/json",
  body: {
    kind: KINDS.join(" | "),
    page: "the site-relative path of the page the report is about, exactly as it appears in the address bar",
    helpful: "boolean, for kind: page-feedback",
    comment: `free text, up to ${LIMITS.comment} characters`,
    query: "the search term, for kind: zero-result-search",
    docsVersion: "optional; the version stamp the reader was on",
  },
} as const

function clamp(value: unknown, limit: number): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed.slice(0, limit) : undefined
}

export function GET(): Response {
  return json(
    {
      endpoint: absoluteUrl("/api/feedback"),
      status: "not-implemented",
      storage: "none",
      message:
        "This site has no feedback sink. POST here and you will get a 501 with a pre-filled GitHub issue URL in the body. Nothing you send is stored or logged.",
      request: SHAPE,
      issues: `${GITHUB_URL}/issues`,
      docsVersion: DOCS_VERSION,
    },
    { status: 200 }
  )
}

export async function POST(request: Request): Promise<Response> {
  let parsed: unknown
  try {
    const raw = await request.text()
    if (raw.length > LIMITS.payload) {
      return json(
        { error: "payload-too-large", limit: LIMITS.payload },
        { status: 413 }
      )
    }
    parsed = JSON.parse(raw)
  } catch {
    return json({ error: "invalid-json", request: SHAPE }, { status: 400 })
  }

  if (typeof parsed !== "object" || parsed === null) {
    return json({ error: "invalid-body", request: SHAPE }, { status: 400 })
  }

  const body = parsed as Record<string, unknown>
  const kind: Kind =
    typeof body.kind === "string" &&
    (KINDS as readonly string[]).includes(body.kind)
      ? (body.kind as Kind)
      : "page-feedback"

  const page = clamp(body.page, LIMITS.page)
  const comment = clamp(body.comment, LIMITS.comment)
  const query = clamp(body.query, LIMITS.query)
  const helpful = typeof body.helpful === "boolean" ? body.helpful : undefined
  const readerVersion = clamp(body.docsVersion, 64) ?? DOCS_VERSION

  if (kind === "zero-result-search" && !query) {
    return json(
      {
        error: "missing-query",
        message:
          "kind: zero-result-search requires the search term that found nothing.",
        request: SHAPE,
      },
      { status: 400 }
    )
  }
  if (kind === "page-feedback" && !page) {
    return json(
      {
        error: "missing-page",
        message: "kind: page-feedback requires the page the report is about.",
        request: SHAPE,
      },
      { status: 400 }
    )
  }

  const title =
    kind === "zero-result-search"
      ? `Search found nothing for "${query}"`
      : `Docs feedback: ${page}`

  const issueBody = [
    kind === "zero-result-search"
      ? `Searching the documentation for **${query}** returned no results.`
      : `Feedback on \`${page}\`.`,
    "",
    ...(helpful === undefined
      ? []
      : [`Was this page useful: **${helpful ? "yes" : "no"}**`, ""]),
    ...(comment ? ["### What happened", "", comment, ""] : []),
    "### Context",
    "",
    `- Page: ${page ? absoluteUrl(page) : "not given"}`,
    `- Docs version: ${readerVersion}`,
    ...(query ? [`- Search term: \`${query}\``] : []),
    "",
    "_Opened from the feedback control on the documentation site. Nothing was stored server-side; this text came from the browser that submitted it._",
  ].join("\n")

  // The issue FORM in .github/ISSUE_TEMPLATE/docs-issue.yml tells the reader
  // its Page and Docs version fields arrive pre-filled from this link, so they
  // have to be set here. A form prefills only from `?<field-id>=value`. Those
  // keys are the field ids, not the labels. The form ignores `body` entirely,
  // which is why the plain URL below exists alongside it rather than instead of
  // it. `page` is required on the form and is absent on a zero-result search,
  // so it is only sent when there is one. `kind` is deliberately left empty: it
  // is a dropdown and prefills only from an exact option string, which this
  // route cannot infer from a thumbs-down.
  const templated = new URL(GITHUB_NEW_ISSUE_URL)
  templated.searchParams.set("template", "docs-issue.yml")
  templated.searchParams.set("title", title)
  templated.searchParams.set("labels", "documentation")
  if (page) templated.searchParams.set("page", absoluteUrl(page))
  templated.searchParams.set("version", readerVersion)

  const plain = new URL(GITHUB_NEW_ISSUE_URL)
  plain.searchParams.set("title", title)
  plain.searchParams.set("labels", "documentation")
  plain.searchParams.set("body", issueBody)

  return json(
    {
      accepted: false,
      stored: false,
      reason: "no-sink-configured",
      message:
        "Feedback is not collected by this site. Your report has not been saved anywhere. Open it as an issue instead. The link below is already filled in.",
      fallback: {
        kind: "github-issue",
        /**
         * Uses the repository's issue form when it exists. Carries the page and
         * the docs version into the form's own fields; the free text cannot
         * travel this way, because a form ignores `body`.
         */
        url: templated.toString(),
        /** Works with or without the issue form; carries the whole report. */
        prefilledUrl: plain.toString(),
        title,
        body: issueBody,
      },
      echo: { kind, page, helpful, query, docsVersion: readerVersion },
      docsVersion: DOCS_VERSION,
    },
    { status: 501 }
  )
}
