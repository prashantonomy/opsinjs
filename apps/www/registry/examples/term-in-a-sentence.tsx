/**
 * The primary use: reading a paragraph without leaving it.
 *
 * Three things are on show, and the third is the one worth watching for.
 *
 *   1. `auto` sends a three-word definition inline and a longer one behind a
 *      control. Nothing on the page chose that; it fell out of how long the
 *      definitions are.
 *   2. Two terms in one paragraph is already close to the ceiling. Term is not a
 *      licence to keep the jargon: the question is always whether the reader
 *      will meet the word somewhere the product does not control, and if the
 *      answer is no, the fix is to write it plainly and delete the component.
 *   3. The second appearance of `eGFR` carries `once`. The word is still marked
 *      and the definition is still one press away and still in the
 *      accessibility tree; it is simply not printed a second time.
 *
 * The definitions are copied verbatim from this repository's own
 * `tokens/glossary.json`. No number appears anywhere in this file, and none
 * should: a term explains a word, and an example carrying a reading would be
 * showing somebody a result.
 */

import {
  Term,
  TermGlossaryProvider,
  type GlossaryEntry,
} from "@/registry/base-lyra/ui/term"

/* Hoisted to a module constant rather than written inline in the JSX below.
   The provider rebuilds its lookup whenever the array's identity changes, and
   an array literal in a render is a new identity every time. */
const GLOSSARY: readonly GlossaryEntry[] = [
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

export default function TermInASentence() {
  return (
    <TermGlossaryProvider glossary={GLOSSARY}>
      <div className="flex w-full max-w-(--opsin-measure-comfortable) flex-col gap-opsin-4 text-opsin-body">
        <p className="m-0">
          Your letter uses the word <Term id="acute" />, which describes how
          quickly something started rather than how serious it is.
        </p>
        <p className="m-0">
          It also reports an <Term id="egfr" />. That number comes from a blood
          test and from details the laboratory already holds about you.
        </p>
        <p className="m-0">
          A second <Term id="egfr" once /> on the same page is marked, and its
          definition is still there for anyone reading with speech — it is not
          repeated in front of everybody else.
        </p>
      </div>
    </TermGlossaryProvider>
  )
}
