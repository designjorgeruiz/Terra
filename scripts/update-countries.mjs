#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const cwd = process.cwd();
const outPath = path.join(cwd, 'data', 'countries.json');
const jsOutPath = path.join(cwd, 'data', 'countries-data.js');
const seedPath = path.join(cwd, 'data', 'country-seeds.json');
const metaPath = path.join(cwd, 'data', 'country-meta.json');

const [seedRaw, metaRaw] = await Promise.all([
  fs.readFile(seedPath, 'utf8').catch(() => '[]'),
  fs.readFile(metaPath, 'utf8').catch(() => '{}'),
]);

const seedData = JSON.parse(seedRaw);
const metaData = JSON.parse(metaRaw);
const seedByCode = new Map(seedData.map(c => [c.code3, c]));

function normalizeRegion(apiCountry) {
  const region = apiCountry?.region || '';
  const subregion = apiCountry?.subregion || '';
  if (region === 'Americas') {
    if (subregion === 'South America') return 'South America';
    return 'North America';
  }
  return region || subregion || 'Other';
}

function joinObjectValues(obj) {
  return Object.values(obj || {}).map(v => v?.name || v).filter(Boolean).join(', ');
}

function makeGenericFacts(country) {
  return [
    `${country.name} is in ${country.region || 'the world map'}.`,
    `Capital: ${country.capital || '—'}.`,
    `Population: ${Number(country.pop || 0).toLocaleString()}.`,
    `Area: ${Number(country.area || 0).toLocaleString()} km².`,
    `Languages: ${country.language || '—'}; currency: ${country.currency || '—'}.`,
  ];
}

function buildRecord(apiCountry) {
  const seed = seedByCode.get(apiCountry.cca3) || {};
  const languages = joinObjectValues(apiCountry.languages);
  const currency = joinObjectValues(apiCountry.currencies);
  const latlng = Array.isArray(apiCountry.latlng) ? apiCountry.latlng : [];
  const region = normalizeRegion(apiCountry);
  const name = seed.name || apiCountry?.name?.common || apiCountry?.name?.official || apiCountry.cca3;
  const alpha2 = (apiCountry.cca2 || '').toString().toLowerCase();
  const country = {
    name,
    code3: apiCountry.cca3,
    alpha2,
    flagSvg: apiCountry?.flags?.svg || '',
    flagPng: apiCountry?.flags?.png || '',
    flag: seed.flag || '🌍',
    capital: seed.capital || apiCountry.capital?.[0] || '—',
    pop: seed.pop || apiCountry.population || 0,
    area: seed.area || apiCountry.area || 0,
    currency: seed.currency || currency || '—',
    region: seed.region || region,
    lat: seed.lat ?? latlng[0] ?? 0,
    lon: seed.lon ?? latlng[1] ?? 0,
    language: seed.language || languages || '—',
    demonym: seed.demonym || apiCountry?.demonym || name,
    calendar: seed.calendar || metaData[apiCountry.cca3]?.calendar || 'Gregorian',
    alphabet: seed.alphabet || metaData[apiCountry.cca3]?.alphabet || 'Latin alphabet: A, B, C',
    alphabetExample: seed.alphabetExample || metaData[apiCountry.cca3]?.alphabetExample || 'Examples: A, B, C',
    facts: seed.facts || makeGenericFacts({
      name,
      region: seed.region || region,
      capital: seed.capital || apiCountry.capital?.[0] || '—',
      pop: seed.pop || apiCountry.population || 0,
      area: seed.area || apiCountry.area || 0,
      language: seed.language || languages || '—',
      currency: seed.currency || currency || '—',
    }),
  };
  return country;
}

const [coreRes, enrichRes] = await Promise.all([
  fetch('https://restcountries.com/v3.1/all?fields=name,cca2,cca3,capital,region,subregion,population,area,latlng,unMember'),
  fetch('https://restcountries.com/v3.1/all?fields=cca3,languages,currencies,flags'),
]);
if (!coreRes.ok) throw new Error(`Failed to fetch core countries: ${coreRes.status} ${coreRes.statusText}`);
if (!enrichRes.ok) throw new Error(`Failed to fetch enriched countries: ${enrichRes.status} ${enrichRes.statusText}`);
const [core, enrich] = await Promise.all([coreRes.json(), enrichRes.json()]);
const enrichByCode = new Map(enrich.map(c => [c.cca3, c]));

const countries = core
  .filter(c => c.unMember || c.cca3 === 'VAT' || c.cca3 === 'PSE')
  .map(c => buildRecord({...c, ...(enrichByCode.get(c.cca3) || {})}))
  .sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));

if (countries.length === 194) {
  countries.push({
    name: 'Kosovo',
    code3: 'XKX',
    alpha2: 'xk',
    flagSvg: 'https://flagcdn.com/xk.svg',
    flagPng: 'https://flagcdn.com/w320/xk.png',
    flag: '🇽🇰',
    capital: 'Pristina',
    pop: 1800000,
    area: 10887,
    currency: 'Euro',
    region: 'Europe',
    lat: 42.67,
    lon: 21.17,
    language: 'Albanian, Serbian',
    demonym: 'Kosovar',
    calendar: 'Gregorian',
    alphabet: 'Latin alphabet: A, B, C',
    alphabetExample: 'Examples: A, B, C',
    facts: [
      'Declared independence in 2008',
      'Pristina is the largest city and capital',
      'Uses the euro despite not being in the EU',
      'The country is known for its mountain landscapes and monasteries',
      'It is recognized by many countries, though not universally',
    ],
  });
}

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, JSON.stringify(countries, null, 2) + '\n', 'utf8');
await fs.writeFile(jsOutPath, `window.TERRA_COUNTRIES_DATA = ${JSON.stringify(countries)};\n`, 'utf8');
console.log(`Wrote ${countries.length} countries to ${outPath}`);
