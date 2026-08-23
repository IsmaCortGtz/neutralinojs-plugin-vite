# NeutralinoJS Vite Plugin

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![Made with TypeScript](https://img.shields.io/badge/made%20with-TypeScript-blue.svg) ![NeutralinoJS Plugin](https://img.shields.io/badge/plugin-NeutralinoJS-blue.svg)

A [`neu-cli`](https://neutralino.js.org/docs/cli/neu-cli) plugin that integrates [Vite](https://vitejs.dev/) into your [NeutralinoJS](https://neutralino.js.org/) projects. Create and develop lightweight, cross-platform desktop applications using your favorite frontend framework with hot module replacement (HMR) support.

## Features

- ⚡ **Instant HMR** — develop against a real Vite dev server while the native window stays connected
- 🧩 **Multiple frameworks** — React, Vue, Svelte, SvelteKit, Solid, Preact, Lit and Qwik (TypeScript & JavaScript)
- ✨ **Easy setup** — interactive project creation wizard, fully scriptable for CI
- 🛠️ **One-command builds** — frontend build + native bundling in a single step
- 📦 **Your package manager** — npm, pnpm, yarn or bun

## Installation

```bash
neu plugins --add neutralinojs-plugin-vite
```

Requires Node.js >= 16 and the [neu CLI](https://neutralino.js.org/docs/cli/neu-cli) installed globally.

## Quick start

```bash
neu vite create    # scaffold a new project (interactive wizard)
cd my-app
neu vite dev       # Vite dev server + NeutralinoJS window with HMR
neu vite build     # production bundle in one step
```

## Documentation

All guides are browsable right here on GitHub and rendered as a website with VitePress.

| Topic | Guide |
|---|---|
| Requirements & installation | [Getting Started](./docs/guide/getting-started.md) |
| Creating a new project (`neu vite create`) | [Creating a Project](./docs/guide/create-project.md) |
| Adopting the plugin in an existing app | [Existing Projects](./docs/guide/existing-project.md) |
| How `neu vite dev` works, servers & session commands | [Development Server](./docs/guide/development.md) |
| Production builds & packaging | [Building & Distribution](./docs/guide/building.md) |
| Checking & updating the plugin | [Updating the Plugin](./docs/guide/updating.md) |
| Every command and flag | [Commands Reference](./docs/reference/commands.md) |
| `neutralino.config.json` options | [Configuration Reference](./docs/reference/configuration.md) |
| Contributing & testing local builds | [Contributing](./docs/contributing.md) |

> [!TIP]
> Compatible with [neutralinojs-builder](https://github.com/neutralinojs-community/neutralinojs-builder): run it after your builds to generate platform installers (NSIS, DEB, AppImage, DMG) — see [Building & Distribution](./docs/guide/building.md#compatibility-with-neutralinojs-builder).

## Contributing

Contributions are welcome! Check the [contributing guide](./docs/contributing.md) for the workflow and how to test your own build against the global CLI.

## License

This project is licensed under the MIT License.
