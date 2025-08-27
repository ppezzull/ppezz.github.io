const fs = require('fs');
const path = require('path');

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