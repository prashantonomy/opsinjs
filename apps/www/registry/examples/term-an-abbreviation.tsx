/**
 * An abbreviation needs two things, and they are not the same thing.
 *
 * The EXPANSION is what the letters stand for. The DEFINITION is what the thing
 * is. *SpO2 — oxygen saturation* still explains nothing on its own, which is why
 * `GlossaryEntry` carries both and why the order is fixed: expansion, then
 * definition, then stop.
 *
 * The third field on show is `speech`. `SpO2` written down is read aloud as a
 * word by speech synthesis — *spoh-two* — and a reader who hears that has been
 * given a different word from the one on their paperwork. Writing the letters
 * out ADDS them to the control's accessible name, after the written form rather
 * than in place of it, so the name is *SpO2 S P O 2*: the sentence still shows
 * `SpO2`, a speech reader gets the letters, and a braille reader still gets the
 * spelling that is on their paperwork. Added rather than substituted on two
 * counts. Swapping the letters in for the written word would hide that spelling
 * from exactly the readers who cannot see the screen; and keeping the visible
 * word inside the accessible name is what SC 2.5.3 Label in Name asks for, and
 * what a Voice Control user saying "click SpO2" needs in order to hit anything.
 *
 * The second entry has no expansion at all, because `benign` is not an
 * abbreviation. It is here as the counterweight: a term with a two-word
 * definition goes inline under `auto`, and no control is drawn for something
 * that is already on the screen.
 *
 * The sentence around it is third person and general on purpose. *benign — not
 * cancer* is a definition where it stands; the identical component call inside
 * *your biopsy was benign* is a verdict about one named reader, delivered
 * through a parenthesis, with nobody behind it. Term cannot tell those two
 * apart — it renders whatever the glossary holds into whatever sentence the
 * product wrote — so the surface has to, and
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
  },
  {
    id: "benign",
    word: "benign",
    plain: "not cancer",
  },
]

export default function TermAnAbbreviation() {
  return (
    <TermGlossaryProvider glossary={GLOSSARY}>
      <div className="flex w-full max-w-(--opsin-measure-comfortable) flex-col gap-opsin-4 text-opsin-body">
        <p className="m-0">
          A wrist device reports <Term id="spo2" />, and it is an estimate rather
          than a measurement — movement, cold hands and skin tone all affect it.
        </p>
        <p className="m-0">
          A report describing a finding as <Term id="benign" /> is using a word
          that appears on paperwork and nowhere else in everyday speech.
        </p>
      </div>
    </TermGlossaryProvider>
  )
}
