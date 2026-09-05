import { isValidElement, type ReactNode } from "react"
import type { TOCItemType } from "fumadocs-core/toc"

import {
  accessibilitySectionFor,
  componentSections,
  OUTLINE_IS_EXACT,
  SECTION_OUTLINES,
  type Kind,
  type Status,
} from "@/lib/status"

/* ==========================================================================
   page-template.tsx — <PageTemplate>: the page declares its `kind`, and the
   section contract for that kind is enforced against what the page actually
   contains.

   WHY A RUNTIME COMPONENT AND NOT ONLY A LINTER

   A page's `kind` fully determines its headings. That contract is worth
   nothing if it is only written down: 280 MDX files are authored in parallel,
   and the failure mode is not a missing page but a page with the right title
   and the wrong bones — a component page with no "When to use it", a health
   page with no "What this does not cover". Both look finished.

   So it is enforced twice, and the two halves catch different things:

     scripts/assert-ia.mts   parses the MDX SOURCE. Authoritative, exhaustive,
                             can name a line number, and runs in `pnpm check`
                             without rendering anything.

     <PageTemplate>          runs during PRERENDER. Every docs page is
                             statically generated, so throwing here fails
                             `next build` and Next names the route it failed on.
                             It sees the page's real table of contents, so a
                             heading lost inside a component still gets caught.

   BOTH READ THE SAME TABLE. `SECTION_OUTLINES` and `COMPONENT_SECTIONS_BY_STATUS`
   live in lib/status.ts, which is also what content/_templates/*.mdx implements
   and what assert-ia.mts checks. Three enforcers, one list. If this file kept
   its own copy, the copy would be right on the day it was written and wrong
   from the first time somebody added a section.

   NO "use client". The docs route hands the table of contents down as a prop,
   so nothing here needs a hook, nothing ships to the browser, and the throw
   happens on the server where it can stop a build.
   ========================================================================== */

/** Fatality policy — see `Problem.fatal` below. */
type ProblemKind = "missing" | "order" | "forbidden" | "unexpected"

interface Problem {
  kind: ProblemKind
  section: string
  detail: string
  /**
   * Fatal problems throw and therefore fail `next build`. Non-fatal ones render
   * a visible panel and log a greppable line.
   *
   * The split is deliberate. A MISSING mandatory section, a section in the
   * wrong order, or a clinical claim on a component that is not clinical all
   * change what the page MEANS, so they stop the build. An extra heading is a
   * housekeeping defect: it is reported here and failed properly by assert-ia,
   * which can see the source and point at the line rather than at a route.
   */
  fatal: boolean
}

/**
 * Headings that are legitimately written two ways. "Research and rationale" and
 * "Research & rationale" are the same section; failing a build over an
 * ampersand teaches authors to fight the tool instead of using it.
 */
const ALIASES: Record<string, string[]> = {
  "when to use it": ["when to use"],
  accessibility: ["accessibility requirements"],
  "accessibility requirements": ["accessibility"],
  "research and rationale": ["research & rationale", "research"],
  "approved / rejected": ["approved and rejected"],
  "why (evidence)": ["why", "why — evidence"],
}

/** "Approved / Rejected" and "approved  /  rejected" are the same heading. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/[.:]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
}

function candidatesFor(heading: string): string[] {
  const key = normalize(heading)
  return [key, ...(ALIASES[key] ?? []).map(normalize)]
}

/** TOC titles are ReactNode. Pull the text out of whatever shape arrived. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children)
  }
  return ""
}

export interface PageTemplateProps {
  kind: Kind
  /**
   * The page's release phase. Only `component` gates its outline on it.
   *
   * The default is `planned` because it is the CONSERVATIVE answer, not the
   * common one. No component page sits at `planned` today — every generated
   * page passes its real status, and registry/catalogue.ts is where those
   * live — so the default only ever catches a page that forgot to declare
   * one. `planned` is what that page should be held to: it claims the
   * least about the code while still resolving to a real outline, where
   * `considered` resolves to an empty one and would check nothing at all.
   */
  status?: Status
  /**
   * The page's catalogue category. A category beginning with `health-` makes
   * "Clinical meaning" mandatory and forbids it everywhere else. When it is not
   * supplied the section becomes optional rather than forbidden, because the
   * template cannot tell a non-clinical component from a page that simply did
   * not pass the prop — and assert-ia, which reads the frontmatter, can.
   */
  category?: string
  /** The page's table of contents, from `page.data.toc`. */
  toc?: TOCItemType[]
  /** The page path, for the error message. Optional; Next names the route too. */
  path?: string
  /** The page body. */
  children?: ReactNode
}

