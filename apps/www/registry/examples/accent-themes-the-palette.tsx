/**
 * The whole accent layer at once: three accent themes by nine accents, each
 * cell its own scope (ADR 0029).
 *
 * Every cell carries both `data-accent-theme` and `data-accent`, and
 * app/product.css re-declares every role on an element that carries either, so
 * each cell resolves its own values even though twenty-seven of them share one
 * page. That is the scoping a product uses to preview a theme in a settings
 * screen without changing the screen around it.
 *
 * A cell draws the three roles a reader meets, in a row: the action as a
 * capsule, the selected state as a disc, and the accent's name in the accent ink, which is
 * real text at the body floor. The capsule and the disc carry the theme's rim
 * where a bright accent needs one. They are pictures of the roles rather than
 * controls, so the matrix has no tab stops and no repeated control names, and
 * the names beside them are what a screen reader reads.
 *
 * Under `prefers-contrast: more` every row draws as stryk, because that theme
 * answers the reader's request whatever the product chose, and this page does
 * not pretend otherwise.
 */

import { ACCENTS, ACCENT_THEMES } from "@/lib/generated/accents"

export default function AccentThemesThePalette() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-opsin-5">
      {ACCENT_THEMES.map((theme) => (
        <section key={theme.id} aria-labelledby={`palette-${theme.id}`} className="flex flex-col gap-opsin-2">
          <h3 id={`palette-${theme.id}`} className="m-0 text-opsin-headline">
            {theme.label}
          </h3>
          <ul className="m-0 grid list-none grid-cols-2 gap-opsin-2 p-0 sm:grid-cols-3">
            {ACCENTS.map((accent) => (
              <li
                key={accent.id}
                data-accent-theme={theme.id}
                data-accent={accent.id}
                className="flex min-w-0 items-center gap-opsin-2 rounded-opsin-md border border-edge bg-card px-opsin-3 py-opsin-2 [corner-shape:var(--opsin-corner-shape)]"
              >
                <span
                  aria-hidden="true"
                  className="block h-opsin-5 w-opsin-10 shrink-0 rounded-full border border-primary-edge bg-primary shadow-[0_6px_16px_-8px_var(--brand-glow)]"
                />
                <span
                  aria-hidden="true"
                  className="block size-opsin-4 shrink-0 rounded-full border border-brand-edge bg-brand"
                />
                <span className="min-w-0 text-opsin-subheadline-emphasis wrap-break-word [color:var(--brand-ink)]">
                  {accent.label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
