# Integrating into Existing Projects

You don't need `neu vite create` to use this plugin. Any NeutralinoJS project — new or years old — can adopt it as long as two things exist:

1. A **`cli.vite.projectPath`** entry in `neutralino.config.json` pointing to a directory that contains a `package.json` with **`vite` installed** and a **`build` script**.
2. The frontend HTML loads the native API bindings in development via `<script src="/__neutralino_globals.js" vite-ignore></script>`.

This page walks through the common layouts and everything you must align manually.

---

## Scenario 1: Separated layout (the default)

Your repo already keeps the NeutralinoJS app at the root and Vite somewhere else (commonly `vite-src/`):

```
my-app/
├── neutralino.config.json
├── extensions/
├── bin/
└── vite-src/
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

**Integration is just the config entry:**

```json
{
  "cli": {
    "binaryName": "my-app",
    "resourcesPath": "/vite-src/dist/",
    "vite": {
      "projectPath": "/vite-src/"
    }
  },
  "documentRoot": "/vite-src/dist/"
}
```

Then make sure your `vite-src/index.html` includes the globals script (inside `<head>`), next to wherever you initialize the client library:

```html
<script src="/__neutralino_globals.js" vite-ignore></script>
```

And that your app initializes Neutralino, e.g.:

```ts
import { init } from '@neutralinojs/lib'

init()
```

> [!NOTE]
> In development the plugin injects nothing into your code — the script tag above is what connects your app to the native API. It is marked `vite-ignore` so Vite never tries to resolve or bundle it.

Done. `neu vite dev` and `neu vite build` now work against your layout.

## Scenario 2: Shared root (legacy repositories)

Many older repos keep the Vite project at the same root as `neutralino.config.json`:

```
my-app/
├── index.html
├── src/
│   └── main.ts
├── public/
├── vite.config.ts
├── package.json          # has vite + @neutralinojs/lib + a "build" script
└── neutralino.config.json
```

Point `projectPath` at the root itself:

```json
{
  "cli": {
    "binaryName": "my-app",
    "distributionPath": "/dist/",
    "resourcesPath": "/dist/",
    "vite": {
      "projectPath": "/"
    }
  },
  "documentRoot": "/dist/"
}
```

Because there is a single `package.json`, dependency installation happens at the root too. Full setup checklist for this layout:

1. **Dependencies** — install once at the root; it must include both `vite` and `@neutralinojs/lib`. There is no separate frontend directory anymore.
2. **Build script** — `package.json` needs a `"build"` script that outputs where `documentRoot` points, e.g.:

   ```json
   {
     "scripts": {
       "build": "vite build"
     }
   }
   ```

3. **Entry HTML** — add the globals tag to `index.html`:

   ```html
   <script src="/__neutralino_globals.js" vite-ignore></script>
   ```

4. **Output alignment** — `documentRoot`, `cli.resourcesPath` and your Vite `outDir` must agree (`dist/` by default). During `neu vite build`, the Vite output lands exactly where the NeutralinoJS bundler expects the resources.
5. **Ignore build artifacts** — make sure `.gitignore` covers `bin/`, `dist/`, `.storage/` and log files.
6. **Clean up leftovers** — if the legacy app loaded the downloaded `neutralino.js` client instead of importing `@neutralinojs/lib`, migrate your imports; the plugin flow always uses the npm library plus the injected globals script.

Everything else behaves identically: run every command from the repository root.

## Scenario 3: Custom subdirectory

Any directory name works — `frontend/`, `client/`, `webapp/`… Just point the config at it:

```json
{
  "documentRoot": "/frontend/dist/",
  "cli": {
    "binaryName": "my-app",
    "resourcesPath": "/frontend/dist/",
    "vite": {
      "packageManager": "pnpm",
      "projectPath": "/frontend/"
    }
  }
}
```

The path is resolved relative to the directory containing `neutralino.config.json`.

## Manual integration checklist

Use this list regardless of the layout:

- [ ] `neutralino.config.json` contains `cli.vite.projectPath` pointing to the Vite project directory.
- [ ] That directory's `package.json` has a `"build"` script producing the final assets.
- [ ] `vite` is installed in that directory (`node_modules/vite` exists) — one of the [pre-flight checks](./development.md#pre-flight-checks).
- [ ] Entry HTML (`index.html` / `src/app.html`) contains `<script src="/__neutralino_globals.js" vite-ignore></script>`.
- [ ] Your code imports and initializes `@neutralinojs/lib`.
- [ ] `documentRoot` and `cli.resourcesPath` point at the Vite output folder.
- [ ] `neu update` has been run at the NeutralinoJS root so `bin/` holds the binaries.
- [ ] Optional: `cli.vite.packageManager` matches how you install dependencies ([reference](../reference/configuration.md)).

## Command matrix

Where each command runs depends on the scenario:

| Command | Separated / custom subdir | Shared root |
|---|---|---|
| `neu plugins --add neutralinojs-plugin-vite` | anywhere | anywhere |
| `neu update` | NeutralinoJS root | repo root |
| `<pm> install` | inside the Vite dir (e.g. `vite-src/`) | repo root |
| `neu vite dev` | NeutralinoJS root | repo root |
| `neu vite build` | NeutralinoJS root | repo root |
| `neu vite version` | anywhere | anywhere |

Example daily flow for the separated layout:

```bash
cd my-app
npm install --prefix vite-src   # only when dependencies changed
neu vite dev                    # develop
neu vite build                  # ship
```

## Troubleshooting

If `neu vite dev` stops at the pre-flight checks, each line tells you what to fix — usually running `neu update` at the root or installing dependencies inside the Vite directory. See [Development Server → Pre-flight checks](./development.md#pre-flight-checks) for the full list.
