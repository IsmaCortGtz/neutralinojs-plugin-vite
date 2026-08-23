# Commands

All functionality is exposed through the `vite` command group added to the `neu` CLI:

```bash
neu vite <command> [options]
```

Run it from the **NeutralinoJS project root** (the directory containing `neutralino.config.json`), except where noted.

---

## neu vite create

```
neu vite create [projectName] [options]
```

Create a new NeutralinoJS project with Vite setup. Fully interactive by default; every prompt can be replaced by a flag. See [Creating a Project](../guide/create-project.md) for the full walkthrough and the resulting structure.

| Option | Description |
|---|---|
| `[projectName]` | Target directory (positional). Defaults to `neutralinojs-vite-app`; use `.` for the current directory |
| `-t, --template <id>` | Template id to scaffold, e.g. `react-ts`, `vue`, `sveltekit-ts` |
| `--pm <manager>` | Package manager: `npm`, `pnpm`, `yarn` or `bun` |
| `--install` / `--no-install` | Install dependencies (`neu update` + package manager install) |
| `--open` / `--no-open` | Start the dev server after creation; requires installation |
| `--force` | Remove existing files when the target directory is not empty |

Behavior notes:

- Invalid `--template` or `--pm` values exit with code `1` and list the valid options.
- `--open` with `--no-install` is rejected.
- When the target directory is not empty you are prompted interactively — unless `--force` empties it first (`.git` is preserved).
- Template ids: see the [table](../guide/create-project.md#template-ids).

## neu vite dev

```
neu vite dev [--arch <arch>]
```

Start the Vite development server and launch the NeutralinoJS app window against it. Runs a set of pre-flight checks first and exits with code `1` if any fails. Interactive keys while running:

| Key | Action |
|---|---|
| <kbd>r</kbd> | Full-reload every connected app window |
| <kbd>o</kbd> | Open another app window |
| <kbd>Ctrl+C</kbd> | Stop and exit |

Details: [Development Server](../guide/development.md).

| Option | Description |
|---|---|
| `--arch <arch>` | Architecture of the NeutralinoJS binary to run (`x64`, `arm64`, `armhf`). Defaults to `process.arch` |

## neu vite build

```
neu vite build [options]
```

Run the Vite production build and bundle the NeutralinoJS app in one step.

| Flag | Description |
|---|---|
| `-r, --release` | Also generate a release ZIP |
| `--embed-resources` | Embed resources into the binaries |
| `--copy-storage` | Copy `.storage` into the bundle |
| `--macos-bundle` | Create macOS app bundles (`.app`) |
| `--clean` | Clean previous build files from the distribution directory first |
| `--config-file <path>` | Use an alternative configuration file |

Notes:

- The frontend `build` script is executed directly from the Vite project's `package.json` — independent of any package manager.
- A non-zero frontend build exit code stops the command before bundling.
- Output goes to `cli.distributionPath` (`dist/` by default).

Details: [Building & Distribution](../guide/building.md).

## neu vite version

```
neu vite version
```

Print the installed plugin version and check npm for a newer release. Safe to run from anywhere. Update procedure: [Updating the Plugin](../guide/updating.md).

---

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success (or graceful cancel in `create`) |
| `1` | Failed pre-flight checks, invalid flags, missing config/scripts — or a propagated frontend build failure |
