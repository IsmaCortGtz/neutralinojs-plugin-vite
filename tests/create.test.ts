import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ==== shared mocks ====

const CANCEL = Symbol('clack-cancel');

vi.mock('@clack/prompts', () => ({
  text: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn((v: unknown) => v === CANCEL),
  outro: vi.fn(),
  log: { info: vi.fn(), step: vi.fn() },
}));

vi.mock('@/modules/create', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/create')>();
  return { ...actual, createProject: vi.fn().mockResolvedValue(undefined) };
});

import * as prompts from '@clack/prompts';
import neuViteCreateCommand from '@/commands/create';
import { createProject } from '@/modules/create';
import { cleanupTempDirs, makeModules, makeTempDir, writeFile } from './helpers';

const stubInstaller = vi.hoisted(() => ({
  scaffold: vi.fn().mockResolvedValue(undefined),
  patchHtml: vi.fn().mockResolvedValue(undefined),
  patchPackageJson: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/modules/installers', () => ({
  default: vi.fn(() => stubInstaller),
}));

vi.mock('@/modules/vite', () => ({
  startServer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, execSync: vi.fn() };
});

import { execSync } from 'node:child_process';
import { startServer } from '@/modules/vite';

const originalCwd = process.cwd();

const mockedPrompts = vi.mocked(prompts, true);
const createProjectMock = vi.mocked(createProject);

function resetPromptFlow(answers: {
  name?: string | symbol;
  selections?: Array<Record<string, unknown>>;
  installDependencies?: boolean;
  openApp?: boolean;
}) {
  vi.clearAllMocks();
  mockedPrompts.text.mockResolvedValue(answers.name ?? 'demo-app' as never);
  const selectionQueue = [...(answers.selections ?? [])];
  mockedPrompts.select.mockImplementation(async () => selectionQueue.shift() ?? CANCEL);
  mockedPrompts.confirm
    .mockResolvedValueOnce(answers.installDependencies ?? false)
    .mockResolvedValueOnce(answers.openApp ?? false);
}

function runCommand(modulesConfig: unknown = {}) {
  const modules = makeModules(modulesConfig);
  const action = neuViteCreateCommand({} as never, modules);
  return action({} as never);
}

describe('neu vite create (interactive flow)', () => {
  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDirs();
    vi.restoreAllMocks();
  });

  it('assembles CreateData from the wizard answers and passes it to createProject', async () => {
    resetPromptFlow({
      name: 'demo-app',
      // first select: framework root -> pick "react" node (has variants),
      // second select: pick leaf variant react-ts
      selections: [
        { name: 'react', variants: [] },
        { name: 'react-ts', display: 'TypeScript', installer: 'vite' },
      ],
      installDependencies: true,
    });
    const modules = makeModules({ cli: { vite: { packageManager: 'bun' } } });
    const action = neuViteCreateCommand({} as never, modules);

    await action({} as never);

    expect(createProjectMock).toHaveBeenCalledTimes(1);
    const data = createProjectMock.mock.calls[0][0];
    expect(data.projectName).toBe('demo-app');
    expect(data.packageName).toBe('demo-app');
    expect(data.variant).toBe('react-ts');
    expect(data.installer).toBe('vite');
    expect(data.installDependencies).toBe(true);
    expect(data.openAppAfterCreation).toBe(false); // skipped because prompt only shown when installing deps
    // package manager resolved from the project configuration
    expect(data.packageManager).toBe('bun');
  });

  it('falls back to npm when no package manager is configured', async () => {
    resetPromptFlow({
      name: 'app2',
      selections: [{ name: 'vue-ts', display: 'TypeScript', installer: 'vite' }],
    });
    await runCommand({});

    const data = createProjectMock.mock.calls[0][0];
    expect(data.packageManager).toBe('npm');
    expect(data.variant).toBe('vue-ts');
  });

  it('aborts without calling createProject when the user cancels the name prompt', async () => {
    resetPromptFlow({ name: CANCEL as never });
    await runCommand({});

    expect(createProjectMock).not.toHaveBeenCalled();
    expect(mockedPrompts.cancel).toHaveBeenCalledWith('Operation cancelled');
  });

  it('asks how to proceed when the target directory already has files and honours "cancel"', async () => {
    const cwd = makeTempDir('neu-create-cwd-');
    process.chdir(cwd);
    // non-empty target directory
    fs.mkdirSync(path.join(cwd, 'demo-app'));
    fs.writeFileSync(path.join(cwd, 'demo-app', 'keep.txt'), 'data');

    resetPromptFlow({
      name: 'demo-app',
      selections: [{ value: 'no' }], // first select consumed = dir-not-empty prompt
    });

    await runCommand({});

    expect(createProjectMock).not.toHaveBeenCalled();
    expect(mockedPrompts.cancel).toHaveBeenCalledWith('Operation cancelled');
  });
});

