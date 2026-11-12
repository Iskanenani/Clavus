// Checks the rules applied to every model answer (FEATURES.md step 5),
// with answers a real model could plausibly give.
// Run with: npm run test:checks

import { strictEqual, throws } from 'node:assert'
import {
  checkVerdict,
  strategyText,
} from '../supabase/functions/_shared/verdict.ts'

const lines = [
  {
    slug: 'grow',
    kind: 'priority',
    statement: 'Win Germany and France: half of new merchants.',
  },
  {
    slug: 'no-usa',
    kind: 'non_goal',
    statement: 'We will not sell outside Europe.',
  },
]
const text = strategyText('Tessel sells software.', lines)
const good = {
  verdict: 'serves',
  priority_id: 'grow',
  quote: lines[0].statement,
  reason: 'It does.',
}
const check = (answer) => checkVerdict(answer, text, lines)

strictEqual(check(good).verdict, 'serves')
// Spacing differences are tolerated, as FEATURES.md asks.
strictEqual(
  check({ ...good, quote: 'Win  Germany and\nFrance: half of new merchants.' })
    .verdict,
  'serves',
)
strictEqual(
  check({
    verdict: 'none',
    priority_id: null,
    quote: null,
    reason: 'Unrelated.',
  }).verdict,
  'none',
)
strictEqual(
  check({
    verdict: 'contradicts',
    priority_id: 'no-usa',
    quote: lines[1].statement,
    reason: 'x',
  }).verdict,
  'contradicts',
)

throws(() => check('serves'), /not a JSON object/)
throws(() => check({ ...good, verdict: 'aligned' }), /Unknown verdict/)
throws(() => check({ ...good, reason: '' }), /reason is missing/)
throws(() => check({ ...good, quote: null }), /needs a quote/)
throws(
  () => check({ ...good, priority_id: 'invented' }),
  /not a priority or non-goal/,
)
throws(
  () => check({ ...good, quote: 'Win Germany and France soon.' }),
  /does not appear/,
)
throws(
  () => check({ ...good, priority_id: 'no-usa', quote: lines[1].statement }),
  /cannot serve/,
)

console.log('PASS  the verdict checks accept good answers and reject bad ones.')
