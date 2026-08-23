import type { NeuPluginModules } from "@/types";
import type { Command } from "commander";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import c from "picocolors";
import { printHeader } from "@/utils/art";
import constants from "@/utils/constants";
import { log, error } from "@/utils/log";

interface BuildOptions {
  release?: boolean;
  embedResources?: boolean;
  copyStorage?: boolean;
  macosBundle?: boolean;
  clean?: boolean;
  configFile?: string;
}

function runScript(script: string, cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    // Run the script directly (no package manager involved), exposing
    // the project's node_modules/.bin on PATH so binaries like vite or
    // tsc resolve no matter if deps were installed with bun/pnpm/yarn/npm.
    const binDir = path.join(cwd, 'node_modules', '.bin');
    const child = spawn(script, {
      cwd,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ''}`,
        npm_lifecycle_event: 'build',
      },
    });

    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 1));
  });
}

export default function neuViteBuildCommand(_command: Command, modules: NeuPluginModules) {
  return async (options: BuildOptions, _subcommand: Command) => {
    try {
      printHeader();

      const configFileName = options.configFile ?? constants.files.configFile;
      if (options.configFile) log(`Using config file: ${options.configFile}`);

      const configPath = path.join(process.cwd(), configFileName);
      if (!fs.existsSync(configPath)) {
        throw new Error(`Unable to find ${configFileName}. Please check whether the current directory has a Neutralinojs project.`);
      }

      const neuConfig = modules.config.get();

      const viteProjectPathRel = neuConfig?.cli?.vite?.projectPath;
      if (!viteProjectPathRel || typeof viteProjectPathRel !== 'string') {
        throw new Error(`Missing "cli.vite.projectPath" in ${configFileName}. Please set it to your Vite project directory (e.g. "/vite-src/").`);
      }

      const viteProjectPath = path.join(process.cwd(), viteProjectPathRel);

      const packageJsonPath = path.join(viteProjectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`No package.json found in ${viteProjectPath}.`);
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const buildScript = packageJson?.scripts?.build;
      if (!buildScript || typeof buildScript !== 'string') {
        throw new Error(`No "build" script found in ${path.join(path.basename(viteProjectPath), 'package.json')}.`);
      }

      const buildDir = neuConfig.cli.distributionPath
        ? String(neuConfig.cli.distributionPath).replace(/^\/|\/$/g, '')
        : 'dist';

      if (options.clean) {
        log(`Cleaning previous build files from ${buildDir}...`);
        fs.rmSync(buildDir, { recursive: true, force: true });
      }

      log(`Running Vite build script: ${c.bold(buildScript)}...`);
      const code = await runScript(buildScript, viteProjectPath);
      if (code !== 0) process.exit(code);

      log('Bundling app...');
      await modules.bundler.bundleApp({
        release: options.release,
        embedResources: options.embedResources,
        copyStorage: options.copyStorage,
        macosBundle: options.macosBundle,
      });

      log(`Application package was generated at the ${c.bold(buildDir)} directory!`);
    } catch (e: any) {
      error(e.message || String(e));
      process.exit(1);
    }
  };
}
