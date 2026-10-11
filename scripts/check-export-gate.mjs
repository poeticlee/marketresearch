// Fails the build if export files are created outside the export gate.
// Works without git and on Windows: walks apps/ and packages/ for export-creation patterns.
import * as fs from 'fs';
import * as path from 'path';
const roots = ['apps', 'packages'];
const allow = ['apps/worker/src/export.ts', 'scripts/check-export-gate.mjs'];
const patterns = [/toCsv\s*\(/, /\.xlsx\b/, /createObjectURL/];
const hits = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === '.next' || e.name === 'dist') continue; walk(p); }
    else if (/\.(ts|tsx|js|mjs)$/.test(e.name)) {
      const rel = p.replace(/\\/g, '/');
      if (allow.some((a) => rel.endsWith(a))) continue;
      const text = fs.readFileSync(p, 'utf8');
      for (const re of patterns) if (re.test(text)) hits.push(rel + ' matched ' + re.source);
    }
  }
}
for (const r of roots) if (fs.existsSync(r)) walk(r);
if (hits.length) { console.error('Export created outside gate:\n' + hits.join('\n')); process.exit(1); }
console.log('export-gate check ok');
