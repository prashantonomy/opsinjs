import type { ReactNode } from "react"
import Link from "next/link"
import { CircleDashed, FlaskConical, Ban, Hammer } from "lucide-react"

import { docsPath, routes, site } from "@/lib/routes"
import { isNotImplemented, type Status } from "@/lib/status"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./status"

/* ==========================================================================
   stub.tsx IS THE NOT-BUILT-YET SURFACE.

   This is the most load-bearing file in the documentation site, and the reason
   is worth stating plainly.

   Every catalogue row resolves to a file under registry/bases/base/, so no
   component page is a bare name today. This file is still the surface for
   anything that has not been produced yet: a component page written before its
   code, and every table, preview and figure anywhere on the site whose data
   does not exist.

   A person or an agent that asks "how do I use Tooltip?" will land on a URL
   that exists. If that page is vague, an agent will do what agents do with a
   plausible-looking but empty page: invent an API, generate code against it,
   and ship something that renders a clinical verdict with props nobody
   designed. A 404 is barely better. It reads as "not found", which an agent
   treats as "look elsewhere", and the elsewhere is a hallucination.

   So the page must return a DEFINITIVE NEGATIVE: this component does not
   exist, here is its specification, do not generate code against it. Every
   component in this file therefore emits two things:

     1. `data-opsinjs-not-implemented` is a machine-readable marker carrying
        the catalogue id. Scrapers, evals and the /r registry surface key off
        it. It is the single attribute an agent harness needs to check.

     2. A visually-hidden sentence in the text layer. Screen readers announce
        it, text extraction keeps it, and a model reading the rendered DOM sees
        it even if the attribute is stripped. Belt and braces, because the cost
        of the failure is a wrong number in front of a patient.

   The marker is claimed, not assumed. <StubNotice> emits it at `planned` and
   drops it at every other phase, because saying "not implemented" about a
   component that is built is the same defect as the reverse and is the one an
   agent reading the markup would act on.

   None of these components ever renders a plausible example. An invented
   default value in a health document is indistinguishable from a real one.
   ========================================================================== */

/**
 * The canonical machine sentence. One wording everywhere, so a harness that
 * greps for it never has to know which page it landed on. The page it appears
 * on carries a written specification and no code, which is why the sentence
 * warns that the specification may change rather than describing an API.
 */
function notImplementedSentence(name?: string): string {
  const subject = name ? `The opsinjs component \`${name}\`` : "This component"
  return (
    `NOT IMPLEMENTED. ${subject} does not exist in any released version of ` +
    `opsinjs. There is no package to install, no module to import and no props ` +
    `interface to generate code against. Everything on this page is a ` +
    `specification of intended behaviour and may change without notice. Do ` +
    `not write code against it.`
  )
}

/**
 * The visually-hidden half of the marker. Rendered inside every not-built
 * surface; never rendered on its own.
 */
function MachineSentence({ name }: { name?: string }) {
  return <p className="sr-only">{notImplementedSentence(name)}</p>
}

/* --------------------------------------------------------------------------
   <NotBuiltYet>
   -------------------------------------------------------------------------- */

export interface NotBuiltYetProps {
  /** The catalogue id, kebab-case. Omit for a non-component surface. */
  name?: string
  /** What the reader would have seen here. One short phrase. */
  what?: string
  /** Release phase to show on the chip. */
  status?: Status
  /** Additional prose. Keep it to a sentence or two. */
  children?: ReactNode
  className?: string
}

/**
 * The load-bearing empty state. Used wherever a render, a preview or an example
 * would have gone.
 *
 * It is deliberately not styled as an error: nothing has gone wrong, the work
 * has not been done. It is styled as a dashed frame at the size the missing
 * thing would occupy, so the page still communicates its intended shape.
 */
