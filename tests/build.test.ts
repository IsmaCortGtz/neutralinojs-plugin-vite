import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import neuViteBuildCommand from '@/commands/build';
import {
  captureConsole,
  cleanupTempDirs,
  createBuildFixture,
  makeModules,
  stubProcessExit,
  writeFile,
  writeBinShim,
} from './helpers';

const originalCwd = process.cwd();

let cons: ReturnType<typeof captureConsole>;
let exit: ReturnType<typeof stubProcessExit>;

beforeEach(() => {
  cons = captureConsole();
  exit = stubProcessExit();
});

afterEach(() => {
  process.chdir(originalCwd);
  cons.restore();
  exit.restore();
  cleanupTempDirs();
});

function makeModulesFor(root: string) {
  return makeModules(JSON.parse(fs.readFileSync(path.join(root, 'neutralino.config.json'), 'utf8')));
}

/** Runs the command action; swallows the sentinel thrown by the stubbed process.exit. */
async function runAction(modules: any, options: Record<string, unknown> = {}, root?: string) {
  const action = neuViteBuildCommand({} as never, modules);
  const run = () => action(options as never, {} as never);
  if (root) process.chdir(root);
  try {
    await run();
  } catch (e: any) {
    if (!String(e?.message ?? '').startsWith('__process_exit__')) throw e;
  } finally {
    if (root) process.chdir(originalCwd);
  }
}

