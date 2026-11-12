# Handoff

Where the project stands and what to do next. Written on 12 November 2026 at the end of the first build session. Read [AGENTS.md](AGENTS.md) first for the rules, then this.

## Where things stand

All nine steps of [FEATURES.md](FEATURES.md) are built and their checks pass, with the **mock provider**. No AI model has been chosen.

| What | Where |
|---|---|
| Live app | https://clavus.vercel.app (Vercel, deploys from `main` on every push) |
| Hosted database and function | Supabase project `clavus`, ref `srhptjebvyvisauwesuu`, region Stockholm, free plan |
| Demo login | `demo@clavus.example`; the password is `DEMO_USER_PASSWORD` in `.env.hosted` |
| Code | `main` and `build-v1` on GitHub hold the same commits |

The hosted project currently holds the synthetic dataset with stored verdicts for all 60 projects.

## The one thing that is not real yet

Every verdict so far comes from the mock provider, which reads the answer key. **The 100% in `reports/accuracy.md` therefore says nothing about how well a real model judges.** That figure is the point of the jury demo, so choosing a model is the next real step.

## What to do next

1. **Choose the AI model.** This is the owner's decision (see AGENTS.md). Candidates named in TECH.md: Gemini Flash-Lite and Mistral. It needs a free tier covering about 60 calls per run, structured JSON output, and plain HTTPS.
2. **Add the provider** in `supabase/functions/_shared/model.ts`, the only file that changes. Write one function next to `askMock` that sends `request.prompt` to the model and returns the parsed JSON, and register it in `PROVIDERS`.
3. **Set the secrets** on the hosted project. The key never goes in the repository:
   ```sh
   npx supabase secrets set MODEL_PROVIDER=<name> MODEL_API_KEY=<key>
   npx supabase functions deploy judge-project --remote
   ```
4. **Re-judge and measure.** Reset the demo in the app (or delete the stored verdicts), then:
   ```sh
   node --env-file=.env.hosted scripts/judge-all.mjs
   node --env-file=.env.hosted scripts/accuracy.mjs
   ```
   Set `JUDGE_PAUSE_MS` if the model's free tier limits requests per minute. Read the misses in `reports/accuracy.md`; the prompt is in `supabase/functions/_shared/verdict.ts` if it needs tuning.
5. **Decide what the demo shows.** "Reset with stored verdicts" currently loads the answer key as if it were the model's output. Once a real model is in, the stored verdicts should be that model's, misses included. This is not built: `load_demo()` in `supabase/migrations/20261112000004_demo_reset.sql` copies from `answer_key`.

## Open questions for the owner

- **Effort units.** FEATURES.md says the unit is recorded once per import, but the synthetic file mixes points (engineering) and hours (other teams). The unit is stored per work item, and the import screen asks once per file. Importing the synthetic file through the screen therefore labels every team with one unit; the seeded data is labelled correctly. Decide whether this matters for the demo.
- **Overrides after re-judging.** The newest override always wins, even over a later verdict from a re-judgement. Simple to explain, but a stale human correction can hide a new verdict.
- **The ambiguous cases.** Four projects expect `unclear`. A real model answering `none` or `contradicts` on them is defensible; decide how to present that to the jury.

## Environment notes for this machine

These cost time in the first session.

- **Two env files, both ignored by git.** `.env.local` points at the local Supabase stack and is what `npm run ...` scripts read. `.env.hosted` points at the hosted project; use it as `node --env-file=.env.hosted scripts/<name>.mjs`. Both were created by the agent, not typed by the owner. If `.env.hosted` is lost, the keys can be fetched again with `npx supabase projects api-keys`.
- **Docker is not usable without sudo.** The user is not in the `docker` group. Fix: `sudo usermod -aG docker $USER`, then log out and in. Until then, run the local stack through Podman:
  ```sh
  systemctl --user start podman.socket
  export DOCKER_HOST=unix:///run/user/1000/podman/podman.sock
  npx supabase start -x realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,logflare,vector,supavisor
  ```
- **SELinux.** `supabase/functions` was relabelled so containers can read it (`chcon -Rt container_file_t supabase/functions`). A fresh clone needs this again; the symptom is "failed to determine entrypoint".
- **The Supabase CLI is logged in and linked** to the hosted project. Commands that change it need `--remote`, and `--yes` when run by an agent. Ask the owner before using `--yes`.
- **Local stack and dev server were stopped** at the end of the session. To bring everything back: the Podman lines above, `npx supabase functions serve`, and `npm run dev`. The local database keeps its data between stops.
- **Browser tests** were run with Playwright from a temporary folder that no longer exists; they are not in the repository. Its headless Chromium remains in `~/.cache/ms-playwright`. The checks that are in the repository are listed in README.md under "Commands".

## Things to remember before a demo

- Supabase pauses a free project after 7 days without activity. Open the site in the week before.
- The first judging run after a quiet period can fail some calls while the function starts. It happened once locally (19 of 60); re-running judged them. Do one judging pass shortly before presenting, or use "Reset with stored verdicts".
- To change the demo password: edit `DEMO_USER_PASSWORD` in `.env.hosted`, then `node --env-file=.env.hosted scripts/seed.mjs`. This also reloads the dataset.
- Vercel's free plan is for non-commercial use only (see TECH.md).

## Known gaps

- No automated browser tests in the repository.
- The JavaScript bundle is about 800 kB (Recharts). Fine for a demo; code-splitting would cut it.
- A project is assumed to belong to one team. If its items name several, the first alphabetically is used.
- The mock provider only knows the synthetic projects. Importing any other file and judging it gives an error per project until a real model is set.
