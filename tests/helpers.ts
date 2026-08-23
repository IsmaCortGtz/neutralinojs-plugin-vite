import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { vi } from 'vitest';
import type { NeuPluginModules } from '@/types';

// ==== process.exit stubbing ====

export function stubProcessExit() {
  const exitCalls: Array<number | undefined> = [];
  const spy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    exitCalls.push(code);
    throw new Error(`__process_exit__: ${code ?? 0}`);
  }) as never);
  return {
    exitCalls,
    restore: () => spy.mockRestore(),
  };
}

// ==== console capture ====

export function captureConsole() {
  const logs: string[] = [];
  const errors: string[] = [];
  const warns: string[] = [];

  const logSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logs.push(args.map(String).join(' '));
  });
  const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args.map(String).join(' '));
  });
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    warns.push(args.map(String).join(' '));
  });

  return {
    logs,
    errors,
    warns,
    output: () => [...logs, ...errors, ...warns].join('\n'),
    restore: () => {
      logSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    },
  };
}

/** Runs `fn` with console captured and process.exit stubbed. */
export async function withStubs<T>(fn: () => Promise<T>) {
  const cons = captureConsole();
  const exit = stubProcessExit();
  try {
    const result = await fn();
    return { result, ...cons, exitCalls: exit.exitCalls };
  } finally {
    cons.restore();
    exit.restore();
  }
}

// ==== fake NeuPluginModules ====

type AnyFn = (...args: never[]) => unknown;

export function makeModules(configData: unknown): NeuPluginModules & Record<string, any> {
  return {
    bundler: { bundleApp: vi.fn().mockResolvedValue(undefined) },
    creator: { createApp: vi.fn().mockResolvedValue(undefined) },
    downloader: {
      downloadTemplate: vi.fn().mockResolvedValue(undefined),
      downloadAndUpdateBinaries: vi.fn().mockResolvedValue(undefined),
      downloadAndUpdateClient: vi.fn().mockResolvedValue(undefined),
      isValidTemplate: vi.fn().mockResolvedValue(true),
      getRemoteLatestVersion: vi.fn().mockResolvedValue('0.0.0'),
    },
    runner: { runApp: vi.fn().mockResolvedValue(undefined) },
    config: {
      update: vi.fn(),
      get: () => configData,
    },
    websocket: { start: vi.fn(), stop: vi.fn(), dispatch: vi.fn() },
  } as unknown as NeuPluginModules;
}

// ==== temp fixtures ====

const createdDirs: string[] = [];

export function makeTempDir(prefix = 'neu-vite-test-'): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  createdDirs.push(dir);
  return dir;
}

export function cleanupTempDirs() {
  while (createdDirs.length) {
    const dir = createdDirs.pop()!;
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function writeFile(root: string, relPath: string, content: string) {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

export interface BuildFixtureOptions {
  /** Whether to write neutralino.config.json at the root (default true). */
  configFile?: boolean;
  /** Value for cli.vite.projectPath (default '/vite-src'). Pass null in neuConfig.cli.vite to omit. */
  projectPath?: string;
  /** Extra keys merged into the neutralino config object. */
  neuConfig?: Record<string, unknown>;
  /** Directory name of the vite project inside root (default 'vite-src'). */
  viteDirName?: string;
  /** package.json contents; null omits the file entirely (default auto). */
  packageJson?: Record<string, unknown> | null;
  /** Contents of build.cjs placed next to package.json (default writes a cwd marker). */
  buildScriptBody?: string;
}

export interface BuildFixture {
  root: string;
  viteDir: string;
}

/**
 * Creates a Neutralino project root on a temp dir with an embedded vite
 * project whose "build" script runs `node build.cjs`.
 */
export function createBuildFixture(opts: BuildFixtureOptions = {}): BuildFixture {
  const {
    configFile = true,
    projectPath = '/vite-src',
    neuConfig = {},
    viteDirName = 'vite-src',
    packageJson,
    buildScriptBody = defaultBuildScriptBody('build-marker.txt'),
  } = opts;

  const root = makeTempDir();
  const viteDir = path.join(root, viteDirName.replace(/^\/|\/$/g, ''));
  fs.mkdirSync(viteDir, { recursive: true });

  if (configFile) {
    const cli: Record<string, any> = {
      binaryName: 'test-app',
      resourcesPath: '/vite-src/dist/',
      ...(neuConfig.cli ?? {}),
    };
    // null => omit the vite key entirely (for guard tests)
    if (neuConfig.cli?.vite === null) delete cli.vite;
    else cli.vite = { projectPath, ...(neuConfig.cli?.vite ?? {}) };

    const config = {
      applicationId: 'test.app',
      version: '1.0.0',
      defaultMode: 'window',
      url: '/',
      modes: { window: { title: 'test' } },
      ...neuConfig,
      cli,
    };
    writeFile(root, 'neutralino.config.json', JSON.stringify(config, null, 2));
  }

  if (packageJson !== null) {
    const pkg = {
      name: 'fixture-vite-app',
      version: '0.0.0',
      scripts: {
        build: 'node build.cjs',
        ...(packageJson?.scripts ?? {}),
      },
      ...(packageJson ?? {}),
    };
    writeFile(viteDir, 'package.json', JSON.stringify(pkg, null, 2));
  }

  writeFile(viteDir, 'build.cjs', buildScriptBody);

  return { root, viteDir };
}

function defaultBuildScriptBody(markerFile: string) {
  return `
const fs = require('fs');
fs.writeFileSync(${JSON.stringify(markerFile)}, process.cwd());
`;
}

/**
 * Writes an executable shim into <viteDir>/node_modules/.bin/<name>
 * (.cmd variant included for Windows PATHEXT resolution).
 */
export function writeBinShim(viteDir: string, name: string, body: string) {
  const binDir = path.join(viteDir, 'node_modules', '.bin');
  fs.mkdirSync(binDir, { recursive: true });
  const shimPath = path.join(binDir, name);
  fs.writeFileSync(shimPath, `#!/usr/bin/env sh\n${body}\n`, { mode: 0o755 });
  fs.writeFileSync(
    shimPath + '.cmd',
    `@echo off\r\n${body.replace(/"/g, '')}\r\n`,
  );
}
