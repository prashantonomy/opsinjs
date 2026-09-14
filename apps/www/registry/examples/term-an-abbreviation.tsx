/**
 * An abbreviation needs two things, and they are not the same thing.
 *
 * The EXPANSION is what the letters stand for. The DEFINITION is what the thing
 * is. Expanding *SpO2* to *oxygen saturation* still explains nothing on its own,
 * which is why `GlossaryEntry` carries both and why the order is fixed:
 * expansion, then definition, then stop.
 *
 * The third field on show is `speech`. `SpO2` written down is read aloud as the
 * word *spoh-two* by speech synthesis, and a reader who hears that has been
 * given a different word from the one on their paperwork. Writing the letters
 * out ADDS them after the written form rather than replacing it: the sentence
 * still shows `SpO2`, a speech reader also hears the letters, and a braille
 * reader still gets the spelling that is on their paperwork. The `speech` span
 * sits inside the trigger content on both presentation paths, so the letters
 * follow the word whether the definition arrives inline or behind a control.
 * Swapping the letters in for the written word would hide that paperwork
 * spelling from exactly the readers who cannot see the screen, which is why they
 * are added and not substituted.
 *
 * Both entries arrive inline under `auto`, in parentheses, with nothing behind a
 * press. `SpO2` shows its expansion, its definition and its spoken form
 * together; `benign` shows a two-word definition and no expansion, because it is
 * not an abbreviation.
 *
 * The sentence around it is third person and general on purpose. *benign means
 * not cancer* is a definition where it stands; the identical component call
 * inside *your biopsy was benign* is a verdict about one named reader, delivered
 * through a parenthesis, with nobody behind it. Term cannot tell those two
 * apart, because it renders whatever the glossary holds into whatever sentence
 * the product wrote. The surface therefore has to, and
 * `content/docs/health/delivering-difficult-results.mdx` is where that decision
 * lives.
 *
 * Both definitions are copied verbatim from this repository's own
 * `tokens/glossary.json`.
 */

import {
  Term,
  TermGlossaryProvider,
  type GlossaryEntry,
} from "@/registry/base-lyra/ui/term"

const GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: "spo2",
    word: "SpO2",
    expansion: "oxygen saturation",
    plain: "an estimate of how much oxygen your blood is carrying",
    speech: "S P O 2",
    showBoth: "always",
  },
  {
    id: "benign",
    word: "benign",
    plain: "not cancer",
    showBoth: "always",
  },
]

export default function TermAnAbbreviation() {
  return (
    <TermGlossaryProvider glossary={GLOSSARY}>
      <div className="flex w-full max-w-(--opsin-measure-comfortable,66ch) flex-col gap-opsin-4 text-opsin-body">
        <p className="m-0">
          A wrist device reports <Term id="spo2" />, and it is an estimate rather
          than a measurement. Movement, cold hands and skin tone all affect it.
        </p>
        <p className="m-0">
          A report describing a finding as <Term id="benign" /> is using a word
          that appears on paperwork and nowhere else in everyday speech.
        </p>
      </div>
    </TermGlossaryProvider>
  )
}
