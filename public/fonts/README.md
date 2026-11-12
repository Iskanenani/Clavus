# Local fonts

These are the free font substitutes recommended by the Attio reference in the repository's `DESIGN.md`. They are served locally rather than requested from a font service.

| File | Family | Upstream |
|---|---|---|
| `inter-latin.woff2` | Inter | https://github.com/google/fonts/tree/main/ofl/inter |
| `inter-tight-latin.woff2` | Inter Tight | https://github.com/google/fonts/tree/main/ofl/intertight |
| `source-serif-latin.woff2` | Source Serif 4 | https://github.com/google/fonts/tree/main/ofl/sourceserif4 |

The upstream variable TTFs were subset with FontTools and compressed to WOFF2. Subsets include Latin and Latin Extended characters, punctuation, the euro symbol, and the small set of arrows/check marks used by the interface. OpenType layout features are retained, including Inter's `ss03` alternates. Inter provides the UI type; Inter Tight supplies the display voice; Source Serif 4 appears only in strategy quotations.

Each family's SIL Open Font License is included in this directory. Add another language's glyph range if the interface is translated beyond the current English and French names.
