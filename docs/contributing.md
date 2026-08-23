# Contributing

Contributions are welcome! There are no strict rules beyond the usual ones:

1. **Fork and clone** the repository.
2. **Create a branch** for your change (`git checkout -b my-fix`).
3. **Install dependencies and make your changes** at the repository root:

   ```bash
   npm install
   ```

4. **Add or update tests** covering your change when applicable.
5. **Verify everything passes before pushing:**

   ```bash
   npm run build   # type-checks (tsc) and bundles (rolldown)
   npm test        # runs the vitest suite
   ```

6. **Open an issue first** if you are proposing a big feature or found a bug worth discussing, so we can align on the approach before you invest time.
7. **Open a Pull Request** describing:
   - The problem it solves (with steps to reproduce, if it is a bug).
   - How it is solved and why that approach was chosen.
   - How to test it manually, plus which tests were added.

> [!TIP]
> The documentation lives in `docs/` and is built with VitePress (`npm run docs:dev` to preview it locally). Docs-only PRs are very welcome too.

## Testing the plugin locally

You can install your own build into the global `neu` CLI — no npm publishing needed.

> [!NOTE]
> These steps assume the [neu CLI](https://neutralino.js.org/docs/cli/neu-cli) is already installed globally.

### 1. Build the plugin

```bash
git clone https://github.com/IsmaCortGtz/neutralinojs-plugin-vite.git
cd neutralinojs-plugin-vite
npm install
npm run build
```

### 2. Register your local build in the global CLI

The CLI ships a test mode for exactly this purpose. Pass `--test` with a local path instead of a package name:

```bash
neu plugins --add --test /absolute/path/to/neutralinojs-plugin-vite
```

This copies your build into the CLI's own dependencies and registers the plugin, so every `neu` invocation picks it up.

Verify that everything works:

```bash
neu plugins        # should list neutralinojs-plugin-vite
neu vite version   # should print your local version
```

### 3. Iterate on your changes

The CLI installs your plugin folder as a **symlink**, so your working directory is what actually runs. After modifying the code, rebuilding is enough — no need to re-register:

```bash
npm run build
```

Then run `neu vite ...` again and you will be testing the fresh build.

<details>
<summary><strong>Troubleshooting: if your setup installed a copy instead of a symlink</strong></summary>

Depending on the package manager or npm version used under the hood, the installation may end up as a copy instead of a symlink. You can check it with:

```bash
ls -la "$(npm root -g)/@neutralinojs/neu/node_modules/" | grep neutralinojs-plugin-vite
```

If it is a real directory (not a `->` symlink), either re-run the registration, or replace it manually for instant iteration:

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

### 4. Restore the published version

When you are done testing, go back to the stable release from npm:

```bash
neu plugins --remove neutralinojs-plugin-vite
neu plugins --add neutralinojs-plugin-vite
```
