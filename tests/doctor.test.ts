import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { doctor } from '@/modules/neu';
import { captureConsole, cleanupTempDirs, makeTempDir, writeFile } from './helpers';

let cons: ReturnType<typeof captureConsole>;

beforeEach(() => {
  cons = captureConsole();
});

afterEach(() => {
  cons.restore();
  cleanupTempDirs();
});

function makeValidProject() {
  const root = makeTempDir();
  writeFile(root, 'neutralino.config.json', JSON.stringify({
    applicationId: 'test.app',
    cli: {
      binaryName: 'test-app',
      vite: { projectPath: '/vite-src' },
    },
  }));
  fs.mkdirSync(path.join(root, 'vite-src'));
  return { root };
}

/** Binary filename for the current platform/arch per the CLI constants. */
function binaryNameFor(platform: string, arch: string): string | null {
  const table: Record<string, Record<string, string>> = {
    linux: { x64: 'neutralino-linux_x64', armhf: 'neutralino-linux_armhf', arm64: 'neutralino-linux_arm64' },
    darwin: { x64: 'neutralino-mac_x64', arm64: 'neutralino-mac_arm64', universal: 'neutralino-mac_universal' },
    win32: { x64: 'neutralino-win_x64.exe' },
  };
  return table[platform]?.[arch] ?? null;
}

const currentBinary = binaryNameFor(process.platform, process.arch);

describe('doctor()', () => {
  it.skipIf(currentBinary === null)('passes on a complete project (current platform/arch)', async () => {
    const { root } = makeValidProject();
    writeFile(root, path.join('bin', currentBinary!), '');
    const config = JSON.parse(fs.readFileSync(path.join(root, 'neutralino.config.json'), 'utf8'));

    const result = await doctor(process.arch, config, root);

    expect(result).toBe(true);
    expect(cons.output()).toMatch(/All pre-flight checks passed/);
  });

  it('fails when the neutralino config file is missing', async () => {
    const root = makeTempDir();

    const result = await doctor(process.arch, {}, root);

    expect(result).toBe(false);
  });

  it('fails when the configured vite project dir does not exist', async () => {
    const { root } = makeValidProject();
    fs.rmSync(path.join(root, 'vite-src'), { recursive: true });
    const config = JSON.parse(fs.readFileSync(path.join(root, 'neutralino.config.json'), 'utf8'));

    const result = await doctor(process.arch, config, root);

    expect(result).toBe(false);
    expect(cons.output()).toMatch(/cli\.vite\.projectPath/);
  });

  it('fails when the architecture is not supported', async () => {
    const { root } = makeValidProject();
    const config = JSON.parse(fs.readFileSync(path.join(root, 'neutralino.config.json'), 'utf8'));

    const result = await doctor('sparc64', config, root);

    expect(result).toBe(false);
    expect(cons.output()).toMatch(/Some pre-flight checks failed/);
  });

  it('fails when the neutralino binary has not been downloaded', async () => {
    const { root } = makeValidProject();
    const config = JSON.parse(fs.readFileSync(path.join(root, 'neutralino.config.json'), 'utf8'));

    const result = await doctor(process.arch, config, root);

    expect(result).toBe(false);
    expect(cons.output()).toMatch(/neu update/);
  });
});
