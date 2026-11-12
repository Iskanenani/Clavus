// Judges ONE project against the company's strategy and stores the verdict.
// Called by the queue in the browser, once per project.
//
// Steps: who is asking -> load strategy and project -> ask the model ->
// check the answer (retry once) -> store the verdict or the error.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { askModel, providerName } from '../_shared/model.ts'
import {
  buildPrompt,
  checkVerdict,
  strategyText,
  type StrategyLine,
  type Verdict,
} from '../_shared/verdict.ts'

// Lets the browser app, served from another address, call this function.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// Asks the model and checks its answer. One retry, as FEATURES.md requires:
// models sometimes misquote, and a second attempt usually fixes it.
async function judgeWithRetry(
  ask: () => Promise<unknown>,
  check: (answer: unknown) => Verdict,
): Promise<{ verdict: Verdict } | { error: string }> {
  let lastError = ''
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return { verdict: check(await ask()) }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  return { error: lastError }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // The service key bypasses the access rules, so this function must
  // itself make sure it only touches the caller's company.
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // 1. Who is asking, and for which company?
  const token = (request.headers.get('Authorization') ?? '').replace(
    'Bearer ',
    '',
  )
  const { data: auth } = await db.auth.getUser(token)
  if (!auth?.user) return reply(401, { error: 'Please log in again.' })

  const { data: member } = await db
    .from('members')
    .select('company_id')
    .eq('user_id', auth.user.id)
    .maybeSingle()
  if (!member)
    return reply(403, { error: 'This account belongs to no company.' })
  const companyId: string = member.company_id

  const { project } = await request.json().catch(() => ({}))
  if (typeof project !== 'string' || project === '') {
    return reply(400, { error: 'Send { "project": "name of the project" }.' })
  }

  // 2. Load the strategy and the project.
  const { data: strategy } = await db
    .from('strategies')
    .select('id, body, validated_at')
    .eq('company_id', companyId)
    .maybeSingle()
  if (!strategy?.validated_at) {
    return reply(409, {
      error: 'The strategy must be validated before judging.',
    })
  }
  const { data: lines } = await db
    .from('priorities')
    .select('id, slug, kind, statement')
    .eq('strategy_id', strategy.id)
    .order('position')
  const { data: summary } = await db
    .from('project_summary')
    .select('fingerprint')
    .eq('company_id', companyId)
    .eq('project', project)
    .maybeSingle()
  if (!summary) return reply(404, { error: `No project named "${project}".` })
  const { data: items } = await db
    .from('work_items')
    .select('title, description')
    .eq('company_id', companyId)
    .eq('parent', project)
    .order('id')

  // 3 and 4. Ask the model, check the answer.
  const text = strategyText(strategy.body, lines as StrategyLine[])
  const prompt = buildPrompt(text, project, items ?? [])
  const result = await judgeWithRetry(
    () => askModel({ prompt, project, companyId, db }),
    (answer) => checkVerdict(answer, text, lines as StrategyLine[]),
  )

  // 5. Store the outcome. One row per project: a new judgement replaces
  // the old one.
  const checked = 'verdict' in result ? result.verdict : null
  const row = {
    company_id: companyId,
    project,
    verdict: checked?.verdict ?? null,
    priority_id:
      lines!.find((line) => line.slug === checked?.priority_id)?.id ?? null,
    quote: checked?.quote ?? null,
    reason: checked?.reason ?? null,
    error: 'error' in result ? result.error : null,
    stale: false,
    provider: providerName,
    fingerprint: summary.fingerprint,
    judged_at: new Date().toISOString(),
  }
  const { error: saveError } = await db
    .from('verdicts')
    .upsert(row, { onConflict: 'company_id,project' })
  if (saveError) return reply(500, { error: saveError.message })

  return reply(200, { project, verdict: row.verdict, error: row.error })
})
