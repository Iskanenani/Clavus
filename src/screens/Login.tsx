import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function logIn(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setError(error ? 'Wrong email or password.' : null)
    setBusy(false)
    // On success, App notices the new session and shows the workspace.
  }

  return (
    <main className="page narrow login-page">
      <img src="/favicon.svg" width="42" height="42" alt="" />
      <h1>Welcome to Clavus</h1>
      <p className="lead">A clearer view of where the work is going.</p>
      <form className="card stack" onSubmit={logIn}>
        <h2>Open your workspace</h2>
        <p className="muted small">Sign in with your demo account.</p>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </main>
  )
}
