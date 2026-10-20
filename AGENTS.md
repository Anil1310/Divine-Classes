# Divine Classes — Agent Notes

## Deployment rule (user instruction)
- **Always run `clasp push` automatically after ANY code/file update** — no need to ask.
- `clasp push` publishes to the Apps Script editor; run `clasp deploy` only when the user asks to update the live web app URL.
- `.claspignore` whitelists exactly 7 files: Code.js, appsscript.json, index.html, css.html, javascript.html, login.html, logout.html (README.md and images stay local).

## Verify before pushing
- `node --check Code.js`
- Extract JS from javascript.html (`awk '/<script>/{f=1;next} /<\/script>/{f=0} f' javascript.html`) and run `node --check` on it.
- Pages must be tested via the deployed GAS URL only — local file:// opens break on `<?!= include() ?>` scriptlets.
