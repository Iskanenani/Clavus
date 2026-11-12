// Judges every project that has no up-to-date verdict, from the command
// line. It does exactly what the queue in the app does: one call to the
// judge-project function per project, signed in as the demo user.
// Run with: npm run judge

import { browserLikeClient, must, requireEnv } from './lib/admin.mjs'

const PAUSE_MS = Number(process.env.JUDGE_PAUSE_MS ?? 0)

const client = browserLikeClient()
must(
  await client.auth.signInWithPassword({
    email: requireEnv('DEMO_USER_EMAIL'),
    password: requireEnv('DEMO_USER_PASSWORD'),
  }),
  'Sign in',
)

const waiting = must(
  await client
    .from('project_verdicts')
    .select('project')
    .eq('up_to_date', false)
    .order('project'),
  'List projects',
)
console.log(`${waiting.length} project(s) to judge.`)

let errors = 0
for (const { project } of waiting) {
  const { data, error } = await client.functions.invoke('judge-project', {
    body: { project },
  })
  const problem = error?.message ?? data?.error
  if (problem) errors++
  console.log(
    `${problem ? 'ERROR' : data.verdict.padEnd(11)}  ${project}${problem ? `: ${problem}` : ''}`,
  )
  if (PAUSE_MS > 0)
    await new Promise((resolve) => setTimeout(resolve, PAUSE_MS))
}

console.log(`Done. ${waiting.length - errors} judged, ${errors} error(s).`)
process.exit(errors === 0 ? 0 : 1)
