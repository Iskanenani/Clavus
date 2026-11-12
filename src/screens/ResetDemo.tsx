import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Reloads the synthetic dataset (FEATURES.md step 9). Shown only for a
// company that has a demo template.
export function ResetDemo({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reset(withVerdicts: boolean) {
    setBusy(true)
    const { error } = await supabase.rpc('reset_demo', {
      p_with_verdicts: withVerdicts,
    })
    setBusy(false)
    if (error) return setError(error.message)
    setOpen(false)
    onDone()
  }

  if (!open) {
    return (
      <button className="link" onClick={() => setOpen(true)}>
        Reset demo
      </button>
    )
  }
  return (
    <div className="overlay">
      <div className="card dialog stack">
        <h2>Reset the demo?</h2>
        <p>
          This replaces the strategy, the work items, the verdicts and the
          review log with the original synthetic dataset.
        </p>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button
            className="primary"
            disabled={busy}
            onClick={() => reset(false)}
          >
            Reset, nothing judged yet
          </button>
          <button disabled={busy} onClick={() => reset(true)}>
            Reset with stored verdicts
          </button>
          <button
            className="link"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </div>
        <p className="muted small">
          “With stored verdicts” fills the map straight away, without calling a
          model.
        </p>
      </div>
    </div>
  )
}
