# NeutralinoJS Vite Plugin

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![Made with TypeScript](https://img.shields.io/badge/made%20with-TypeScript-blue.svg) ![NeutralinoJS Plugin](https://img.shields.io/badge/plugin-NeutralinoJS-blue.svg)

> [!CAUTION]
> This plugin is still under active development. Future updates may introduce breaking changes or compatibility issues.

A [`neu-cli`](https://neutralino.js.org/docs/cli/neu-cli) plugin that integrates [Vite](https://vitejs.dev/) into your [NeutralinoJS](https://neutralino.js.org/) projects. Create and develop lightweight, cross-platform desktop applications using your favorite frontend framework with hot module replacement (HMR) support.

## Features

- 🚀 **Fast Development** - Vite's lightning-fast HMR for instant feedback
- 🎨 **Multiple Frameworks** - Support for React, Vue, Svelte, Solid, Preact, Lit, Qwik, and SvelteKit
- 📦 **Easy Setup** - Interactive project creation wizard
- 🔧 **TypeScript Support** - First-class TypeScript support for all frameworks

## Installation

Install the plugin using the `neu` CLI:

```bash
neu plugins --add neutralinojs-plugin-vite
```

## Usage

This plugin extends the `neu` CLI with the `vite` command. All commands are executed using:

```bash
neu vite <command>
```

### Creating a New Project

<img src="./docs/create.gif" alt="neu vite create" width="400" >

To create a new NeutralinoJS project with Vite integration, run:

```bash
neu vite create
```

This will start an interactive wizard that guides you through the project setup:

1. **Project name** - Enter your project name (default: `neutralinojs-vite-app`)
2. **Framework selection** - Choose from available frameworks:
   - **React** - TypeScript, JavaScript, SWC, React Compiler variants
   - **Vue** - TypeScript or JavaScript
   - **Svelte** - TypeScript, JavaScript, or SvelteKit
   - **Solid** - TypeScript or JavaScript
   - **Preact** - TypeScript or JavaScript
   - **Lit** - TypeScript or JavaScript
   - **Qwik** - TypeScript or JavaScript
3. **Install dependencies** - Optionally install dependencies after creation
4. **Run the app** - Optionally run the application after creation (like `neu vite dev`)

> [!NOTE]
> Scaffolding and dependency installation respect the `cli.vite.packageManager`
> setting of the freshly generated `neutralino.config.json` (defaults to `npm`).
> See [Package Manager](#package-manager).

### Building the Application

To build your application (Vite build + Neutralinojs bundling) in one step:

```bash
neu vite build
```

This command is equivalent to:

```bash
cd vite-src/
<package-manager> run build    # runs the "build" script from vite-src/package.json
cd ..
neu build
```

The Vite build script is read from `vite-src/package.json` and executed directly,
without invoking any specific package manager binary. It accepts the same flags as `neu build`:

| Flag | Description |
|---|---|
| `-r, --release` | Also generate a release ZIP |
| `--embed-resources` | Embed resources into the binaries |
| `--copy-storage` | Copy `.storage` into the bundle |
| `--macos-bundle` | Create macOS app bundles (.app) |
| `--clean` | Clean previous build files first |
| `--config-file <path>` | Use an alternative configuration file |

### Checking for Updates

To see which plugin version you have and check whether a newer one was published on npm:

```bash
neu vite version
```

If an update is available, the command prints the exact steps to update:

```bash
neu plugins --remove neutralinojs-plugin-vite
neu plugins --add neutralinojs-plugin-vite
```

### Running the Development Server

<img src="./docs/dev.gif" alt="neu vite dev" width="400" >


To start the Vite development server with NeutralinoJS:

```bash
neu vite dev
```

This command will:
1. Verify your NeutralinoJS setup
2. Start the Vite development server with HMR
3. Launch the NeutralinoJS application window

## Project Structure

After creating a project, you'll have the following structure:

```
my-project/
├── neutralino.config.json    # NeutralinoJS configuration
├── vite-src/                 # Vite project source
│   ├── src/                  # Your application source code
│   ├── public/               # Static assets
│   ├── dist/                 # Built files (generated)
│   └── vite.config.ts        # Vite configuration
└── extensions/               # NeutralinoJS extensions
```

> [!NOTE]  
> The contents inside `vite-src/` may vary depending on the framework you selected during project creation.

## Configuration

### Vite Configuration

You can customize Vite by editing the `vite.config.ts` (or `vite.config.js`) file inside the `vite-src/` directory.

For more details, refer to the [official Vite documentation](https://vite.dev/config/).

### NeutralinoJS Configuration

Configure your NeutralinoJS application by editing the `neutralino.config.json` file in your project root. This file controls:

- Window properties (size, title, resizable, etc.)
- Native API permissions
- Application metadata
- Build settings

For a complete list of options, check the [official NeutralinoJS documentation](https://neutralino.js.org/docs/configuration/neutralino.config.json/).

#### Vite-specific Configuration

The plugin adds a `vite` section under `cli` in `neutralino.config.json`:

```json
{
  "cli": {
    "vite": {
      "projectPath": "/vite-src/"
    }
  }
}
```

#### Package Manager

The `cli.vite.packageManager` option tells the plugin which package manager your
project uses. Supported values: `"npm"` (default), `"pnpm"`, `"yarn"`, `"bun"`.

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

- **`neu vite create`** – scaffolds projects (`create-vite`, `sv`) and installs
  dependencies with the configured manager.
- **`neu vite dev`** – launches the NeutralinoJS app window through the
  configured manager's runner.

> [!NOTE]
> This option only affects this plugin's own commands (`neu vite ...`). The
> rest of the neu CLI keeps using npm internally regardless of your setting,
> e.g. when installing or removing plugins through `neu plugins`, or when
> checking for CLI updates. Core commands like `neu run` and `neu build`
> don't invoke any package manager at all.
>
> For the same reason, `neu vite build` does not use the package manager
> either: it reads the `build` script from `vite-src/package.json` and
> executes it directly, so it works identically regardless of the configured
> value.

## Contributing

Contributions are welcome! There are no strict rules beyond the usual ones:

1. **Fork and clone** the repository.
2. **Create a branch** for your change (`git checkout -b my-fix`).
3. **Install dependencies and make your changes** at the repository root:
   ```bash
   cd neutralinojs-plugin-vite
   npm install
   ```
4. **Add or update tests** covering your change when applicable.
5. **Verify everything passes before pushing:**
   ```bash
   npm run build   # type-checks (tsc) and bundles (rolldown)
   npm test        # runs the vitest suite
   ```
6. **Open an issue first** if you are proposing a big feature or found a bug worth
   discussing, so we can align on the approach before you invest time.
7. **Open a Pull Request** describing:
   - The problem it solves (with steps to reproduce, if it is a bug).
   - How it is solved and why that approach was chosen.
   - How to test it manually, plus which tests were added.

### Testing the plugin locally

You can install your own build into the global `neu` CLI — no npm publishing needed.

> [!NOTE]
> These steps assume the [neu CLI](https://neutralino.js.org/docs/cli/neu-cli)
> is already installed globally.

#### 1. Build the plugin

```bash
git clone https://github.com/IsmaCortGtz/neutralinojs-plugin-vite.git
cd neutralinojs-plugin-vite
npm install
npm run build
```

#### 2. Register your local build in the global CLI

The CLI ships a test mode for exactly this purpose. Pass `--test` with a local path
instead of a package name:

```bash
neu plugins --add --test /absolute/path/to/neutralinojs-plugin-vite
```

This copies your build into the CLI's own dependencies and registers the plugin,
so every `neu` invocation picks it up.

Verify that everything works:

```bash
neu plugins        # should list neutralinojs-plugin-vite
neu vite version   # should print your local version
```

#### 3. Iterate on your changes

The CLI installs your plugin folder as a **symlink**, so your working directory
is what actually runs. After modifying the code, rebuilding is enough — no need
to re-register:

```bash
npm run build
```

Then run `neu vite ...` again and you will be testing the fresh build.

<details>
<summary><strong>Troubleshooting: if your setup installed a copy instead of a symlink</strong></summary>

Depending on the package manager or npm version used under the hood, the
installation may end up as a copy instead of a symlink. You can check it with:

```bash
ls -la "$(npm root -g)/@neutralinojs/neu/node_modules/" | grep neutralinojs-plugin-vite
```

If it is a real directory (not a `->` symlink), either re-run the registration,
or replace it manually for instant iteration:

```bash
NEU_ROOT="$(npm root -g)/@neutralinojs/neu"

rm -rf "$NEU_ROOT/node_modules/neutralinojs-plugin-vite"
ln -s "$(pwd)" "$NEU_ROOT/node_modules/neutralinojs-plugin-vite"
```

On Windows, use an elevated prompt instead of `ln -s`:

```bat
rmdir /s /q "%NEU_ROOT%\node_modules\neutralinojs-plugin-vite"
mklink /D "%NEU_ROOT%\node_modules\neutralinojs-plugin-vite" C:\path\to\neutralinojs-plugin-vite
```

</details>

#### 4. Restore the published version

When you are done testing, go back to the stable release from npm:

```bash
neu plugins --remove neutralinojs-plugin-vite
neu plugins --add neutralinojs-plugin-vite
```

## Requirements

- Node.js >= 16
- [neu-cli](https://neutralino.js.org/docs/cli/neu-cli) installed globally

## License

This project is licensed under the MIT License.