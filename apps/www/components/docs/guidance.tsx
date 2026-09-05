import { isValidElement, type ComponentProps, type ReactNode } from "react"
import Link from "next/link"
import {
  Callout as FumaCallout,
  type CalloutType,
} from "fumadocs-ui/components/callout"
import { Check, ShieldAlert, Stethoscope, X } from "lucide-react"

import { getEntry, type CatalogueEntry } from "@/lib/catalogue"
import { isBuilt } from "@/lib/registry"
import { componentPath } from "@/lib/routes"
import {
  CLINICAL_STATUSES,
  CLINICAL_STATUS_META,
  isClinicalStatus,
  STATUS_META,
  type ClinicalStatus,
} from "@/lib/status"
import { cn } from "@/lib/utils"

/* ==========================================================================
   guidance.tsx — <DoDont>, <Callout>, <SafetyCallout>, <ClinicalNote>,
   <ResearchNote>, <Reviewed>, <PlainLanguage>, <ReadingLevel>, <WhenToUse>.

   These are the components that carry opinion, evidence and prohibition, and
   the rules they enforce are the ones the site would be most damaged by
   breaking.

   ONE STATUS VOCABULARY, DOCS AND PRODUCT. <Callout> accepts the four clinical
   levels — steady, watch, attention, urgent — as well as fumadocs' own info/
   warn/error types, and maps the clinical ones onto the same tokens the product
   uses. A documentation site that admonishes in one colour language while
   teaching another is teaching two. `expected` and `act` are dead vocabulary:
   they are not accepted here, and reintroducing either — in a comment, a
   default or an identifier — puts the two vocabularies back.

   EVIDENCE IS DECLARED, NEVER IMPLIED. <ResearchNote> and <ClinicalNote> take
   an `evidence` value and a date, and `cited` means a source a reader can open.
   An honest `opinion` is always better than a plausible reference: a fabricated
   citation in a health document is the single worst thing this repository could
   contain, and it is the easiest thing for a generated page to produce.

   A REDIRECTION IS ONLY AS GOOD AS ITS DESTINATION. <WhenToUse> resolves the
   id it is about to send a reader to, and says so when nothing has been built
   behind it. This file is therefore server-only, like status.tsx and
   anatomy.tsx: it reads the catalogue and the registry index, and adding
   "use client" to it would drag both into a browser bundle.
   ========================================================================== */

/** Pull plain text out of arbitrary children, for counting and for aria. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join(" ")
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children)
  }
  return ""
}

/* --------------------------------------------------------------------------
   <Callout>
   -------------------------------------------------------------------------- */

const CLINICAL_TO_FUMA: Record<ClinicalStatus, CalloutType> = {
  steady: "success",
  watch: "info",
  attention: "warn",
  urgent: "error",
}

export interface CalloutProps extends Omit<
  ComponentProps<typeof FumaCallout>,
  "type"
> {
  /**
   * Either a clinical level or one of fumadocs' own types. Both are accepted
   * because Markdown blockquote admonitions (`> [!NOTE]`) compile to the
   * fumadocs types, and breaking those would break every page that uses the
   * ordinary Markdown syntax.
   */
  type?: ClinicalStatus | CalloutType
}

export function Callout({ type = "info", children, ...props }: CalloutProps) {
  const isClinical = (CLINICAL_STATUSES as readonly string[]).includes(type)
  const level = isClinical ? (type as ClinicalStatus) : undefined

  return (
    <FumaCallout
      type={level ? CLINICAL_TO_FUMA[level] : (type as CalloutType)}
      data-status={level}
      {...props}
    >
      {children}
    </FumaCallout>
  )
}

/* --------------------------------------------------------------------------
   <SafetyCallout>
   -------------------------------------------------------------------------- */

