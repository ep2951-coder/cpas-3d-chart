// note
// fetches the DPO-CPAS dataset from the UN Peace & Security Data Hub (https://psdata.un.org/dataset/DPO-CPAS),
// filters to "# of indicator data points entered", buckets monthly values into 
// quarters, runs a cumulative total per mission, and writes the chart-ready JSON.

const fs = require('fs');
const path = require('path');

const API_URL = 'https://api.psdata.un.org/public/data/DPO-CPAS/json';
const TARGET_INDICATOR = '# of indicator data points entered';
const OUTPUT_PATH = path.join(__dirname, '..', '3d-graph-data.json');

const MISSIONS = [
  'MINUSCA', 'MONUSCO', 'UNFICYP', 'UNMISS', 'UNIFIL', 'UNMIK',
  'UNMOGIP', 'UNTSO', 'UNISFA', 'MINURSO', 'UNDOF', 'MINUSMA',
];

async function main() {
  console.log('Fetching:', API_URL);
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`PSData API returned ${res.status}: ${res.statusText}`);
  const apiResponse = await res.json();

  let rows = apiResponse;
  if (apiResponse && Array.isArray(apiResponse.data)) rows = apiResponse.data;
  else if (apiResponse && Array.isArray(apiResponse.results)) rows = apiResponse.results;
  else if (apiResponse && Array.isArray(apiResponse.records)) rows = apiResponse.records;
  if (!Array.isArray(rows)) {
    throw new Error('Unexpected API response shape: ' + JSON.stringify(apiResponse).slice(0, 200));
  }
  console.log(`Received ${rows.length} rows total.`);
  
  const buckets = {};
  const validMissions = new Set(MISSIONS);

  let used = 0;
  rows.forEach(r => {
    if (r.indicator !== TARGET_INDICATOR) return;
    if (!validMissions.has(r.mission)) return;
    const d = new Date(r.date);
    if (isNaN(d)) return;
    const year = d.getUTCFullYear();
    const q = Math.floor(d.getUTCMonth() / 3) + 1;
    const sortKey = `${year}-Q${q}`;
    if (!buckets[sortKey]) buckets[sortKey] = {};
    buckets[sortKey][r.mission] = (buckets[sortKey][r.mission] || 0) + Number(r.value || 0);
    used++;
  });
  console.log(`Used ${used} rows matching indicator "${TARGET_INDICATOR}".`);
  const sortedKeys = Object.keys(buckets).sort();
  const running = {};
  MISSIONS.forEach(m => { running[m] = 0; });

  const output = sortedKeys.map(sortKey => {
    const [year, qPart] = sortKey.split('-');
    const row = { quarter: `${qPart} ${year}` };
    MISSIONS.forEach(m => {
      running[m] += (buckets[sortKey][m] || 0);
      row[m] = running[m];
    });
    return row;
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Wrote ${output.length} quarters to ${OUTPUT_PATH}`);
  console.log('First quarter:', output[0]);
  console.log('Last quarter:', output[output.length - 1]);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