export function PageTemplate({
  kind,
  status = "planned",
  category,
  toc,
  path,
  children,
}: PageTemplateProps) {
  const categoryKnown = category !== undefined
  const isHealthComponent = Boolean(category?.startsWith("health-"))

  // `componentSections` filters "Clinical meaning" out for a non-health
  // category. With no category we ask for the health variant and then treat
  // that one section as optional, so a page is never failed for a heading whose
  // requirement we cannot see.
  const expected: string[] =
    kind === "component"
      ? componentSections(status, categoryKnown ? category : "health-")
      : SECTION_OUTLINES[kind]

  const optional = new Set<string>()
  if (kind === "component" && !categoryKnown) optional.add("Clinical meaning")

  const headings = (toc ?? [])
    .filter((item) => item.depth === 2)
    .map((item) => textOf(item.title))
    .filter((title) => title.length > 0)

  /**
   * Whether an H2 the outline does not name is a problem.
   *
   * `component` is exact — unless the outline is EMPTY. `componentSections()`
   * returns `[]` at `considered` (ADR 0008: those pages are generated and thin
   * by design), and an empty allowed-set makes every heading UNEXPECTED, which
   * put a developer error dump naming repo paths above the fold on all 36 of
   * them in production. An empty outline is the absence of a contract, not a
   * contract that forbids everything.
   *
   * Nothing is unguarded by this. assert-ia.mts checks `considered` pages
   * against CONSIDERED_COMPONENT_HEADINGS in both directions, before it
   * resolves an outline at all, precisely because `componentSections()` returns
   * `[]` — its comment says this branch is "the same gate on the authoring
   * side". The fix belongs here rather than in lib/status.ts: giving
   * `considered` a non-empty outline there would collide with that gate.
   */
  const exact =
    kind === "component" ? expected.length > 0 : OUTLINE_IS_EXACT[kind]

  const problems: Problem[] = []

  // An empty table of contents means it was not passed down, not that the page
  // is empty. Never fail a build on an absent input; assert-ia reads the source.
  if (headings.length > 0) {
    const present = headings.map(normalize)

    let cursor = -1
    let previous: string | undefined
    for (const section of expected) {
      const at = present.findIndex((heading) =>
        candidatesFor(section).includes(heading)
      )

      if (at === -1) {
        if (!optional.has(section)) {
          problems.push({
            kind: "missing",
            section,
            detail: `no "## ${section}" in this page`,
            fatal: true,
          })
        }
        continue
      }

      if (at < cursor) {
        problems.push({
          kind: "order",
          section,
          detail: previous
            ? `appears above "## ${previous}", but the outline puts it below`
            : "appears above a section the outline places before it",
          fatal: true,
        })
      }
      cursor = Math.max(cursor, at)
      previous = section
    }

    // The mirror error, and the more dangerous one: a clinical claim on a
    // component that is not clinical implies a verdict it may not carry.
    if (
      kind === "component" &&
      categoryKnown &&
      !isHealthComponent &&
      present.includes("clinical meaning")
    ) {
      problems.push({
        kind: "forbidden",
        section: "Clinical meaning",
        detail: `category "${category}" does not start with "health-", so this component asserts nothing clinical and must not have this section`,
        fatal: true,
      })
    }

    if (exact) {
      const allowed = new Set(expected.flatMap(candidatesFor))
      if (kind === "component") {
        // Both spellings of section 14 are allowed at any status; the canonical
        // one for this status is what assert-ia asks for.
        allowed.add(normalize(accessibilitySectionFor(status)))
        allowed.add("clinical meaning")
      }
      for (const heading of present) {
        if (!allowed.has(heading)) {
          problems.push({
            kind: "unexpected",
            section: heading,
            detail: `kind "${kind}" has no such section — authors fill the template, they do not invent headings`,
            fatal: false,
          })
        }
      }
    }
  }

  if (problems.length > 0) {
    const message = buildMessage(path, kind, status, expected, problems)
    const lenient = process.env.OPSINJS_PAGE_TEMPLATE === "warn"

    if (problems.some((problem) => problem.fatal) && !lenient) {
      throw new Error(message)
    }
    console.warn(message)

    return (
      <>
        <div
          role="alert"
          className="not-prose my-6 border-l-4 border-border p-4 text-sm"
          style={{
            borderColor: "var(--opsin-status-attention-line, var(--border))",
            background: "var(--opsin-status-attention-surface, var(--muted))",
            color: "var(--opsin-status-attention-ink, var(--foreground))",
          }}
        >
          <p className="m-0 font-medium">
            This page does not match the contract for kind &ldquo;{kind}&rdquo;
            at status &ldquo;{status}&rdquo;.
          </p>
          <pre className="m-0 mt-2 overflow-x-auto text-xs whitespace-pre-wrap">
            {message}
          </pre>
        </div>
        {children}
      </>
    )
  }

  return (
    <>
      {/* The contract, machine-readable. An agent reading this page can tell
          which sections it is entitled to expect, rather than inferring it from
          the headings it happens to find. */}
      <script
        type="application/json"
        data-opsinjs-page-contract=""
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            kind,
            status,
            category: category ?? null,
            requiredSections: expected,
            exactOutline: kind === "component" ? true : OUTLINE_IS_EXACT[kind],
          }),
        }}
      />
      {children}
    </>
  )
}

function buildMessage(
  path: string | undefined,
  kind: Kind,
  status: Status,
  expected: string[],
  problems: Problem[]
): string {
  return [
    `[opsinjs] Page contract violation${path ? ` on ${path}` : ""}`,
    "",
    `  kind:   ${kind}`,
    `  status: ${status}`,
    "",
    "  Problems:",
    ...problems.map(
      (problem) =>
        `    - ${problem.kind.toUpperCase()} "${problem.section}": ${problem.detail}`
    ),
    "",
    `  A "${kind}" page at status "${status}" has exactly these H2 sections, in this order:`,
    ...expected.map((section, index) => `    ${index + 1}. ## ${section}`),
    "",
    "  Fix it by copying the template rather than editing headings by hand:",
    `    apps/www/content/_templates/${kind}.mdx`,
    "",
    "  A heading with nothing under it is worse than an absent heading. If a",
    "  section has no content yet, put <Todo> inside it so the gap is counted",
    "  in the coverage report instead of hidden.",
  ].join("\n")
}
