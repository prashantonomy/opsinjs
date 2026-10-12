/**
 * The Pensieve lockup, stacked: the convergence mark above the wordmark.
 *
 * The geometry is the navbar lockup's in the pensievelabs site, copied rather
 * than redrawn: the same 217 by 250 viewBox, the two wings meeting on the
 * axis, and the midline at 7.75 user units so it thickens with the mark. The
 * wordmark is Geist at the variable weight 358 with -0.05em tracking, which is
 * that site's `--lockup-weight` and `--lockup-tracking`. Only the arrangement
 * differs: the navbar sets the word beside the mark, and this footer sets it
 * below.
 *
 * Everything paints in `currentColor`, so the footer chooses the ink. The
 * group is one image to assistive technology, named once.
 */
export function PensieveLockup({ name }: { name: string }) {
  return (
    <span className="landing-lockup" role="img" aria-label={name}>
      <svg
        viewBox="0 0 217 250"
        aria-hidden="true"
        className="landing-lockup-mark"
      >
        <path d="M0 62.5V187.5L108.253 125L0 62.5Z" fill="currentColor" />
        <path
          d="M108.253 125L216.506 62.5V187.5L108.253 125Z"
          fill="currentColor"
        />
        <line
          x1="108.253"
          y1="0"
          x2="108.253"
          y2="250"
          stroke="currentColor"
          strokeWidth="7.75"
        />
      </svg>
      <span className="landing-lockup-word" aria-hidden="true">
        {name}
      </span>
    </span>
  )
}
