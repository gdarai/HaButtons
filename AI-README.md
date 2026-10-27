# AI development notes

- Keep application source, including the HTML entry, React components, and the single stylesheet, under `src/`.
- Use `src/styles.css` for all app CSS; avoid adding component-specific stylesheets.
- Keep the output self-contained: `npm run build` must produce only `dist/index.html`, with no external script or stylesheet dependencies. Commit updates to `dist/` along with source changes.
- Preserve the Home Assistant-inspired palette and accessible button interactions. The starter preview has no Home Assistant integration; do not imply otherwise.
- Use `npm run lint` and `npm run build` to validate changes. This project intentionally has no tests.
