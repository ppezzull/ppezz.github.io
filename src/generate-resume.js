const fs = require('fs');
const path = require('path');

const cheerio = require('cheerio');

function setupBabel() {
  try {
    require('@babel/register')({
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ],
      extensions: ['.js', '.jsx'],
      ignore: [
        function (filepath) {
          if (filepath.includes('node_modules/jsonresume-theme-professional')) return false;
          return /node_modules/.test(filepath);
        }
      ]
    });
    // Ensure peer deps are resolvable
    require('react');
    require('react-dom/server');
    require('styled-components');
  } catch (e) {
    const hint = [
      'Missing build deps. Please install devDependencies before generating.',
      '- Run: npm install',
      '- If NODE_ENV=production or npm config production=true, dev deps are skipped. Use: npm install --include=dev',
    ].join('\n');
    throw new Error(e.message + '\n' + hint);
  }
}

function loadResumeData(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
}

function getThemeRender() {
  const theme = require('jsonresume-theme-professional');
  const render = theme.render || (theme.default && theme.default.render);
  if (typeof render !== 'function') {
    throw new Error('jsonresume-theme-professional did not export a render() function.');
  }
  return render;
}

function mapMissingFonts(html) {
  return html.replace(/lmsans10-(regular|bold|italic)\.otf/g, (_m, s) => `lmroman10-${s}.otf`);
}

function rewriteFontUrls(html) {
  const urlFontsRegex = /url\((['"])??(?:\.\.\/|\.\/|\/)?fonts\/(?:[^/'")]\/)*([^/'")]+\.otf)\1?\)/g;
  return html.replace(urlFontsRegex, (_match, _quote, file) => `url("../fonts/${file}")`);
}

function injectBaseFontSize(html, sizePx) {
  const tag = `<style>html{font-size:${sizePx}}</style>`;
  return html.replace('</head>', `${tag}</head>`);
}

function injectLinks(html, resume) {
  // Use cheerio to parse and manipulate HTML
  const $ = cheerio.load(html);

  // Common selectors observed in the theme output (keeps it DRY)
  const titleSelectors = ['div.sc-hjsuWn.jINFql', 'div.sc-jJLAfE.jsgwBQ'];

  // Normalizes text for comparison: collapse whitespace and lower-case
  function normalizeText(s) {
    return (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  // Safely create and append an <a> to the element
  function wrapElementWithLink(el, href, linkText) {
    if (el.find('a').length > 0) return; // already linked
    const a = $('<a>')
      .attr('href', href)
      .attr('target', '_blank')
      .attr('rel', 'noopener noreferrer')
      .css('color', 'inherit')
      .css('text-decoration', 'none')
      .text(linkText);
    el.empty().append(a);
  }

  // Generic helper: iterate entries, look for matching rendered nodes, and wrap
  function linkifyEntries(entries, fieldName) {
    if (!Array.isArray(entries)) return;
    entries.forEach(entry => {
      const href = entry.website;
      const raw = entry[fieldName];
      if (!href || !raw) return;
      const targetNorm = normalizeText(raw);
      // Try exact match first, fall back to contains match
      $(titleSelectors.join(',')).each(function () {
        const el = $(this);
        const rendered = normalizeText(el.text());
        if (!rendered) return;
        if (rendered === targetNorm || rendered.includes(targetNorm)) {
          wrapElementWithLink(el, href, raw);
        }
      });
    });
  }

  // Map resume sections to the field that should be linked
  // work -> position, projects -> name, education -> institution
  linkifyEntries(resume.work, 'position');
  linkifyEntries(resume.projects, 'name');
  linkifyEntries(resume.education, 'institution');
  linkifyEntries(resume.awards, 'title');

  // Support alternate certificate fields: certificates or certifications
  // Some resume files use `title`, others use `name` for certificate entries — try both.
  if (Array.isArray(resume.certificates)) {
    linkifyEntries(resume.certificates, 'title');
    linkifyEntries(resume.certificates, 'name');
  }
  if (Array.isArray(resume.certifications)) {
    linkifyEntries(resume.certifications, 'title');
    linkifyEntries(resume.certifications, 'name');
  }

  return $.html();
}

function writeHtml(outPath, html) {
  fs.writeFileSync(path.resolve(outPath), html);
}

function main() {
  try {
    setupBabel();
    const render = getThemeRender();
    const resume = loadResumeData('./src/resume.json');

  let html = render(resume);
  html = mapMissingFonts(html);
  html = rewriteFontUrls(html);
  html = injectBaseFontSize(html, '11.5px');
  html = injectLinks(html, resume);
  writeHtml('./src/resume.html', html);

    console.log('Resume successfully generated: src/resume.html');
  } catch (error) {
    console.error('Failed to generate resume:', error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}