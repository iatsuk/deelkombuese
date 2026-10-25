# Analytics integration

The app uses the existing self-hosted GoatCounter instance at `https://stats.deelstuff.com`. The independent sibling `web-analytics` repository owns the shared tracker, approved hosts, collector gateway, dashboard filters, reports and deployment. The neighbouring deelstuff project documents the same integration under ANALYTICS-01.

## Collection

`site-analytics.js` is a byte-identical copy of `web-analytics/tracker/site-analytics.js`. The approved host is `kombuese.deelstuff.com`, and visit paths use the prefix `/kombuese.deelstuff.com/` in the shared dashboard.

The adapter counts one visible page load, not every filter interaction or hash change. It requires production HTTPS and skips localhost, unknown hosts, automated browsers, frames and legal pages. It respects Do Not Track, Global Privacy Control and the local owner opt-out.

Only the public path/title and external referrer's origin are included. Query parameters, fragments, full referrer paths, pantry contents, favourites, selected ingredients and shopping lists are not sent. The app's language query is not an analytics identifier.

Open `#analytics-disable` to store `analytics.disabled=true`; use `#analytics-enable` to remove that setting. The application continues to work when collection is blocked.

## Shared configuration

Adding this site requires all of the following, not just a script tag:

1. Add the exact HTTPS hostname to the shared adapter.
2. Add the site ID/domain/prefix to `web-analytics/config/sites.json`.
3. Permit its exact referrer origin at the collector gateway.
4. Add a domain-filtered dashboard view and record the actual activation instant for report coverage.
5. Synchronise website copies and publish this app's updated privacy notice.

Keep COLLECT-01, METRIC-01, GAP-01 and SECURITY-01 intact. A site's pre-activation period is missing data, not zero visits. Reports describe page visits, not exact unique people. Do not change credentials or the existing Telegram recipient and do not send a manual report as an integration test.

## Verification

The local VM test exercises the production allowlist, DNT/GPC, opt-out, privacy-safe URLs and automation exclusions without recording real visits. Production verification checks the published tracker and gateway policy without inventing visitor traffic. The collector remains on the existing VPS; the application itself stays on GitHub Pages.