describe('neu vite build', () => {
  describe('happy path', () => {
    it('runs the vite build script inside the vite project dir, then bundles', async () => {
      const fx = createBuildFixture();
      const modules = makeModulesFor(fx.root);
      let bundleAppCwd = '';
      modules.bundler.bundleApp.mockImplementation(async () => {
        bundleAppCwd = process.cwd();
      });

      await runAction(modules, {}, fx.root);

      // script executed with spawn cwd = vite dir
      const markerPath = path.join(fx.viteDir, 'build-marker.txt');
      expect(fs.existsSync(markerPath)).toBe(true);
      expect(fs.realpathSync(fs.readFileSync(markerPath, 'utf8'))).toBe(fs.realpathSync(fx.viteDir));
      // ...and not in the neutralino root
      expect(fs.existsSync(path.join(fx.root, 'build-marker.txt'))).toBe(false);

      // bundler called once from the neutralino root
      expect(modules.bundler.bundleApp).toHaveBeenCalledTimes(1);
      expect(bundleAppCwd).toBe(fx.root);
      expect(exit.exitCalls).toEqual([]);
    });

    it('runs the build script strictly before calling bundleApp', async () => {
      const fx = createBuildFixture();
      const orderLog = path.join(fx.root, 'order.log');
      writeFile(fx.viteDir, 'build.cjs', `require('fs').appendFileSync(${JSON.stringify(orderLog)}, 'script\\n');`);

      const modules = makeModulesFor(fx.root);
      let logAtBundleTime = '';
      modules.bundler.bundleApp.mockImplementation(async () => {
        logAtBundleTime = fs.existsSync(orderLog) ? fs.readFileSync(orderLog, 'utf8') : '';
      });

      await runAction(modules, {}, fx.root);

      expect(logAtBundleTime).toBe('script\n');
    });

    it('resolves binaries from node_modules/.bin without npm/pnpm/yarn/bun', async () => {
      const fx = createBuildFixture({
        packageJson: { scripts: { build: 'fake-vite-tool' } },
      });
      const marker = path.join(fx.viteDir, 'tool-marker.txt');
      writeBinShim(fx.viteDir, 'fake-vite-tool', `echo ok > ${marker}`);
      const modules = makeModulesFor(fx.root);

      await runAction(modules, {}, fx.root);

      expect(fs.readFileSync(marker, 'utf8').trim()).toBe('ok');
      expect(exit.exitCalls).toEqual([]);
    });

    it('uses cli.vite.projectPath from the neutralino config', async () => {
      const fx = createBuildFixture({ projectPath: '/custom-web', viteDirName: 'custom-web' });
      const modules = makeModulesFor(fx.root);

      await runAction(modules, {}, fx.root);

      expect(fs.existsSync(path.join(fx.viteDir, 'build-marker.txt'))).toBe(true);
    });

    it.each([
      ['release', { release: true }],
      ['embedResources', { embedResources: true }],
      ['copyStorage', { copyStorage: true }],
      ['macosBundle', { macosBundle: true }],
    ] as const)('passes %s through to bundleApp', async (_name, input) => {
      const fx = createBuildFixture();
      const modules = makeModulesFor(fx.root);

      await runAction(modules, input, fx.root);

      expect(modules.bundler.bundleApp).toHaveBeenCalledTimes(1);
      const arg = modules.bundler.bundleApp.mock.calls[0][0];
      const [key] = Object.entries(input)[0];
      expect(arg[key]).toBe(true);
    });

    it('passes no truthy flags by default', async () => {
      const fx = createBuildFixture();
      const modules = makeModulesFor(fx.root);

      await runAction(modules, {}, fx.root);

      const arg = modules.bundler.bundleApp.mock.calls[0][0];
      expect(arg.release).toBeFalsy();
      expect(arg.embedResources).toBeFalsy();
      expect(arg.copyStorage).toBeFalsy();
      expect(arg.macosBundle).toBeFalsy();
    });

    it('--clean removes the previous distribution dir before bundling', async () => {
      const fx = createBuildFixture();
      writeFile(path.join(fx.root, 'dist'), 'stale-artifact.txt', 'old');
      const modules = makeModulesFor(fx.root);

      let distExistsAtBundleTime: boolean | undefined;
      modules.bundler.bundleApp.mockImplementation(async () => {
        distExistsAtBundleTime = fs.existsSync(path.join(fx.root, 'dist'));
      });

      await runAction(modules, { clean: true }, fx.root);

      expect(distExistsAtBundleTime).toBe(false);
    });
  });

  describe('--config-file', () => {
    it('reads the project config from a custom file', async () => {
      const fx = createBuildFixture();
      // move the config to a custom name
      const customName = 'other.config.json';
      fs.renameSync(path.join(fx.root, 'neutralino.config.json'), path.join(fx.root, customName));
      const modules = makeModules(JSON.parse(fs.readFileSync(path.join(fx.root, customName), 'utf8')));

      await runAction(modules, { configFile: customName }, fx.root);

      expect(cons.output()).toMatch(new RegExp(`Using config file: ${customName}`));
      expect(modules.bundler.bundleApp).toHaveBeenCalledTimes(1);
      expect(exit.exitCalls).toEqual([]);
    });

    it('fails when the custom config file does not exist', async () => {
      const fx = createBuildFixture();
      const modules = makeModulesFor(fx.root);

      await runAction(modules, { configFile: 'missing.config.json' }, fx.root);

      expect(exit.exitCalls[0]).toBe(1);
      expect(cons.output()).toMatch(/missing\.config\.json/);
      expect(modules.bundler.bundleApp).not.toHaveBeenCalled();
    });
  });

  describe('error cases', () => {
    it('fails when there is no neutralino.config.json at the root', async () => {
      const fx = createBuildFixture({ configFile: false });
      const modules = makeModules({});

      await runAction(modules, {}, fx.root);

      expect(exit.exitCalls).toEqual([1]);
      expect(cons.output()).toMatch(/neutralino\.config\.json/);
      expect(modules.bundler.bundleApp).not.toHaveBeenCalled();
    });

    it('fails when the vite dir has no package.json', async () => {
      const fx = createBuildFixture({ packageJson: null });
      const modules = makeModulesFor(fx.root);

      await runAction(modules, {}, fx.root);

      expect(exit.exitCalls).toEqual([1]);
      expect(cons.output()).toMatch(/No package\.json found/);
      expect(fs.existsSync(path.join(fx.viteDir, 'build-marker.txt'))).toBe(false);
      expect(modules.bundler.bundleApp).not.toHaveBeenCalled();
    });

    it('fails when package.json has no build script', async () => {
      const fx = createBuildFixture({
        packageJson: { scripts: { dev: 'vite' } },
      });
      const modules = makeModulesFor(fx.root);

      await runAction(modules, {}, fx.root);

      expect(exit.exitCalls).toEqual([1]);
      expect(cons.output()).toMatch(/No "build" script found/);
      expect(fs.existsSync(path.join(fx.viteDir, 'build-marker.txt'))).toBe(false);
      expect(modules.bundler.bundleApp).not.toHaveBeenCalled();
    });

    it('fails when cli.vite.projectPath is missing from the config', async () => {
      const fx = createBuildFixture({ neuConfig: { cli: { vite: null } } });
      const modules = makeModulesFor(fx.root);

      await runAction(modules, {}, fx.root);

      expect(exit.exitCalls[0]).toBe(1);
      expect(cons.output()).toMatch(/cli\.vite\.projectPath/);
      expect(fs.existsSync(path.join(fx.viteDir, 'build-marker.txt'))).toBe(false);
      expect(modules.bundler.bundleApp).not.toHaveBeenCalled();
    });

    it('propagates a non-zero exit code from the build script and skips bundling', async () => {
      const fx = createBuildFixture({
        buildScriptBody: `process.stderr.write('boom\\n'); process.exit(7);`,
      });
      const modules = makeModulesFor(fx.root);

      await runAction(modules, {}, fx.root);

      // first exit carries the script's code; a trailing 1 may appear because
      // our stubbed exit "throws", re-entering the command catch in the test
      expect(exit.exitCalls[0]).toBe(7);
      expect(modules.bundler.bundleApp).not.toHaveBeenCalled();
    });
  });
});
