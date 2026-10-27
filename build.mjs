// Builds the CV PDFs (and HTML previews) from src/data/*.json.
//
//   npm run build          → dist/Lebenslauf.pdf, dist/CV-Marc-Borer-EN.pdf (+ .html)
//   npm run preview        → HTML only, no browser needed
//
// PDF rendering uses Playwright's Chromium. Set PLAYWRIGHT_MODULE to the
// absolute path of an existing Playwright install to reuse it.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from './src/template.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const htmlOnly = process.argv.includes('--html');

mkdirSync(DIST, { recursive: true });

// Fonts: one @font-face per shipped WOFF2, embedded as data URIs.
const fontFaces = {
  'archivo': { family: 'Archivo', weight: '400 800', stretch: '100% 125%' },
  'ibm-plex-sans': { family: 'IBM Plex Sans', weight: '400 600' },
  'ibm-plex-mono': { family: 'IBM Plex Mono', weight: null },
};
let fontCss = '';
for (const file of readdirSync(join(SRC, 'fonts')).filter((f) => f.endsWith('.woff2')).sort()) {
  const key = Object.keys(fontFaces).find((k) => file.startsWith(k + '-'));
  if (!key) continue;
  const face = fontFaces[key];
  const data = readFileSync(join(SRC, 'fonts', file)).toString('base64');
  // Plex Mono ships one static file per weight; the website's fonts.css names them.
  const weight = face.weight ?? (file.includes('wl5FgtIU') || file.includes('wJwlBFgg') ? '500' : '400');
  const range = file.includes('latin-ext')
    ? 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF'
    : 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
  fontCss += `@font-face{font-family:'${face.family}';font-style:normal;font-weight:${weight};${face.stretch ? `font-stretch:${face.stretch};` : ''}src:url(data:font/woff2;base64,${data}) format('woff2');unicode-range:${range};}\n`;
}

const css = readFileSync(join(SRC, 'cv.css'), 'utf8');
const photoPng = readFileSync(join(ROOT, 'profile.png'));
const languages = readdirSync(join(SRC, 'data')).filter((f) => /^cv\.[a-z]{2}\.json$/.test(f)).sort();

let chromium = null;
if (!htmlOnly) {
  const pw = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
  chromium = pw.chromium ?? pw.default.chromium;
}

const browser = chromium ? await chromium.launch() : null;

// Downscale the portrait once, in the browser, so the PDF stays small.
let photoDataUrl = `data:image/png;base64,${photoPng.toString('base64')}`;
if (browser) {
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');
  photoDataUrl = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const w = 480;
    const h = Math.round((img.naturalHeight / img.naturalWidth) * w);
    const c = document.getElementById('c');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.9);
  }, photoDataUrl);
  await page.close();
}

for (const file of languages) {
  const data = JSON.parse(readFileSync(join(SRC, 'data', file), 'utf8'));
  const html = render(data, { css, fontCss, photoDataUrl });
  const htmlOut = join(DIST, data.file.replace(/\.pdf$/, '.html'));
  writeFileSync(htmlOut, html);
  console.log('wrote', htmlOut);
  if (!browser) continue;

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  const monoB64 = readFileSync(join(SRC, 'fonts', 'ibm-plex-mono-latin-8n1i8q1w.woff2')).toString('base64');
  const footer = `<style>@font-face{font-family:'IBM Plex Mono';src:url(data:font/woff2;base64,${monoB64}) format('woff2');}</style><div style="width:100%;padding:0 17mm;display:flex;justify-content:space-between;font-family:'IBM Plex Mono','DejaVu Sans Mono',monospace;font-size:7pt;color:#5C6474;">
      <span>${data.person.name} · ${data.title} · ${data.stamp}</span>
      <span>${data.pageLabel} <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`;
  const pdfOut = join(DIST, data.file);
  await page.pdf({
    path: pdfOut,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: false,
    margin: { top: '16mm', right: '17mm', bottom: '18mm', left: '17mm' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: footer,
  });
  console.log('wrote', pdfOut);
  await page.close();
}

if (browser) await browser.close();
