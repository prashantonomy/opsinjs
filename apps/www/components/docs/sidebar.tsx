"use client"

import type { ComponentType, ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookMarked,
  Boxes,
  HandHelping,
  HeartPulse,
  House,
  Layers,
  Search,
  Workflow,
  type LucideProps,
} from "lucide-react"
import { useSearchContext } from "fumadocs-ui/contexts/search"
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch"

import type { DocsNav, NavLink, NavSection } from "@/lib/docs-nav"
import { site } from "@/lib/routes"

/**
 * The documentation sidebar, modelled on blueprintjs.com: a wordmark, two
 * action rows, then the sections. Only the section you are in is expanded, and
 * the page you are on lists its own headings under its row, so there is no
 * second table of contents on the right.
 */

const SECTION_ICONS: Record<string, ComponentType<LucideProps>> = {
  home: House,
  foundations: Layers,
  components: Boxes,
  health: HeartPulse,
  patterns: Workflow,
  reference: BookMarked,
  contribute: HandHelping,
}

function normalise(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path
}

function sectionFor(nav: DocsNav, pathname: string): NavSection | undefined {
  return nav.sections.find(
    (section) =>
      section.url === pathname ||
      section.groups.some((group) =>
        group.links.some((link) => link.url === pathname)
      )
  )
}

/** The opsinjs mark: a reading against a range, as in app/icon.svg. */
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

function Headings({
  nav,
  url,
  onNavigate,
}: {
  nav: DocsNav
  url: string
  onNavigate?: () => void
}) {
  const headings = nav.headings[url]
  if (!headings || headings.length === 0) return null
  return (
    <ul className="docs-nav-headings">
      {headings.map((heading) => (
        <li key={heading.id} data-depth={heading.depth}>
          <a
            className="docs-nav-heading"
            href={`#${heading.id}`}
            onClick={onNavigate}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  )
}

function LinkRow({
  nav,
  link,
  pathname,
  onNavigate,
}: {
  nav: DocsNav
  link: NavLink
  pathname: string
  onNavigate?: () => void
}) {
  const active = link.url === pathname
  return (
    <li>
      <Link
        aria-current={active ? "page" : undefined}
        className="docs-nav-item"
        data-active={active || undefined}
        href={link.url}
        onClick={onNavigate}
      >
        {link.title}
      </Link>
      {active ? (
        <Headings nav={nav} url={link.url} onNavigate={onNavigate} />
      ) : null}
    </li>
  )
}

function SectionRow({
  nav,
  section,
  pathname,
  expanded,
  onNavigate,
}: {
  nav: DocsNav
  section: NavSection
  pathname: string
  expanded: boolean
  onNavigate?: () => void
}) {
  const Icon = SECTION_ICONS[section.id] ?? Layers
  const active = section.url === pathname
  return (
    <li className="docs-nav-section" data-expanded={expanded || undefined}>
      <Link
        aria-current={active ? "page" : undefined}
        className="docs-nav-section-link"
        data-active={active || undefined}
        href={section.url}
        onClick={onNavigate}
      >
        <span className="docs-nav-section-icon">
          <Icon aria-hidden="true" />
        </span>
        <span className="docs-nav-section-title">{section.title}</span>
        {section.meta ? (
          <span className="docs-nav-section-meta">{section.meta}</span>
        ) : null}
      </Link>
      {active ? (
        <Headings nav={nav} url={section.url} onNavigate={onNavigate} />
      ) : null}
      {expanded ? (
        <ul className="docs-nav-groups">
          {section.groups.map((group, index) => (
            <li key={group.title ?? index}>
              {group.title ? (
                <div className="docs-nav-group-title">{group.title}</div>
              ) : null}
              <ul>
                {group.links.map((link) => (
                  <LinkRow
                    key={link.url}
                    nav={nav}
                    link={link}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function ActionRow({ children }: { children: ReactNode }) {
  return <div className="docs-sidebar-action">{children}</div>
}

function SearchRow({ onNavigate }: { onNavigate?: () => void }) {
  const { setOpenSearch, hotKey } = useSearchContext()
  return (
    <button
      type="button"
      className="docs-sidebar-action"
      onClick={() => {
        onNavigate?.()
        setOpenSearch(true)
      }}
    >
      <Search aria-hidden="true" className="docs-sidebar-action-icon" />
      <span className="docs-sidebar-action-label">Search</span>
      <kbd className="docs-hint">
        {hotKey.map((key, index) => (
          <span key={index}>{key.display}</span>
        ))}
      </kbd>
    </button>
  )
}

export interface SidebarProps {
  nav: DocsNav
  /** Called after a link is followed, to close the mobile drawer. */
  onNavigate?: () => void
}

export function Sidebar({ nav, onNavigate }: SidebarProps) {
  const pathname = normalise(usePathname() ?? "/")
  const current = sectionFor(nav, pathname)?.id ?? "home"

  return (
    <div className="docs-sidebar-inner">
      <div className="docs-brand">
        <Link
          href="/"
          className="docs-brand-mark"
          aria-label={`${site.name} home`}
          onClick={onNavigate}
        >
          <LogoMark size={40} />
        </Link>
        <div className="docs-brand-text">
          <Link href="/" className="docs-brand-name" onClick={onNavigate}>
            {site.name}
          </Link>
          {site.sourcePublic ? (
            <a
              className="docs-brand-link"
              href={site.github}
              target="_blank"
              rel="noreferrer noopener"
            >
              View on GitHub
            </a>
          ) : (
            <span className="docs-brand-link">{site.shortTagline}</span>
          )}
        </div>
      </div>

      <div className="docs-sidebar-actions">
        <ActionRow>
          <span className="docs-sidebar-action-label">Theme</span>
          <ThemeSwitch mode="light-dark-system" className="docs-theme-switch" />
        </ActionRow>
        <SearchRow onNavigate={onNavigate} />
      </div>

      <nav className="docs-nav" aria-label="Documentation">
        <ul>
          {nav.sections.map((section) => (
            <SectionRow
              key={section.id}
              nav={nav}
              section={section}
              pathname={pathname}
              expanded={section.id === current}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </nav>
    </div>
  )
}
