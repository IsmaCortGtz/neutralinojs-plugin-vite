# Creating a Project

`neu vite create` scaffolds a complete NeutralinoJS + Vite project: a NeutralinoJS app at the project root and a Vite frontend inside `vite-src/`.

```bash
neu vite create
```

<img src="../create.gif" alt="neu vite create wizard" width="400">

## Interactive walkthrough

The wizard guides you through four choices:

1. **Project name** — the target directory (default: `neutralinojs-vite-app`). Use `.` to scaffold into the current directory.
2. **Framework & variant** — pick a framework, then a language flavor:

   | Framework | Variants |
   |---|---|
   | React | TypeScript, TypeScript + SWC, TypeScript + React Compiler, JavaScript (+ SWC / React Compiler) |
   | Vue | TypeScript, JavaScript |
   | Svelte | TypeScript, JavaScript |
   | SvelteKit | TypeScript, JSDoc, JavaScript |
   | Solid | TypeScript, JavaScript |
   | Preact | TypeScript, JavaScript |
   | Lit | TypeScript, JavaScript |
   | Qwik | TypeScript, JavaScript |

3. **Install dependencies** — when accepted, the plugin runs `neu update` at the new project root and installs the frontend dependencies inside `vite-src/`.
4. **Start the app** — when accepted (and dependencies were installed), `neu vite dev` starts right away.

## Non-interactive usage (scripts & CI)

Every wizard choice can be provided as a flag instead, so the command runs without any prompt:

```bash
neu vite create my-app --template react-ts --install
```

| Flag | Description |
|---|---|
| `[projectName]` | Project directory name (first positional argument) |
| `-t, --template <id>` | Template id to scaffold (see [table below](#template-ids)) |
| `--pm <manager>` | Package manager: `npm`, `pnpm`, `yarn` or `bun` |
| `--install` / `--no-install` | Install dependencies (`neu update` + package manager install) |
| `--open` / `--no-open` | Start the dev server after creation (requires installation) |
| `--force` | Remove existing files when the target directory is not empty |

More examples:

```bash
# SvelteKit + TypeScript, dependencies installed with pnpm, no prompts
neu vite create my-app --template sveltekit-ts --pm pnpm --install

# Plain JavaScript Vue project, no dependency install, never opens the app
neu vite create my-app --template vue --no-install --no-open

# Scaffold into the current (non-empty) directory, wiping its contents first
neu vite create . --template react-ts --install --force
```

Validation is fail-fast (exit code `1`, before any prompt):

- Unknown `--template` or `--pm` values print the valid options.
- `--open` combined with `--no-install` is rejected.
- The only case that still requires interaction is a non-empty target directory without `--force`.

### Template ids

| Framework | Ids |
|---|---|
| React | `react-ts`, `react-compiler-ts`, `react-swc-ts`, `react`, `react-compiler`, `react-swc` |
| Vue | `vue-ts`, `vue` |
| Svelte | `svelte-ts`, `svelte` |
| SvelteKit | `sveltekit-ts`, `sveltekit-jsdoc`, `sveltekit-js` |
| Solid | `solid-ts`, `solid` |
| Preact | `preact-ts`, `preact` |
| Lit | `lit-ts`, `lit` |
| Qwik | `qwik-ts`, `qwik` |

## Resulting structure

The default layout keeps NeutralinoJS at the root and Vite inside `vite-src/`:

```
my-app/
├── neutralino.config.json    # NeutralinoJS configuration
├── .gitignore                # Ignores bin/, dist/, logs, etc.
├── extensions/               # NeutralinoJS extensions (empty)
├── bin/                      # NeutralinoJS binaries (after "neu update")
├── dist/                     # Bundled app output (after "neu vite build")
└── vite-src/                 # Vite project
    ├── index.html            # Entry HTML (patched by the plugin)
    ├── package.json          # Frontend deps incl. @neutralinojs/lib
    ├── vite.config.ts        # Vite configuration
    ├── public/               # Static assets
    └── src/                  # Your application source code
```

> [!NOTE]
> The contents of `vite-src/` vary depending on the selected framework. For SvelteKit the entry HTML lives at `vite-src/src/app.html`.

If you declined dependency installation during the wizard, the CLI prints exactly what to run next:

```bash
cd my-app
neu update          # downloads NeutralinoJS binaries + client
cd vite-src
npm install         # or pnpm/yarn/bun depending on your configuration
cd ..
neu vite dev
```

## What happens under the hood

Knowing what the wizard generates makes it easier to customize or replicate manually in an existing project ([see integration guide](./existing-project.md)):

1. **Scaffolds the frontend** with the official generators (`create-vite` for most frameworks, `sv` for SvelteKit) using the configured [package manager](../reference/configuration.md#clivitepackagemanager) as runner.
2. **Renames** the generated folder to `vite-src/`.
3. **Copies the NeutralinoJS template files** (`neutralino.config.json` and `.gitignore`) to the project root. The config already points `documentRoot`, `resourcesPath` and `cli.vite.projectPath` at `/vite-src/dist/` and `/vite-src/`.
4. **Patches the entry HTML**: sets the `<title>` and injects `<script src="/__neutralino_globals.js" vite-ignore></script>`, which is how the app receives the native API bindings in development.
5. **Tunes the config**: sets `cli.binaryName` and the window title from your project name.
6. **Adds `@neutralinojs/lib`** to `vite-src/package.json`, pinned to `cli.clientVersion`/`cli.binaryVersion` if set, otherwise to the latest npm release.
7. **Installs** (optional): `neu update` at the root, then the package manager install inside `vite-src/`.

## Next steps

- Run [`neu vite dev`](./development.md) to start developing.
- Customize Vite through `vite-src/vite.config.ts` ([official docs](https://vite.dev/config/)) and the app via [`neutralino.config.json`](https://neutralino.js.org/docs/configuration/neutralino.config.json/) ([plugin options reference](../reference/configuration.md)).
