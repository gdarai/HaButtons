# HaButtons

A local React app for Home Assistant webhook buttons. A Python server downloads the definitions before serving the app, then handles button webhook requests. The browser only connects to the local server, so Home Assistant does not need to allow cross-origin browser requests.

## Configuration

Edit `config.json` in the project directory before starting the server:

```json
{
  "URL": "http://192.168.1.100:8123",
  "PATH": "local/ButtonsFile.txt",
  "COLUMNS": 2,
  "TEST": false
}
```

- **URL**: full Home Assistant `http://` or `https://` origin, with optional port; no credentials, query, or path.
- **PATH**: relative URL path to the UTF-8 definitions file on Home Assistant. For a file in Home Assistant's `www` directory, the public path normally starts with `local/`.
- **COLUMNS**: positive integer grid column count.
- **TEST**: `false` for actual downloads and webhook POSTs, or `true` for sample buttons without Home Assistant network requests.

The server reads configuration once at startup. Restart it after editing `config.json` or the definitions on Home Assistant. A failed or empty download stops startup with an error; if the browser cannot load local data or a webhook fails, it displays an error. Neither configuration nor definitions are stored in browser local storage. The server binds to `127.0.0.1` and serves only the app and its required local API routes.

Each nonblank line in the UTF-8 text file defines one button in `name|icon|color|command` format (no header row):

```text
Lights on|lit bulb|#F6C453|lights_on
Lights off|unlit bulb|#34495E|lights_off
```

Fields must be nonempty and separated by exactly three `|` characters. Colors must be six-digit `#RRGGBB` values. Blank lines and CRLF line endings are supported. Any invalid line rejects the whole load and displays its error in the browser. Unknown icon names display the question-mark icon. The icon is white or black according to the button color; the centered name sits below the colored rectangle.

Available icon names (case-sensitive): `tick-v yes`, `tick-x no`, `lit bulb`, `unlit bulb`, `arrow up`, `arrow down`, `sun`, `moon`, `half moon`, `door`, `sound volume plus`, `sound volume minus`, `play`, `pause`, `question mark`, `exclamation mark`.

Pressing a button sends an empty-body POST to the local server, which relays it to `<URL>/api/webhook/<command>` with `command` encoded as one URL path segment. Request failures appear on the Buttons screen.

## Test mode

Set `TEST` to `true` in `config.json` and restart the Python server. The browser uses the fixed sample string in `src/testMode.js` and logs `POST /api/webhook/<command>` to its console instead of sending webhook requests. Python also rejects webhook requests in test mode. Set `TEST` back to `false` and restart to resume real requests.

## Development and deployment

Requires Node.js 20.19+ and npm to build, plus Python 3 to run. From the project directory:

```sh
npm ci
npm run lint
npm run build
python3 server.py
```

Open `http://localhost:8080`. On Windows, run `start-win.bat` instead of `python3 server.py`; on Linux/macOS, run `./start.sh`. Both open the browser and launch the server using `python`/`python3`. The Python server, not `python -m http.server` or Vite's standalone dev server, must serve the app for the local API routes to work. Vite uses `src/index.html` as its entry point and writes **one self-contained `dist/index.html`**, with JavaScript and CSS inlined. The `dist/` folder is tracked in Git, so rebuild and include it when publishing changes. Node.js is not required at runtime.
