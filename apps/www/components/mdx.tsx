import type { MDXComponents } from "mdx/types"
import defaultMdxComponents from "fumadocs-ui/mdx"

import glossary from "@/lib/generated/glossary.json"
import { ContrastReport, CvdSimulator } from "./docs/a11y"
import { StatusAxisDemo, StatusLadder } from "./docs/colour"
import { Callout, SafetyCallout, WhenToUse } from "./docs/guidance"
import {
  Glossary,
  RangeDemo,
  type GlossaryEntry,
  type GlossaryProps,
} from "./docs/health"
import { MaterialLadder } from "./docs/material"
import { MotionDemo } from "./docs/motion"
/* The two preview tags come from the server wrapper, not from ./docs/preview.
   The wrapper resolves the name against the generated registry index and hands
   the client surface a single boolean; importing the index into a "use client"
   module would put every built component's source in every page's bundle. */
import { ComponentPreview, IframePreview } from "./docs/preview-server"
import { ComponentInstall } from "./docs/source"
import { NoDataYet, NotBuiltYet, StubNotice, Todo } from "./docs/stub"
import {
  CssVariablesTable,
  DataAttributesTable,
  KeyboardTable,
  Kbd,
  PropsTable,
  TokenTable,
} from "./docs/tables"

/* ==========================================================================
   mdx.tsx DEFINES THE CLOSED VOCABULARY.

   Every tag an MDX page may use is registered below, and nothing else.
   `scripts/assert-ia.mts` fails the build on an unknown tag (MDX001), which
   makes this file the single definition of what an author can write, person
   or agent. An unknown capitalised tag otherwise renders as nothing or throws,
   and in a health document "silently dropped" is the outcome that matters.

   The set is exactly what the corpus uses. A tag no page uses is not
   registered, because registering one is the same drift in the other
   direction; add it back here, and to MDX_VOCABULARY in assert-ia, in the
   change that first uses it.

   `Callout` is shadowed deliberately, so that the four clinical status levels
   and fumadocs' info, warn and error types resolve through one component.
   ========================================================================== */

/** `lib/generated/glossary.json` in the shape <Glossary> filters. */
const GLOSSARY_ENTRIES: GlossaryEntry[] = glossary.terms.map((entry) => ({
  id: entry.term.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  term: entry.term,
  plain: entry.plain,
  showBoth: entry.showBoth,
  reason: entry.reason,
}))

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    // fumadocs defaults: pre, headings, links, images and tables.
    ...defaultMdxComponents,

    // ---- The honesty markers -----------------------------------------------
    NotBuiltYet,
    StubNotice,
    NoDataYet,
    Todo,

    // ---- Previews and installation -----------------------------------------
    ComponentPreview,
    IframePreview,
    ComponentInstall,

    // ---- Generated tables ---------------------------------------------------
    PropsTable,
    DataAttributesTable,
    CssVariablesTable,
    KeyboardTable,
    TokenTable,
    Kbd,

    // ---- Measurement and specimens ------------------------------------------
    ContrastReport,
    CvdSimulator,
    StatusLadder,
    StatusAxisDemo,
    MaterialLadder,
    MotionDemo,
    RangeDemo,
    /* The A to Z renders the generated glossary. Registered bare, it had no
       entries and showed its empty-state notice on the one page that uses it. */
    Glossary: (props: GlossaryProps) => (
      <Glossary entries={GLOSSARY_ENTRIES} {...props} />
    ),

    // ---- Guidance -----------------------------------------------------------
    WhenToUse,
    Callout,
    SafetyCallout,

    ...components,
  }
}
