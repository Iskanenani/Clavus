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
    <>
      <header className="topbar">
        <div className="brand">
          <strong>Clavus</strong>
          <span className="muted">{company.data?.name ?? ''}</span>
        </div>
        <nav>
          {SCREENS.map((item) => (
            <button
              key={item.key}
              className={screen === item.key ? 'tab active' : 'tab'}
              onClick={() => setScreen(item.key)}
            >
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
            {screen === 'strategy' && <StrategyScreen />}
            {screen === 'import' && <ImportScreen goTo={setScreen} />}
            {screen === 'judge' && <JudgeScreen goTo={setScreen} />}
            {screen === 'log' && <LogScreen />}
          </>
        )}
      </main>
    </>
  )
}

export type GoTo = (screen: ScreenKey) => void
export default App
