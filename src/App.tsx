import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured, unwrap } from './lib/supabase'
import { useQuery } from './lib/useQuery'
import { Login } from './screens/Login'
import { MapScreen } from './screens/MapScreen'
import { StrategyScreen } from './screens/StrategyScreen'
import { ImportScreen } from './screens/ImportScreen'
import { JudgeScreen } from './screens/JudgeScreen'
import { LogScreen } from './screens/LogScreen'
import { ResetDemo } from './screens/ResetDemo'
import { WorkspaceIcon } from './components/WorkspaceIcon'
import './workspace.css'

const SCREENS = [
  { key: 'map', label: 'Map' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'import', label: 'Import' },
  { key: 'judge', label: 'Judge' },
  { key: 'log', label: 'Review log' },
] as const
type ScreenKey = (typeof SCREENS)[number]['key']

function App() {
  // undefined = still checking, null = logged out
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    )
    return () => data.subscription.unsubscribe()
  }, [])

  if (!supabaseConfigured) {
    return (
      <main className="page narrow">
        <h1>Clavus</h1>
        <p className="notice">
          Supabase is not configured yet. Copy <code>.env.example</code> to{' '}
          <code>.env.local</code> and fill in the values, then restart.
        </p>
      </main>
    )
  }
  if (session === undefined) return <p className="page muted">Loading…</p>
  if (session === null) return <Login />
  return <Workspace email={session.user.email ?? ''} />
}

function Workspace({ email }: { email: string }) {
  const [screen, setScreen] = useState<ScreenKey>('map')
  // Raised after a demo reset so every screen reloads its data.
  const [dataVersion, setDataVersion] = useState(0)

  const company = useQuery(
    async () =>
      unwrap(
        await supabase
          .from('companies')
          .select('name, demo_template_id')
          .maybeSingle(),
      ) as {
        name: string
        demo_template_id: string | null
      } | null,
    [],
  )

  return (
    <div className="workspace-shell">
      <header className="topbar">
        <div className="brand">
          <img src="/favicon.svg" width="27" height="27" alt="" />
          <strong>Clavus</strong>
        </div>
        <div className="workspace-company">
          <span className="workspace-company-avatar" aria-hidden="true">
            {company.data?.name.charAt(0) ?? 'C'}
          </span>
          <div>
            <strong>{company.data?.name ?? 'Workspace'}</strong>
            <span>Demo workspace</span>
          </div>
        </div>
        <span className="sidebar-label">Workspace</span>
        <nav aria-label="Workspace navigation">
          {SCREENS.map((item) => (
            <button
              key={item.key}
              aria-current={screen === item.key ? 'page' : undefined}
              className={screen === item.key ? 'tab active' : 'tab'}
              onClick={() => setScreen(item.key)}
            >
              <WorkspaceIcon name={item.key} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="account">
          {company.data?.demo_template_id && (
            <ResetDemo
              onDone={() => {
                setDataVersion((v) => v + 1)
                setScreen('strategy')
              }}
            />
          )}
          <span className="muted">{email}</span>
          <button className="link" onClick={() => supabase.auth.signOut()}>
            Log out
          </button>
        </div>
      </header>

      <main className="page" key={dataVersion}>
        <div className="workspace-breadcrumb">
          <span>Workspace</span>
          <WorkspaceIcon name="chevron" />
          <span>{SCREENS.find((item) => item.key === screen)?.label}</span>
          <span className="workspace-demo-label">Synthetic company data</span>
        </div>
        {company.error && (
          <p className="error">Could not load the company: {company.error}</p>
        )}
        {!company.loading && !company.error && !company.data && (
          <p className="notice">
            This account is not attached to a company yet.
          </p>
        )}
        {company.data && (
          <>
            {screen === 'map' && <MapScreen goTo={setScreen} />}
            {screen === 'strategy' && <StrategyScreen goTo={setScreen} />}
            {screen === 'import' && <ImportScreen goTo={setScreen} />}
            {screen === 'judge' && <JudgeScreen goTo={setScreen} />}
            {screen === 'log' && <LogScreen />}
          </>
        )}
      </main>
    </div>
  )
}

export type GoTo = (screen: ScreenKey) => void
export default App
