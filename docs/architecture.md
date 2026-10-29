# Architecture and maintenance

Smart Galley is a static ES-module application. The browser owns user state, rendering and PNG downloads; there is no application server or database. The development server and GitHub Actions are delivery tools, not runtime dependencies.

## Dependency direction

```mermaid
flowchart TD
  App[app.js: browser controller] --> State[state/: persistence and session defaults]
  App --> UI[ui/: catalogue, views and recipe dialog]
  App --> Export[export/: recipe snapshot and PNG renderer]
  App --> Browser[i18n/browser.js: browser integration]
  UI --> Domain[model.js and planner.js]
  UI --> I18n[i18n/runtime.js and messages.js]
  Domain --> Data[data.js: catalogue assembly]
  Domain --> Cooking[cooking-guide.js and generator-engine.js]
  Data --> Definitions[catalog/: recipe definitions]
  Export --> Domain
  Export --> Visuals[cooking-visuals.js: action metadata]
  I18n --> Catalogues[locales/: checked-in display messages]
```

The diagram shows responsibilities, not every import. `pnpm check:architecture` verifies actual imports, rejects cycles and undefined names, reports unused imports, and enforces the boundaries below.

## Ownership and public entry points

| Concern                           | Owner                                                             | Contract                                                                                                                                               |
| --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Product and recipe identity       | `data.js`, `catalog/`, `recipe-library.js`                        | Stable IDs and canonical units; no DOM, network or locale access                                                                                       |
| Recipe calculations               | `model.js`                                                        | `prepareRecipe`, substitutions, whole packs, filtering and shopping aggregation                                                                        |
| Cooking techniques                | `cooking-guide.js`, `generator-engine.js`                         | Water absorption, generator bases, rules, names and phase-ordered steps; no presentation                                                               |
| Passage and seasonal provisioning | `planner.js`                                                      | Deterministic menus, retail rounding, usage and water budgets                                                                                          |
| Configured favourites             | `preferences.js`                                                  | Normalised selections, per-variant keys for generators and legacy recipe migrations                                                                    |
| Persistence                       | `state/storage.js`                                                | Storage is injected; corrupt or unavailable storage does not prevent use                                                                               |
| Session defaults and routes       | `state/session.js`                                                | `createAppState`, `parseRoute` and `routeHash`; chapter links carry base, modules and swaps; `pagePath` and `parsePagePath` name the prerendered pages |
| UI catalogue                      | `ui/catalog.js`                                                   | Shared cards, selection-aware filtering, search and shopping selectors                                                                                 |
| Page rendering                    | `ui/views/`                                                       | One module per primary section, with explicit state/catalogue inputs                                                                                   |
| Generator chapters                | `ui/views/generators.js`, `chapters.css`                          | Contents and chapter pages; the chapter keeps its own selection in the controller                                                                      |
| Recipe detail                     | `ui/recipe-dialog.js`, `recipe-page.css`                          | Cookbook-page presentation of an already prepared recipe; actions remain in the controller                                                             |
| Graph geometry                    | `ui/graph.js`                                                     | DOM measurement and SVG connections only                                                                                                               |
| SVG and display formatting        | `ui/icons.js`, `ui/format.js`, `ui/water.js`                      | Shared visual vocabulary and locale-aware display                                                                                                      |
| Colour roles and site frame       | `tokens.css`, `shell.css`                                         | Light/dark colour tokens; header and footer layout (see [design](design.md))                                                                           |
| Language policy                   | `i18n/locale.js`                                                  | Pure precedence and shareable language URLs                                                                                                            |
| Display translation               | `i18n/messages.js`, `runtime.js`, `html.js`                       | Exact messages and parameter patterns; only public text and accessible labels change                                                                   |
| Browser language integration      | `i18n/browser.js`                                                 | Reads preferences, loads a catalogue and exposes the selector                                                                                          |
| Theme switch                      | `theme.js`, root `theme-preference.js`                            | Pins light or dark on `<html>`; the early script applies the saved choice before paint                                                                 |
| PNG snapshot                      | `export/recipe-card.js`, `i18n/recipe-card.js`                    | Captures the selected recipe before asynchronous rendering, then localises display fields                                                              |
| PNG drawing                       | `export/png.js`                                                   | Reads a complete snapshot; never reads application state, the product catalogue or storage                                                             |
| Shopping text                     | `export/shopping-list.js`                                         | Pure text export with explicit plan/items and translator/language inputs                                                                               |
| Compatibility exports             | `recipe-export.js`                                                | Keeps the previous import path working without duplicating implementation                                                                              |
| Analytics                         | root `site-analytics.js`                                          | Byte-identical copy of the authoritative `web-analytics` adapter                                                                                       |
| Legal pages and offline manifest  | `scripts/legal-pages.mjs`, `offline-assets.mjs`                   | Deterministic generation from checked-in inputs                                                                                                        |
| Pages for search                  | `scripts/static-pages.mjs`, `ui/shell.js`, `ui/product-detail.js` | Prerenders every chapter, dish, standalone recipe and product in every language with the app's own views, plus `sitemap.xml` and `robots.txt`          |

