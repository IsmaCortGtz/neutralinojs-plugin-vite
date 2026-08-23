# Configuration

The plugin is configured through the standard `neutralino.config.json` at your project root, under a `vite` section inside `cli`.

## `cli.vite.projectPath`

- **Type:** `string` (path relative to the directory containing `neutralino.config.json`)
- **Required for:** `neu vite dev`, `neu vite build`
- **Default in generated projects:** `/vite-src/`

Points to the Vite project directory — the folder whose `package.json` declares `vite` and the frontend `build` script. Leading and trailing slashes are the convention used by NeutralinoJS paths (`/vite-src/`), but any relative path form works.

```json
{
  "cli": {
    "vite": {
      "projectPath": "/vite-src/"
    }
  }
}
```

See [Existing Projects](../guide/existing-project.md) for examples pointing at the repo root or custom directories.

## `cli.vite.packageManager`

- **Type:** `"npm" | "pnpm" | "yarn" | "bun"`
- **Default:** `"npm"`

Tells the plugin which package manager your project uses:

```json
{
  "cli": {
    "vite": {
      "projectPath": "/vite-src/",
      "packageManager": "pnpm"
    }
  }
}
```

It is used by:

| Command | How it uses it |
|---|---|
| `neu vite create` | Runs the scaffolding tools (`create-vite`, `sv`) through the manager's exec runner (`npx -y`, `pnpm dlx`, `yarn dlx`, `bunx`) and installs dependencies with it |
| `neu vite dev` | Launches each app window's `neu run` through the same runner |

And explicitly **not** used by:

| Context | Why |
|---|---|
| `neu vite build` | Reads the `build` script from the Vite project's `package.json` and executes it directly — works identically for every manager |
| The rest of the `neu` CLI | Core commands like `neu run`/`neu build` don't invoke a package manager; plugin management (`neu plugins …`) and CLI updates keep using npm internally |

## Related keys

The generated projects wire these up for you; when integrating manually, align them with your Vite output:

| Key | Role |
|---|---|
| `documentRoot` | Where the app loads resources from at runtime (e.g. `/vite-src/dist/`) |
| `cli.resourcesPath` | What gets bundled as app resources during builds |
| `cli.distributionPath` | Output directory of `neu vite build`; also cleaned by its `--clean` flag |
| `cli.binaryName` | Name of the produced binaries |
| `cli.binaryVersion` / `cli.clientVersion` | When set, pins the binaries downloaded by `neu update` and the `@neutralinojs/lib` version added during `neu vite create` |
| `modes.window.title` | Window title set by `neu vite create` from your project name |

## Full example

```json
{
  "applicationId": "js.neutralino.vite",
  "version": "1.0.0",
  "defaultMode": "window",
  "documentRoot": "/vite-src/dist/",
  "url": "/",
  "enableServer": true,
  "enableNativeAPI": true,
  "nativeAllowList": [
    "app.*",
    "os.*",
    "debug.log"
  ],
  "modes": {
    "window": {
      "title": "my-app",
      "width": 800,
      "height": 500,
      "exitProcessOnClose": true
    }
  },
  "cli": {
    "binaryName": "my-app",
    "resourcesPath": "/vite-src/dist/",
    "extensionsPath": "/extensions/",
    "distributionPath": "/dist/",
    "binaryVersion": "6.9.0",
    "clientVersion": "6.3.0",
    "vite": {
      "projectPath": "/vite-src/",
      "packageManager": "pnpm"
    }
  }
}
```

For everything else in this file, refer to the [official NeutralinoJS configuration docs](https://neutralino.js.org/docs/configuration/neutralino.config.json/).
