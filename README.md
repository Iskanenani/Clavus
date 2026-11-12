# Clavus

**Is the work following the strategy?**

Clavus reads the work a company is actually doing, from trackers such as Jira, and shows its leaders how much of it serves the strategy they set, how much serves nothing they stated, and what runs against it.

> *Clavus* is Latin for the tiller, the handle used to steer a ship.

## The problem

Leaders set a strategy, but the people making daily choices often can't name it. In a London Business School study of 11,000 managers, only about a third could name their company's top three priorities ([source](https://www.london.edu/news/two-thirds-of-senior-managers-cant-name-their-firms-top-priorities)).

So projects drift away from the strategy, and leaders find out late, when results disappoint. KPI dashboards show outcomes after the fact. Clavus looks earlier, at where the effort is going.

## How it works

1. **Set the reference.** The strategy becomes a short list of priorities and explicit "we will not do" items, validated by the leader.
2. **Load the work.** Clavus takes a list of work items from whatever tool the teams already use, e.g. Jira projects, epics and stories.
3. **Judge each project.** An AI model marks it as *serves a priority*, *serves none* or *contradicts one*, and quotes the strategy line behind the call.
4. **Show the map.** One dashboard compares where effort goes with where the strategy says it should go.

## Features

- Strategy reference with priorities and non-goals
- Tool-agnostic import (see below), judged at project or epic level
- A quoted reason for every judgement, and an "unclear" flag when the strategy is too vague to decide
- Effort view: share of work items per priority, plus story points or time where the source records them
- Human review: a person can confirm or override each call, and overrides are logged
- A short list of contradictions for the leader to rule on

## Works with any work tracker

Clavus is not tied to one tool. It reads a simple common format, so a company can combine engineering, marketing and sales work in one view, whatever each team uses.

Each work item needs:

| Field | Required | Example |
|---|---|---|
| Title | Yes | "German checkout flow" |
| Description | Yes | What the work is for |
| Parent | Yes | The project or epic it belongs to |
| Team | No | "Payments" |
| Effort | No | Story points, hours or days |
| Status | No | "In progress" |

Any tracker that can export its items (Jira, Asana, Linear and similar) can be mapped to this format, and so can a plain spreadsheet.

## What it is not

- Not a KPI dashboard: it measures direction of effort, not results.
- Not a goal tracker: it doesn't rely on people tagging their own work to a goal. It reads the work itself.
- Not a decision-maker: it flags, and people decide.

## Data

The prototype runs on synthetic data: a fictional company with one strategy and a set of work items containing planted mismatches. No real company data is used.

## Run it locally

You need [Node.js](https://nodejs.org) 22 or newer, and Docker (or Podman) for the local copy of Supabase.

```sh
git clone <this repository>
cd Clavus
npm install
npx supabase start           # local Supabase; prints its URL and keys
cp .env.example .env.local   # then fill in the values (see below)
npm run db:setup             # creates the tables and loads the synthetic dataset
npx supabase functions serve # leave running: this is the judging function
npm run dev                  # in a second terminal; opens on http://localhost:5173
```

The homepage at `/` introduces the product. The public pages at `/who-we-are` and `/how-it-works` explain its purpose and workflow; they work without a database connection. Open `/app` for the existing workspace, then log in with the `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD` you chose in `.env.local`.

**What goes in `.env.local`:** `npx supabase start` prints `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY`; they go in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. For the hosted project, the same three values are in the Supabase dashboard under Project Settings > API.

**On Fedora or another SELinux system**, containers cannot read your home folder by default and the judging function fails with "failed to determine entrypoint". Allow it once with `chcon -Rt container_file_t supabase/functions`.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Runs the app locally |
| `npm run build` | Type-checks and builds the static files into `dist/` |
| `npm run lint` / `npm run format` | Checks the code for mistakes / formats it |
| `npm run data` | Regenerates the synthetic dataset in `data/` |
| `npm run db:setup` | Local only: recreates the tables, then loads the dataset |
| `npm run db:seed` | Loads the dataset into the Supabase project named in `.env.local` |
| `npm run judge` | Judges every project that needs it, like the queue in the app |
| `npm run accuracy` | Compares stored verdicts with the answer key; writes `reports/accuracy.md` |
| `npm run db:test-access` | Proves one company cannot read or change another's rows |
| `npm run test:import` | Proves both sample CSV files map to the same items |
| `npm run test:checks` | Proves the checks on model answers reject bad answers |

### Putting it online

This is done: the app is at https://clavus.vercel.app. The steps are kept here so the setup can be repeated or explained.

1. **Supabase:** create a project, then `npx supabase link`, `npx supabase db push` (tables), `npx supabase functions deploy judge-project` (judging), and the seed with the hosted values, kept in `.env.hosted` (ignored by git): `node --env-file=.env.hosted scripts/seed.mjs`.
2. **Vercel:** import the GitHub repository and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Vercel detects Vite by itself.
3. **A real model, once chosen:** add it in `supabase/functions/_shared/model.ts` (the only file to change) and set `MODEL_PROVIDER` and `MODEL_API_KEY` with `npx supabase secrets set`.

## Status

Early prototype, built for a student consulting project.

- [x] Synthetic strategy and work-item dataset
- [x] Import in the common format
- [x] Classification of projects against the strategy (with the mock provider; no AI model chosen yet)
- [x] Dashboard
- [x] Accuracy test against the planted mismatches
- [x] Deployment: https://clavus.vercel.app, on a hosted Supabase project
- [x] Public product, Who we are, and How it works pages (deployed and verified at https://clavus.vercel.app)
- [x] Attio design reference applied to the public pages and workspace, with local fonts and the team section preserved
- [x] Readable strategy reference with contextual editors, priority cards, non-goals, and validation status
- [ ] Ready-made mappings for common trackers (later)
- [ ] Live connections to trackers (later)
