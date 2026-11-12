# Clavus: features and build plan

This file tells an engineer or a coding agent what to build, in what order, and how to know each part is done. It assumes you have no other context.

Read these first:

- [README.md](README.md): what Clavus is and the problem it solves.
- [TECH.md](TECH.md): the stack and the reasons behind it.

## Where things stand

All nine steps are built and their checks pass, with the mock provider. The app is deployed at https://clavus.vercel.app on a hosted Supabase project, and the full path below ran there twice in a row. No AI model has been chosen yet.

## What version 1 must do

A person opens Clavus in a browser and, in a few minutes, can:

1. see a company's strategy as a short list of priorities and "will not do" items;
2. upload a file of work items from any tracker and map its columns;
3. have every project judged against the strategy by an AI model;
4. see a map of where the effort goes compared with the strategy;
5. open any project, read why it was judged that way, and correct it.

It runs on synthetic data and is shown live to a jury. Three things matter most to that audience: it works without failing, every judgement can be explained, and every number is exact.

## Terms

| Term | Meaning |
|---|---|
| Strategy | The company's direction, as text, owned by its leader |
| Priority | One thing the strategy says the company will pursue |
| Non-goal | One thing the strategy says the company will not do |
| Work item | A task, story or ticket imported from a tracker |
| Project | The parent a work item belongs to (a project or an epic). **Judgements are made at this level** |
| Verdict | The model's judgement of one project against the strategy |
| Override | A human correction of a verdict |
| Effort | How much work a project represents: number of items, plus points or hours when the source has them |

## The common format

Every imported work item is mapped to these fields. This is what makes Clavus independent of any one tracker.

| Field | Required | Notes |
|---|---|---|
| `title` | Yes | |
| `description` | Yes | May be empty for some items, but the column must exist |
| `parent` | Yes | Name or ID of the project or epic |
| `team` | No | |
| `effort` | No | A number. The unit (points, hours, days) is recorded once per import |
| `status` | No | Free text |

## The verdict

Each judgement is stored in this shape:

```json
{
  "verdict": "serves | none | contradicts | unclear",
  "priority_id": "id of the priority or non-goal concerned, or null",
  "quote": "the exact line of the strategy that justifies the verdict, or null",
  "reason": "one or two sentences in plain language"
}
```

- `serves`: the project advances a priority.
- `none`: the project advances no stated priority and conflicts with nothing.
- `contradicts`: the project works against a priority or does something listed as a non-goal.
- `unclear`: the strategy is too vague to decide. This is a useful result, not a failure.

`quote` is required for `serves` and `contradicts`.

## Build order

Do the steps in order. Each one ends with a check you can run.

### Step 0. Project setup

**Build:** a React + Vite + TypeScript app; a `supabase/` folder for migrations and functions; linting and formatting; a `.env.example` listing every variable; a "Run it locally" section in README.md.

**Done when:** a new person can clone the repository, follow README.md, and see a blank app running locally.

**Needs the owner:** the Supabase project and its keys. Ask for them. Do not create accounts.

### Step 1. Synthetic dataset

Build this before any screen, because everything else is tested against it.

**Build**, in `data/`:

- `strategy.md`: a fictional mid-sized company with 4 to 5 priorities and 2 to 3 non-goals.
- `work_items.csv`: about 60 projects and 400 to 600 work items across 4 to 5 teams, in the common format.
- `answer_key.csv`: the expected verdict for every project.
- `work_items_other_shape.csv`: the same data with different column names and order, to test the mapping screen.

Plant these cases and label them in the answer key:

| Case | What it tests |
|---|---|
| Clear match | A project that plainly serves a priority |
| Different words | A project that serves a priority without using its vocabulary |
| Label only | A title that names a priority while the work inside does something else |
| No priority | Reasonable work that serves nothing stated |
| Contradiction | Work in an area the strategy lists as a non-goal |
| Ambiguous | A project the strategy cannot settle, expected `unclear` |

**Done when:** the four files exist, the answer key covers every project, and a short `data/README.md` describes the company and the planted cases.

### Step 2. Database

