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
    <main className="page narrow">
      <h1>Clavus</h1>
      <p className="lead">Is the work following the strategy?</p>
      <form className="card stack" onSubmit={logIn}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
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
