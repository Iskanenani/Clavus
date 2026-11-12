// Checks the mapping logic of step 4 without a browser: both sample files
// must map to exactly the same items in the common format.
// Run with: npm run test:import

import Papa from 'papaparse'
import { deepStrictEqual } from 'node:assert'
import { readData } from './lib/admin.mjs'
import { guessMapping, mapRows } from '../src/lib/csv.ts'

function importFile(name) {
  const parsed = Papa.parse(readData(name), {
    header: true,
    skipEmptyLines: true,
  })
  const mapping = guessMapping(parsed.meta.fields)
  const { items, errors } = mapRows(parsed.data, mapping)
  if (errors.length > 0) throw new Error(`${name}: ${errors[0]}`)
  console.log(`${name}: ${items.length} items, mapping`, mapping)
  return items
}

const common = importFile('work_items.csv')
const other = importFile('work_items_other_shape.csv')
deepStrictEqual(other, common)

// A file with a missing required column and a bad number must be refused.
const broken = mapRows([{ Summary: 'x', Epic: '', Pts: 'many' }], {
  title: 'Summary',
  description: '',
  parent: 'Epic',
  team: '',
  effort: 'Pts',
  status: '',
})
deepStrictEqual(broken.errors, ['Choose the column that holds "Description".'])
const broken2 = mapRows([{ Summary: 'x', D: '', Epic: '', Pts: 'many' }], {
  title: 'Summary',
  description: 'D',
  parent: 'Epic',
  team: '',
  effort: 'Pts',
  status: '',
})
deepStrictEqual(broken2.errors, [
  'Line 2: the parent is empty.',
  'Line 2: effort "many" is not a number.',
])

console.log('PASS  both files produce the same items; bad files are refused.')