export interface SafetyCalloutProps {
  /** How bad it is if this is ignored. Maps onto the clinical status ramp. */
  severity: ClinicalStatus
  /** A source a reader can open. Required unless `evidence` is "opinion". */
  cite?: string
  /** Where the claim comes from. Declared, never implied. */
  evidence?: "cited" | "opinion" | "mixed"
  /** Short heading. Say the risk, not the topic. */
  title?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * The heavier clinical-safety admonition. Visually distinct from <Callout>
 * because it means something different: a Callout is guidance, a SafetyCallout
 * is a statement about how somebody could be harmed.
 *
 * It refuses to be silent about its own provenance. A safety claim with no
 * citation and no opinion marker renders a visible defect notice rather than
 * quietly looking authoritative — that is the failure mode that matters, since
 * an unmarked assertion in a red box is exactly what a reader will trust most.
 */
export function SafetyCallout({
  severity,
  cite,
  evidence,
  title,
  children,
  className,
}: SafetyCalloutProps) {
  const declared =
    evidence === "opinion" || Boolean(cite) || evidence === "mixed"

  /**
   * MDX prop values are not typechecked, so `severity` arrives as an arbitrary
   * string at runtime. An unrecognised level used to read `undefined.word` and
   * take the whole prerender down — one mistyped attribute in one page killing
   * the entire corpus. Fall back to the highest level (a safety note is never
   * quietly downgraded), render a visible defect notice, and log it. The
   * authoritative gate is assert-ia, which fails on the source.
   */
  const level: ClinicalStatus = isClinicalStatus(severity) ? severity : "urgent"
  const meta = CLINICAL_STATUS_META[level]

  if (!isClinicalStatus(severity) && typeof window === "undefined") {
    console.warn(
      `[opsinjs:vocabulary] SafetyCallout severity="${String(severity)}" is not a clinical status. Use one of ${CLINICAL_STATUSES.join(", ")}.`
    )
  }

  if (!declared && typeof window === "undefined") {
    console.warn(
      `[opsinjs:evidence] SafetyCallout severity="${String(severity)}" has neither a citation nor evidence="opinion".`
    )
  }

  return (
    <aside
      data-safety-callout=""
      data-status={level}
      role="note"
      aria-label={`Safety note, severity ${meta.word}`}
      className={cn("not-prose my-6 border-l-4 p-4", className)}
      style={{
        borderColor: `var(--opsin-status-${level}-line, var(--border))`,
        background: `var(--opsin-status-${level}-surface, var(--muted))`,
        color: `var(--opsin-status-${level}-ink, var(--foreground))`,
      }}
    >
      <p className="m-0 flex items-center gap-2 text-sm font-semibold">
        <ShieldAlert aria-hidden="true" className="size-4 shrink-0" />
        {title ?? `Safety — ${meta.word}`}
      </p>
      <div className="mt-1 text-sm [&>p]:m-0 [&>p+p]:mt-2">{children}</div>

      <p className="m-0 mt-3 text-xs opacity-80">
        {cite ? (
          <>Source: {cite}</>
        ) : evidence === "opinion" ? (
          <>
            This is a design opinion, not a clinical finding. It has not been
            validated by a study and should be read as a starting position.
          </>
        ) : (
          <strong className="font-semibold">
            Evidence not declared. This callout must carry either a citation or
            evidence=&ldquo;opinion&rdquo;; as written it is a defect.
          </strong>
        )}
      </p>
    </aside>
  )
}

/* --------------------------------------------------------------------------
   <ClinicalNote> and <ResearchNote>
   -------------------------------------------------------------------------- */

export interface ClinicalNoteProps {
  children: ReactNode
  /** Who reviewed the claim, by discipline. Not a name. */
  reviewer?: "design" | "engineering" | "clinical" | "content"
  className?: string
}

/**
 * A short inline note in a clinician's voice — the sentence that explains why a
 * design rule exists in terms of what a clinician would actually say.
 */
export function ClinicalNote({
  children,
  reviewer = "clinical",
  className,
}: ClinicalNoteProps) {
  return (
    <p
      data-opsinjs-note="clinical"
      className={cn(
        "not-prose my-4 flex items-start gap-2 border-l-2 border-border py-1 pl-3 text-sm text-muted-foreground",
        className
      )}
    >
      <Stethoscope aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        {children}
        <span className="block text-xs opacity-80">
          Reviewed by {reviewer}.
        </span>
      </span>
    </p>
  )
}

export interface ResearchNoteProps {
  /** Declared, never implied. */
  evidence: "cited" | "opinion" | "mixed"
  /** ISO date the claim was last stood behind. */
  date?: string
  /** Sources, each a reference a reader can check. */
  sources?: { label: string; href?: string }[]
  children: ReactNode
  className?: string
}

/**
 * The full block behind a design decision: why it is shaped this way, dated,
 * with evidence separated from opinion.
 *
 * The date matters as much as the source. A claim about how people read lab
 * results in 2019 is a different claim in 2026, and the reviewer who has to
 * decide whether to trust it needs to know which one they are reading.
 */
export function ResearchNote({
  evidence,
  date,
  sources,
  children,
  className,
}: ResearchNoteProps) {
  return (
    <aside
      data-opsinjs-note="research"
      data-evidence={evidence}
      className={cn("not-prose my-6 border border-border p-4", className)}
    >
      <p className="m-0 flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
        <span className="border border-border px-1.5 py-px font-medium tracking-wide uppercase">
          {evidence}
        </span>
        {date ? <span>as at {date}</span> : null}
      </p>

      <div className="mt-2 text-sm [&>p]:m-0 [&>p+p]:mt-2">{children}</div>

      {evidence === "opinion" ? (
        <p className="m-0 mt-3 text-xs text-muted-foreground">
          Opinion. No study is being claimed here. If you have evidence that
          contradicts it, that is the fastest way to change this page.
        </p>
      ) : null}

      {sources?.length ? (
        <ul className="m-0 mt-3 list-disc pl-5 text-xs text-muted-foreground">
          {sources.map((source) => (
            <li key={source.label} className="m-0">
              {source.href ? (
                <a href={source.href} rel="noreferrer noopener" target="_blank">
                  {source.label}
                </a>
              ) : (
                source.label
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  )
}

/* --------------------------------------------------------------------------
   <Reviewed>
   -------------------------------------------------------------------------- */

export interface ReviewedProps {
  /** ISO date of the last review. */
  date?: string
  /** The discipline that reviewed it. Discipline, not a person. */
  by?: "design" | "engineering" | "clinical" | "content"
  /** The freshness SLA declared in frontmatter. */
  every?: "3m" | "6m" | "12m" | "never"
  /** The page path, used to stamp printed copies. */
  path?: string
  className?: string
}

/**
 * The review provenance block that ends every health, accessibility, pattern
 * and project page.
 *
 * A health page with no review date is a page nobody has to maintain. The
 * `every` value is a promise with an expiry, and `scripts/check-freshness.mts`
 * reports the ones that have passed it — which is the difference between a
 * review policy and a review.
 */
export function Reviewed({ date, by, every, path, className }: ReviewedProps) {
  return (
    <p
      data-reviewed=""
      data-page-url={path ?? ""}
      className={cn(
        "not-prose mt-8 border-t border-border pt-3 text-xs text-muted-foreground",
        className
      )}
    >
      {date ? (
        <>
          Last reviewed {date}
          {by ? ` by ${by}` : ""}.
        </>
      ) : (
        <>Not yet reviewed.</>
      )}{" "}
      {every && every !== "never" ? (
        <>
          Due for review every {every.replace("m", " months")}; expiry is
          reported by <code className="text-xs">pnpm run check:freshness</code>.
        </>
      ) : null}
    </p>
  )
}

/* --------------------------------------------------------------------------
   <DoDont>
   -------------------------------------------------------------------------- */

export interface DoDontProps {
  children: ReactNode
  className?: string
}

function DoCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      data-dodont="do"
      className={cn("border-l-4 p-3 text-sm", className)}
      style={{
        borderColor: "var(--opsin-status-steady-line, var(--border))",
        background: "var(--opsin-status-steady-surface, var(--muted))",
        color: "var(--opsin-status-steady-ink, var(--foreground))",
      }}
    >
      <p className="m-0 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        <Check aria-hidden="true" className="size-3.5" />
        Do
      </p>
      <div className="mt-1 [&>p]:m-0 [&>p+p]:mt-2">{children}</div>
    </div>
  )
}

function DontCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      data-dodont="dont"
      className={cn("border-l-4 p-3 text-sm", className)}
      style={{
        borderColor: "var(--opsin-status-urgent-line, var(--border))",
        background: "var(--opsin-status-urgent-surface, var(--muted))",
        color: "var(--opsin-status-urgent-ink, var(--foreground))",
      }}
    >
      <p className="m-0 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        <X aria-hidden="true" className="size-3.5" />
        Don&rsquo;t
      </p>
      <div className="mt-1 [&>p]:m-0 [&>p+p]:mt-2">{children}</div>
    </div>
  )
}

/**
 * Paired approved and rejected cards — the primary vehicle for content and
 * clinical guidance on this site.
 *
 * They are laid out side by side on a wide screen and stacked on a narrow one,
 * with Do always first. The pairing is the teaching: a prohibition on its own
 * tells somebody what not to write and leaves them with the same blank page
 * they started with.
 *
 * The colours are the clinical ramp rather than a generic green and red, on
 * purpose. There is one colour vocabulary on this site and the documentation
 * does not get its own.
 */
export function DoDont({ children, className }: DoDontProps) {
  return (
    <div className={cn("not-prose my-6 grid gap-3 md:grid-cols-2", className)}>
      {children}
    </div>
  )
}

DoDont.Do = DoCard
DoDont.Dont = DontCard

/* --------------------------------------------------------------------------
   <PlainLanguage>
   -------------------------------------------------------------------------- */

export interface PlainLanguageProps {
  /** The clinical phrasing, as it appears in a report or a portal. */
  clinical: ReactNode
  /** The plain-English replacement. */
  plain: ReactNode
  /** When both must be shown, and why. */
  note?: ReactNode
  className?: string
}

/**
 * Clinical phrasing beside its plain-English replacement.
 *
 * Both halves are shown because replacing is not always right. A reader who
 * will take a printout to an appointment needs the clinical term too, or they
 * cannot ask about it — so the rule this component teaches is "lead with plain
 * English and keep the clinical word available", not "delete the clinical word".
 */
export function PlainLanguage({
  clinical,
  plain,
  note,
  className,
}: PlainLanguageProps) {
  return (
    <div
      data-opsinjs-plain-language=""
      className={cn(
        "not-prose my-4 grid border border-border md:grid-cols-2",
        className
      )}
    >
      <div className="border-b border-border/60 p-3 md:border-r md:border-b-0">
        <p className="m-0 text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
          Clinical
        </p>
        <div className="mt-1 text-sm [&>p]:m-0">{clinical}</div>
      </div>
      <div className="p-3">
        <p className="m-0 text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
          Plain English
        </p>
        <div className="mt-1 text-sm [&>p]:m-0">{plain}</div>
      </div>
      {note ? (
        <p className="m-0 border-t border-border/60 p-3 text-xs text-muted-foreground md:col-span-2">
          {note}
        </p>
      ) : null}
    </div>
  )
}

/* --------------------------------------------------------------------------
   <ReadingLevel>
   -------------------------------------------------------------------------- */

/**
 * Syllables, by the usual vowel-group heuristic.
 *
 * It is a heuristic and the component says so. Every automated readability
 * score depends on one, they all disagree at the margins, and none of them
 * knows that "SpO2" is read as four syllables. The number is a smoke alarm, not
 * a measurement: it is useful for noticing that a paragraph has drifted, and it
 * is not evidence that a real reader understood anything.
 */
function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "")
  if (clean.length === 0) return 0
  if (clean.length <= 3) return 1
  const groups = clean
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g)
  return groups ? groups.length : 1
}

export interface ReadingLevelProps {
  /** The copy to score. Usually the sample this page is arguing about. */
  children: ReactNode
  /** Show the sample as well as the score. */
  showSample?: boolean
  className?: string
}

/**
 * A readability readout for one block of copy, used through Content & language.
 *
 * Flesch–Kincaid grade level, computed here from the text. It is reported as a
 * range and with its limitations stated, because a single decimal implies a
 * precision the formula does not have — and because a health interface that
 * optimises a score rather than a sentence ends up with short words in an
 * incomprehensible order.
 */
export function ReadingLevel({
  children,
  showSample = true,
  className,
}: ReadingLevelProps) {
  const text = textOf(children).replace(/\s+/g, " ").trim()
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim()).length
  const words = text.split(/\s+/).filter(Boolean)
  const syllables = words.reduce(
    (total, word) => total + countSyllables(word),
    0
  )

