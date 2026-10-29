# Languages

Russian is the original editorial source. English and German are complete interface editions, including provisions, cooking instructions, configured recipe cards, shopping exports and legal pages. All editions share one application and stable recipe/product identities.

## Selection

The pure `selectLanguage` function applies this precedence:

1. An explicit supported `?lang=ru`, `?lang=en` or `?lang=de` value.
2. The stored `deelkombuese.language` preference.
3. The first supported entry in `navigator.languages`.
4. English.

The language selector retains the current query parameters and hash, so a chapter link with its base, modules and substitutions (`#generators/pasta?base=risottoRice&with=sauce-cream`) opens the same dish in every language. An explicit supported choice is remembered when storage is available; blocked storage does not prevent selecting a language through the URL. Language detection is local and is not sent to a translation service.

The interface changes `html[lang]` and translates the document title and accessible labels. Legal documents have generated language-specific paths under `impressum/` and `datenschutz/`, with links back to the matching application language.

## Translation boundary

`messages.js` is a pure exact-message translator. Checked-in `locales/en.json` and `locales/de.json` contain text and explicitly numbered parameter patterns. Parameters preserve their values and can translate independently composed labels. Product quantities have a small explicit display-unit mapping.

`html.js` translates a detached HTML fragment's text nodes and accessible labels. It does not perform global string replacement over markup. IDs, option values, links, data attributes, SVG paths and event actions remain unchanged. Domain calculations continue to use canonical source data; a translated product name never becomes a lookup key.

`runtime.js` contains only the selected presentation language and translator. It has no DOM or browser-storage access, so views can be verified in Node. `browser.js` is the browser adapter that loads the catalogue and applies the selection policy.

## PNG cards

Build the canonical selection snapshot first, then use `localizeRecipeCard`. It translates only display fields and captures action icons before translating cooking instructions. The canvas renderer consumes the resulting snapshot and never reclassifies translated prose or reads mutable application state.

Shopping text exports translate individual names, quantities and message patterns before assembling lines. The pure exporter receives its translator and language explicitly; concatenated product/menu lines must never become catalogue keys. Tests cover passage water, seasonal replenishment and independently added dishes in both translated editions.

## Maintaining wording

Edit catalogue entries by their exact source message. Changed Russian wording is a new key, so an old translation cannot silently attach to changed meaning. Preserve numbered placeholders, measurements, times and temperatures. Review food names and nautical terminology in context: passata is a tomato product, a watch is a sailing duty period, and a pantry addition is not an industrial food additive.

`extract-messages.mjs` extracts public source messages for editorial work. The optional `import-translation-drafts.mjs --online --draft` command bootstraps missing public wording through the same public translation endpoint used by the neighbouring deelstuff project. It is explicitly an editorial operation; normal startup, checks and builds never call it. It does not constitute proofreading. Product names, dish titles, critical terminology and numerical invariants receive separate corrections and checks.

`audit-rendered-translations.mjs` renders all main sections and recipe modules/substitutions without a browser, then checks for untranslated source text. Tests also ensure language precedence, URL preservation and unchanged recipe identities and quantities. Browser verification remains necessary for search, text wrapping and downloadable cards.
