# Instructions for coding agents

Clavus is an early prototype that shows company leaders whether the work being done follows the strategy they set. Version 1 is built and deployed; your job is to continue from where [HANDOFF.md](HANDOFF.md) says the work stopped.

## Read these first, in this order

1. [README.md](README.md): what Clavus is and why it exists.
2. [TECH.md](TECH.md): the stack, how the pieces connect, and why each was chosen.
3. [FEATURES.md](FEATURES.md): what to build, in what order, and the check that ends each step.

4. [HANDOFF.md](HANDOFF.md): where the last session stopped, what comes next, and notes about this machine.

FEATURES.md is the plan. If it conflicts with anything you would otherwise assume, follow it.

## How to work

- Build one step of FEATURES.md at a time, in order. Later steps depend on earlier ones, and the synthetic dataset in step 1 is what everything else is tested against.
- Before moving on, run the step's "Done when" check and say plainly whether it passed.
- After each step, tell the owner what you built, what you verified, and what comes next.
- Tick the checklist in README.md as steps finish, and update TECH.md if a technical choice changes.

## Ask the owner before you

- choose or change the AI model (until then, use the mock provider described in FEATURES.md);
- change the stack or add a service;
- do anything that needs an account, a key or a payment;
- delete data or files you did not create.

The owner presents this project to a jury and has to explain every part of it, so a surprising choice costs more than a question.

## Rules that always apply

- **No secrets in the repository or in browser code.** The model key belongs in the Edge Function's secrets only.
- **Synthetic data only.** Free model tiers may use prompts for training, so never send real company information.
- **Stay on free tiers.**
- **Write code the owner can explain.** Prefer short, plain functions, and comment the reason behind anything non-obvious.
