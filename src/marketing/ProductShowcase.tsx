import { useState } from 'react'

const views = [
  { key: 'map', label: 'Alignment map' },
  { key: 'strategy', label: 'Strategy reference' },
  { key: 'review', label: 'Human review' },
] as const

const allocation = [
  { label: 'Serves a priority', count: 271, tone: 'blue' },
  { label: 'No stated priority', count: 124, tone: 'grey' },
  { label: 'Contradicts strategy', count: 67, tone: 'coral' },
  { label: 'Unclear', count: 32, tone: 'gold' },
] as const

function AlignmentPreview() {
  return (
    <>
      <div className="m-preview-heading">
        <div>
          <h2>Where the work is going</h2>
          <p>Your strategy, reflected in everyday work.</p>
        </div>
        <span>All 5 teams</span>
      </div>
      <div className="m-preview-stats">
        <div>
          <span>Projects reviewed</span>
          <strong>60</strong>
          <small>Across five teams</small>
        </div>
        <div>
          <span>Work items</span>
          <strong>494</strong>
          <small>One shared view</small>
        </div>
        <div>
          <span>Serving a priority</span>
          <strong>
            54.9<span>%</span>
          </strong>
          <small>271 of 494 work items</small>
        </div>
      </div>
      <div className="m-preview-map">
        <div>
          <div className="m-map-heading">
            <b>Alignment with the strategy</b>
            <span>By work-item count</span>
          </div>
          <div
            className="m-effort-bar"
            role="img"
            aria-label="271 work items serve a priority, 124 serve no stated priority, 67 contradict the strategy, and 32 are unclear."
          >
            {allocation.map((item) => (
              <span
                className={`m-dot-${item.tone}`}
                key={item.tone}
                style={{ flex: item.count }}
              />
            ))}
          </div>
          <div className="m-map-legend">
            {allocation.map((item) => (
              <div key={item.tone}>
                <i className={`m-dot-${item.tone}`} />
                <span>{item.label}</span>
                <b>{item.count}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="m-preview-insight">
          <span className="m-mini-label">A clearer picture</span>
          <strong>8 projects</strong>
          <p>work against the stated strategy.</p>
          <a href="/how-it-works#example">
            See an example <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <div className="m-preview-projects">
        <div className="m-map-heading">
          <b>Projects worth a conversation</b>
          <span>Judgement</span>
        </div>
        <a href="/how-it-works#example">
          <span>
            <b>France launch: Québec pilot</b>
            <small>Sales and Partnerships</small>
          </span>
          <span className="m-verdict m-verdict-coral">
            <i />
            Contradicts strategy
          </span>
          <span aria-hidden="true">↗</span>
        </a>
        <a href="/how-it-works?example=unclear#example">
          <span>
            <b>Switzerland and Austria pilot</b>
            <small>Sales and Partnerships</small>
          </span>
          <span className="m-verdict m-verdict-gold">
            <i />
            Unclear
          </span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </>
  )
}

function StrategyPreview() {
  return (
    <>
      <div className="m-preview-heading">
        <div>
          <h2>A shared reference for every decision</h2>
          <p>Tessel’s synthetic strategy · 2026–2028</p>
        </div>
        <span>5 priorities · 3 non-goals</span>
      </div>
      <div className="m-reference-columns">
        <div>
          <span className="m-mini-label">What we will pursue</span>
          <ol>
            {[
              'Win Germany and France',
              'Make payments dependable',
              'Let merchants help themselves',
              'Grow through accountants and resellers',
              'Keep the merchants we have',
            ].map((priority) => (
              <li key={priority}>{priority}</li>
            ))}
          </ol>
        </div>
        <div>
          <span className="m-mini-label">What we will not do</span>
          <ul>
            {[
              'Build features for a single customer',
              'Sell outside Europe',
              'Design or manufacture our own payment hardware',
            ].map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
          <p>Clear boundaries make the trade-offs visible.</p>
        </div>
      </div>
    </>
  )
}

function ReviewPreview() {
  return (
    <>
      <div className="m-preview-heading">
        <div>
          <h2>France launch: Québec pilot</h2>
          <p>Sales and Partnerships · Synthetic example</p>
        </div>
        <span className="m-verdict m-verdict-coral">
          <i />
          Contradicts strategy
        </span>
      </div>
      <div className="m-review-preview">
        <div>
          <span className="m-mini-label">The strategy says</span>
          <blockquote>“We will not sell outside Europe.”</blockquote>
          <span className="m-mini-label">The reasoning</span>
          <p>
            The title borrows the France launch, but the work sells to merchants
            in Canada, which is outside Europe.
          </p>
        </div>
        <div className="m-review-next">
          <span className="m-mini-label">A person makes the call</span>
          <h3>Context matters.</h3>
          <p>
            Inspect the work, confirm the judgement, or correct it with a
            recorded explanation.
          </p>
          <a href="/how-it-works#example">
            Explore the reasoning <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </>
  )
}

export function ProductShowcase() {
  const [view, setView] = useState<(typeof views)[number]['key']>('map')
  return (
    <div className="m-preview-scene">
      <div className="m-preview-tabs" role="group" aria-label="Product views">
        {views.map((item) => (
          <button
            key={item.key}
            aria-pressed={view === item.key}
            onClick={() => setView(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        className="m-preview"
        aria-label="Interactive product illustration using Tessel's synthetic data"
      >
        <aside className="m-preview-rail" aria-hidden="true">
          <div className="m-preview-rail-brand">
            <img src="/favicon.svg" width="25" height="25" alt="" />
            Tessel
          </div>
          <span className="m-mini-label">Workspace</span>
          {views.map((item, index) => (
            <span
              key={item.key}
              className={view === item.key ? 'm-rail-active' : ''}
            >
              <span className="m-rail-icon">{['▦', '≡', '✓'][index]}</span>
              {item.label}
            </span>
          ))}
          <div className="m-rail-bottom">
            <span>T</span>
            <div>
              Tessel workspace<small>Synthetic company</small>
            </div>
          </div>
        </aside>
        <div className="m-preview-content">
          <div className="m-preview-top">
            <span>
              Workspace <span aria-hidden="true">/</span>{' '}
              <b>{views.find((item) => item.key === view)?.label}</b>
            </span>
            <span className="m-preview-live">
              <i />
              Synthetic demo
            </span>
          </div>
          <div className="m-preview-panel" aria-live="polite">
            {view === 'map' ? (
              <AlignmentPreview />
            ) : view === 'strategy' ? (
              <StrategyPreview />
            ) : (
              <ReviewPreview />
            )}
          </div>
          <div className="m-preview-bottom">
            <span>Every judgement has a reason.</span>
            <span>People make the call.</span>
          </div>
        </div>
      </div>
      <p className="m-preview-caption">
        A working prototype, illustrated with Tessel’s synthetic data.
        Judgements use predefined answers.
      </p>
    </div>
  )
}
