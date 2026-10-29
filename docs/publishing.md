# Publishing

The app is served by GitHub Pages from the public [iatsuk/deelkombuese](https://github.com/iatsuk/deelkombuese) repository. Its production address is <https://kombuese.deelstuff.com/>. The main deelstuff website and analytics collector retain their existing VPS hosting; this app needs no VPS.

## Build and deployment

Install the pinned development dependencies with `pnpm install --frozen-lockfile`. `pnpm build:pages` generates legal editions, the pages for search engines (`scripts/static-pages.mjs`: every chapter, dish, standalone recipe and product in Russian, English and German, with `sitemap.xml` and `robots.txt` for `https://kombuese.deelstuff.com/`) and a content-hashed offline asset manifest, then copies only the runtime allowlist into `dist/`. `pnpm start` generates the same files at the repository root for local use; they are ignored by Git.

The offline cache holds the app and the chapter pages in every language. Dish, recipe and product pages are cached when visited; a page never visited opens the app root offline on the page's language and view.

The allowlist includes application HTML/modules/styles, local fonts, images, translation catalogues, generated legal pages, the shared analytics adapter and service worker. Git metadata, tests, development scripts, documentation and private configuration are excluded. No translations are downloaded during a build.

`.github/workflows/pages.yml` installs the pinned package manager/dependencies, checks source architecture and translations, runs tests, builds the static package and deploys it through GitHub Pages. The Pages source is GitHub Actions. Relative asset paths support the custom hostname and the project path.

## DNS and HTTPS

The domain uses Namecheap's `registrar-servers.com` nameservers. The required record is:

| Type  | Host       | Target             | TTL       |
| ----- | ---------- | ------------------ | --------- |
| CNAME | `kombuese` | `iatsuk.github.io` | Automatic |

Do not include `https://` or `/deelkombuese` in the target. Do not change the apex domain's existing VPS records. In Namecheap, use Domain List → Manage → Advanced DNS → Host Records.

Assign `kombuese.deelstuff.com` in repository Settings → Pages before pointing DNS at GitHub. After DNS resolves, wait for GitHub's certificate and enable Enforce HTTPS. A cached NXDOMAIN response can outlive a newly added record: compare authoritative nameservers with public resolvers before changing a correct record.

```sh
dig @dns1.registrar-servers.com kombuese.deelstuff.com CNAME
dig @1.1.1.1 kombuese.deelstuff.com CNAME
curl -I https://kombuese.deelstuff.com/
```

A custom GitHub Actions deployment does not need a source `CNAME` file. The hostname is owned by the Pages setting. Confirm domain ownership through GitHub's account Pages settings with its unique TXT value; never invent the value.

## Release verification and rollback

Verify the workflow result, production HTML and assets, language links, legal pages, PNG download and the published `site-analytics.js`. Automated browser checks intentionally do not count as analytics traffic. Run collection gateway checks separately, without manufacturing page visits.

Deploying a known previous commit through the same workflow restores its static assets. Browser-local data is not a server backup: preserve stored IDs and migrations across releases. The content-hashed service-worker cache replaces earlier app caches, but it does not delete favourites or the provisioning plan.

## References

- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
