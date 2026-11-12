// The ~60 projects of the fictional company Tessel, written by hand.
// Each project lists the work items that say what it is really for, plus
// the verdict a careful reader should reach (this becomes answer_key.csv).
//
// `kase` is the planted case from FEATURES.md step 1:
//   clear-match | different-words | label-only | no-priority |
//   contradiction | ambiguous

const PAY = 'Payments Engineering'
const PROD = 'Product Engineering'
const MKT = 'Marketing'
const SALES = 'Sales and Partnerships'
const CS = 'Customer Success'

// Small helper so each project reads as one block.
function project(name, team, kase, verdict, priorityId, reason, items) {
  return { name, team, kase, verdict, priorityId, reason, items }
}

export const PROJECTS = [
  // ---------------------------------------------------------------
  // CLEAR MATCH: plainly serves a priority, in the strategy's own words
  // ---------------------------------------------------------------
  project(
    'German checkout flow',
    PROD,
    'clear-match',
    'serves',
    'germany-france',
    'A German-language checkout with the payment methods German shoppers expect is needed to win merchants in Germany.',
    [
      [
        'Translate checkout into German',
        'All checkout screens, error messages and receipts in German for merchants in Germany.',
      ],
      [
        'Add SEPA direct debit',
        'German shoppers pay by direct debit far more often than by card.',
      ],
      [
        'Add purchase on invoice',
        'Kauf auf Rechnung is expected by German online shoppers.',
      ],
      [
        'Show prices with German VAT',
        'Display 19% and 7% VAT rates correctly on receipts.',
      ],
      [
        'Test checkout with five German pilot merchants',
        'Pilot shops in Cologne and Leipzig.',
      ],
    ],
  ),
  project(
    'French e-invoicing compliance',
    PROD,
    'clear-match',
    'serves',
    'germany-france',
    'French merchants cannot adopt Tessel unless invoices meet the French e-invoicing rules, so this is required to win France.',
    [
      [
        'Support Factur-X invoice format',
        'Mandatory electronic invoice format for businesses in France.',
      ],
      [
        'Connect to the French invoicing platform',
        'Invoices must be transmitted through a registered platform.',
      ],
      [
        'French VAT rates and mentions',
        'TVA rates and the legal mentions required on French invoices.',
      ],
      [
        'Legal review with French counsel',
        'Confirm the product meets the mandate before launch in France.',
      ],
    ],
  ),
  project(
    'Germany launch campaign',
    MKT,
    'clear-match',
    'serves',
    'germany-france',
    'An advertising campaign aimed at German small retailers directly supports winning new merchants in Germany.',
    [
      [
        'German landing pages',
        'Product pages written for German bakeries, salons and bike shops.',
      ],
      [
        'Search ads in Germany',
        'Paid search for German small-business payment keywords.',
      ],
      [
        'Trade fair stand at EuroShop Düsseldorf',
        'Meet German retailers in person.',
      ],
      ['German customer stories', 'Film two early German merchants.'],
      ['Local press outreach', 'Pitch German retail trade magazines.'],
    ],
  ),
  project(
    'Paris sales office',
    SALES,
    'clear-match',
    'serves',
    'germany-france',
    'A sales team in Paris exists to sign up French merchants, which the strategy names as a priority market.',
    [
      [
        'Hire four French account executives',
        'Native speakers who will sell to independent retailers in France.',
      ],
      ['Lease office space in Paris', ''],
      [
        'French sales contracts',
        'Standard merchant agreement under French law.',
      ],
      [
        'Set France new-merchant targets',
        'Quarterly targets for merchants signed in France.',
      ],
    ],
  ),
  project(
    'DATEV export for German bookkeeping',
    PROD,
    'clear-match',
    'serves',
    'germany-france',
    'German retailers hand their books to tax advisers in DATEV format, so this removes a blocker to winning merchants in Germany.',
    [
      [
        'Export transactions in DATEV format',
        'The format nearly all German tax advisers use.',
      ],
      ['Map Tessel accounts to German chart of accounts', 'SKR03 and SKR04.'],
      ['Validate exports with a German tax adviser', ''],
      ['German help article for the export', ''],
    ],
  ),
  project(
    'Payment gateway failover',
    PAY,
    'clear-match',
    'serves',
    'reliability',
    'Automatic failover keeps payments available when a data centre fails, which is exactly the availability target.',
    [
      [
        'Run the gateway in a second region',
        'So payments continue if the first region goes down.',
      ],
      [
        'Automatic traffic switch on failure',
        'Switch within 30 seconds with no manual step.',
      ],
      ['Replicate transaction state between regions', ''],
      [
        'Failover rehearsal in production',
        'Prove the 99.95% availability target can be met.',
      ],
      ['Alert when regions drift out of sync', ''],
    ],
  ),
  project(
    'Payments on-call and incident response',
    PAY,
    'clear-match',
    'serves',
    'reliability',
    'Faster detection and repair of payment outages directly improves payment availability.',
    [
      [
        'Set up a 24/7 on-call rota for payments',
        'An engineer reachable within five minutes at any hour.',
      ],
      [
        'Define payment availability alerts',
        'Page when card or online payment success rate drops.',
      ],
      [
        'Write incident playbooks',
        'Step-by-step recovery for the ten most likely payment failures.',
      ],
      [
        'Post-incident review process',
        'Every outage gets a written review and follow-up actions.',
      ],
    ],
  ),
  project(
    'Offline card payments',
    PAY,
    'clear-match',
    'serves',
    'reliability',
    'Accepting cards while the connection is down means a merchant does not lose the sale, as the strategy requires.',
    [
      [
        'Store card payments when the connection drops',
        'The terminal app accepts the card and submits it later.',
      ],
      [
        'Risk limits for offline payments',
        'Cap the amount accepted without authorisation.',
      ],
      ['Automatic submission when back online', ''],
      ['Merchant setting to enable offline mode', ''],
      [
        'Field test in shops with poor connectivity',
        'Market stalls and basement shops lose sales today.',
      ],
    ],
  ),
  project(
    'Zero-downtime ledger migration',
    PAY,
    'clear-match',
    'serves',
    'reliability',
    'Moving the ledger without taking payments offline protects the availability target.',
    [
      [
        'Move the payments ledger to the new database cluster',
        'The current database causes most of our payment outages.',
      ],
      ['Dual-write during migration', 'No payment downtime during the move.'],
      ['Verify every balance after cutover', ''],
      [
        'Rollback plan',
        'Return to the old cluster within minutes if payments fail.',
      ],
    ],
  ),
  project(
    'Peak season load testing',
    PAY,
    'clear-match',
    'serves',
    'reliability',
    'Proving the system holds under peak load prevents outages on the busiest trading days.',
    [
      [
        'Simulate December peak payment volume',
        'Three times the highest volume seen so far.',
      ],
      ['Find and fix bottlenecks in card authorisation', ''],
      [
        'Capacity plan for peak trading days',
        'Payments must stay available on the busiest days of the year.',
      ],
      ['Automate the load test', 'Run it before every major release.'],
    ],
  ),
  project(
    'Self-service signup',
    PROD,
    'clear-match',
    'serves',
    'self-service',
    'An online signup that needs no staff is the first step of letting merchants help themselves.',
    [
      [
        'Online signup form',
        'A merchant creates an account without contacting sales.',
      ],
      [
        'Company lookup from business registers',
        'Fill in company details automatically.',
      ],
      [
        'Choose a plan and accept terms online',
        'No sales call or paper contract.',
      ],
      [
        'Measure signup completion',
        'Share of merchants who finish signup without staff help.',
      ],
    ],
  ),
  project(
    'Automated identity checks',
    PAY,
    'clear-match',
    'serves',
    'self-service',
    'Automating the identity check removes the main step where new merchants still wait for staff.',
    [
      [
        'Automated ID document verification',
        'Replace the manual review by our compliance staff.',
      ],
      ['Instant bank account verification', ''],
      [
        'Decision in under five minutes for standard cases',
        'So a new merchant can take a first payment the same day without staff.',
      ],
      ['Queue only exceptions for manual review', ''],
      ['Audit trail for the regulator', ''],
    ],
  ),
  project(
    'In-app setup guide',
    PROD,
    'clear-match',
    'serves',
    'self-service',
    'A guided setup lets a new merchant reach a first payment alone.',
    [
      [
        'Step-by-step setup checklist in the app',
        'Guides a new merchant from account to first payment.',
      ],
      [
        'Test payment walkthrough',
        'The merchant takes a 1 euro test payment by themselves.',
      ],
      ['Setup progress reminders by email', ''],
      [
        'Remove the mandatory setup call',
        'Setup should not require talking to staff.',
      ],
    ],
  ),
  project(
    'Help centre rewrite',
    CS,
    'clear-match',
    'serves',
    'self-service',
    'Clear help articles let merchants solve setup questions without contacting staff.',
    [
      [
        'Rewrite the 50 most-read help articles',
        'In plain language, with screenshots.',
      ],
      [
        'Setup articles for each shop type',
        'So merchants can set up without calling us.',
      ],
      ['Search inside the help centre', ''],
      ['Measure which articles fail to answer', ''],
    ],
  ),
  project(
    'Video tutorials for new merchants',
    MKT,
    'clear-match',
    'serves',
    'self-service',
    'Short videos that walk a merchant through setup reduce the need to talk to staff.',
    [
      [
        'Record a two-minute video for each setup step',
        'Sign up, connect bank, take a first payment.',
      ],
      ['Embed videos in the setup guide', ''],
      ['Subtitles in Dutch, English, German and French', ''],
      ['Track whether viewers finish setup unaided', ''],
    ],
  ),
  project(
    'Accountant partner portal',
    PROD,
    'clear-match',
    'serves',
    'partners',
    'A portal for accountants makes it practical for them to bring and manage merchants, which is the partner priority.',
    [
      [
        'Partner login for accountants',
        'One login to see all the merchants they advise.',
      ],
      [
        'Invite a client to Tessel from the portal',
        'The accountant starts the merchant signup.',
      ],
      ['Read-only access to client books', ''],
      [
        'Dashboard of merchants referred',
        'Shows each partner how many merchants they have brought.',
      ],
      ['Partner onboarding flow', ''],
    ],
  ),
  project(
    'Reseller commission programme',
    SALES,
    'clear-match',
    'serves',
    'partners',
    'Paying resellers for the merchants they bring is how the partner channel reaches its target.',
    [
      [
        'Design commission tiers for resellers',
        'Pay per active merchant brought in.',
      ],
      ['Reseller agreement template', ''],
      [
        'Track merchants by referring partner',
        'Needed to pay commission and measure the share of merchants from partners.',
      ],
      ['Monthly commission payouts', ''],
    ],
  ),
  project(
    'Partner recruitment roadshow',
    SALES,
    'clear-match',
    'serves',
    'partners',
    'Recruiting accounting firms as partners is the direct route to growing through accountants.',
    [
      [
        'Events for accounting firms in eight cities',
        'Present Tessel to firms that advise small retailers.',
      ],
      ['Target list of 300 accounting firms', ''],
      ['Sign partner agreements at the events', ''],
      ['Follow-up calls with attendees', ''],
    ],
  ),
  project(
    'Co-branded partner marketing kit',
    MKT,
    'clear-match',
    'serves',
    'partners',
    'Giving partners ready-made material helps them recommend Tessel to the retailers they advise.',
    [
      [
        'Brochure template with partner logo',
        'For accountants and resellers to hand to their clients.',
      ],
      ['Partner email templates', ''],
      [
        'Slide deck for resellers',
        'How to explain Tessel to a small retailer.',
      ],
      ['Partner section on the website', ''],
    ],
  ),
  project(
    'First-year merchant health score',
    CS,
    'clear-match',
    'serves',
    'retention',
    'Spotting first-year merchants at risk of leaving is the basis for reducing first-year churn.',
    [
      [
        'Score each merchant on risk of leaving',
        'Based on payment volume, logins and support contacts in the first year.',
      ],
      ['Weekly list of at-risk merchants', ''],
      ['Playbook for contacting at-risk merchants', ''],
      [
        'Report first-year churn monthly',
        'Track progress from 24% towards 12%.',
      ],
    ],
  ),
  project(
    'Cancellation save flow',
    PROD,
    'clear-match',
    'serves',
    'retention',
    'Asking why a merchant is leaving and offering a remedy at that moment keeps some of them.',
    [
      ['Ask for the reason when a merchant cancels', ''],
      [
        'Offer a fix matched to the reason',
        'For example a cheaper plan or a pause instead of leaving.',
      ],
      ['Pause account option', ''],
      [
        'Report of merchants kept by the flow',
        'Counts towards the first-year churn target.',
      ],
    ],
  ),
  project(
    'First-year check-in programme',
    CS,
    'clear-match',
    'serves',
    'retention',
    'Planned contact during the first year addresses the period in which most merchants leave.',
    [
      [
        'Check in with every merchant at 30, 90 and 180 days',
        'Most merchants who leave do so in their first year.',
      ],
      ['Check-in script and survey', ''],
      ['Route problems found to the right team', ''],
      ['Compare churn of contacted and uncontacted merchants', ''],
    ],
  ),

  // ---------------------------------------------------------------
  // DIFFERENT WORDS: serves a priority without using its vocabulary
  // ---------------------------------------------------------------
  project(
    'Project Rhine',
    SALES,
    'different-words',
    'serves',
    'germany-france',
    'Hiring account managers in Munich and Hamburg to sign up local shops is work to win merchants in Germany, although the country is never named.',
    [
      [
        'Recruit account managers in Munich and Hamburg',
        'Six people who will visit local independent shops.',
      ],
      ['Rent co-working desks in both cities', ''],
      [
        'Standard merchant agreement under local law',
        'Reviewed by a Frankfurt law firm.',
      ],
      [
        'First 200 shop visits',
        'Bakeries and bike shops in Bavaria and the north.',
      ],
      ['Local-language sales training', ''],
    ],
  ),
  project(
    'Project Marianne',
    PROD,
    'different-words',
    'serves',
    'germany-france',
    'Making the product and support usable for shops in Lyon and Marseille is work to win merchants in France.',
    [
      [
        'Translate the merchant app for the Lyon pilot',
        'Every screen, including receipts and error messages.',
      ],
      [
        'Support Cartes Bancaires',
        'The domestic card scheme most shoppers there use.',
      ],
      ['Hire support agents who speak the language', 'Based in Lille.'],
      ['Pilot with 40 shops in Lyon and Marseille', ''],
    ],
  ),
  project(
    'Second acquirer integration',
    PAY,
    'different-words',
    'serves',
    'reliability',
    'A second bank to route card transactions through means an outage at one bank no longer stops merchants taking payments.',
    [
      [
        'Integrate a second acquiring bank',
        'Today every card transaction goes through one bank.',
      ],
      [
        'Route transactions to whichever bank is responding',
        'If one bank has an outage, shops keep trading.',
      ],
      ['Reconcile settlements from two banks', ''],
      ['Contract and certification with the second bank', ''],
      ['Monitor approval rates per bank', ''],
    ],
  ),
  project(
    'Game days',
    PAY,
    'different-words',
    'serves',
    'reliability',
    'Rehearsing failures on purpose finds weaknesses before they cause a real payment outage.',
    [
      [
        'Switch off one service on purpose each month',
        'See whether shops can still take cards while it is down.',
      ],
      ['Record what broke and how long recovery took', ''],
      ['Fix the weaknesses each exercise uncovers', ''],
      ['Rehearse loss of the card authorisation service', ''],
    ],
  ),
  project(
    'Zero-touch activation',
    PROD,
    'different-words',
    'serves',
    'self-service',
    'Removing the manual activation steps lets a new merchant start taking payments without waiting for staff.',
    [
      [
        'Activate accounts automatically after checks pass',
        'Today an operations agent presses a button for each new shop.',
      ],
      [
        'Connect the bank account through open banking',
        'Replaces emailing a bank statement to our team.',
      ],
      [
        'Ship the card reader pre-paired to the account',
        'It works when taken out of the box.',
      ],
      ['Remove the welcome call from the activation steps', ''],
    ],
  ),
  project(
    'Top 20 contact reasons',
    CS,
    'different-words',
    'serves',
    'self-service',
    'Answering the commonest questions inside the product means merchants no longer need to contact staff for them.',
    [
      [
        'List the 20 questions new shops phone us about most',
        'From six months of call and chat logs.',
      ],
      [
        'Answer each question inside the product at the point it arises',
        'For example explain payout timing on the payout screen.',
      ],
      ['Fix the three product defects behind the most calls', ''],
      ['Track calls per new shop in the first month', 'Target is under one.'],
    ],
  ),
  project(
    'Bookkeeper referral links',
    SALES,
    'different-words',
    'serves',
    'partners',
    'Rewarding bookkeepers for recommending Tessel to their clients grows the channel of advisers who bring new merchants.',
    [
      [
        'Personal referral link for each bookkeeper',
        'Bookkeepers recommend tools to the shops whose books they keep.',
      ],
      ['Reward for each client who starts trading', ''],
      [
        'Recruit 500 freelance bookkeepers',
        'Through bookkeeping associations.',
      ],
      ['Leaderboard of top referrers', ''],
    ],
  ),
  project(
    'Till installer API',
    PROD,
    'different-words',
    'serves',
    'partners',
    'Firms that install tills for small shops can bundle Tessel through this API, making them a channel that brings new merchants.',
    [
      [
        'Public API to create a merchant account',
        'Firms that install tills for small shops can set Tessel up for their customers.',
      ],
      ['API keys and sandbox for installers', ''],
      ['Documentation and sample code', ''],
      [
        'Pilot with three till installation firms',
        'Each installs tills in several hundred shops a year.',
      ],
      ['Report accounts created per installer', ''],
    ],
  ),
  project(
    'Quiet account outreach',
    CS,
    'different-words',
    'serves',
    'retention',
    'Contacting recently joined merchants whose activity is falling aims to stop them leaving in their first year.',
    [
      [
        'Detect shops whose payment volume has halved',
        'In months three to nine after joining.',
      ],
      [
        'Call each one within a week',
        'Ask what changed and whether they are trying a competitor.',
      ],
      ['Offer a fee review to shops considering a switch', ''],
      ['Record outcome of each call', ''],
    ],
  ),
  project(
    'Fee transparency statements',
    PROD,
    'different-words',
    'serves',
    'retention',
    'Exit surveys name surprise fees as the main reason new merchants leave, so clearer statements address first-year churn.',
    [
      ['Redesign the monthly statement', 'Show every fee in one plain table.'],
      [
        'Explain each fee in a sentence',
        'Exit surveys say surprise fees are the top reason shops close their account within months of joining.',
      ],
      ['Fee estimate before a plan change', ''],
      ['Survey shops on whether fees are now clear', ''],
    ],
  ),

  // ---------------------------------------------------------------
  // LABEL ONLY: the title names a priority, the work does something else
  // ---------------------------------------------------------------
  project(
    'Reliability: admin dashboard restyle',
    PROD,
    'label-only',
    'none',
    null,
    'Despite the title, the work is a visual restyle of an internal screen and does nothing for payment availability.',
    [
      [
        'New colour palette for the internal admin dashboard',
        'Staff find the current grey theme dated.',
      ],
      ['Replace icon set', ''],
      ['Rounded corners and new fonts on admin tables', ''],
      ['Collect staff opinions on the new look', ''],
    ],
  ),
  project(
    'Germany expansion: Berlin team offsite',
    MKT,
    'label-only',
    'none',
    null,
    'The work is a social event for existing staff that happens to be in Berlin; it does not win German merchants.',
    [
      [
        'Book a venue in Berlin for the marketing team offsite',
        'Two days of team building for the Amsterdam marketing team.',
      ],
      ['Flights and hotel for 35 staff', ''],
      ['Plan the boat trip and team dinner', ''],
      ['Offsite photo album', ''],
    ],
  ),
  project(
    'Self-service: staff expense tool',
    SALES,
    'label-only',
    'none',
    null,
    'The self-service here is for employees filing expenses, not for merchants setting up, so no priority is served.',
    [
      [
        'Choose a self-service expense tool for employees',
        'Staff currently email receipts to finance.',
      ],
      ['Import the sales team’s company cards', ''],
      ['Train sales staff to file their own expenses', ''],
      ['Switch off the old expense spreadsheet', ''],
    ],
  ),
  project(
    'Retention: employee engagement survey',
    CS,
    'label-only',
    'none',
    null,
    'The work concerns keeping employees, while the priority is about keeping merchants.',
    [
      [
        'Survey support staff on job satisfaction',
        'Staff turnover in the support team was high last year.',
      ],
      ['Exit interviews with employees who resigned', ''],
      ['Propose changes to shift patterns and pay bands', ''],
      ['Present findings to HR', ''],
    ],
  ),
  project(
    'Partner growth: annual sales kickoff',
    SALES,
    'label-only',
    'none',
    null,
    'An internal kickoff event for the sales team does not recruit or support accountants or resellers.',
    [
      [
        'Book the hotel for the internal sales kickoff',
        'Annual gathering of our own sales staff.',
      ],
      ['Invite a motivational speaker', ''],
      ['Sales awards ceremony', 'Prizes for last year’s top sellers.'],
      ['Kickoff theme and merchandise', ''],
    ],
  ),
  project(
    'France launch: Québec pilot',
    SALES,
    'label-only',
    'contradicts',
    'no-outside-europe',
    'The title borrows the France launch, but the work sells to merchants in Canada, which is outside Europe.',
    [
      [
        'Sign up 50 French-speaking shops in Montréal',
        'Reuse the French translation to sell in Québec.',
      ],
      ['Support Canadian dollars and Interac', ''],
      ['Register a Canadian entity', ''],
      ['Hire a sales contractor in Montréal', ''],
    ],
  ),

  // ---------------------------------------------------------------
  // NO PRIORITY: reasonable work that serves nothing stated
  // ---------------------------------------------------------------
  project(
    'Headquarters move',
    CS,
    'no-priority',
    'none',
    null,
    'Moving office is ordinary company work that advances none of the stated priorities.',
    [
      [
        'Plan the move to the new Amsterdam office',
        'The current lease ends in March.',
      ],
      ['Seating plan for the support floor', ''],
      ['Move phone system and headsets', ''],
      ['Order desks and chairs', ''],
    ],
  ),
  project(
    'Build system migration',
    PROD,
    'no-priority',
    'none',
    null,
    'Faster builds help engineers, but the work is not aimed at any stated priority.',
    [
      [
        'Move code builds to the new build system',
        'Builds take 25 minutes and engineers want them faster.',
      ],
      ['Migrate 140 build scripts', ''],
      ['Cache dependencies between builds', ''],
      ['Retire the old build servers', ''],
    ],
  ),
  project(
    'Dark mode for the merchant app',
    PROD,
    'no-priority',
    'none',
    null,
    'A cosmetic option some merchants asked for; it is not tied to any priority.',
    [
      [
        'Dark colour theme for the merchant app',
        'Requested by a few merchants on the feedback forum.',
      ],
      ['Theme switch in settings', ''],
      ['Check contrast of all screens in dark mode', ''],
      ['Dark versions of charts', ''],
    ],
  ),
  project(
    'Brand refresh',
    MKT,
    'no-priority',
    'none',
    null,
    'A new logo and colours serve no stated priority.',
    [
      ['Commission a new logo', 'The current logo is eight years old.'],
      ['New brand colours and typeface', ''],
      ['Update templates and stationery', ''],
      ['Brand guidelines document', ''],
      ['Replace signage in the office', ''],
    ],
  ),
  project(
    'Industry awards submissions',
    MKT,
    'no-priority',
    'none',
    null,
    'Entering awards is reputation work unrelated to the stated priorities.',
    [
      ['Enter three fintech awards', ''],
      ['Write award submissions', ''],
      ['Book a table at the awards dinner', ''],
      ['Press release if shortlisted', ''],
    ],
  ),
  project(
    'Sales compensation redesign',
    SALES,
    'no-priority',
    'none',
    null,
    'Changing how our own salespeople are paid is internal housekeeping, not a stated priority.',
    [
      [
        'Review base and bonus split for our sales staff',
        'The plan has not changed in four years.',
      ],
      ['Benchmark pay against other software firms', ''],
      ['Model the cost of three options', ''],
      ['Present the new plan to the board', ''],
    ],
  ),
  project(
    'Staff single sign-on',
    PAY,
    'no-priority',
    'none',
    null,
    'Internal login security for employees is sensible, but the strategy does not ask for it.',
    [
      [
        'One login for all internal staff tools',
        'Employees juggle eleven passwords.',
      ],
      ['Connect internal tools to the identity provider', ''],
      ['Require two-factor login for employees', ''],
      ['Remove shared team passwords', ''],
    ],
  ),
  project(
    'Crypto payments exploration',
    PAY,
    'no-priority',
    'none',
    null,
    'Exploring a new payment method is neither a priority nor ruled out by the strategy.',
    [
      [
        'Research accepting stablecoin payments',
        'An engineer proposed it at the last hackathon.',
      ],
      ['Prototype with one crypto payment provider', ''],
      ['Summarise regulatory position', ''],
      ['Demo to the product team', ''],
    ],
  ),
  project(
    'Podcast sponsorship',
    MKT,
    'no-priority',
    'none',
    null,
    'General brand awareness in an existing market serves none of the priorities.',
    [
      [
        'Sponsor a UK small-business podcast for a season',
        'General brand awareness in our existing market.',
      ],
      ['Write the sponsor message', ''],
      ['Negotiate the rate', ''],
      ['Review listener numbers', ''],
    ],
  ),
  project(
    'Support shift planner',
    CS,
    'no-priority',
    'none',
    null,
    'A rota tool for our own staff is internal efficiency work with no link to the priorities.',
    [
      [
        'Choose a shift planning tool for support agents',
        'Rotas are kept in a spreadsheet today.',
      ],
      ['Import agent contracts and holidays', ''],
      ['Let agents swap shifts in the tool', ''],
      ['Train team leads', ''],
    ],
  ),
  project(
    'Investor data room',
    SALES,
    'no-priority',
    'none',
    null,
    'Preparing documents for investors is corporate work outside the stated priorities.',
    [
      [
        'Assemble contracts for the investor data room',
        'Preparation for a possible funding round.',
      ],
      ['Summarise the top 50 merchant contracts', ''],
      ['Answer due-diligence questions on the sales pipeline', ''],
      ['Redact personal data from documents', ''],
    ],
  ),

  // ---------------------------------------------------------------
  // CONTRADICTION: work inside a non-goal, or against a priority
  // ---------------------------------------------------------------
  project(
    'MegaMart loyalty module',
    PROD,
    'contradiction',
    'contradicts',
    'no-bespoke',
    'A loyalty module built to one chain’s specification and used by no one else is a feature for a single customer.',
    [
      [
        'Build a loyalty points module to MegaMart’s specification',
        'MegaMart will sign a three-year contract if we build it.',
      ],
      ['Integrate with MegaMart’s own customer database', ''],
      [
        'MegaMart-only reporting screens',
        'No other merchant will have access.',
      ],
      ['Weekly requirements calls with MegaMart IT', ''],
      ['Dedicated test environment for MegaMart', ''],
    ],
  ),
  project(
    'Castell Group enterprise deal',
    SALES,
    'contradiction',
    'contradicts',
    'no-bespoke',
    'The deal depends on promising features only Castell Group needs, which the strategy rules out however large the contract.',
    [
      [
        'Negotiate the Castell Group contract',
        'Our largest ever deal: 400 stores.',
      ],
      [
        'Commit to a custom approval workflow for Castell',
        'Written into the contract as a deliverable only they need.',
      ],
      ['Custom invoice layout for Castell head office', ''],
      ['Named engineer assigned to Castell requests', ''],
    ],
  ),
  project(
    'United States market entry',
    SALES,
    'contradiction',
    'contradicts',
    'no-outside-europe',
    'Piloting sales in the United States is selling outside Europe.',
    [
      ['Market study of small retailers in Texas and Florida', ''],
      [
        'Pilot with 30 shops in Austin',
        'First paying merchants in the United States.',
      ],
      ['US payment licence application', ''],
      ['Hire a US country manager', ''],
    ],
  ),
  project(
    'Dubai reseller agreement',
    SALES,
    'contradiction',
    'contradicts',
    'no-outside-europe',
    'Although it uses a reseller, the agreement sells Tessel in the Gulf, which is outside Europe.',
    [
      [
        'Sign a reseller for the United Arab Emirates',
        'A Dubai firm offers to sell Tessel to Gulf retailers.',
      ],
      ['Support dirham pricing', ''],
      ['Arabic translation of the merchant app', ''],
      ['Reseller training in Dubai', ''],
    ],
  ),
  project(
    'Tessel Terminal One',
    PAY,
    'contradiction',
    'contradicts',
    'no-hardware',
    'Designing a card reader and contracting a factory to make it is designing and manufacturing our own hardware.',
    [
      [
        'Design our own card reader',
        'Industrial design and circuit board for a Tessel-made terminal.',
      ],
      ['Select a contract manufacturer in Shenzhen', ''],
      ['Write firmware for the reader', ''],
      ['Card scheme hardware certification', ''],
      ['Order the first 5,000 units', ''],
    ],
  ),
  project(
    'Saturday maintenance windows',
    PAY,
    'contradiction',
    'contradicts',
    'reliability',
    'Taking payments offline during Saturday trading hours makes merchants lose sales, against the dependability priority.',
    [
      [
        'Take card payments offline every Saturday 14:00 to 15:00 for releases',
        'Engineers prefer releasing in working hours rather than at night.',
      ],
      ['Announce the weekly downtime to merchants', ''],
      ['Exclude the window from availability reporting', ''],
      ['Move the release schedule to Saturdays', ''],
    ],
  ),
  project(
    'Mandatory onboarding call',
    CS,
    'contradiction',
    'contradicts',
    'self-service',
    'Blocking a merchant’s first payment until they have spoken to staff is the opposite of letting merchants help themselves.',
    [
      [
        'Require a 45-minute call with an agent before an account can take payments',
        'Agents believe merchants set up better when walked through it.',
      ],
      ['Block activation until the call is completed', ''],
      ['Booking calendar for onboarding calls', ''],
      ['Hire six onboarding agents', ''],
    ],
  ),

  // ---------------------------------------------------------------
  // AMBIGUOUS: the strategy cannot settle it; expected "unclear"
  // ---------------------------------------------------------------
  project(
    'Switzerland and Austria pilot',
    SALES,
    'ambiguous',
    'unclear',
    'germany-france',
    'The pilot reuses the German-language product, but the priority names only Germany and France and the strategy does not say whether neighbouring countries count.',
    [
      [
        'Pilot with 60 shops in Zurich and Vienna',
        'Reuses the German-language product.',
      ],
      ['Support Swiss francs', ''],
      ['Swiss and Austrian merchant agreements', ''],
      ['Assign two account managers from the German team', ''],
    ],
  ),
  project(
    'Mid-size chains pilot',
    SALES,
    'ambiguous',
    'unclear',
    null,
    'The strategy speaks of small retailers but neither includes nor excludes chains of 20 to 50 shops using the standard product.',
    [
      [
        'Sell the standard product to chains of 20 to 50 shops',
        'No custom features; the same product small shops use.',
      ],
      [
        'Multi-shop account view',
        'Useful to any merchant with more than one shop.',
      ],
      ['Pilot with five regional chains', ''],
      ['Pricing for 20 or more shops', ''],
    ],
  ),
  project(
    'White-label card reader',
    PAY,
    'ambiguous',
    'unclear',
    'no-hardware',
    'Tessel would resell a supplier’s existing reader under its own logo; the strategy forbids designing or manufacturing hardware but is silent on rebranding someone else’s.',
    [
      [
        'Put the Tessel logo on a supplier’s existing card reader',
        'The supplier designs and makes it; we choose the colour and logo.',
      ],
      ['Supply contract for 10,000 readers', ''],
      ['Tessel-branded packaging', ''],
      ['Warranty and returns handled by Tessel', ''],
    ],
  ),
  project(
    'Premium phone support tier',
    CS,
    'ambiguous',
    'unclear',
    null,
    'A paid phone line might keep merchants from leaving, yet it moves merchants towards talking to staff; the strategy does not say which priority wins.',
    [
      [
        'Paid plan with a direct phone line to a named agent',
        'Some merchants say they would stay if they could always reach a person.',
      ],
      ['Promote the phone line to new merchants during setup', ''],
      ['Hire agents for the premium line', ''],
      ['Measure whether premium merchants stay longer', ''],
    ],
  ),
]