## Architectural rules

- **ARCH-01 — Domain independence.** Domain and catalogue modules cannot import UI, browser integration, persistence or exports, and cannot access browser globals or fetch resources. Generator definitions in `catalog/generators/` describe options, rules, dish names and phase-ordered steps; `generator-engine.js` owns the shared algorithm and never names a particular generator.
- **ARCH-02 — No reverse controller dependencies.** Views cannot import `app.js`. The controller owns browser events and delegates rendering and calculations through small explicit interfaces.
- **ARCH-03 — Snapshot exports.** The PNG renderer receives prepared display data. Changing a selection while a download is being created cannot alter that download.
- **ARCH-04 — Locale is presentation.** Never translate IDs, option values, `data-*` attributes, stored units, recipe choices or numeric measurements. Browser integration is isolated from the pure translator and locale policy.
- **ARCH-05 — Checked dependencies.** Imports must be acyclic. New unresolved names and unused imports fail the architecture gate.
- **ARCH-07 — Pages first, app as enhancement.** Every chapter, dish, standalone recipe and product has a real page: Russian at the site root, other languages under `en/` and `de/` (`generators/<chapter>/<dish>/`, `recipes/<id>/`, `products/<id>/`). A page carries its full text, a canonical link, `hreflang` alternates with `x-default` (English), Open Graph tags and, for dishes and recipes, schema.org `Recipe` data. Its `<base>` points at the site root, so assets and the app's hash links resolve there. The app boots on any page and opens its view; recipe and product drawers take their page address with `pushState` and give it back when they close. Hash links never reload the document, old hash links and `?lang=` keep working, and the language switch leads to the sibling page.
- **ARCH-06 — Static delivery.** Only explicitly allowlisted runtime files enter `dist/`. Tests, documentation, development scripts, Git metadata and credentials are excluded.

## Applying design principles

KISS and YAGNI take precedence over speculative extensibility. Use plain functions, data objects and direct ES-module imports. Do not introduce a service container, event bus, class hierarchy or framework to support hypothetical features.

GRASP's Information Expert places quantities, pack scaling and water rules beside the domain data and calculations. The browser controller coordinates events; views have high cohesion around a single section. Persistence and translation are adapters rather than hidden dependencies of recipe calculations.

GoF patterns are tools, not a compliance checklist. The existing cooking-technique functions provide a small strategy-like variation point; the export snapshot separates preparation from rendering. Extra factories, observers and abstract base classes would add indirection without solving a current problem.

Clean Code here means descriptive ownership, readable formatting, explicit inputs, short comments for policy and units, and tests of meaningful outcomes. A rendering template may be long because it describes a full section; split it when a part has an independent responsibility, not merely to meet an arbitrary line count.

## Editing a feature in isolation

- A product or dish: start in `data.js` or its `catalog/` definition and update both language catalogues. Preserve its ID.
- Pack or water behaviour: edit `model.js`, the relevant cooking technique or `planner.js`; verify the affected quantities and generated steps.
- A page layout: edit its `ui/views/` module and stylesheet. It should not require changes to persistence or recipe calculations.
- Language behaviour: use `i18n/locale.js` and `browser.js`; wording belongs in `locales/`, with numeric/placeholder coverage tests.
- A PNG layout: use `export/png.js`. The renderer must continue to work solely from its snapshot.
- Analytics: update the independent shared source first, then synchronise website copies; see [analytics](analytics.md).

## Verification

Run `pnpm check`, `pnpm test`, `pnpm format:check` and `pnpm build:pages`. Tests cover domain outcomes, storage failures, language precedence, translated recipe variants, immutable numeric data, analytics privacy gates and the static package. Browser checks cover the actual language selector, translated search, favourites, PNG downloads and responsive layouts. Static checks do not establish editorial or legal accuracy.
