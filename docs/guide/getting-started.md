# Getting Started

[neutralinojs-plugin-vite](https://github.com/IsmaCortGtz/neutralinojs-plugin-vite) is a [`neu` CLI](https://neutralino.js.org/docs/cli/neu-cli) plugin that integrates [Vite](https://vitejs.dev/) into your [NeutralinoJS](https://neutralino.js.org/) projects. It adds a single `neu vite` command group with everything you need to scaffold, develop and build desktop apps backed by a real Vite dev server with HMR.

## Requirements

- **Node.js >= 16**
- The [**neu CLI**](https://neutralino.js.org/docs/cli/neu-cli) installed globally:

  ```bash
  npm install -g @neutralinojs/neu
  ```

## Installation

Install the plugin into the global `neu` CLI:

```bash
neu plugins --add neutralinojs-plugin-vite
```

Verify the installation:

```bash
neu plugins        # neutralinojs-plugin-vite should be listed
neu vite version   # prints the plugin version and checks npm for updates
```

To remove it later:

```bash
neu plugins --remove neutralinojs-plugin-vite
```

> [!TIP]
> Updating is just removing and re-adding the plugin. See [Updating the Plugin](./updating.md).

## Quick start

Create a new project from scratch (interactive wizard):

```bash
neu vite create
```

Start developing — Vite dev server + NeutralinoJS window:

```bash
cd my-app
neu vite dev
```

Build for production — Vite build + native bundling in one step:

```bash
neu vite build
```

Each step is covered in detail in its own page:

| Step | Page |
|---|---|
| Scaffold a new project | [Creating a Project](./create-project.md) |
| Adopt the plugin in an existing app | [Existing Projects](./existing-project.md) |
| Day-to-day development | [Development Server](./development.md) |
| Ship it | [Building & Distribution](./building.md) |

## Where do commands run?

Every `neu vite <command>` runs from the **NeutralinoJS project root** — the directory containing `neutralino.config.json`. The only exception is installing frontend dependencies, which happens inside the Vite project directory. See the [command matrix](./existing-project.md#command-matrix) for the exact directory of each operation.
