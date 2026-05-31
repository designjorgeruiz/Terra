# Terra Globe V2

Project layout:

- `Terra_Globe_V2.html`: main runnable app.
- `terra_globe_v2.css`: exported stylesheet for easier editing.
- `data/countries.json`: full 195-country dataset used by the app.
- `data/countries-data.js`: browser-loadable wrapper around the country dataset.
- `data/country-seeds.json`: curated seed data used to enrich countries.
- `data/country-meta.json`: language, demonym, calendar, and alphabet metadata.
- `assets/flags/`: local cache for downloaded SVG flags.
- `scripts/sync-flags.mjs`: helper to populate the flag cache from FlagCDN.
- `scripts/update-countries.mjs`: refreshes `data/countries.json` from REST Countries.

Run `node scripts/split-workspace.mjs` again whenever you want to refresh the extracted files from the HTML.
Run `node scripts/update-countries.mjs` whenever you want to regenerate the country dataset.
