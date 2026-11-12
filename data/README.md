# Synthetic dataset

Everything here is invented. No real company, customer or person is described.

## The company

**Tessel** sells payment and invoicing software to small independent retailers in Europe. It has about 450 staff and 38,000 merchants. Its strategy ([strategy.md](strategy.md)) has five priorities and three "will not do" items:

| ID | Kind | In short |
|---|---|---|
| `germany-france` | Priority | Win Germany and France |
| `reliability` | Priority | Payments available 99.95% of the time |
| `self-service` | Priority | Merchants set up without talking to staff |
| `partners` | Priority | Grow through accountants and resellers |
| `retention` | Priority | Halve first-year merchant churn |
| `no-bespoke` | Non-goal | No features for a single customer |
| `no-outside-europe` | Non-goal | No selling outside Europe |
| `no-hardware` | Non-goal | No own payment hardware |

## The files

| File | Holds |
|---|---|
| `strategy.md` | The strategy text. Every quote in the answer key appears in it word for word. |
| `work_items.csv` | 494 work items in 60 projects across 5 teams, in the common format. |
| `work_items_other_shape.csv` | The same items as a tracker might export them: other column names, another order, one extra column (`Issue Key`). Used to test the mapping screen. |
| `answer_key.csv` | The expected verdict for every project, with the planted case, the quote and a reason. |

Column mapping for the second file: `Summary` → title, `Details` → description, `Epic Name` → parent, `Squad` → team, `Estimate` → effort, `State` → status.

**Effort units differ by team.** The two engineering teams estimate in story points, the other three in hours. This is deliberate: it is why the map compares teams by number of items only.

Each project has four or five items that say what it is for, plus three to five routine ones ("Kickoff meeting", "Add automated tests") with no description. The routine items are the reason Clavus judges projects and not single items.

## The planted cases

| Case (`case` column) | Projects | Expected verdict | What it tests |
|---|---|---|---|
| `clear-match` | 22 | `serves` | A project that plainly serves a priority |
| `different-words` | 10 | `serves` | Serves a priority without its vocabulary, e.g. "Project Rhine" hires in Munich and never says "Germany" |
| `label-only` | 6 | 5 `none`, 1 `contradicts` | The title names a priority, the work does something else, e.g. "Retention: employee engagement survey" is about staff, not merchants |
| `no-priority` | 11 | `none` | Reasonable work that serves nothing stated, e.g. an office move |
| `contradiction` | 7 | `contradicts` | Five inside a non-goal, two against a priority ("Saturday maintenance windows", "Mandatory onboarding call") |
| `ambiguous` | 4 | `unclear` | The strategy cannot settle it, e.g. a pilot in Switzerland and Austria when the priority names Germany and France |

Totals by expected verdict: 32 `serves`, 16 `none`, 8 `contradicts`, 4 `unclear`.

Two traps worth knowing when reading results:

- "France launch: Québec pilot" is label-only **and** a contradiction: the title borrows a priority, the work sells in Canada.
- "Dubai reseller agreement" uses the partner vocabulary but sells outside Europe.

The ambiguous cases are a matter of judgement by design. A model that answers `none` or `contradicts` on one of them is not obviously wrong, and the accuracy report lists them separately for that reason.

## Regenerating

The CSV files are generated, so do not edit them by hand. Edit the projects in [`scripts/dataset/projects.mjs`](../scripts/dataset/projects.mjs), then run:

```sh
npm run data
```

The script is deterministic (same input, same files) and stops if a quote is not found word for word in `strategy.md`.
