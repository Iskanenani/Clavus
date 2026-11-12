// The priorities and non-goals of the fictional company, with the exact
// line of data/strategy.md that states each one. The generator checks that
// every line really appears in strategy.md, so a quote can never drift.

export const STRATEGY_LINES = {
  'germany-france': {
    kind: 'priority',
    quote:
      'Win Germany and France: by the end of 2027, half of all new merchants should come from these two countries.',
  },
  reliability: {
    kind: 'priority',
    quote:
      'Make payments dependable: card and online payments must be available 99.95% of the time, and no merchant should lose a sale because of us.',
  },
  'self-service': {
    kind: 'priority',
    quote:
      'Let merchants help themselves: a new merchant should be able to sign up, set up and take a first payment without talking to our staff.',
  },
  partners: {
    kind: 'priority',
    quote:
      'Grow through accountants and resellers: partners who already advise small retailers should bring us at least a third of new merchants.',
  },
  retention: {
    kind: 'priority',
    quote:
      'Keep the merchants we have: reduce the share of merchants who leave within their first year from 24% to 12%.',
  },
  'no-bespoke': {
    kind: 'non-goal',
    quote:
      'We will not build features for a single customer, however large the contract.',
  },
  'no-outside-europe': {
    kind: 'non-goal',
    quote: 'We will not sell outside Europe.',
  },
  'no-hardware': {
    kind: 'non-goal',
    quote: 'We will not design or manufacture our own payment hardware.',
  },
}
