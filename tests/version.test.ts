import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import neuViteVersionCommand, { compareVersions, fetchLatestVersion } from '@/commands/version';
import { captureConsole } from './helpers';

let cons: ReturnType<typeof captureConsole>;

beforeEach(() => {
  cons = captureConsole();
});

afterEach(() => {
  cons.restore();
  vi.unstubAllGlobals();
});

function stubRegistry(latest: string | null, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
    if (latest === null || !ok) return { ok: false, json: async () => ({}) };
    return {
      ok: true,
      json: async () => ({ 'dist-tags': { latest } }),
    };
  }));
}

async function runCommand() {
  const action = neuViteVersionCommand({} as never, {} as never);
  await action();
}

describe('compareVersions()', () => {
  it.each([
    ['1.0.0', '1.0.0', 0],
    ['0.0.2', '0.1.0', -1],
    ['1.2.3', '1.2.2', 1],
    ['0.10.0', '0.9.9', 1], // numeric, not lexicographic
    ['v1.0.0', '1.0.0', 0], // v prefix tolerated
    ['2.0', '2.0.0', 0], // missing parts count as zero
    ['1.0.0-beta', '1.0.0', 0], // prerelease suffix ignored (documented simplification)
  ] as const)('compares %s vs %s as %i sign', (a, b, expectedSign) => {
    const result = compareVersions(a, b);
    expect(Math.sign(result)).toBe(expectedSign);
  });
});

describe('fetchLatestVersion()', () => {
  it('reads dist-tags.latest from the npm registry', async () => {
    stubRegistry('9.9.9');
    await expect(fetchLatestVersion()).resolves.toBe('9.9.9');
  });

  it('returns null when the registry responds with an error status', async () => {
    stubRegistry(null);
    await expect(fetchLatestVersion()).resolves.toBeNull();
  });

  it('returns null when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ENETDOWN')));
    await expect(fetchLatestVersion()).resolves.toBeNull();
  });

  it('returns null when the payload has no latest tag', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    await expect(fetchLatestVersion()).resolves.toBeNull();
  });
});

describe('neu vite version', () => {
  it('shows the current version and confirms it is up to date', async () => {
    const pkg = (await import('../../package.json')) as { name: string; version: string };
    stubRegistry(pkg.version);

    await runCommand();

    expect(cons.output()).toContain(`${pkg.name} version: ${pkg.version}`);
    expect(cons.output()).toMatch(/using the latest version/);
  });

  it('announces newer versions with update instructions', async () => {
    const pkg = (await import('../../package.json')) as { name: string; version: string };
    stubRegistry(`${pkg.version.split('.')[0]}.${Number(pkg.version.split('.')[1]) + 1}.0`);

    await runCommand();

    expect(cons.output()).toMatch(/A new version .* is available/);
    expect(cons.output()).toMatch(/neu plugins --remove/);
    expect(cons.output()).toMatch(/neu plugins --add/);
  });

  it('handles being ahead of the registry gracefully', async () => {
    const pkg = (await import('../../package.json')) as { name: string; version: string };
    const [major, minor, patch] = pkg.version.split('.').map(Number);
    // build a version strictly below the local one
    const older = patch > 0
      ? `${major}.${minor}.${patch - 1}`
      : minor > 0
        ? `${major}.${minor - 1}.99`
        : `${major - 1}.99.99`;
    stubRegistry(older);

    await runCommand();

    expect(cons.output()).toMatch(/ahead of the published version/);
  });

  it('warns instead of failing when npm cannot be reached', async () => {
    stubRegistry(null);

    await runCommand();

    expect(cons.output()).toMatch(/Could not check the latest version on npm/);
  });
});
