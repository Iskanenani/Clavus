# Clavus: tech stack

What Clavus is built with, and why. For what the product does, see [README.md](README.md).

Two constraints drove every choice: the prototype must run **entirely on free tiers**, and it must **look and behave like a product**, not a data script.

## The stack

| Layer | Choice | Why |
|---|---|---|
| Interface | React + Vite (TypeScript) | Full control over the screens that sell the product (the map and the review table). Builds to static files, so any host can serve it for free. |
| Hosting | Vercel, free plan | Deploys from GitHub on every push. It only serves static files here, so moving host later takes minutes. |
| Database and logins | Supabase (Postgres) | Hosted and always on, with authentication and per-table access rules built in. Nothing to deploy or maintain. |
| Server code | Supabase Edge Functions | Keeps the AI key private and calls the model. Puts the whole back end in one place, so the host stays static. |
| Counting | SQL in Supabase | The percentages on the map come from queries over stored verdicts, so they are exact and repeatable. |
| File import | Parsed in the browser with Papa Parse | Work items arrive as CSV. The user maps columns to the common format before anything is stored. |
| Charts | Recharts | For the effort map. |
| AI model | **Not chosen yet** | See below. Until then a mock provider answers from the answer key. |

## How the pieces connect

```mermaid
flowchart LR
    U[Browser: React app] -->|static files| V[Vercel]
    U -->|login, read, write| S[(Supabase: Postgres + Auth)]
    U -->|judge one project| F[Supabase Edge Function]
    F -->|prompt + strategy| M[AI model API]
    F -->|store verdict| S
```

No always-on server is needed. Everything the server side does is a short request: take an upload, judge one project, read or write a row.

## AI model

Still open. Whatever is chosen has to:

- return **structured JSON** in a fixed shape;
- have a **free tier** that covers a full run (about 60 calls, one per project) several times a day;
- be callable over plain HTTPS from an Edge Function.

Candidates so far: Gemini Flash-Lite and Mistral. Free tiers change often and may use prompts for training, so the prototype sends **synthetic data only**.

The model sits behind a single function. Switching provider means editing one file.

## Design rules

1. **One project per call.** Each project is sent with its child items, and the interface shows progress. This keeps every request short.
2. **Fixed output shape.** Each verdict contains: `serves`, `none`, `contradicts` or `unclear`; the priority concerned; the quoted strategy line; a short reason.
3. **Quotes are checked in code.** After each call, the quoted line must appear in the strategy text, or the verdict is rejected.
4. **Verdicts are stored.** An unchanged project is never judged twice, which keeps results stable and usage low.
5. **The model never counts.** Totals and percentages are computed in SQL.
6. **Access rules on every table.** Each user sees only their own company's data.

## Data model

Defined in `supabase/migrations/`. Every table has a `company_id` and an access rule that compares it with the company of the logged-in user.

| Table | Holds |
|---|---|
| `companies` | One row per company. Added to the first draft: the access rules need something to compare against |
| `members` | Which user belongs to which company |
| `strategies` | One strategy per company, with its text and when it was validated |
| `priorities` | The priorities and "will not do" items of a strategy, each with a short name |
| `work_items` | Imported items in the common format, with their parent project |
| `verdicts` | The model's judgement per project, with quote and reason, or the error if the answer failed the checks |
| `overrides` | Human confirmations and corrections. Rows can be added and read, never edited or deleted |
| `answer_key` | The expected verdicts of the synthetic dataset. Read only by the mock provider on the server; the browser has no access |

Three things are computed, not stored:

| Name | What it gives |
|---|---|
| `project_summary` (view) | Work items grouped into projects, with item count, effort and a fingerprint of the items |
| `project_verdicts` (view) | Each project with the verdict in force: the newest override if there is one, otherwise the model's |
| `effort_map()` (function) | The rows of the map: projects, items and share per priority, plus "no priority", "contradicts", "unclear" and "not judged" |

How the rules in this document are enforced:

- **Never judged twice:** a verdict stores the fingerprint of the project's items. The queue skips a project while the fingerprint still matches and the strategy has not changed.
- **Out of date:** a database trigger withdraws the validation and flags every verdict when the strategy text or a priority changes. It lives in the database so that no screen can forget to do it.
- **Reset demo:** the synthetic dataset is kept in a template company with no members. Resetting copies it over the demo company (`reset_demo()`).
- **Effort units:** stored per work item, because the synthetic teams use different units. The import screen asks for the unit once per file.

## Where the code is

| Path | What |
|---|---|
| `src/screens/` | One file per screen: strategy, import, judge, map, project panel, review log |
| `src/lib/csv.ts` | Mapping a tracker's columns to the common format |
| `supabase/migrations/` | Tables, access rules, triggers and the SQL behind the map |
| `supabase/functions/judge-project/` | Judges one project and stores the verdict |
| `supabase/functions/_shared/verdict.ts` | The prompt, and the checks every model answer must pass |
| `supabase/functions/_shared/model.ts` | The model adapter and the mock provider. **The one file to edit when a model is chosen** |
| `scripts/` | Dataset generator, seed, accuracy report and the tests |

## Alternatives considered

| Option | Why not |
|---|---|
| Streamlit (Python) | Fastest to build, but every app looks the same and the interface can't be customised much. |
| Next.js | Its built-in server routes are convenient, but they tie the server code to the host. Plain React keeps the host replaceable. |
| An always-on server (for example FastAPI) | Nothing in Clavus needs a running process, and free always-on hosting tends to sleep when idle. |
| SQLite | Serverless hosts have no permanent disk to keep the file on. |

## Free-tier limits to watch

Checked in November 2026 from third-party pricing guides. Verify before relying on them.

- **Vercel free plan:** personal, non-commercial use only. If Clavus ever earns money, move the static files to a host that allows it, such as Cloudflare Pages.
- **Supabase free plan:** projects pause after 7 days without activity and need a manual restart; 500 MB database; no backups. Open the app in the week before any demo.
- **Model free tiers:** request limits are low and change without notice.

A real deployment with customer data would need paid plans for the database and the model.
