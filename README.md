## Professional Resume

Generates a static resume HTML from `src/resume.json` using the `jsonresume-theme-professional` theme, post-processes it, and publishes via GitHub Pages.

### Key files
- `src/resume.json` — your data. Add a `website` string to `work` or `projects` entries to create links.
- `src/generate-resume.js` — renders the theme, fixes fonts, injects base font size, and uses Cheerio to add links.
- `.github/workflows/pages.yml` — CI workflow that builds and deploys the `site/` artifact.

### Quick start
Install dependencies (including dev deps required by the theme):

```bash
npm install --include=dev
```

Generate the resume HTML:

```bash
npm run generate
# generates: src/resume.html
```

Open `src/resume.html` to preview.

### Link injection
- Work entries: when `website` is set, the script wraps `work.position` in an `<a>` tag.
- Project entries: when `website` is set, the script wraps `projects.name` in an `<a>` tag.
- Links are styled with `style="color:inherit;text-decoration:none;"` so they blend with the text.

### GitHub Pages
If this repo is named `<user-name>.github.io`, GitHub Pages will serve the site at:

```
https://<user-name>.github.io/
```

The workflow copies `src/resume.html` → `site/index.html` and includes `fonts/` so the site works from the root path.

### Troubleshooting
- If a link doesn't appear: confirm `website` is set and inspect `src/resume.html` to see where the theme rendered the title. Adjust selectors in `src/generate-resume.js` if needed.
- If rendering fails: install devDeps (`react`, `styled-components`, `@babel/*`) and re-run the generator.

### Commands

```bash
npm install --include=dev
npm run generate
```

Short and ready — tell me if you want a one-line badge or a hosted preview instruction added.

### Credits
Shoutout to Thomas Davis for the excellent `jsonresume-theme-professional` theme:

https://github.com/thomasdavis/resume

