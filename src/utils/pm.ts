/**
 * Package manager support for the plugin.
 *
 * The active package manager is read from `cli.vite.packageManager`
 * in neutralino.config.json and falls back to "npm".
 */
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

const KNOWN_PACKAGE_MANAGERS: PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun'];

/** Resolves the configured package manager, falling back to "npm". */
export function resolvePackageManager(config: unknown): PackageManager {
  const raw = (config as any)?.cli?.vite?.packageManager;
  const name = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return (KNOWN_PACKAGE_MANAGERS as string[]).includes(name)
    ? (name as PackageManager)
    : 'npm';
}

/** Dependency installation command for each package manager. */
export function installCommand(pm: PackageManager): string {
  return `${pm} install`;
}

/**
 * Command used to execute CLI tools/packages (npx-like semantics),
 * so scaffolding and app launching work the same under every manager.
 */
export function execCommandFor(pm: PackageManager): { cmd: string; args: string[] } {
  switch (pm) {
    case 'pnpm':
      return { cmd: 'pnpm', args: ['dlx'] };
    case 'yarn':
      return { cmd: 'yarn', args: ['dlx'] };
    case 'bun':
      return { cmd: 'bunx', args: [] };
    case 'npm':
    default:
      return { cmd: 'npx', args: ['-y'] };
  }
}

/** Builds the `create-vite` scaffold invocation for the given manager. */
export function createViteCommand(pm: PackageManager, packageName: string, variant: string): { cmd: string; args: string[] } {
  const { cmd, args } = execCommandFor(pm);
  return {
    cmd,
    args: [...args, 'create-vite@latest', packageName, '--template', variant, '--no-interactive'],
  };
}

/** Builds the `sv` (SvelteKit) scaffold invocation for the given manager. */
export function createSvelteKitCommand(pm: PackageManager, variant: string, packageName: string): { cmd: string; args: string[] } {
  const { cmd, args } = execCommandFor(pm);
  const typesFlag = variant === 'no-types' ? '--no-types' : `--types ${variant}`;
  return {
    cmd,
    args: [
      ...args,
      'sv',
      'create',
      '--template',
      'minimal',
      typesFlag,
      '--install',
      pm,
      packageName,
      '--no-add-ons',
      '--no-dir-check',
    ],
  };
}

/** Builds the arguments needed to launch the neu CLI through the manager. */
export function runNeuCommand(pm: PackageManager, neuArgs: string[]): { cmd: string; args: string[] } {
  const { cmd, args } = execCommandFor(pm);
  return { cmd, args: [...args, 'neu', ...neuArgs] };
}
