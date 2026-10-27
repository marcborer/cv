# CV - Marc Borer

[![Build CV PDF](https://github.com/marcborer/cv/actions/workflows/build-pdf.yml/badge.svg)](https://github.com/marcborer/cv/actions/workflows/build-pdf.yml)

Marc Borer's CV as HTML and CSS, rendered to PDF with headless Chromium. It shares the design system of [marc-borer.ch](https://marc-borer.ch): the same type (Archivo, IBM Plex Sans, IBM Plex Mono), the same ink, paper and cobalt, the same ruled, labelled layout.

## Download

- **[Lebenslauf (Deutsch, PDF)](https://github.com/marcborer/cv/releases/latest/download/Lebenslauf.pdf)**
- **[CV (English, PDF)](https://github.com/marcborer/cv/releases/latest/download/CV-Marc-Borer-EN.pdf)**

## How it works

1. Edit the content in `src/data/cv.de.json` or `src/data/cv.en.json` and push to `main`
2. GitHub Actions renders both languages with Playwright's Chromium (`build.mjs`)
3. The PDFs are published as release assets at the stable URLs above

Layout lives in `src/cv.css`, the HTML structure in `src/template.mjs`. Fonts are embedded from `src/fonts/` (the same WOFF2 files the website ships), the portrait from `profile.png`.

## Local build

```bash
npm ci
npx playwright install chromium   # once
npm run build                     # dist/Lebenslauf.pdf, dist/CV-Marc-Borer-EN.pdf (+ .html)
npm run preview                   # HTML only, no browser needed
```

To reuse an existing Playwright install, point `PLAYWRIGHT_MODULE` at its `index.js`.

## Content rules

- Swiss spelling (ss, not ß) in the German version
- No hyperlinks in the PDF, so uploads to applicant-tracking systems stay plain
- Attestree is described with what [attestree.com](https://attestree.com) states publicly, nothing more

## License

Content is personal. The build scripts may be reused freely.
