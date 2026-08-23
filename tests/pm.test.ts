import { describe, expect, it } from 'vitest';
import {
  resolvePackageManager,
  installCommand,
  execCommandFor,
  createViteCommand,
  createSvelteKitCommand,
  runNeuCommand,
} from '@/utils/pm';

describe('resolvePackageManager()', () => {
  it.each([
    [undefined, 'npm'],
    [{}, 'npm'],
    [{ cli: {} }, 'npm'],
    [{ cli: { vite: {} } }, 'npm'],
    [{ cli: { vite: { packageManager: 'npm' } } }, 'npm'],
    [{ cli: { vite: { packageManager: 'pnpm' } } }, 'pnpm'],
    [{ cli: { vite: { packageManager: 'bun' } } }, 'bun'],
    [{ cli: { vite: { packageManager: 'yarn' } } }, 'yarn'],
    [{ cli: { vite: { packageManager: ' BUN ' } } }, 'bun'],
  ] as const)('resolves %j to %s', (config, expected) => {
    expect(resolvePackageManager(config)).toBe(expected);
  });

  it.each(['npm9', 'conda', 'cargo', '', '   '])('falls back to npm for invalid value %s', (invalid) => {
    expect(resolvePackageManager({ cli: { vite: { packageManager: invalid } } })).toBe('npm');
  });

  it('falls back to npm when packageManager is not a string', () => {
    expect(resolvePackageManager({ cli: { vite: { packageManager: 42 } } })).toBe('npm');
  });
});

describe('installCommand()', () => {
  it.each([
    ['npm', 'npm install'],
    ['pnpm', 'pnpm install'],
    ['yarn', 'yarn install'],
    ['bun', 'bun install'],
  ] as const)('builds %s install command', (pm, expected) => {
    expect(installCommand(pm)).toBe(expected);
  });
});

describe('execCommandFor()', () => {
  it('maps each manager to its npx-like runner', () => {
    expect(execCommandFor('npm')).toEqual({ cmd: 'npx', args: ['-y'] });
    expect(execCommandFor('pnpm')).toEqual({ cmd: 'pnpm', args: ['dlx'] });
    expect(execCommandFor('yarn')).toEqual({ cmd: 'yarn', args: ['dlx'] });
    expect(execCommandFor('bun')).toEqual({ cmd: 'bunx', args: [] });
  });
});

describe('createViteCommand()', () => {
  it('builds the create-vite invocation for bun', () => {
    const { cmd, args } = createViteCommand('bun', 'my-app', 'react-ts');
    expect(cmd).toBe('bunx');
    expect(args).toEqual(['create-vite@latest', 'my-app', '--template', 'react-ts', '--no-interactive']);
  });
});

describe('createSvelteKitCommand()', () => {
  it('builds the sv invocation with --types for typed variants', () => {
    const { cmd, args } = createSvelteKitCommand('pnpm', 'ts', 'sk-app');
    expect(cmd).toBe('pnpm');
    expect(args).toEqual([
      'dlx', 'sv', 'create', '--template', 'minimal', '--types ts',
      '--install', 'pnpm', 'sk-app', '--no-add-ons', '--no-dir-check',
    ]);
  });

  it('builds the sv invocation with --no-types when requested', () => {
    const { args } = createSvelteKitCommand('yarn', 'no-types', 'sk-app');
    expect(args).toContain('--no-types');
    expect(args.join(' ')).not.toMatch(/--types(?!-)/);
  });
});

describe('runNeuCommand()', () => {
  it('launches neu through the manager runner keeping extra args order', () => {
    const { cmd, args } = runNeuCommand('npm', ['run', '--', '--port=5000']);
    expect(cmd).toBe('npx');
    expect(args).toEqual(['-y', 'neu', 'run', '--', '--port=5000']);
  });

  it('launches neu through bunx for bun', () => {
    const { cmd, args } = runNeuCommand('bun', ['update']);
    expect(cmd).toBe('bunx');
    expect(args).toEqual(['neu', 'update']);
  });
});
