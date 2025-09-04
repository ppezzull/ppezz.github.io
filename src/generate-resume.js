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

  // For work: wrap position in <a> if website exists
  if (Array.isArray(resume.work)) {
    resume.work.forEach(entry => {
      if (entry.website && entry.position) {
        $(`div.sc-hjsuWn.jINFql`).each(function () {
          const el = $(this);
          if (el.text().trim() === entry.position) {
            if (el.find('a').length === 0) {
              el.html(`<a href="${entry.website}" target="_blank" style="color:inherit;text-decoration:none;">${entry.position}</a>`);
            }
          }
        });
      }
    });
  }

  // For projects: wrap name in <a> if website exists
  if (Array.isArray(resume.projects)) {
    resume.projects.forEach(entry => {
      if (entry.website && entry.name) {
        $(`div.sc-jJLAfE.jsgwBQ, div.sc-hjsuWn.jINFql`).each(function () {
          const el = $(this);
          if (el.text().trim() === entry.name) {
            if (el.find('a').length === 0) {
              el.html(`<a href="${entry.website}" target="_blank" style="color:inherit;text-decoration:none;">${entry.name}</a>`);
            }
          }
        });
      }
    });
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