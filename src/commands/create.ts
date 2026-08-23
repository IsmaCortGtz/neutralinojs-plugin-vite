import type { CreateData, NeuPluginModules, TemplateVariant } from "@/types";
import type { Command } from "commander";
import * as prompts from '@clack/prompts'
import fs from 'node:fs';
import path from 'node:path';
import Frameworks, { listTemplates, resolveTemplate } from '@/utils/templates';
import { printHeader } from "@/utils/art";
import { normalizePackageManager, resolvePackageManager } from "@/utils/pm";
import { error } from '@/utils/log';
import { createProject } from "@/modules/create";

const defaultTargetDir = 'neutralinojs-vite-app';
const cancel = () => prompts.cancel('Operation cancelled');
const formatTargetDir = (targetDir: string) => targetDir.trim().replace(/\/+$/g, '');

interface CreateOptions {
  template?: string;
  pm?: string;
  install?: boolean;
  open?: boolean;
  force?: boolean;
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') continue;
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  )
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-')
}

export default function neuViteCreateCommand(_command: Command, modules: NeuPluginModules) {
  return async (projectNameArg: string | undefined, options: CreateOptions = {}) => {

    // Fail fast on invalid flags before prompting anything
    const resolvedTemplate = options.template !== undefined ? resolveTemplate(options.template) : null;
    if (options.template !== undefined && !resolvedTemplate) {
      error(`Unknown template "${options.template}". Valid templates:\n  ${listTemplates().join(', ')}`);
      process.exit(1);
    }

    const flaggedPm = options.pm !== undefined ? normalizePackageManager(options.pm) : null;
    if (options.pm !== undefined && !flaggedPm) {
      error(`Unknown package manager "${options.pm}". Valid values: npm, pnpm, yarn, bun.`);
      process.exit(1);
    }

    if (options.open === true && options.install === false) {
      error('The --open option requires dependency installation. Drop --no-install or use --install.');
      process.exit(1);
    }

    printHeader();

    const data: CreateData = {
      projectName: defaultTargetDir,
      packageName: toValidPackageName(defaultTargetDir),
      variant: resolvedTemplate?.variant.name ?? 'react-ts',
      installer: resolvedTemplate?.installer ?? 'vite',
      installDependencies: false,
      openAppAfterCreation: false,
    }

    // 1. Prompt for project name unless provided as an argument
    let projectName = projectNameArg;
    if (projectName === undefined) {
      const answer = await prompts.text({
        message: 'Project name:',
        placeholder: defaultTargetDir,
        defaultValue: defaultTargetDir,
        validate: (value) => {
          const val = value ?? '';
          return val.length === 0 || formatTargetDir(val).length > 0
            ? undefined
            : 'Invalid project name'
        },
      });

      if (prompts.isCancel(answer) || typeof answer !== 'string') return cancel();
      projectName = answer;
    }
    data.projectName = formatTargetDir(projectName);


    // 1.2. Check if target directory exists and is not empty
    if (fs.existsSync(data.projectName) && !isEmpty(data.projectName)) {
      if (options.force) {
        emptyDir(data.projectName);
      } else {
        const res = await prompts.select({
          message:
            (data.projectName === '.'
              ? 'Current directory'
              : `Target directory "${data.projectName}"`) +
            ` is not empty. Please choose how to proceed:`,
          options: [
            {
              label: 'Cancel operation',
              value: 'no',
            },
            {
              label: 'Remove existing files and continue',
              value: 'yes',
            },
            {
              label: 'Ignore files and continue',
              value: 'ignore',
            },
          ],
        });

        if (prompts.isCancel(res)) return cancel();
        if (res === 'no') return cancel();
        if (res === 'yes') emptyDir(data.projectName);
      }
    }



    // 2. Get package name
    data.packageName = path.basename(path.resolve(data.projectName));
    if (!isValidPackageName(data.packageName)) {
      const packageNameResult = await prompts.text({
        message: 'Package name:',
        defaultValue: toValidPackageName(data.packageName),
        placeholder: toValidPackageName(data.packageName),
        validate(dir) {
          if (dir && !isValidPackageName(dir)) {
            return 'Invalid package.json name'
          }
        },
      })
      if (prompts.isCancel(packageNameResult)) return cancel()
      data.packageName = packageNameResult
    }


    // 3. Get framework and variant unless provided via --template
    if (!resolvedTemplate) {
      let framework: TemplateVariant = Frameworks;
      do {
        if (!framework.variants) break;

        const result = await prompts.select({
          message: !framework.name.trim() ? 'Select a framework:' : 'Select a variant:',
          options: framework.variants.map((framework) => {
            const frameworkColor = framework.color;
            return {
              label: frameworkColor(framework.display || framework.name),
              value: framework,
            }
          }),
        });


        if (prompts.isCancel(result)) return cancel()
        framework = result;
      } while (framework.variants)

      data.variant = framework.name;
      data.installer = framework.installer || 'vite';
    }


    // 4. Resolve dependency installation: --install/--no-install or prompt
    if (typeof options.install === 'boolean') {
      data.installDependencies = options.install;
    } else {
      const dependencies = await prompts.confirm({
        message: 'Install dependencies after project creation?',
      });

      if (prompts.isCancel(dependencies)) return cancel()
      data.installDependencies = dependencies;
    }


    // 5. Start the app after creation: --open/--no-open or prompt
    if (data.installDependencies) {
      if (typeof options.open === 'boolean') {
        data.openAppAfterCreation = options.open;
      } else {
        const openApp = await prompts.confirm({
          message: 'Start the app after creation?',
        });

        if (prompts.isCancel(openApp)) return cancel()
        data.openAppAfterCreation = openApp;
      }
    }

    // 6. Create the project
    data.packageManager = flaggedPm ?? resolvePackageManager(modules.config.get());
    await createProject(data, modules);
  };
}