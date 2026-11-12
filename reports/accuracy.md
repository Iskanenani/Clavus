# Clavus accuracy report

- Generated: 2026-11-12T06:44:42.857Z
- Provider: mock
- Projects in the answer key: 60
- Verdicts stored: 60

## Overall: 60 of 60 correct (100.0%)

A project is correct when the verdict matches the answer key and, for
`serves` and `contradicts`, the right priority or non-goal is named.
Human overrides are ignored: this measures the model alone.

## By planted case

| Case | Projects | Correct | Accuracy |
|---|---|---|---|
| Clear match | 22 | 22 | 100.0% |
| Different words | 10 | 10 | 100.0% |
| Label only | 6 | 6 | 100.0% |
| No priority | 11 | 11 | 100.0% |
| Contradiction | 7 | 7 | 100.0% |
| Ambiguous | 4 | 4 | 100.0% |

The ambiguous cases are a matter of judgement by design (see data/README.md).

## Misses: 0

None.
