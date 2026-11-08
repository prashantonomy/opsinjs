"use client"

import { GlossaryEntry, Term, TermGlossaryProvider } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the two
 * presentations in one sentence, because the single thing worth seeing about
 * this component is that `auto` sends a three-word definition inline and a
 * longer one behind a control, and that both of them are readable without a
 * pointer.
 *
 * The two entries are copied from this repository's own `tokens/glossary.json`,
 * which is authored opsinjs prose written for exactly this audience, with one
 * field left off on purpose: `showBoth`. The glossary marks eGFR `"always"`,
 * which would send its definition inline, and the whole job of this demo is to
 * show both presentations in one sentence, so the field is omitted and eGFR's
 * length sends it behind a control instead. Nothing else is changed, nothing is
 * invented and nothing here is a number: a definition explains a word, and a
 * demo that put a reading on the screen would be showing somebody a result (ADR
 * 0012).
 *
 * They are the exception to the sentence at the top of `GlossaryEntry`, and the
 * exception is worth stating rather than hoping nobody notices. This file
 * refuses to import the repository's glossary because the glossary belongs to
 * the product; two of its entries are then hard-coded here, because a zero-prop
 * demo has to have something to define and the preview is what proves the
 * component renders. `DEMO_GLOSSARY` is not exported and no `<Term>` outside
 * this function can reach it, so what ships is a demonstration rather than a
 * dictionary. Even so, "opsinjs ships no definitions" is true of the API and
 * not of the bytes, and `term.mdx` says it that way.
 */
const DEMO_GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: "acute",
    word: "acute",
    plain: "sudden, or short-lasting",
  },
  {
    id: "egfr",
    word: "eGFR",
    expansion: "estimated glomerular filtration rate",
    plain: "an estimate of how well your kidneys are filtering",
    speech: "e G F R",
  },
]

export default function TermDemo() {
  return (
    <TermGlossaryProvider glossary={DEMO_GLOSSARY}>
      <p className="m-0 max-w-(--opsin-measure-comfortable,66ch) text-opsin-body">
        An <Term id="acute" /> problem is not the same as a long-lasting one, and
        your <Term id="egfr" /> is measured differently again.
      </p>
    </TermGlossaryProvider>
  )
}
