# Signo Kafka UI hard refresh / rebuild

Build marker: `1.0.2-kafka-ui-hardfix`

The Electron production app serves the React renderer from `dist/` through the backend on port 3900. Updating `src/` alone does not update an already packaged app.

## Development

```bash
cd /path/to/Signo-main
pkill -f "vite|electron|node.*server/index.js" || true
rm -rf node_modules/.vite
npm install
npm run dev
```

Open `http://localhost:7200`.

## Electron development

```bash
cd /path/to/Signo-main
pkill -f "vite|electron|node.*server/index.js" || true
rm -rf node_modules/.vite
npm install
npm run electron:dev
```

## Packaged Electron

```bash
cd /path/to/Signo-main
pkill -f "vite|electron|node.*server/index.js" || true
npm install
npm run electron:dist:mac
```

Install the newly generated app. Do not launch an older DMG/app copy. The application disables Chromium HTTP cache and appends a build query to the renderer URL.

## Verify the hard fix

Open DevTools console and run:

```js
fetch('/api/version').then(r => r.json()).then(console.log)
```

Expected:

```text
{ ok: true, build: '1.0.2-kafka-ui-hardfix' }
```
