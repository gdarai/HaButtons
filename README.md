# HaButtons

A small React + Vite starter for Home Assistant-inspired buttons. The current button is a local interactive preview; it does not connect to Home Assistant.

## Development

Requires Node.js 20.19+ and npm.

```sh
npm ci
npm run dev
```

Run `npm run lint` to check the source. There is no test suite.

## Build

```sh
npm run build
npm run preview
```

Vite uses `src/index.html` as its entry point and writes **one self-contained `dist/index.html`** with the JavaScript and CSS inlined. The `dist/` folder is intentionally tracked in Git, so rebuild and include it when publishing changes. For a static host, serve `dist/index.html`; no Node.js server is required at runtime.
