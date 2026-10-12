/**
 * The opsinjs mark: a reading against a range, as in app/icon.svg. A track, a
 * band that is expected, and one marker sitting outside it.
 *
 * It lives in its own module, with no "use client", so the landing page can
 * render it on the server without pulling in the documentation sidebar.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="7" fill="#17181A" />
      <rect x="6" y="14.5" width="20" height="3" rx="1.5" fill="#3F4145" />
      <rect x="6" y="14.5" width="11" height="3" rx="1.5" fill="#7FB77A" />
      <circle cx="22" cy="16" r="4" fill="#17181A" />
      <circle cx="22" cy="16" r="2.75" fill="#E08A3C" />
    </svg>
  )
}
