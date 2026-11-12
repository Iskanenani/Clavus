import { lazy, Suspense } from 'react'
import { Marketing, type PublicPage } from './marketing/Marketing'

// The workspace and its chart library are only downloaded when opening the demo.
const WorkspaceApp = lazy(() => import('./App'))

const pages: Record<
  string,
  { page: PublicPage; title: string; description: string }
> = {
  '/': {
    page: 'product',
    title: 'Clavus — Is the work following your strategy?',
    description:
      'See where your company’s effort is going, whether it serves your strategy, and which projects need a conversation.',
  },
  '/who-we-are': {
    page: 'about',
    title: 'Who we are — Clavus',
    description:
      'Why we are building Clavus: bringing the strategy leaders set into the everyday work that determines their direction.',
  },
  '/how-it-works': {
    page: 'how',
    title: 'How it works — Clavus',
    description:
      'Set your strategy, import the work, inspect the alignment, and review the reasoning. Walk through the Clavus prototype.',
  },
}

export function Website() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/app') {
    document.title = 'Demo workspace — Clavus'
    return (
      <>
        <div className="workspace-site-link">
          <a href="/">← Back to Clavus</a>
          <span>Synthetic data demo</span>
        </div>
        <Suspense
          fallback={<p className="page muted">Opening the workspace…</p>}
        >
          <WorkspaceApp />
        </Suspense>
      </>
    )
  }

  const current = pages[path]
  if (!current) {
    document.title = 'Page not found — Clavus'
    return (
      <main className="page narrow stack">
        <h1>Page not found</h1>
        <p>This page does not exist.</p>
        <a href="/">Return to Clavus</a>
      </main>
    )
  }
  document.title = current.title
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', current.description)
  return <Marketing page={current.page} />
}
