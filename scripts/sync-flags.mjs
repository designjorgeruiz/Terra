#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const outDir = path.resolve(process.cwd(), 'assets/flags');
await fs.mkdir(outDir, { recursive: true });

const res = await fetch('https://restcountries.com/v3.1/all?fields=cca2,cca3');
if (!res.ok) throw new Error(`Failed to fetch country list: ${res.status} ${res.statusText}`);
const countries = await res.json();

for (const country of countries) {
  const code = String(country.cca2 || '').toLowerCase();
  if (!code) continue;
  const flagRes = await fetch(`https://flagcdn.com/${code}.svg`);
  if (!flagRes.ok) continue;
  const svg = await flagRes.text();
  await fs.writeFile(path.join(outDir, `${code}.svg`), svg, 'utf8');
}

console.log('Flags synced to assets/flags');
