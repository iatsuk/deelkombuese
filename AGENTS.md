# Repository instructions

Read `docs/architecture.md` before structural changes and the relevant language, provisioning, analytics or publishing document before changing that feature. Keep internal documentation, comments and code identifiers in English. Russian product copy remains the editorial source; preserve complete English and German display coverage.

Preserve stable product/recipe IDs, persisted choices and canonical numeric units. Domain modules cannot access the DOM, browser storage, network or presentation modules. Keep views independent of the browser controller and render PNGs from immutable prepared snapshots. Prefer small functions and data objects; add abstractions only for a concrete current requirement.

Analytics is owned by the sibling `web-analytics` repository. Synchronise the shared adapter rather than creating a divergent collector. Never log or commit secrets, visitor data, local browser state, generated reports or private configuration.

Run `pnpm check`, `pnpm test`, `pnpm format:check` and `pnpm build:pages` for relevant structural or language changes, with browser verification of affected interactions. Normal builds and checks must not download translations. Update the corresponding English documentation when changing a contract.
