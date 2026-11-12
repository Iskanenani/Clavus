import { useMemo, useState, type ChangeEvent } from 'react'
import Papa from 'papaparse'
import type { GoTo } from '../App'
import { COMMON_FIELDS, guessMapping, mapRows, type Mapping } from '../lib/csv'
import { supabase } from '../lib/supabase'

type ParsedFile = {
  name: string
  columns: string[]
  rows: Record<string, string>[]
}

export function ImportScreen({ goTo }: { goTo: GoTo }) {
  const [file, setFile] = useState<ParsedFile | null>(null)
  const [mapping, setMapping] = useState<Mapping | null>(null)
  const [unit, setUnit] = useState('points')
  const [replace, setReplace] = useState(true)
  const [fileError, setFileError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [stored, setStored] = useState<{
    items: number
    projects: number
  } | null>(null)

  // The file is read here, in the browser. Nothing is sent anywhere
  // until the user presses "Store".
  function readFile(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0]
    if (!chosen) return
    setStored(null)
    Papa.parse<Record<string, string>>(chosen, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const columns = result.meta.fields ?? []
        if (columns.length === 0 || result.data.length === 0) {
          setFile(null)
          return setFileError(
            'This file has no rows. Is it a CSV with a header line?',
          )
        }
        setFileError(null)
        setFile({ name: chosen.name, columns, rows: result.data })
        setMapping(guessMapping(columns))
      },
      error: (problem) =>
        setFileError(`Could not read the file: ${problem.message}`),
    })
  }

  const result = useMemo(
    () => (file && mapping ? mapRows(file.rows, mapping) : null),
    [file, mapping],
  )
  const projectCount = result
    ? new Set(result.items.map((item) => item.parent)).size
    : 0

  async function store() {
    if (!result || result.errors.length > 0) return
    setBusy(true)
    setSaveError(null)
    try {
      if (replace) {
        // "id > 0" matches every row; the access rules limit it to this company.
        const { error } = await supabase.from('work_items').delete().gt('id', 0)
        if (error) throw new Error(error.message)
      }
      const rows = result.items.map((item) => ({
        ...item,
        effort_unit: item.effort === null ? null : unit,
      }))
      // In batches, so one request never grows too large.
      for (let start = 0; start < rows.length; start += 500) {
        const { error } = await supabase
          .from('work_items')
          .insert(rows.slice(start, start + 500))
        if (error) throw new Error(error.message)
      }
      setStored({ items: rows.length, projects: projectCount })
      setFile(null)
    } catch (problem) {
      setSaveError((problem as Error).message)
    }
    setBusy(false)
  }

  return (
    <section className="stack">
      <h1>Import work items</h1>
      <p className="muted">
        Export your tracker (Jira, Asana, Linear, a spreadsheet…) as CSV. You
        then tell Clavus which column is which.
      </p>

      <div className="card stack">
        <h2>1. Choose a CSV file</h2>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={readFile}
          aria-label="CSV file"
        />
        {fileError && <p className="error">{fileError}</p>}
        {stored && (
          <p className="success">
            Stored {stored.items} work items in {stored.projects} projects.{' '}
            <button className="link" onClick={() => goTo('judge')}>
              Judge them →
            </button>
          </p>
        )}
      </div>

      {file && mapping && result && (
        <>
          <div className="card stack">
            <h2>2. Map the columns</h2>
            <p className="muted">
              {file.name}: {file.rows.length} rows, {file.columns.length}{' '}
              columns.
            </p>
            <div className="grid-form">
              {COMMON_FIELDS.map((field) => (
                <label key={field.key}>
                  {field.label}
                  {field.required && (
                    <span className="required"> (required)</span>
                  )}
                  <select
                    value={mapping[field.key]}
                    onChange={(e) =>
                      setMapping({ ...mapping, [field.key]: e.target.value })
                    }
                  >
                    <option value="">— not in this file —</option>
                    {file.columns.map((column) => (
                      <option key={column}>{column}</option>
                    ))}
                  </select>
                </label>
              ))}
              {mapping.effort && (
                <label>
                  Effort is measured in
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option>points</option>
                    <option>hours</option>
                    <option>days</option>
                  </select>
                </label>
              )}
            </div>
          </div>

          <div className="card stack">
            <h2>3. Check and store</h2>
            {result.errors.length > 0 ? (
              <div className="error">
                <strong>
                  {result.errors.length} problem
                  {result.errors.length > 1 ? 's' : ''} to fix before storing:
                </strong>
                <ul>
                  {result.errors.slice(0, 10).map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
                {result.errors.length > 10 && (
                  <p>…and {result.errors.length - 10} more.</p>
                )}
              </div>
            ) : (
              <>
                <p>
                  <strong>{result.items.length}</strong> work items in{' '}
                  <strong>{projectCount}</strong> projects. First rows:
                </p>
                <div className="scroll">
                  <table>
                    <thead>
                      <tr>
                        {COMMON_FIELDS.map((field) => (
                          <th key={field.key}>{field.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.slice(0, 6).map((item, index) => (
                        <tr key={index}>
                          {COMMON_FIELDS.map((field) => (
                            <td key={field.key}>{item[field.key] ?? '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={replace}
                    onChange={(e) => setReplace(e.target.checked)}
                  />
                  Replace the work items already stored
                </label>
                {saveError && (
                  <p className="error">Could not store: {saveError}</p>
                )}
                <button className="primary fit" disabled={busy} onClick={store}>
                  {busy
                    ? 'Storing…'
                    : `Store ${result.items.length} work items`}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </section>
  )
}
