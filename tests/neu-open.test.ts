import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return {
    ...actual,
    spawn: vi.fn().mockImplementation(() => {
      const fake = new EventEmitter() as EventEmitter & { on: EventEmitter['on'] };
      return fake;
    }),
  };
});

vi.mock('@/utils/findPort', () => ({
  findPort: vi.fn().mockResolvedValue(4242),
}));

import { makeTempDir, cleanupTempDirs } from './helpers';
import { spawn } from 'node:child_process';
import neu from '@/modules/neu';

const spawnMock = vi.mocked(spawn);

let cwd: string;

beforeEach(() => {
  cwd = makeTempDir('neu-open-');
});

afterEach(() => {
  spawnMock.mockClear();
  cleanupTempDirs();
});

describe('neu.open()', () => {
  it('launches `neu run` through npx by default with the resolved port and uid', async () => {
    const url = await neu.open('http://localhost:5173', cwd);

    expect(spawnMock).toHaveBeenCalledTimes(1);
    const [cmd, args, opts] = spawnMock.mock.calls[0] as [string, string[], any];

    expect(cmd).toBe('npx');
    expect(args[0]).toBe('-y');
    expect(args[1]).toBe('neu');
    expect(args[2]).toBe('run');
    expect(args[3]).toBe('--');

    const urlFlag = args.find((a) => a.startsWith('--url='));
    expect(args).toContain(`--port=${url.port}`);
    expect(urlFlag).toContain(`neutralinoViteUid=${url.uuid}`);
    expect(opts.cwd).toBe(cwd);
    expect(opts.stdio).toEqual(['ignore', expect.any(Number), expect.any(Number)]);
  });

  it.each(['pnpm', 'yarn'] as const)('launches neu via %s dlx when configured', async (pm) => {
    await neu.open('http://localhost:5173', cwd, pm);
    const [cmd, args] = spawnMock.mock.calls[0] as unknown as [string, string[]];
    expect(cmd).toBe(pm);
    expect(args[0]).toBe('dlx');
    expect(args[1]).toBe('neu');
  });

  it('launches neu via bunx for bun', async () => {
    await neu.open('http://localhost:5173', cwd, 'bun');
    const [cmd, args] = spawnMock.mock.calls[0] as unknown as [string, string[]];
    expect(cmd).toBe('bunx');
    expect(args[0]).toBe('neu');
  });

  it('registers lifecycle listeners for the spawned process', async () => {
    const proc = await neu.open('http://localhost:5173', cwd);
    void proc;
    const fakeProcess = spawnMock.mock.results[0].value as unknown as EventEmitter;
    expect(fakeProcess.eventNames().includes('spawn')).toBe(true);
    expect(fakeProcess.eventNames().includes('close')).toBe(true);
  });
});
