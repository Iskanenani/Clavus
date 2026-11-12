// The rules every model answer must pass before it is stored, and the
// prompt that asks for it. Nothing here talks to a model or a database,
// so each function can be read and tested by itself.

export const VERDICTS = ['serves', 'none', 'contradicts', 'unclear'] as const

export type Verdict = {
  verdict: (typeof VERDICTS)[number]
  priority_id: string | null // the short name of a priority or non-goal
  quote: string | null
  reason: string
}

export type StrategyLine = {
  slug: string
  kind: 'priority' | 'non_goal'
  statement: string
}

export type WorkItem = { title: string; description: string }

// The strategy as the model reads it: the leader's text, then the two lists.
export function strategyText(body: string, lines: StrategyLine[]): string {
  const list = (kind: string) =>
    lines
      .filter((line) => line.kind === kind)
      .map((line) => `- [${line.slug}] ${line.statement}`)
      .join('\n')
  return [
    body.trim(),
    'PRIORITIES',
    list('priority'),
    'WHAT WE WILL NOT DO',
    list('non_goal'),
  ].join('\n\n')
}

export function buildPrompt(
  strategy: string,
  project: string,
  items: WorkItem[],
): string {
  const itemList = items
    .map(
      (item) =>
        `- ${item.title}${item.description ? `: ${item.description}` : ''}`,
    )
    .join('\n')

  return `You check whether a project follows a company's strategy.

STRATEGY
${strategy}

PROJECT: ${project}
WORK ITEMS
${itemList}

Judge what the work is for, not which words it shares with the strategy.
A title can name a priority while the work inside does something else.

Answer with one JSON object and nothing else:
{
  "verdict": "serves" | "none" | "contradicts" | "unclear",
  "priority_id": the name in [brackets] of the priority or non-goal concerned, or null,
  "quote": the exact line of the strategy that justifies the verdict, or null,
  "reason": one or two sentences in plain language
}

Rules:
- "serves": the project advances a priority. Give its priority_id and quote.
- "contradicts": only for work against a priority or inside a "will not do" item. Give its priority_id and quote.
- "none": the project advances no stated priority and conflicts with nothing.
- "unclear": the strategy does not allow a decision. This is a valid answer.
- Copy the quote word for word from the strategy, without the [name].`
}

// Spacing differences must not fail a quote, anything else must.
function squash(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

// Returns the checked verdict, or throws with the reason it was rejected.
export function checkVerdict(
  answer: unknown,
  strategy: string,
  lines: StrategyLine[],
): Verdict {
  if (typeof answer !== 'object' || answer === null) {
    throw new Error('The answer is not a JSON object.')
  }
  const { verdict, priority_id, quote, reason } = answer as Record<
    string,
    unknown
  >

  // Check 1: the shape.
  if (!VERDICTS.includes(verdict as Verdict['verdict'])) {
    throw new Error(`Unknown verdict "${String(verdict)}".`)
  }
  if (typeof reason !== 'string' || reason.trim() === '') {
    throw new Error('The reason is missing.')
  }
  if (priority_id !== null && typeof priority_id !== 'string') {
    throw new Error('priority_id must be a name or null.')
  }
  if (quote !== null && typeof quote !== 'string') {
    throw new Error('quote must be text or null.')
  }

  const line = lines.find((candidate) => candidate.slug === priority_id)
  if (priority_id !== null && !line) {
    throw new Error(
      `"${priority_id}" is not a priority or non-goal of this strategy.`,
    )
  }
  if (verdict === 'serves' || verdict === 'contradicts') {
    if (!line) throw new Error(`"${verdict}" needs a priority_id.`)
    if (!quote) throw new Error(`"${verdict}" needs a quote.`)
    if (verdict === 'serves' && line.kind !== 'priority') {
      throw new Error('A project cannot serve a "will not do" item.')
    }
  }

  // Check 2: the quote is really in the strategy, word for word.
  if (quote && !squash(strategy).includes(squash(quote))) {
    throw new Error('The quote does not appear in the strategy text.')
  }

  return {
    verdict: verdict as Verdict['verdict'],
    priority_id: priority_id as string | null,
    quote: quote ? squash(quote) : null,
    reason: reason.trim(),
  }
}
