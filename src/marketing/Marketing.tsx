import { useState } from 'react'
import './marketing.css'
import { ProductShowcase } from './ProductShowcase'

export type PublicPage = 'product' | 'about' | 'how'

const navigation = [
  { page: 'product', href: '/', label: 'Product' },
  { page: 'about', href: '/who-we-are', label: 'Who we are' },
  { page: 'how', href: '/how-it-works', label: 'How it works' },
] as const

export function Compass({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m20 2 5.5 12.5L38 20l-12.5 5.5L20 38l-5.5-12.5L2 20l12.5-5.5L20 2Z"
        fill="currentColor"
      />
      <path
        d="m20 12 2.5 5.5L28 20l-5.5 2.5L20 28l-2.5-5.5L12 20l5.5-2.5L20 12Z"
        fill="var(--m-paper, #ffffff)"
      />
    </svg>
  )
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Brand() {
  return (
    <a className="m-brand" href="/" aria-label="Clavus home">
      <Compass />
      clavus<span className="m-brand-period">.</span>
    </a>
  )
}

function Header({ page }: { page: PublicPage }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header
      className="m-header m-container"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setMenuOpen(false)
          document.getElementById('m-menu-toggle')?.focus()
        }
      }}
    >
      <Brand />
      <button
        id="m-menu-toggle"
        className="m-menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="m-navigation"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? 'Close' : 'Menu'}
        <span aria-hidden="true">{menuOpen ? '−' : '+'}</span>
      </button>
      <nav
        id="m-navigation"
        className={`m-navigation ${menuOpen ? 'is-open' : ''}`}
        aria-label="Main navigation"
      >
        {navigation.map((link) => (
          <a
            key={link.page}
            href={link.href}
            aria-current={page === link.page ? 'page' : undefined}
          >
            {link.label}
          </a>
        ))}
        <a className="m-nav-demo" href="/app">
          Open the demo <Arrow />
        </a>
      </nav>
    </header>
  )
}

function DemoLink({ children = 'Explore the demo' }: { children?: string }) {
  return (
    <a className="m-button" href="/app">
      {children}
      <Arrow />
    </a>
  )
}

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="m-eyebrow">
      <span aria-hidden="true" />
      {children}
    </p>
  )
}

