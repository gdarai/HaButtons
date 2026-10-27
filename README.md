# HaButtons

A two-screen, static React app for Home Assistant webhook buttons. The Buttons screen loads automatically when the saved configuration and definitions file are valid. If not, Config opens with the error; use **Submit** to save settings and retry. **Config** on the Buttons screen lets you change them later.

## Configuration

- **URL**: Home Assistant host and optional port, for example `192.168.1.100:8123` (no `http://` or trailing path). There is no default.
- **PATH**: path to the text definitions file on that host, for example `src/definitions.txt`. There is no default. The app GETs `http://<URL>/<PATH>` on startup and Submit.
- **Columns**: number of grid columns, a positive integer; defaults to `2`.

All three values are stored in browser local storage as `habuttons.url`, `habuttons.path`, and `habuttons.columns` on each Submit, even if loading fails. Settings are local to the browser and origin.

Each nonblank line in the UTF-8 text file defines one button in `name|icon|color|command` format (no header row):

```text
Lights on|lit bulb|#F6C453|lights_on
Lights off|unlit bulb|#34495E|lights_off
```

Fields must be nonempty and separated by exactly three `|` characters. Colors must be six-digit `#RRGGBB` values. Blank lines and CRLF line endings are supported. Any invalid line (or an empty file) rejects the whole load and shows its error on Config. Unknown icon names display the question-mark icon. The icon is white or black according to the button color; the centered name sits below the colored rectangle.

Available icon names (case-sensitive): `tick-v yes`, `tick-x no`, `lit bulb`, `unlit bulb`, `arrow up`, `arrow down`, `sun`, `moon`, `half moon`, `door`, `sound volume plus`, `sound volume minus`, `play`, `pause`, `question mark`, `exclamation mark`.

Pressing a button sends an empty-body POST to `http://<URL>/api/webhook/<command>`, where `command` is encoded as one URL path segment. Request failures appear on the Buttons screen.

## Test mode

Set `isTest` to `true` in `src/testMode.js` and rebuild. This replaces the definitions GET with the fixed sample string in that file and replaces webhook POST requests with `POST <url>` messages in the browser console. A configured URL is still required; PATH is not needed in test mode. Set it back to `false` for actual requests.

## Development and deployment

Requires Node.js 20.19+ and npm:

```sh
npm ci
npm run dev
npm run lint
npm run build
```

Vite uses `src/index.html` as its entry point and writes **one self-contained `dist/index.html`**, with JavaScript and CSS inlined. The `dist/` folder is tracked in Git, so rebuild and include it when publishing changes. Serve this HTML on a compatible origin: browsers block HTTP requests from HTTPS pages and may require Home Assistant to allow cross-origin GET/POST requests. No Node.js server is required at runtime.