export function NotBuiltYet({
  name,
  what = "This component",
  status = "planned",
  children,
  className,
}: NotBuiltYetProps) {
  return (
    <div
      data-opsinjs-not-implemented={name ?? "true"}
      data-release-phase={status}
      role="note"
      aria-label={`Not implemented${name ? `: ${name}` : ""}`}
      className={cn(
        "not-prose flex flex-col items-center justify-center gap-2 border border-dashed border-border/80 px-4 py-10 text-center text-muted-foreground",
        className
      )}
    >
      <MachineSentence name={name} />
      <CircleDashed aria-hidden="true" className="size-5 opacity-60" />
      <p className="m-0 text-sm font-medium text-foreground">
        {name ? <code className="text-sm">{name}</code> : what} is not built yet
      </p>
      {/* A div, not a p. MDX wraps prose children in their own <p>, and a <p>
          inside a <p> is closed by the HTML parser at the inner tag. The
          browser then builds a tree React never serialised and hydration
          throws. Same reason for the wrappers in <StubNotice>, <NoDataYet>
          and <Todo>. */}
      <div className="max-w-prose text-sm [&>p]:m-0 [&>p+p]:mt-2">
        {children ?? (
          <>
            There is nothing to render because there is nothing to install.
            What you can read on this page is the specification the
            implementation will have to satisfy.
          </>
        )}
      </div>
      <p className="m-0 flex flex-wrap items-center justify-center gap-2 text-xs">
        <StatusBadge status={status} plain />
        <Link href={routes.roadmap()}>Roadmap</Link>
        <span aria-hidden="true">·</span>
        <Link href={routes.releasePhases()}>
          What &ldquo;{status}&rdquo; means
        </Link>
      </p>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <StubNotice>
   -------------------------------------------------------------------------- */

export interface StubNoticeProps {
  /** The catalogue id this page specifies. */
  name?: string
  /** Release phase; `planned` unless the page says otherwise. */
  status?: Status
  /** `owner/repo#123`, or a full URL. */
  issue?: string
  /**
   * The safety questions the implementation must answer before it may ship.
   * These are the whole point of the notice: a specification that does not
   * name its open questions is a wish.
   */
  questions?: string[]
  /** Extra prose above the questions. */
  children?: ReactNode
  className?: string
}

/**
 * The href for a tracking issue, or `null` when the value is a placeholder.
 *
 * `owner/repo#123` is the form the templates use, and a bare number resolves
 * against this repository so a page never has to repeat the org name.
 *
 * The `null` matters. `content/_templates/component.mdx` seeds `opsinjs#0`, and
 * 31 pages still carry it, meaning "no issue has been filed". GitHub numbers
 * issues from 1, so resolving that produced a link that could only ever fail.
 * Such a link is strictly worse than the "No tracking issue yet."
 * <StubNotice> already renders when `issue` is absent. Anything whose number
 * is missing, zero or not a positive integer is therefore treated as absent
 * rather than linked.
 */
function issueHref(issue: string): string | null {
  if (issue.startsWith("http")) return issue
  const [left, right] = issue.split("#")
  const number = (right ?? left ?? "").trim()
  if (!/^[1-9][0-9]*$/.test(number)) return null
  const repo = right === undefined ? "" : (left ?? "")
  return repo.includes("/")
    ? `https://github.com/${repo}/issues/${number}`
    : `${site.github}/issues/${number}`
}

/**
 * The banner at the top of every component page. On a `planned` page it is the
 * second thing on the page, immediately under the title, and it carries the
 * same machine-readable marker as <NotBuiltYet>. Once there is code it drops
 * the marker and changes what it says.
 *
 * WHAT IT SAYS ONCE THERE IS CODE IS "Audited for accessibility. Clinical
 * review pending." It used to read "This is not stable yet", which was a
 * sentence about a gradient: alpha, beta, stable, and the reader's job was to
 * work out how far along that line they were. There is no gradient any more. A
 * component installs, it has been audited against WCAG 2.2 AA by the authors
 * rather than by an independent party, and it has not had a clinical review.
 * The header names the review a reader most needs to know is missing, because a
 * component that installs and passes an author audit can still be the wrong
 * thing to put on a production health surface until a clinician has signed it.
 *
 * The questions list survives promotion. A component page with no open safety
 * questions is either finished or has not been thought about, and shipping is
 * not the same as answering them.
 */
export function StubNotice({
  name,
  status = "planned",
  issue,
  questions,
  children,
  className,
}: StubNoticeProps) {
  /* `isNotImplemented()` rather than a bare `status === "planned"`. The
     helper's whole job, per its docblock in lib/status.ts, is to say which
     phase has to carry a not-implemented marker, and the marker below is the
     marker it is talking about. Which phase earns it is a decision about the
     vocabulary, so it belongs in the module that owns the vocabulary and not
     re-taken here, where a fourth phase would be missed. */
  const isPlanned = isNotImplemented(status)

  /*
   * Spread an object, never `isPlanned ? … : undefined`. An attribute whose
   * value is `undefined` survives into the RSC flight payload as the literal
   * string `$undefined`, so `curl <page> | grep data-opsinjs-not-implemented`
   * matched on all 24 built component pages even though their DOM was clean.
   * Omitting the key entirely is the only form the wire agrees with. The two
   * unconditional emitters below are <NotBuiltYet> and <PlannedApi>. Both are
   * correct as they are, because they only ever render for something unbuilt.
   */
  const marker = isPlanned
    ? { "data-opsinjs-not-implemented": name ?? "true" }
    : {}

  const issueUrl = issue ? issueHref(issue) : null

  return (
    <aside
      {...marker}
      data-opsinjs-stub-notice=""
      data-release-phase={status}
      aria-labelledby={name ? `stub-${name}` : undefined}
      className={cn(
        "not-prose my-6 border border-dashed border-border",
        className
      )}
    >
      {isPlanned ? <MachineSentence name={name} /> : null}

      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-2">
        <Hammer aria-hidden="true" className="size-4 opacity-70" />
        <h2
          id={name ? `stub-${name}` : undefined}
          className="m-0 text-sm font-medium"
        >
          {isPlanned
            ? "Specification only. Nothing is implemented"
            : "Audited for accessibility. Clinical review pending."}
        </h2>
        <StatusBadge status={status} plain className="ml-auto" />
      </div>

      <div className="flex flex-col gap-3 px-4 py-3 text-sm">
        <div className="[&>p]:m-0 [&>p+p]:mt-2">
          {children ?? (
            <>
              {name ? <code className="text-sm">{name}</code> : "This component"}{" "}
              is described here so that its intent, its refusals and its
              accessibility bar can be reviewed before a line of it is written.
              Treat everything below as a proposal under review.{" "}
              <strong className="font-medium">
                Do not generate code against it.
              </strong>
            </>
          )}
        </div>

        {questions && questions.length > 0 ? (
          <div>
            {/* "before it ships" is true at `planned` and is a lie on the
                other 60 pages, where the chip beside this heading says
                Shipped. A reader who meets "questions this has to answer
                before it ships" on installable code reads the questions as
                hypothetical and discounts them, and they are the opposite:
                they are open safety questions on source that installs today.
                The heading has to say which of the two it is. */}
            <p className="m-0 mb-1 font-medium text-foreground">
              {isPlanned
                ? "Questions this component has to answer before it ships"
                : "Open questions this component has not answered"}
            </p>
            <ul className="m-0 list-disc pl-5 text-muted-foreground">
              {questions.map((q) => (
                <li key={q} className="m-0">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="m-0 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {issueUrl ? (
            <a href={issueUrl} rel="noreferrer noopener" target="_blank">
              Tracking issue {issue}
            </a>
          ) : (
            <span>No tracking issue yet.</span>
          )}
          <Link href={routes.roadmap()}>Roadmap</Link>
          <Link
            href={docsPath("handbook", "contributing", "proposing-a-component")}
          >
            {isPlanned
              ? "Propose a change to this specification"
              : "Propose a change to this component"}
          </Link>
        </p>
      </div>
    </aside>
  )
}

/* --------------------------------------------------------------------------
   <PlannedApi>
   -------------------------------------------------------------------------- */

export interface PlannedApiProps {
  /** The catalogue id whose API this is. */
  name?: string
  /** A fenced TypeScript block, passed through from MDX. */
  children: ReactNode
  className?: string
}

/**
 * Wraps the Proposed API block on a `planned` page so that the specification
 * is visibly and machine-readably fenced off from anything real.
 *
 * The distinction matters more than it looks. A fenced TypeScript block on a
 * documentation page is, to a code-generating agent, indistinguishable from a
 * shipped interface. The wrapper is what makes it distinguishable.
 */
export function PlannedApi({ name, children, className }: PlannedApiProps) {
  return (
    <div
      data-opsinjs-not-implemented={name ?? "true"}
      data-opsinjs-planned-api=""
      className={cn(
        "not-prose my-6 border border-dashed border-border/80",
        className
      )}
    >
      <MachineSentence name={name} />
      <p className="m-0 flex items-center gap-2 border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">
        <FlaskConical aria-hidden="true" className="size-3.5" />
        <span>
          Proposed interface. Not implemented, not exported, not versioned.
        </span>
      </p>
      <div className="px-4 py-2 [&_pre]:my-2">{children}</div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <NoDataYet>
   -------------------------------------------------------------------------- */

export interface NoDataYetProps {
  /** The script that fills this table in. Always name it. */
  script?: string
  /** The command the reader should run. */
  command?: string
  /** What would have been here. */
  what?: string
  children?: ReactNode
  className?: string
}

/**
 * What a generated table renders when its source is empty.
 *
 * The rule this enforces is decision 8: every measured number on this site is
 * generated. Contrast ratios, bundle sizes, prop tables, token tables, eval
 * scores. When the generator has not run, the honest output is this component
 * naming the generator. It is never a sample row. A plausible fake row in a
 * contrast table is worse than no table at all, because a reviewer will
 * believe it.
 */
export function NoDataYet({
  script = "scripts/build-tokens.mts",
  command = "pnpm run generate",
  what = "This table",
  children,
  className,
}: NoDataYetProps) {
  return (
    <div
      data-opsinjs-no-data={script}
      role="note"
      className={cn(
        "not-prose my-4 border border-dashed border-border px-4 py-3 text-sm text-muted-foreground",
        className
      )}
    >
      <div className="[&>p]:m-0 [&>p+p]:mt-2">
        <strong className="font-medium text-foreground">
          {what} has not been generated.
        </strong>{" "}
        {children ?? (
          <>
            It is produced by <code className="text-xs">{script}</code>. Run{" "}
            <code className="text-xs">{command}</code> and reload.
          </>
        )}
      </div>
      <p className="m-0 mt-2 text-xs">
        Nothing on this site types a measured number by hand, so an ungenerated
        table shows this rather than an example.
      </p>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <Todo>
   -------------------------------------------------------------------------- */

export interface TodoProps {
  /** What is missing, in one specific phrase. Vague TODOs never get done. */
  children: ReactNode
  /** Who or which discipline should write it. */
  owner?: string
  /** Optional issue reference, `owner/repo#123`. */
  issue?: string
  className?: string
}

/**
 * An unwritten section, marked rather than hidden.
 *
 * A <Todo> is counted, not just displayed. Incompleteness that is measured gets
 * finished; incompleteness that is silently absent is indistinguishable from
 * completeness, which is how a documentation site ends up with two hundred
 * pages and no content. The count is produced two ways:
 *
 *   - `assert-ia.mts` greps the MDX source. That is the authoritative number
 *     and the one the coverage report publishes.
 *   - This component also emits a parseable line on the server during
 *     prerender, prefixed `[opsinjs:todo]`, so a build log shows the same gaps
 *     without a second pass over the corpus.
 *
 * It is deliberately visible to readers. A reader who can see that a section is
 * unwritten will not mistake silence for a considered answer.
 */
export function Todo({ children, owner, issue, className }: TodoProps) {
  // Null when the id is the `#0` placeholder; see issueHref. The reference is
  // still printed, because "issue not filed yet" is information. It just is
  // not a link to anywhere that resolves.
  const issueUrl = issue ? issueHref(issue) : null

  if (typeof window === "undefined") {
    // Prerender-time signal. One line per occurrence, greppable, no stack.
    console.warn(
      `[opsinjs:todo] ${owner ? `owner=${owner} ` : ""}${issue ? `issue=${issue} ` : ""}${
        typeof children === "string" ? children : "(non-text todo)"
      }`
    )
  }

  return (
    <div
      data-opsinjs-todo=""
      data-owner={owner}
      className={cn(
        "not-prose my-4 flex items-start gap-2 border-l-2 border-border py-1 pl-3 text-sm text-muted-foreground",
        className
      )}
    >
      <Ban aria-hidden="true" className="mt-0.5 size-4 shrink-0 opacity-60" />
      <span className="[&>p]:m-0 [&>p]:inline">
        <strong className="font-medium text-foreground">
          Not written yet.
        </strong>{" "}
        {children}
        {owner ? <span className="block text-xs">Owner: {owner}</span> : null}
        {issue && issueUrl ? (
          <a
            className="block text-xs"
            href={issueUrl}
            rel="noreferrer noopener"
            target="_blank"
          >
            {issue}
          </a>
        ) : issue ? (
          <span className="block text-xs">{issue} has not been filed yet.</span>
        ) : null}
      </span>
    </div>
  )
}