// ==== createProject() internals ====

function makeTemplateDir(): string {
  const dir = makeTempDir('neu-template-');
  writeFile(dir, 'neutralino.config.json', JSON.stringify({
    applicationId: 'js.neutralino.vite',
    modes: { window: { title: 'template' } },
    cli: { binaryName: 'app', resourcesPath: '/vite-src/dist/', vite: { projectPath: '/vite-src/' } },
  }));
  return dir;
}

function baseCreateData(overrides: Record<string, unknown> = {}) {
  return {
    projectName: 'demo-app',
    packageName: 'demo-app',
    variant: 'react-ts',
    installer: 'vite',
    installDependencies: false,
    openAppAfterCreation: false,
    ...overrides,
  };
}

describe('createProject()', () => {
  let templateDir: string;
  let cwd: string;

  beforeEach(() => {
    vi.clearAllMocks();
    // simulate the real scaffold effect: creates <packageName> dir in cwd
    stubInstaller.scaffold.mockImplementation(async () => {
      fs.mkdirSync(path.join(process.cwd(), 'demo-app'), { recursive: true });
    });
    templateDir = makeTemplateDir();
    cwd = makeTempDir('neu-create-run-');
    process.chdir(cwd);
    process.env.NEUVITE_TEMPLATE_DIR = templateDir;
  });

  afterEach(() => {
    delete process.env.NEUVITE_TEMPLATE_DIR;
    cleanupTempDirs();
    process.chdir(originalCwd);
    vi.restoreAllMocks();
  });

  async function realCreateProject(data: Record<string, unknown>, modules: never) {
    const actual = (await vi.importActual('@/modules/create')) as typeof import('@/modules/create');
    return actual.createProject(data as never, modules);
  }

  it('scaffolds, renames to vite-src, patches configs and prints next steps', async () => {
    await realCreateProject(baseCreateData(), makeModules({}) as never);

    // scaffold invoked through the installer
    expect(stubInstaller.scaffold).toHaveBeenCalledTimes(1);

    // created folder renamed to vite-src inside the project dir
    const projectRoot = path.join(cwd, 'demo-app');
    const targetDir = path.join(projectRoot, 'vite-src');
    expect(fs.existsSync(targetDir)).toBe(true);
    expect(stubInstaller.patchHtml).toHaveBeenCalledWith(targetDir);
    expect(stubInstaller.patchPackageJson).toHaveBeenCalled();

    // neutralino config copied from template and patched
    const cfg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'neutralino.config.json'), 'utf8'));
    expect(cfg.cli.binaryName).toBe('demo-app');
    expect(cfg.modes.window.title).toBe('demo-app');

    // no installs, no server
    expect(execSync).not.toHaveBeenCalled();
    expect(startServer).not.toHaveBeenCalled();

    // outro suggests manual steps including the package manager install command
    const outroMsg = vi.mocked(prompts.outro).mock.calls[0][0] as string;
    expect(outroMsg).toContain('neu update');
    expect(outroMsg).toContain('npm install');
    expect(outroMsg).toContain('neu vite dev');
  });

  it('installs neu binaries and dependencies with the configured manager', async () => {
    vi.mocked(execSync).mockReturnValue('' as never);
    await realCreateProject(baseCreateData({ installDependencies: true, packageManager: 'bun' }), makeModules({}) as never);

    const calls = vi.mocked(execSync).mock.calls as unknown as Array<[string, any]>;
    expect(calls[0][0]).toBe('neu update');
    expect(calls[1][0]).toBe('bun install');
    expect(calls[1][1].cwd).toBe(path.join(cwd, 'demo-app', 'vite-src'));
  });

  it('starts the app after creation when requested', async () => {
    await realCreateProject(baseCreateData({ installDependencies: true, openAppAfterCreation: true }), makeModules({}) as never);

    expect(startServer).toHaveBeenCalledTimes(1);
    expect(startServer).toHaveBeenCalledWith(path.join(cwd, 'demo-app', 'vite-src'));
  });
});
