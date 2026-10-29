# Design system

Smart Galley shares its visual language with deelstuff 2027: warm paper, deep-sea ink, a copper accent, Literata for display type and Golos Text for interface text. The 2027 redesign follows the «cook's book» direction chosen by the owner: generators become chapters, recipes read like printed cookbook pages and the interface avoids decorative template devices.

## Colour tokens

`src/tokens.css` owns every colour. Rules use role tokens such as `--paper`, `--card`, `--surface`, `--ink`, `--sea`, `--muted`, `--faint`, `--line`, `--accent` and `--copper`, never literal colours. Each token is a `light-dark()` pair, so a rule written once works in both themes. Text and icons on an `--ink` or `--sea` fill use `--on-ink`; shadows mix `--shadow`, which stays dark in the night theme.

Recipe tones (`green`, `red`, `gold`, `brown`) map to `--sea-bg`/`--sea-mid`, `--red-bg`/`--copper`, `--gold-bg`/`--gold` and `--brown-bg`/`--brown`. Earlier olive and khaki tints were deliberately replaced by neutral warm surfaces. `--green`, `--soft` and `--sand` remain as aliases for older rules; new rules use the role names.

Browsers without `light-dark()` receive the light values from the `@supports` fallback block.

## Themes

The system colour scheme applies by default. The header switch (`src/theme.js`) pins the opposite of the theme currently shown and stores it as `deelkombuese.theme`. `theme-preference.js` is a classic script in `<head>` that applies the stored choice before the first paint; the generated legal pages load it too. Storage failures leave the system theme in place.

PNG recipe cards keep their light print palette regardless of the page theme.

## Type

Interface text starts at 15–16 px; supporting labels use 12–14 px and nothing is set below 11 px. Headings use Literata at regular weight in a single colour. Numbers in tables use tabular figures where quantities are compared.

## Avoided devices

These were rejected for deelstuff and are not used here:

- two-colour or italic accent words inside headlines;
- uppercase, letter-spaced eyebrow labels and decorative section numbering such as «01 / …»;
- a ↗ arrow on every card or internal link (it is kept only for links that open another site);
- decorative sidebar notes and olive/khaki tints.

Labels are sentence case in every language. When a label changes, its Russian source becomes a new catalogue key, so English and German entries are added in the same change.

## Recipe page

`ui/recipe-dialog.js` renders a recipe as a cookbook page, and `src/recipe-page.css` owns its layout. The heading carries a small kicker (cooking vessel, shore or breakfast), the title and the lead. A margin column lists the facts a cook needs before reading — time, time at the stove, yield, water, equipment and satiety — followed by the favourite and PNG buttons; on wide screens it stays in view while the page scrolls. The main column holds notices, variants, pack planning, ingredients with dotted leaders and right-aligned quantities, preparation tips and the numbered method.

The recipe opens in the shared `#detail` dialog with the `recipe-sheet` class, which widens it to a page. Product and source notes keep the narrow drawer. Below 760 px the facts become a two-column block above the content. The markup does not depend on the dialog, so the same page can later be rendered as a standalone URL.

## Chapters

Generators are the chapters of the cookbook (`#generators`). The contents page lists each chapter with its number, title, formula and known dishes. A chapter page (`#generators/<slug>`) has a heading and a short paragraph on the principle, then the sentence builder: single-choice options — the base, the sauce, the filling — are underlined selects inside a sentence such as «Приготовить [пасту] [в томатном соусе] [с тунцом]». Options that can be combined stay as toggles below it, and known dishes are links that set the whole combination. The resulting recipe follows as a cookbook page with «Получится» above its title; the variants block of the recipe sheet is omitted because the sentence replaces it.

Option phrases (`phrase` on bases and modules) are written to fit the sentence grammatically; labels keep serving buttons and lists. An option a rule blocks is disabled, and a blocked toggle explains its reason when pressed.

## Layout

`src/shell.css` owns the header and footer: brand, section pills, the sea/shore switch, the theme switch and the language selector. Below 1180 px the section pills move to their own row; below 680 px they scroll horizontally under the brand row. Page sections keep their own stylesheet rules in `styles.css`, `features.css` and `visuals.css`.
