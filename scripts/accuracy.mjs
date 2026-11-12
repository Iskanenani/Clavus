// The proof shown to the jury (FEATURES.md step 8): compares the stored
// verdicts with data/answer_key.csv and writes reports/accuracy.md.
// Run with: npm run accuracy
//
// It reads what the MODEL said, not the human overrides, and it does not
// care which provider produced the verdicts, so it is re-run unchanged
// after a real model is plugged in.

import { mkdirSync, writeFileSync } from 'node:fs'
import { adminClient, must, readDataCsv } from './lib/admin.mjs'

const DEMO_COMPANY = 'Tessel (demo)'
const CASES = [
  ['clear-match', 'Clear match'],
  ['different-words', 'Different words'],
  ['label-only', 'Label only'],
  ['no-priority', 'No priority'],
  ['contradiction', 'Contradiction'],
  ['ambiguous', 'Ambiguous'],
]

const admin = adminClient()
const company = must(
  await admin.from('companies').select('id').eq('name', DEMO_COMPANY).single(),
  'Find demo company',
)
const verdicts = must(
  await admin
    .from('verdicts')
    .select(
      'project, verdict, quote, reason, error, provider, stale, priorities (slug)',
    )
    .eq('company_id', company.id),
  'Read verdicts',
)
const stored = new Map(verdicts.map((row) => [row.project, row]))
const expected = readDataCsv('answer_key.csv')

// A project counts as correct when the verdict matches and, where the
// verdict points at a strategy line, it points at the right one.
function compare(answer) {
  const got = stored.get(answer.project)
  if (!got) return { ok: false, got: 'not judged', why: '' }
  if (got.error) return { ok: false, got: 'error', why: got.error }
  const gotPriority = got.priorities?.slug ?? ''
  const pointsAtLine = ['serves', 'contradicts'].includes(
    answer.expected_verdict,
  )
  const ok =
    got.verdict === answer.expected_verdict &&
    (!pointsAtLine || gotPriority === answer.priority_id)
  return { ok, got: describe(got.verdict, gotPriority), why: got.reason ?? '' }
}

const describe = (verdict, priority) =>
  priority ? `${verdict} (${priority})` : verdict
const percent = (part, whole) =>
  whole === 0 ? '–' : `${((100 * part) / whole).toFixed(1)}%`

const results = expected.map((answer) => ({ answer, ...compare(answer) }))
const correct = results.filter((r) => r.ok).length
const misses = results.filter((r) => !r.ok)
const providers =
  [...new Set(verdicts.map((row) => row.provider))].join(', ') || 'none'
const staleCount = verdicts.filter((row) => row.stale).length

const lines = [
  '# Clavus accuracy report',
  '',
  `- Generated: ${new Date().toISOString()}`,
  `- Provider: ${providers}`,
  `- Projects in the answer key: ${expected.length}`,
  `- Verdicts stored: ${verdicts.length}${staleCount ? ` (${staleCount} out of date)` : ''}`,
  '',
  `## Overall: ${correct} of ${expected.length} correct (${percent(correct, expected.length)})`,
  '',
  'A project is correct when the verdict matches the answer key and, for',
  '`serves` and `contradicts`, the right priority or non-goal is named.',
  'Human overrides are ignored: this measures the model alone.',
  '',
  '## By planted case',
  '',
  '| Case | Projects | Correct | Accuracy |',
  '|---|---|---|---|',
  ...CASES.map(([key, label]) => {
    const inCase = results.filter((r) => r.answer.case === key)
    const right = inCase.filter((r) => r.ok).length
    return `| ${label} | ${inCase.length} | ${right} | ${percent(right, inCase.length)} |`
  }),
  '',
  'The ambiguous cases are a matter of judgement by design (see data/README.md).',
  '',
  `## Misses: ${misses.length}`,
  '',
  ...(misses.length === 0
    ? ['None.']
    : [
        '| Project | Case | Expected | Model said | Model’s reason |',
        '|---|---|---|---|---|',
        ...misses.map(
          (r) =>
            `| ${r.answer.project} | ${r.answer.case} | ` +
            `${describe(r.answer.expected_verdict, r.answer.priority_id)} | ${r.got} | ` +
            `${r.why.replaceAll('|', '/')} |`,
        ),
      ]),
  '',
]

mkdirSync(new URL('../reports/', import.meta.url), { recursive: true })
writeFileSync(
  new URL('../reports/accuracy.md', import.meta.url),
  lines.join('\n'),
)
console.log(
  `${correct} of ${expected.length} correct (${percent(correct, expected.length)}).`,
)
console.log('Report written to reports/accuracy.md')