function ProductPage() {
  return (
    <>
      <section className="m-hero m-container">
        <div className="m-hero-copy">
          <Eyebrow>Strategy, meet reality</Eyebrow>
          <h1>
            Is the work following
            <br />
            <em>your strategy?</em>
          </h1>
          <p className="m-intro">
            See where your company’s effort is going, and whether it serves the
            priorities you set.
          </p>
          <div className="m-hero-actions">
            <DemoLink />
            <a className="m-secondary-button" href="/how-it-works">
              See how it works <Arrow diagonal />
            </a>
          </div>
          <p className="m-hero-note">
            <span aria-hidden="true">↳</span> Evidence you can read. Human
            review. A clearer picture.
          </p>
        </div>
        <ProductShowcase />
      </section>

      <section
        className="m-sources m-container"
        aria-label="Supported workflow"
      >
        <p>
          The tools you already use.
          <br />
          <strong>A perspective you’re missing.</strong>
        </p>
        <div className="m-source-names">
          <span>Jira</span>
          <span>Asana</span>
          <span>Linear</span>
          <span className="m-source-csv">
            <span aria-hidden="true">▤</span> Your spreadsheet
          </span>
        </div>
        <p className="m-source-note">
          Bring a CSV export.
          <br />
          Keep your team’s workflow.
        </p>
      </section>

      <section className="m-problem m-section">
        <div className="m-container m-problem-layout">
          <div>
            <Eyebrow>The space between plan and practice</Eyebrow>
            <h2>
              Everyone is busy.
              <br />
              <em>But moving where?</em>
            </h2>
          </div>
          <div className="m-problem-copy">
            <p>
              The strategy is agreed. The roadmap is full. Yet every new
              project, urgent request and small trade-off can pull the company
              in a different direction.
            </p>
            <p>
              Clavus brings those choices into view. Read the work against your
              strategy, spot the drift, and have the conversations that put
              effort back on course.
            </p>
            <a className="m-text-link" href="/who-we-are">
              Why we’re building Clavus <Arrow diagonal />
            </a>
          </div>
        </div>
      </section>

      <section className="m-section m-container">
        <div className="m-section-heading">
          <div>
            <Eyebrow>From intention to evidence</Eyebrow>
            <h2>
              One strategy.
              <br />
              <em>A shared view of the work.</em>
            </h2>
          </div>
          <a className="m-text-link" href="/how-it-works">
            Walk through the process <Arrow />
          </a>
        </div>
        <div className="m-workflow-strip">
          {[
            [
              '01',
              'Set the direction',
              'Name your priorities and the things you have decided not to do.',
            ],
            [
              '02',
              'Bring in the work',
              'Import projects and their work items from a CSV export.',
            ],
            [
              '03',
              'See the alignment',
              'Understand what serves the strategy, what drifts, and what needs a decision.',
            ],
          ].map(([number, title, copy]) => (
            <div className="m-workflow-item" key={number}>
              <span className="m-step-number">{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="m-evidence m-container">
        <div className="m-evidence-quote">
          <span className="m-mini-label">The strategy says</span>
          <p>
            “We will not sell
            <br />
            <em>outside Europe.</em>”
          </p>
          <div className="m-quote-attribution">
            <span />
            Tessel · Company strategy
          </div>
        </div>
        <div className="m-evidence-copy">
          <Eyebrow>More than a coloured dot</Eyebrow>
          <h2>
            See the reason.
            <br />
            <em>Make the call.</em>
          </h2>
          <p>
            A project called “France launch” sounds aligned. If the work is
            actually a sales pilot in Québec, the details tell a different
            story.
          </p>
          <p>
            Clavus connects each judgement to the strategy behind it. Your team
            can inspect the reasoning, confirm it, or correct it with a recorded
            explanation.
          </p>
          <a className="m-text-link" href="/how-it-works#example">
            Explore an example <Arrow diagonal />
          </a>
        </div>
      </section>
      <Closing />
    </>
  )
}

function AboutPage() {
  return (
    <>
      <section className="m-inner-hero m-container">
        <Eyebrow>Who we are</Eyebrow>
        <h1>
          Good strategy deserves
          <br />
          <em>a place in everyday work.</em>
        </h1>
        <div className="m-about-intro">
          <p>
            We’re building Clavus around one question: does the work a company
            is doing follow the direction its leaders have set?
          </p>
          <p>
            Clavus makes that question concrete: one view of where the effort
            goes, and judgements you can inspect.
          </p>
        </div>
      </section>

      <section className="m-team m-container" aria-labelledby="team-heading">
        <Eyebrow>Our team</Eyebrow>
        <h2 id="team-heading">
          The people <em>behind Clavus.</em>
        </h2>
        <ul className="m-team-members">
          {[
            'Oscar de Froissard de Broissia',
            'Gabrielle de Larminat',
            'Clément Hougard',
            'Elias Madi',
            'Thi Tinh Vo',
          ].map((name) => (
            <li key={name}>
              <span className="m-team-monogram" aria-hidden="true">
                {name[0]}
              </span>
              <h3>{name}</h3>
            </li>
          ))}
        </ul>
      </section>

      <section className="m-section m-container">
        <Eyebrow>What guides us</Eyebrow>
        <h2>
          Built to make
          <br />
          <em>better conversations possible.</em>
        </h2>
        <div className="m-principles">
          {[
            [
              '01',
              'Evidence before labels.',
              'A project’s title is only the beginning. The work underneath matters, and every call should come with a reason you can examine.',
            ],
            [
              '02',
              'People own the decisions.',
              'A flagged project starts a conversation. Leaders and teams bring the context, review the judgement, and decide what to do next.',
            ],
            [
              '03',
              'Uncertainty belongs in the picture.',
              'Sometimes the strategy is too vague to settle a question. Making that ambiguity visible is useful in its own right.',
            ],
          ].map(([number, title, copy]) => (
            <article key={number}>
              <span className="m-step-number">{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <Closing />
    </>
  )
}

const examples = [
  {
    label: 'A clear match',
    project: 'German checkout flow',
    team: 'Product Engineering',
    verdict: 'Serves a priority',
    tone: 'blue',
    quote:
      'Win Germany and France: by the end of 2027, half of all new merchants should come from these two countries.',
    reason:
      'A German-language checkout with the payment methods German shoppers expect is needed to win merchants in Germany.',
    work: 'Translate the checkout into German, add SEPA direct debit, and support local payment methods.',
  },
  {
    label: 'A misleading title',
    project: 'France launch: Québec pilot',
    team: 'Sales and Partnerships',
    verdict: 'Contradicts strategy',
    tone: 'coral',
    quote: 'We will not sell outside Europe.',
    reason:
      'The title borrows the France launch, but the work sells to merchants in Canada, which is outside Europe.',
    work: 'Pilot the product with retailers in Québec and prepare a sales launch in Canada.',
  },
  {
    label: 'An unclear case',
    project: 'Switzerland and Austria pilot',
    team: 'Sales and Partnerships',
    verdict: 'Unclear',
    tone: 'gold',
    quote: null,
    reason:
      'The pilot reuses the German-language product, but the priority names only Germany and France and the strategy does not say whether neighbouring countries count.',
    work: 'Try the German-language product with merchants in Switzerland and Austria.',
  },
] as const

function Example() {
  const [selected, setSelected] = useState(() =>
    new URLSearchParams(window.location.search).get('example') === 'unclear'
      ? 2
      : 1,
  )
  const example = examples[selected]
  return (
    <section className="m-example-section m-container" id="example">
      <div className="m-section-heading">
        <div>
          <Eyebrow>Take a closer look</Eyebrow>
          <h2>
            The title is one thing.
            <br />
            <em>The work tells the story.</em>
          </h2>
        </div>
        <p>
          Three examples from Tessel,
          <br />
          our example company.
        </p>
      </div>
      <div
        className="m-example-choices"
        role="group"
        aria-label="Choose a project example"
      >
        {examples.map((item, index) => (
          <button
            key={item.label}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <span>0{index + 1}</span>
            {item.label}
            <Arrow />
          </button>
        ))}
      </div>
      <div className="m-example-content" aria-live="polite" aria-atomic="true">
        <div className="m-example-project">
          <span className="m-mini-label">The project</span>
          <h3>{example.project}</h3>
          <span className="m-example-team">{example.team}</span>
          <p>{example.work}</p>
          <span className={`m-verdict m-verdict-${example.tone}`}>
            <i />
            {example.verdict}
          </span>
        </div>
        <div className="m-example-reason">
          <span className="m-mini-label">
            {example.quote
              ? 'The strategy says'
              : 'Where the strategy is silent'}
          </span>
          {example.quote && <blockquote>“{example.quote}”</blockquote>}
          <p>{example.reason}</p>
          <div className="m-example-human">
            <span aria-hidden="true">↳</span> A person reviews the judgement and
            decides what happens next.
          </div>
        </div>
      </div>
    </section>
  )
}

function HowPage() {
  return (
    <>
      <section className="m-inner-hero m-how-hero m-container">
        <Eyebrow>How it works</Eyebrow>
        <h1>
          From the strategy you set
          <br />
          <em>to the work you can see.</em>
        </h1>
        <p className="m-inner-intro">
          Bring your direction and your projects into one view.
          <br />
          Then look at the distance between them.
        </p>
        <a className="m-text-link" href="#the-process">
          Follow the process <span aria-hidden="true">↓</span>
        </a>
      </section>
      <section
        className="m-process m-container"
        id="the-process"
        aria-label="The four steps"
      >
        <article className="m-process-step">
          <span className="m-process-number">01</span>
          <div>
            <span className="m-mini-label">Set the reference</span>
            <h2>Make the direction explicit.</h2>
            <p>
              Write down the strategy as a short list of priorities and clear
              “we will not do” items. The leader validates this reference before
              projects are judged.
            </p>
            <p className="m-process-detail">
              A shared reference makes every later judgement explainable.
            </p>
          </div>
          <div className="m-process-visual m-strategy-note">
            <span className="m-mini-label">Our direction</span>
            <span>
              <i>↗</i> Win Germany and France
            </span>
            <span>
              <i>↗</i> Make payments dependable
            </span>
            <span>
              <i>↗</i> Let merchants help themselves
            </span>
            <hr />
            <span className="m-nongoal">
              <i>−</i> No selling outside Europe
            </span>
            <small>Excerpt from Tessel’s strategy</small>
          </div>
        </article>
        <article className="m-process-step">
          <span className="m-process-number">02</span>
          <div>
            <span className="m-mini-label">Load the work</span>
            <h2>Start with what teams already do.</h2>
            <p>
              Export a CSV from a work tracker or use a spreadsheet. Map its
              columns to a common format, check the preview, and import the
              work.
            </p>
            <p className="m-process-detail">
              A title, description column and parent project are required. Team,
              effort and status add context.
            </p>
          </div>
          <div className="m-process-visual m-import-visual">
            <div>
              <span>Tracker export</span>
              <span>Clavus</span>
            </div>
            {[
              ['Summary', 'Title'],
              ['Details', 'Description'],
              ['Epic name', 'Parent project'],
            ].map(([from, to]) => (
              <p key={from}>
                <span>{from}</span>
                <Arrow />
                <b>{to}</b>
              </p>
            ))}
            <small>Map your columns. Keep your tools.</small>
          </div>
        </article>
        <article className="m-process-step">
          <span className="m-process-number">03</span>
          <div>
            <span className="m-mini-label">Read the alignment</span>
            <h2>Give every project a closer look.</h2>
            <p>
              Each project is considered together with its work items. It can
              serve a priority, serve none, contradict the strategy, or remain
              unclear.
            </p>
            <p className="m-process-detail">
              Judgements include a reason. Matches and contradictions quote the
              strategy line behind the call.
            </p>
          </div>
          <div className="m-process-visual m-verdict-visual">
            <span className="m-verdict m-verdict-blue">
              <i />
              Serves a priority
            </span>
            <span className="m-verdict m-verdict-grey">
              <i />
              No stated priority
            </span>
            <span className="m-verdict m-verdict-coral">
              <i />
              Contradicts strategy
            </span>
            <span className="m-verdict m-verdict-gold">
              <i />
              Unclear
            </span>
          </div>
        </article>
        <article className="m-process-step">
          <span className="m-process-number">04</span>
          <div>
            <span className="m-mini-label">Review and steer</span>
            <h2>Turn the picture into a conversation.</h2>
            <p>
              Explore the map by priority or team. Open a project, read its
              reasoning, and confirm or correct the judgement with an
              explanation.
            </p>
            <p className="m-process-detail">
              Corrections update the map and stay in a review log you can
              export. Compare teams by work-item count; use points or hours
              within a team.
            </p>
          </div>
          <div className="m-process-visual m-review-visual">
            <span className="m-mini-label">
              A human decision, on the record
            </span>
            <div className="m-review-line">
              <span aria-hidden="true">✓</span>
              <div>
                <b>Review the judgement</b>
                <small>Read the work and the strategy quote.</small>
              </div>
            </div>
            <div className="m-review-line">
              <span aria-hidden="true">↳</span>
              <div>
                <b>Keep the context</b>
                <small>Who changed it, when, and why.</small>
              </div>
            </div>
          </div>
        </article>
      </section>
      <Example />
      <section className="m-faq m-container">
        <div>
          <Eyebrow>A few useful details</Eyebrow>
          <h2>
            Before you
            <br />
            <em>step inside.</em>
          </h2>
        </div>
        <div>
          <details>
            <summary>
              Do I need to connect Jira or another tracker?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              No. Clavus imports CSV exports. You map the columns to Clavus’s
              common format before importing. Live tracker connections are
              planned for later.
            </p>
          </details>
          <details>
            <summary>
              What is in the demo?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              Tessel, an example company: 60 projects and 494 work items across
              five teams, with a strategy of five priorities.
            </p>
          </details>
          <details>
            <summary>
              Does a flagged project mean the team is wrong?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              No. A project may have context the strategy does not capture. The
              flag invites a review, and a person can confirm or correct the
              judgement with a recorded reason.
            </p>
          </details>
          <details>
            <summary>
              How do I access the demo?<span aria-hidden="true">+</span>
            </summary>
            <p>
              The demo opens the existing Clavus workspace and requires the demo
              account credentials supplied by the Clavus team.
            </p>
          </details>
        </div>
      </section>
      <Closing />
    </>
  )
}

function Closing() {
  return (
    <section className="m-closing m-container">
      <div>
        <Eyebrow>A little clarity. A better course.</Eyebrow>
        <h2>
          Bring the strategy
          <br />
          <em>back into the picture.</em>
        </h2>
      </div>
      <div>
        <DemoLink />
        <p>
          Explore Tessel, our example company.
          <br />
          Demo account required.
        </p>
      </div>
      <Compass className="m-closing-compass" />
    </section>
  )
}

function Footer() {
  return (
    <footer className="m-footer">
      <div className="m-footer-content m-container">
        <div>
          <Brand />
          <p>
            A clearer view of where
            <br />
            the work is going.
          </p>
        </div>
        <nav aria-label="Footer product navigation">
          <span>Clavus</span>
          {navigation.map((link) => (
            <a href={link.href} key={link.page}>
              {link.label}
            </a>
          ))}
        </nav>
        <nav aria-label="Footer workflow navigation">
          <span>The workflow</span>
          <a href="/how-it-works#the-process">From strategy to work</a>
          <a href="/how-it-works#example">Explore an example</a>
          <a href="/who-we-are#team-heading">Meet the team</a>
        </nav>
        <nav aria-label="Footer workspace navigation">
          <span>Try Clavus</span>
          <a href="/app">
            Open the demo <Arrow diagonal />
          </a>
          <p>Demo account required.</p>
        </nav>
        <div className="m-footer-bottom">
          <span>© {new Date().getFullYear()} Clavus</span>
        </div>
      </div>
    </footer>
  )
}

export function Marketing({ page }: { page: PublicPage }) {
  return (
    <div className="marketing">
      <a href="#main-content" className="m-skip-link">
        Skip to content
      </a>
      <div className="m-announcement">
        <a href="/how-it-works">
          Bring strategy and everyday work into the same picture. <Arrow />
        </a>
      </div>
      <Header page={page} />
      <main id="main-content">
        {page === 'product' ? (
          <ProductPage />
        ) : page === 'about' ? (
          <AboutPage />
        ) : (
          <HowPage />
        )}
      </main>
      <Footer />
    </div>
  )
}
