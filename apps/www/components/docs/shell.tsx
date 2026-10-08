"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { Dialog } from "@base-ui/react/dialog"
import { Menu, Search, X } from "lucide-react"
import { useSearchContext } from "fumadocs-ui/contexts/search"

import type { DocsNav } from "@/lib/docs-nav"
import { site } from "@/lib/routes"
import { LogoMark, Sidebar } from "./sidebar"

/**
 * The frame around every documentation page: the sidebar on wide screens, and
 * a top bar with a navigation drawer on narrow ones. There is no top
 * navigation, no breadcrumb and no right-hand table of contents.
 */
export function DocsShell({
  nav,
  children,
}: {
  nav: DocsNav
  children: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { setOpenSearch } = useSearchContext()
  const close = () => setMenuOpen(false)

  return (
    <div className="docs-shell">
      <a className="docs-skip-link" href="#main">
        Skip to content
      </a>
      <header className="docs-mobile-bar" data-print="hide">
        <Link href="/" className="docs-mobile-brand">
          <LogoMark size={28} />
          <span>{site.name}</span>
        </Link>
        <button
          type="button"
          className="docs-icon-button"
          aria-label="Search"
          onClick={() => setOpenSearch(true)}
        >
          <Search aria-hidden="true" />
        </button>
        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Trigger
            className="docs-icon-button"
            aria-label="Open navigation"
          >
            <Menu aria-hidden="true" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="docs-drawer-backdrop" />
            <Dialog.Popup className="docs-drawer">
              <div className="docs-drawer-header">
                <Dialog.Title className="docs-drawer-title">
                  Navigation
                </Dialog.Title>
                <Dialog.Close
                  className="docs-icon-button"
                  aria-label="Close navigation"
                >
                  <X aria-hidden="true" />
                </Dialog.Close>
              </div>
              <Sidebar nav={nav} onNavigate={close} />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </header>

      <aside className="docs-sidebar" data-print="hide">
        <Sidebar nav={nav} />
      </aside>

      <main className="docs-main" id="main">
        {children}
      </main>
    </div>
  )
}
