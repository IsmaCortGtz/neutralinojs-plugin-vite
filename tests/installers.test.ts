import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import getInstaller, { ViteInstaller, SvelteInstaller } from '@/modules/installers';
import type { CreateData } from '@/types';
import { cleanupTempDirs, makeTempDir, writeFile } from './helpers';

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return {
    ...actual,
    spawnSync: vi.fn().mockReturnValue({ status: 0 }),
  };
});

import { spawnSync } from 'node:child_process';

afterEach(() => {
  cleanupTempDirs();
  vi.unstubAllGlobals();
});

function makeData(overrides: Partial<CreateData> = {}): CreateData {
  return {
    projectName: 'my-app',
    packageName: 'my-app',
    variant: 'react-ts',
    installer: 'vite',
    installDependencies: false,
    openAppAfterCreation: false,
    ...overrides,
  };
}

describe('getInstaller()', () => {
  it('returns a ViteInstaller for the vite installer', () => {
    expect(getInstaller(makeData({ installer: 'vite' }))).toBeInstanceOf(ViteInstaller);
  });

  it('returns a SvelteInstaller for the sv installer', () => {
    expect(getInstaller(makeData({ installer: 'sv' }))).toBeInstanceOf(SvelteInstaller);
  });

  it('throws on unknown installers', () => {
    expect(() => getInstaller(makeData({ installer: 'angular' as never }))).toThrow(/Unknown installer/);
  });
});

describe('ViteInstaller.patchHtml()', () => {
  it('replaces the title and injects the neutralino globals script', async () => {
    const dir = makeTempDir();
    writeFile(dir, 'index.html', '<html><head><title>Vite + React</title></head><body></body></html>');

    await new ViteInstaller(makeData({ projectName: 'My Cool App' })).patchHtml(dir);

    const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    expect(html).toContain('<title>My Cool App</title>');
    expect(html).toContain('<script src="/__neutralino_globals.js" vite-ignore></script>');
    expect(html).not.toContain('Vite + React');
  });
});

describe('SvelteInstaller.patchHtml()', () => {
  it('injects the neutralino globals script into src/app.html head', async () => {
    const dir = makeTempDir();
    writeFile(dir, path.join('src', 'app.html'), '<html><head><meta charset="utf8" /></head><body></body></html>');

    await new SvelteInstaller(makeData()).patchHtml(dir);

    const html = fs.readFileSync(path.join(dir, 'src', 'app.html'), 'utf8');
    expect(html).toMatch(/<head>\s*<script src="\/__neutralino_globals\.js" vite-ignore><\/script>/);
  });
});

describe('BaseInstaller.patchPackageJson()', () => {
  const modules = (configData: unknown) => ({
    config: { get: () => configData, update: vi.fn() },
  }) as never;

  it('pins @neutralinojs/lib to cli.clientVersion when present', async () => {
    const dir = makeTempDir();
    writeFile(dir, 'package.json', JSON.stringify({ name: 'x', dependencies: { react: '^19.0.0' } }));

    await new ViteInstaller(makeData()).patchPackageJson(dir, modules({ cli: { clientVersion: '6.1.0', binaryVersion: '6.9.0' } }));

    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    expect(pkg.dependencies['@neutralinojs/lib']).toBe('6.1.0');
    expect(pkg.dependencies.react).toBe('^19.0.0');
  });

  it('falls back to cli.binaryVersion when clientVersion is missing', async () => {
    const dir = makeTempDir();
    writeFile(dir, 'package.json', JSON.stringify({ name: 'x', dependencies: {} }));

    await new ViteInstaller(makeData()).patchPackageJson(dir, modules({ cli: { binaryVersion: '6.9.0' } }));

    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    expect(pkg.dependencies['@neutralinojs/lib']).toBe('6.9.0');
  });

  it('fetches the latest version from npm when no config versions exist', async () => {
    const dir = makeTempDir();
    writeFile(dir, 'package.json', JSON.stringify({ name: 'x', dependencies: {} }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({ 'dist-tags': { latest: '7.7.7' } }),
    }));

    await new ViteInstaller(makeData()).patchPackageJson(dir, modules({}));

    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    expect(pkg.dependencies['@neutralinojs/lib']).toBe('7.7.7');
  });
});

describe('scaffold command construction', () => {
  it('vite scaffold runs create-vite through the configured manager', async () => {
    vi.mocked(spawnSync).mockClear();
    await new ViteInstaller(makeData({ packageName: 'demo', variant: 'vue-ts', packageManager: 'npm' })).scaffold();
    expect(vi.mocked(spawnSync).mock.calls[0].slice(0, 2)).toEqual([
      'npx',
      ['-y', 'create-vite@latest', 'demo', '--template', 'vue-ts', '--no-interactive'],
    ]);
  });

  it('sv scaffold maps no-types variant to --no-types and installs with the manager', async () => {
    vi.mocked(spawnSync).mockClear();
    await new SvelteInstaller(makeData({ packageName: 'demo', variant: 'no-types', packageManager: 'pnpm' })).scaffold();
    const [cmd, args] = vi.mocked(spawnSync).mock.calls[0] as [string, string[]];
    expect(cmd).toBe('pnpm');
    expect(args[0]).toBe('dlx');
    expect(args.slice(1)).toEqual([
      'sv', 'create', '--template', 'minimal', '--no-types', '--install', 'pnpm', 'demo', '--no-add-ons', '--no-dir-check',
    ]);
    expect(args.join(' ')).not.toContain('--types ');
  });

  it.each(['pnpm', 'yarn', 'bun'] as const)('vite scaffold uses the %s exec runner', async (pm) => {
    vi.mocked(spawnSync).mockClear();
    await new ViteInstaller(makeData({ packageName: 'demo', variant: 'react-ts', packageManager: pm })).scaffold();
    const [cmd, args] = vi.mocked(spawnSync).mock.calls[0] as [string, string[]];
    if (pm === 'bun') {
      expect(cmd).toBe('bunx');
      expect(args[0]).toBe('create-vite@latest');
    } else {
      expect(cmd).toBe(pm);
      expect(args[0]).toBe('dlx');
      expect(args[1]).toBe('create-vite@latest');
    }
  });
});
