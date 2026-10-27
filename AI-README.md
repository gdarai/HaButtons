# AI development notes

- Keep application source, including the HTML entry, React components, and the single stylesheet, under `src/`.
- Use `src/styles.css` for all app CSS; avoid adding component-specific stylesheets.
- Keep the output self-contained: `npm run build` must produce only `dist/index.html`, with no external script or stylesheet dependencies. Runtime settings and definitions are served by `server.py` from `config.json`, not baked into the HTML. Commit updates to `dist/` along with source changes.
- Preserve the Home Assistant-inspired palette and accessible button interactions. Browser requests must use local Python endpoints rather than Home Assistant directly.
- Use `python3 -m unittest discover -s tests`, `npm run lint`, and `npm run build` to validate changes.
