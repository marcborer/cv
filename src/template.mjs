// Renders one CV language as a self-contained HTML document.
// Everything the PDF needs (fonts, photo, styles) is inlined so the output
// survives on its own.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function entry(e) {
  return `
    <article class="entry">
      <div class="entry-head">
        <h2 class="entry-title">${esc(e.title)}</h2>
        <span class="entry-period">${esc(e.period)}</span>
      </div>
      <p class="entry-org">${esc(e.org)}${e.note ? `<span class="note">${esc(e.note)}</span>` : ''}</p>
      ${e.summary ? `<p class="entry-summary">${esc(e.summary)}</p>` : ''}
      ${e.bullets?.length ? `<ul class="bullets">${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
    </article>`;
}

function section(s) {
  let body = '';
  if (s.type === 'text') body = s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('');
  if (s.type === 'entries') body = s.entries.map(entry).join('');
  if (s.type === 'table') body = `<dl class="rows">${s.rows.map(([k, v]) => `<div class="row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  return `
    <section class="sec">
      <div class="sec-label">${esc(s.label)}</div>
      <div class="sec-body">${body}</div>
    </section>`;
}

export function render(data, { css, fontCss, photoDataUrl }) {
  const p = data.person;
  return `<!doctype html>
<html lang="${data.lang === 'de' ? 'de-CH' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.name)} — ${esc(data.title)}</title>
<meta name="author" content="${esc(p.name)}">
<style>${fontCss}</style>
<style>${css}</style>
</head>
<body>
<div class="sheet">
  <header class="head">
    <div class="head-id">
      <h1>${esc(p.name)}</h1>
      <p class="role">${esc(p.role)}<span class="sep">·</span><span class="tagline">${esc(p.tagline)}</span></p>
      <ul class="contact">${p.contact.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
    </div>
    ${photoDataUrl ? `<img class="photo" src="${photoDataUrl}" alt="">` : ''}
  </header>
  <main>${data.sections.map(section).join('')}</main>
</div>
</body>
</html>`;
}
