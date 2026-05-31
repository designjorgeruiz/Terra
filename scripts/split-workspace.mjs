#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const cwd = process.cwd();
const htmlPath = path.join(cwd, 'Terra_Globe_V2.html');
const html = await fs.readFile(htmlPath, 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) throw new Error('Style block not found');
await fs.writeFile(path.join(cwd, 'terra_globe_v2.css'), styleMatch[1].trim() + '\n', 'utf8');

const seedMatch = html.match(/const COUNTRY_SEED_DATA = (\[[\s\S]*?\]);\n\nconst COUNTRY_META = \{/);
if (!seedMatch) throw new Error('COUNTRY_SEED_DATA block not found');
const seedData = new Function(`return ${seedMatch[1]};`)();

await fs.mkdir(path.join(cwd, 'data'), { recursive: true });
await fs.writeFile(path.join(cwd, 'data', 'country-seeds.json'), JSON.stringify(seedData, null, 2) + '\n', 'utf8');

const metaMatch = html.match(/const COUNTRY_META = (\{[\s\S]*?\});\n\nlet COUNTRIES = \[];/);
if (!metaMatch) throw new Error('COUNTRY_META block not found');
const countryMeta = new Function(`return ${metaMatch[1]};`)();
await fs.writeFile(path.join(cwd, 'data', 'country-meta.json'), JSON.stringify(countryMeta, null, 2) + '\n', 'utf8');

await fs.mkdir(path.join(cwd, 'assets', 'flags'), { recursive: true });
await fs.writeFile(
  path.join(cwd, 'assets', 'flags', 'README.md'),
  [
    '# Flags cache',
    '',
    'This folder is intended to store local SVG copies of country flags.',
    '',
    'Run `node scripts/sync-flags.mjs` to download the current ISO alpha-2 flag set from FlagCDN.',
    '',
  ].join('\n'),
  'utf8'
);
await fs.writeFile(path.join(cwd, 'assets', 'flags', '.gitkeep'), '', 'utf8');

await fs.mkdir(path.join(cwd, 'scripts'), { recursive: true });
await fs.writeFile(
  path.join(cwd, 'scripts', 'sync-flags.mjs'),
  [
    '#!/usr/bin/env node',
    "import fs from 'fs/promises';",
    "import path from 'path';",
    '',
    "const outDir = path.resolve(process.cwd(), 'assets/flags');",
    'await fs.mkdir(outDir, { recursive: true });',
    '',
    "const res = await fetch('https://restcountries.com/v3.1/all?fields=cca2,cca3');",
    "if (!res.ok) throw new Error(`Failed to fetch country list: ${res.status} ${res.statusText}`);",
    'const countries = await res.json();',
    '',
    'for (const country of countries) {',
    "  const code = String(country.cca2 || '').toLowerCase();",
    '  if (!code) continue;',
    '  const flagRes = await fetch(`https://flagcdn.com/${code}.svg`);',
    '  if (!flagRes.ok) continue;',
    '  const svg = await flagRes.text();',
    "  await fs.writeFile(path.join(outDir, `${code}.svg`), svg, 'utf8');",
    '}',
    '',
    "console.log('Flags synced to assets/flags');",
    '',
  ].join('\n'),
  'utf8'
);

await fs.writeFile(
  path.join(cwd, 'README.md'),
  [
    '# Terra Globe V2',
    '',
    'Project layout:',
    '',
    '- `Terra_Globe_V2.html`: main runnable app.',
    '- `terra_globe_v2.css`: exported stylesheet for easier editing.',
    '- `data/countries.json`: full 195-country dataset used by the app.',
    '- `data/countries-data.js`: browser-loadable wrapper around the country dataset.',
    '- `data/country-seeds.json`: curated seed data used to enrich countries.',
    '- `data/country-meta.json`: language, demonym, calendar, and alphabet metadata.',
    '- `assets/flags/`: local cache for downloaded SVG flags.',
    '- `scripts/sync-flags.mjs`: helper to populate the flag cache from FlagCDN.',
    '- `scripts/update-countries.mjs`: refreshes `data/countries.json` from REST Countries.',
    '',
    'Run `node scripts/split-workspace.mjs` again whenever you want to refresh the extracted files from the HTML.',
    'Run `node scripts/update-countries.mjs` whenever you want to regenerate the country dataset.',
    '',
  ].join('\n'),
  'utf8'
);

console.log('Workspace split files created.');
