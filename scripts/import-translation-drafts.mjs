// Explicit editorial bootstrap only. Normal development, tests and builds are offline.
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
if (!process.argv.includes('--online') || !process.argv.includes('--draft'))
  throw new Error('Use --online --draft to translate public source messages.');
const sources = JSON.parse(readFileSync('work/messages.json', 'utf8'));
const placeholders = (text) =>
  [...text.matchAll(/\{\s*(\d+)\s*\}/g)]
    .map((m) => m[1])
    .sort()
    .join(',');
const languages = process.argv.includes('--language')
  ? [process.argv[process.argv.indexOf('--language') + 1]]
  : ['en', 'de'];
for (const language of languages) {
  const path = `locales/${language}.json`;
  const catalog = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
  const pending = sources.filter((source) => !catalog[source]);
  let batch = [],
    size = 0;
  const batches = [];
  for (const source of pending) {
    if (size + source.length > 2300 && batch.length) {
      batches.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(source);
    size += source.length + 12;
  }
  if (batch.length) batches.push(batch);
  const save = () => {
    writeFileSync(
      path + '.tmp',
      JSON.stringify(
        Object.fromEntries(Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b))),
        null,
        2,
      ) + '\n',
    );
    renameSync(path + '.tmp', path);
  };
  async function translate(messages, attempt = 0) {
    try {
      const query = new URLSearchParams({
        client: 'gtx',
        sl: 'ru',
        tl: language,
        dt: 't',
        q: messages.map((text, index) => `[${String(index).padStart(4, '0')}] ${text}`).join('\n'),
      });
      const response = await fetch('https://translate.googleapis.com/translate_a/single?' + query, {
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`Translation HTTP ${response.status}`);
      const data = await response.json();
      const text = data[0].map((part) => part[0] || '').join('');
      const matches = [...text.matchAll(/\[\s*(\d{4})\s*\]\s*([\s\S]*?)(?=\[\s*\d{4}\s*\]|$)/g)];
      if (matches.length !== messages.length) throw new Error('Message boundaries changed');
      for (const [index, match] of matches.entries()) {
        const output = match[2]
          .replace(/\s+/g, ' ')
          .replace(/\{\s*(\d+)\s*\}/g, '{$1}')
          .trim();
        if (
          Number(match[1]) !== index ||
          !output ||
          placeholders(output) !== placeholders(messages[index])
        )
          throw new Error('Translation placeholders changed');
      }
      for (const [index, match] of matches.entries())
        catalog[messages[index]] = match[2]
          .replace(/\s+/g, ' ')
          .replace(/\{\s*(\d+)\s*\}/g, '{$1}')
          .trim();
    } catch (error) {
      if (attempt < 2) {
        await translate(messages, attempt + 1);
        return;
      }
      if (messages.length > 1) {
        const middle = Math.ceil(messages.length / 2);
        await translate(messages.slice(0, middle));
        await translate(messages.slice(middle));
        return;
      }
      console.error(
        `${language}: could not draft ${JSON.stringify(messages[0])}: ${error.message}`,
      );
    }
  }
  let next = 0,
    complete = 0;
  const worker = async () => {
    while (next < batches.length) {
      const index = next++;
      await translate(batches[index]);
      complete++;
      if (complete % 10 === 0) {
        save();
        console.log(
          `${language}: ${complete}/${batches.length} batches; ${Object.keys(catalog).length} entries`,
        );
      }
    }
  };
  console.log(`${language}: ${pending.length} source messages, ${batches.length} batches`);
  try {
    await Promise.all([worker(), worker(), worker()]);
  } finally {
    save();
  }
  console.log(`${language}: saved ${Object.keys(catalog).length} entries`);
}
