import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureConsole,
  cleanupTempDirs,
  makeModules,
  makeTempDir,
  stubProcessExit,
} from './helpers';

vi.mock('@/modules/neu', () => ({
  default: {
    doctor: vi.fn(),
    open: vi.fn(),
  },
}));

vi.mock('@/modules/vite', () => ({
  startServer: vi.fn(),
}));

import neuViteDevCommand from '@/commands/dev';
import neuModule from '@/modules/neu';
import { startServer } from '@/modules/vite';

const originalCwd = process.cwd();

let cons: ReturnType<typeof captureConsole>;
let exit: ReturnType<typeof stubProcessExit>;

beforeEach(() => {
  cons = captureConsole();
  exit = stubProcessExit();
  vi.mocked(neuModule.doctor).mockReset();
  vi.mocked(startServer).mockReset();
});

afterEach(() => {
  process.chdir(originalCwd);
  cons.restore();
  exit.restore();
  cleanupTempDirs();
  vi.restoreAllMocks();
});

function runAction(modules: any, options: Record<string, unknown> = {}, root?: string) {
  const action = neuViteDevCommand({} as never, modules);
  const run = () => action(options as never, {} as never);
  if (root) process.chdir(root);
  return run().finally(() => {
    if (root) process.chdir(originalCwd);
  });
}

describe('neu vite dev', () => {
  it('starts the server on the configured vite project path when checks pass', async () => {
    const root = makeTempDir();
    const modules = makeModules({ cli: { vite: { projectPath: '/vite-src' } } });
    vi.mocked(neuModule.doctor).mockResolvedValue(true);

    await runAction(modules, {}, root);

    expect(neuModule.doctor).toHaveBeenCalledWith(process.arch, modules.config.get());
    expect(startServer).toHaveBeenCalledTimes(1);
    expect(startServer).toHaveBeenCalledWith(path.join(root, 'vite-src'), 'npm');
    expect(exit.exitCalls).toEqual([]);
  });

  it('reads the configuration only once', async () => {
    const root = makeTempDir();
    const modules = makeModules({ cli: { vite: { projectPath: '/vite-src' } } });
    const getSpy = vi.spyOn(modules.config, 'get');
    vi.mocked(neuModule.doctor).mockResolvedValue(true);

    await runAction(modules, {}, root);

    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('passes --arch to doctor', async () => {
    const root = makeTempDir();
    const modules = makeModules({ cli: { vite: { projectPath: '/vite-src' } } });
    vi.mocked(neuModule.doctor).mockResolvedValue(true);

    await runAction(modules, { arch: 'arm64' }, root);

    expect(neuModule.doctor).toHaveBeenCalledWith('arm64', modules.config.get());
  });

  it('exits with code 1 and does not start anything when doctor fails', async () => {
    const root = makeTempDir();
    const modules = makeModules({ cli: { vite: { projectPath: '/vite-src' } } });
    vi.mocked(neuModule.doctor).mockResolvedValue(false);

    await expect(runAction(modules, {}, root)).rejects.toThrow(/__process_exit__/);

    // first exit is the meaningful one (a trailing 1 can appear because our
    // stubbed exit throws and re-enters the command catch)
    expect(exit.exitCalls[0]).toBe(1);
    expect(startServer).not.toHaveBeenCalled();
  });

  it('exits with code 1 when startServer throws', async () => {
    const root = makeTempDir();
    const modules = makeModules({ cli: { vite: { projectPath: '/vite-src' } } });
    vi.mocked(neuModule.doctor).mockResolvedValue(true);
    vi.mocked(startServer).mockRejectedValue(new Error('vite not installed'));

    await expect(runAction(modules, {}, root)).rejects.toThrow(/__process_exit__/);

    expect(exit.exitCalls).toEqual([1]);
    expect(cons.output()).toMatch(/vite not installed/);
  });
});
