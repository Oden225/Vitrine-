// Enregistre le film d'une page UI Story en vidéo verticale + horodatage des temps forts (pour le son).
// Usage : node record.mjs --url http://localhost:8080/demo.html?video=1 --seconds 20 --out sortie/
// La page doit appeler createUIStory(..., { onCue: (n) => (window.__cues ||= []).push([n, performance.now()]) }).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// Playwright local au projet, sinon installation globale
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import(path.join(execSync('npm root -g').toString().trim(), 'playwright/index.mjs'))); }

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, a) => (v.startsWith('--') && acc.push([v.slice(2), a[i + 1]]), acc), []));
const url = args.url, seconds = +(args.seconds || 20), out = args.out || 'sortie';
const W = +(args.width || 1080), H = +(args.height || 1920);
if (!url) { console.error('--url manquant'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const context = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: out, size: { width: W, height: H } } });
const page = await context.newPage();
const t0 = Date.now();
await page.goto(url);
const origin = await page.evaluate(() => performance.timeOrigin);
await page.waitForTimeout(seconds * 1000);
const cues = await page.evaluate(() => window.__cues || []);
const video = page.video();
await context.close();
await browser.close();
const webm = await video.path();
fs.renameSync(webm, path.join(out, 'film.webm'));
// décalage entre le début de la vidéo et l'origine des horloges de la page
const offset = (origin - t0) / 1000;
fs.writeFileSync(path.join(out, 'cues.json'), JSON.stringify({ offset, cues: cues.map(([n, t]) => [n, +(t / 1000 + offset).toFixed(3)]) }, null, 1));
console.log(`film.webm + cues.json (${cues.length} temps forts) dans ${out}`);