  const valid = sentences > 0 && words.length > 0
  const grade = valid
    ? 0.39 * (words.length / sentences) +
      11.8 * (syllables / words.length) -
      15.59
    : null

  return (
    <div
      data-opsinjs-reading-level=""
      className={cn("not-prose my-4 border border-border", className)}
    >
      {showSample ? (
        <div className="border-b border-border/60 p-3 text-sm [&>p]:m-0">
          {children}
        </div>
      ) : null}
      <dl className="m-0 grid grid-cols-3 gap-3 p-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Grade level</dt>
          <dd className="m-0 font-mono">
            {grade === null ? "—" : Math.max(0, Math.round(grade))}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Words per sentence</dt>
          <dd className="m-0 font-mono">
            {valid ? (words.length / sentences).toFixed(1) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Words</dt>
          <dd className="m-0 font-mono">{words.length}</dd>
        </div>
      </dl>
      <p className="m-0 border-t border-border/60 px-3 py-2 text-[0.6875rem] text-muted-foreground">
        Flesch–Kincaid grade level, computed from this text with a syllable
        heuristic. Treat it as a smoke alarm, not a measurement — it cannot tell
        you whether a sentence is understandable, only that it has got longer.
      </p>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <WhenToUse>
   -------------------------------------------------------------------------- */

export interface WhenToUseAvoid {
  /** The situation somebody is in when they reach for the wrong thing. */
  case: string
  /**
   * The component or pattern to use instead. REQUIRED — a prohibition with no
   * alternative is a trap, and it is the single most common defect in design
   * system documentation.
   *
   * Normally a bare catalogue id, which is resolved against the catalogue and
   * the registry before it is rendered. Prose belongs here only alongside an
   * `href`.
   */
  instead: string
  /** Where the alternative lives, when it is not a component id. */
  href?: string
}

export interface WhenToUseProps {
  /** The cases this thing exists for. Concrete situations, not categories. */
  use: string[]
  /** The cases it is reached for by mistake. */
  avoid: WhenToUseAvoid[]
  /** What the alternatives are: component ids, or arbitrary pages. */
  className?: string
}

interface ResolvedInstead {
  /** The catalogue row the `instead` id names, if it names one at all. */
  target: CatalogueEntry | undefined
  /** True only when a real renderable exists behind it. */
  built: boolean
}

function resolveInstead(entry: WhenToUseAvoid): ResolvedInstead {
  const target = entry.instead ? getEntry(entry.instead) : undefined
  return { target, built: target ? isBuilt(target.name) : false }
}

/**
 * The one line under a prohibition that says what to reach for.
 *
 * It resolves the id rather than printing it. An `instead` that names a row
 * with no code behind it is not a mistake — some of the most useful
 * redirections on this site point at a name that was considered and declined,
 * and saying so is more useful than pretending the name is a component — but
 * rendering it as a
 * bare "Use `tooltip` instead" IS: the reader installs nothing, finds nothing,
 * and concludes the documentation is wrong about its own system. So the status
 * is named, the destination is still linked, and the reader is told what the
 * page at the other end will give them.
 */
function InsteadPointer({
  entry,
  resolved,
}: {
  entry: WhenToUseAvoid
  resolved: ResolvedInstead
}) {
  const { target, built } = resolved

  if (!target) {
    if (entry.href) {
      return (
        <>
          Use <a href={entry.href}>{entry.instead}</a> instead.
        </>
      )
    }
    return (
      <strong className="font-semibold text-foreground">
        Names <code className="text-xs">{entry.instead}</code>, which is not a
        catalogue id. Correct the id, or give this entry an{" "}
        <code className="text-xs">href</code> to the page it means; as written
        the reader is sent nowhere.
      </strong>
    )
  }

  const destination = (
    <Link href={entry.href ?? componentPath(target.name)}>
      <code className="text-xs">{target.name}</code>
    </Link>
  )

  if (built) {
    return <>Use {destination} instead.</>
  }

  if (target.status === "considered") {
    return (
      <>
        The nearest name is {destination}, and it was considered and declined:
        there is no code behind it and none planned. Its page carries the reason
        and names what to reach for in turn — read that before you design around
        the gap.
      </>
    )
  }

  if (target.status === "planned") {
    return (
      <>
        The nearest name is {destination}, and it is planned: specified in full,
        not built. Read the specification and design against it, but do not
        generate code from it.
      </>
    )
  }

  return (
    <>
      The nearest name is {destination}. The catalogue has it at{" "}
      {STATUS_META[target.status].label.toLowerCase()} and nothing is built
      behind it in this registry, so there is nothing to install today.
    </>
  )
}

/**
 * The paired when-to-use / when-not-to-use lists.
 *
 * This is the section none of the surveyed design systems has, and it is the
 * one that stops an agent choosing AlertBanner when it needs Callout. The
 * asymmetry is on purpose: the "use" side may be a plain list, but every entry
 * on the "avoid" side must NAME THE ALTERNATIVE. That is enforced by the type,
 * and — because MDX props are not typechecked — visibly at render time too.
 *
 * The reason is worth stating. A reader who is told "do not use this for X"
 * and not told what to use instead does one of two things: uses it anyway, or
 * invents something. On a health surface both are worse than the mistake the
 * prohibition was trying to prevent.
 */
export function WhenToUse({ use, avoid, className }: WhenToUseProps) {
  const orphans = avoid.filter((entry) => !entry.instead)

  if (orphans.length > 0 && typeof window === "undefined") {
    console.warn(
      `[opsinjs:whentouse] ${orphans.length} prohibition(s) with no alternative: ` +
        orphans.map((entry) => entry.case).join(" | ")
    )
  }

  return (
    <div
      data-opsinjs-when-to-use=""
      className={cn("not-prose my-6 grid gap-4 md:grid-cols-2", className)}
    >
      <section>
        <h3 className="m-0 text-sm font-semibold">Use it when</h3>
        <ul className="mt-2 mb-0 list-disc pl-5 text-sm">
          {use.map((item) => (
            <li key={item} className="m-0 mb-1">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="m-0 text-sm font-semibold">Do not use it when</h3>
        <ul className="mt-2 mb-0 list-none p-0 text-sm">
          {avoid.map((entry) => (
            <li key={entry.case} className="m-0 mb-2">
              {entry.case}
              <span className="block text-xs text-muted-foreground">
                {entry.instead ? (
                  <>
                    Use{" "}
                    {entry.href ? (
                      <a href={entry.href}>{entry.instead}</a>
                    ) : (
                      <code className="text-xs">{entry.instead}</code>
                    )}{" "}
                    instead.
                  </>
                ) : (
                  <strong className="font-semibold text-foreground">
                    No alternative named. Every prohibition must say what to
                    reach for instead; as written this entry is a defect.
                  </strong>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
