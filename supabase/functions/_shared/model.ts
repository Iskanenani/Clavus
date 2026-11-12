// The model adapter: the ONLY file to change when a real AI model is
// chosen. Everything else calls askModel() and does not know or care
// which provider answers.
//
// To add a provider: write a function like askMock below that sends
// request.prompt to the model's API and returns the parsed JSON, add it
// to PROVIDERS, then set the function secrets MODEL_PROVIDER and
// MODEL_API_KEY. The key is read from the secrets here and nowhere else.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

export type ModelRequest = {
  prompt: string
  // The three fields below exist for the mock provider only. A real
  // provider reads the prompt and nothing else.
  project: string
  companyId: string
  db: SupabaseClient
}

// A provider returns whatever JSON the model produced. It is NOT trusted:
// the caller checks it before storing anything.
type Provider = (request: ModelRequest) => Promise<unknown>

// Answers from the answer key of the synthetic dataset, so the product
// can be built and demonstrated before a model is chosen.
async function askMock(request: ModelRequest): Promise<unknown> {
  const { data: company } = await request.db
    .from('companies')
    .select('demo_template_id')
    .eq('id', request.companyId)
    .single()

  const { data: answer } = await request.db
    .from('answer_key')
    .select('expected_verdict, priority_slug, quote, reason')
    .eq('company_id', company?.demo_template_id ?? request.companyId)
    .eq('project', request.project)
    .maybeSingle()

  if (!answer) {
    throw new Error(
      'The mock provider only knows the projects of the synthetic dataset.',
    )
  }
  return {
    verdict: answer.expected_verdict,
    priority_id: answer.priority_slug,
    quote: answer.quote,
    reason: answer.reason,
  }
}

const PROVIDERS: Record<string, Provider> = {
  mock: askMock,
}

export const providerName = Deno.env.get('MODEL_PROVIDER') ?? 'mock'

export function askModel(request: ModelRequest): Promise<unknown> {
  const provider = PROVIDERS[providerName]
  if (!provider) throw new Error(`Unknown MODEL_PROVIDER "${providerName}".`)
  return provider(request)
}
