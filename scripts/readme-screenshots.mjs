// Builds docs/cover.jpg for the README from the demo build.
// Usage: VITE_DEMO=true npx vite build && node scripts/readme-screenshots.mjs
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('dist');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(4173, r));

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto('http://localhost:4173/');

async function submit(values) {
  for (const [name, value] of Object.entries(values)) {
    if (name === 'productCode') await page.selectOption('select[name=productCode]', value);
    else await page.fill(`input[name=${name}]`, String(value));
  }
  await page.click('button[type=submit]');
  await page.waitForTimeout(300);
}

await submit({ applicantName: 'Bilal Ahmed', creditScore: 590 });
await submit({ applicantName: 'Sara Malik', productCode: 'AUTO', amount: 23000, termMonths: 60, monthlyIncome: 9000, propertyValue: 25000, creditScore: 720 });
await submit({ applicantName: 'Usman Tariq', productCode: 'HOME', amount: 180000, termMonths: 240, monthlyIncome: 12000, monthlyDebt: 800, propertyValue: 260000, creditScore: 745 });
await submit({ applicantName: 'Ayesha Khan', productCode: 'PERSONAL', amount: 15000, termMonths: 36, monthlyIncome: 6000, monthlyDebt: 500, creditScore: 760 });
const shot = (await page.screenshot()).toString('base64');

const chip = 'background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);padding:10px 14px;border-radius:10px';
const html = `<html><body style="margin:0;width:1200px;height:675px;background:linear-gradient(135deg,#0b2a3c,#0f4c5c 60%,#13756b);font-family:Inter,Segoe UI,Arial,sans-serif;overflow:hidden;position:relative;color:#fff">
<div style="position:absolute;left:56px;top:70px;width:380px">
<div style="color:#7dd3c0;letter-spacing:3px;font-weight:600;font-size:15px">OPEN SOURCE · REACT · TYPESCRIPT</div>
<div style="font-size:50px;font-weight:800;line-height:1.08;margin-top:16px">Loan Assessment Dashboard</div>
<div style="font-size:20px;color:#d1fae5;margin-top:16px;line-height:1.4">Instant, explainable loan decisions for a Spring Boot API</div>
<div style="margin-top:28px;display:grid;gap:10px;font-size:16px">
<div style="${chip}">Live decision with score and rule reasons</div>
<div style="${chip}">Typed API client, demo mode in the browser</div>
<div style="${chip}">Vitest + Testing Library, GitHub Pages</div>
</div>
<div style="margin-top:30px;color:#99f6e4;font-size:14px">Muzaffar Ali Hakim · github.com/MuzaffarAliChahal</div>
</div>
<div style="position:absolute;left:470px;top:50px;width:690px;border-radius:14px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.45);transform:rotate(-1.5deg)">
<img src="data:image/png;base64,${shot}" style="width:690px;display:block"/></div>
</body></html>`;

const cover = await browser.newPage({ viewport: { width: 1200, height: 675 } });
await cover.setContent(html);
await cover.waitForTimeout(300);
fs.mkdirSync('docs', { recursive: true });
await cover.screenshot({ path: 'docs/cover.jpg', type: 'jpeg', quality: 82 });
console.log('wrote docs/cover.jpg');
await browser.close();
server.close();
