# Updating the Plugin

## Check your version

```bash
neu vite version
```

The command prints the installed plugin version and compares it against the latest release published on npm:

- **Up to date** — nothing to do.
- **A new version is available** — it prints the exact update steps (below).
- **Ahead of npm** — you are running a local/newer build.
- **Offline** — the registry check is skipped with a warning.

Version comparison ignores pre-release suffixes, so `1.0.0-beta` counts as `1.0.0`.

## Update

Updating means removing and re-adding the plugin:

```bash
neu plugins --remove neutralinojs-plugin-vite
neu plugins --add neutralinojs-plugin-vite
```

Then verify:

```bash
neu vite version
```

> [!TIP]
> Since the plugin runs inside your global `neu` CLI, no project files change during an update.

## Testing unreleased changes

If you want to run the plugin straight from a source checkout instead of the published npm package, see [Contributing → Testing the plugin locally](../contributing.md#testing-the-plugin-locally).