**Build:** migrations for the tables in TECH.md (`strategies`, `priorities`, `work_items`, `verdicts`, `overrides`), access rules on every table, and a seed script that loads the synthetic dataset.

**Done when:** one command creates the schema and loads the dataset, and a user from one company cannot read another company's rows.

### Step 3. Strategy screen

**Build:** view and edit the strategy text, its priorities and its non-goals; a "validate" action by the leader. Editing a validated strategy marks existing verdicts as out of date.

**Done when:** the synthetic strategy can be entered by hand through the screen and validated.

### Step 4. Import and mapping

**Build:** upload a CSV; parse it in the browser; a mapping screen where the user assigns columns to the common format; a preview; clear errors for missing required fields; then store the items.

**Done when:** both `work_items.csv` and `work_items_other_shape.csv` import correctly and produce the same stored data.

### Step 5. Judging

**Build:**

- A model adapter: one function that takes a prompt and returns a verdict. Providers plug in behind it.
- A **mock provider** first, which answers from the answer key. This lets every later step proceed while the real model is undecided.
- An Edge Function, `judge-project`: loads the strategy and one project with its items, calls the adapter, checks the result, and stores the verdict.
- A queue in the interface: one project per call, visible progress, a configurable pause between calls, safe to stop and resume. Projects that already have an up-to-date verdict are skipped.

Checks the function must apply to every result:

1. It matches the verdict shape.
2. The `quote` appears word for word in the strategy text (ignoring differences in spacing).
3. If either check fails, retry once, then store the project as `error` with the cause.

Guidance for the prompt: judge what the work is for, not which words it shares with the strategy; quote the strategy exactly; answer `unclear` when the strategy does not allow a decision; use `contradicts` only for work against a priority or inside a non-goal.

**Done when:** all synthetic projects get a stored verdict with the mock provider, and swapping in a real provider requires changes in one file only.

### Step 6. The map

**Build:** the main screen.

- Share of effort per priority, and the share serving no priority.
- A list of contradictions and a list of unclear projects.
- A filter by team.
- Click a priority to see its projects; click a project to see its verdict, quote and reason.

All totals come from SQL. Compare across teams by number of items. Show points or hours only within a team, since units differ between teams.

**Done when:** the figures on screen match a manual count from `answer_key.csv` when the mock provider is used.

### Step 7. Review and override

**Build:** on a project, confirm the verdict or change it with a reason. Store who changed it, when, and from what to what. The map uses the override when one exists. Export the log as CSV.

**Done when:** an override changes the map immediately and appears in the exported log.

### Step 8. Accuracy test

This is the proof shown to the jury.

**Build:** one command that compares stored verdicts with `answer_key.csv` and writes a report: overall accuracy, results per planted case, and every miss with the model's reason.

**Done when:** the report is generated for the mock provider (100% expected) and can be re-run unchanged for a real model.

### Step 9. Ready to demo

**Build:** a "reset demo" action that reloads the synthetic dataset; loading, empty and error states on every screen; deployment to Vercel; the demo must work from stored verdicts so it does not depend on a live model call.

**Done when:** the full path in "What version 1 must do" runs on the deployed site, twice in a row, without touching the code.

## Not in version 1

- Ready-made mappings for specific trackers.
- Live connections to trackers.
- File types other than CSV.
- Billing, teams management, or anything beyond one demo company.

## Rules for whoever builds this

- **Secrets stay out of the repository and out of browser code.** The model key lives only in the Edge Function's secrets.
- **Synthetic data only.** Free model tiers may use prompts for training.
- **The model never counts.** It judges; SQL adds up.
- **Judge projects, not single items.** One item rarely says what it is for.
- **Stay on free tiers.** Do not add a paid service or a new piece of infrastructure without asking the owner.
- **Keep it explainable.** The owner has to explain every part to a jury. Prefer short functions and comments that say why.
- **Keep the documents current.** Tick the checklist in README.md as steps finish, and update TECH.md when a choice changes.

## Decisions still open

Ask the owner before settling these. Where a default is given, use it until told otherwise.

| Decision | Default |
|---|---|
| Which AI model | None. Use the mock provider |
| Chart library | Recharts |
| Login | Supabase email and password, one demo account |
| Interface language | English |
