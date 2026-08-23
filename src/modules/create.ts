import type { CreateData, NeuPluginModules, TemplateInstaller } from "@/types";
import { execSync } from "node:child_process";
import fs from 'node:fs';
import path from 'node:path';
import * as prompts from '@clack/prompts';
import c from 'picocolors';
import { startServer } from "./vite";
import { printHeader } from "@/utils/art";
import { clear } from "@/utils/log";
import getInstaller from "./installers";
import { installCommand, resolvePackageManager } from "@/utils/pm";


export async function createProject(data: CreateData, modules: NeuPluginModules): Promise<void> {
  
  const projectPath = path.join(process.cwd(), data.projectName);
  const installer = getInstaller(data);
  prompts.log.info(`Scaffolding project in ${c.dim(projectPath)}`);


  // Create project directory and navigate into it
  fs.mkdirSync(data.projectName, { recursive: true });
  process.chdir(data.projectName);


  // Install using 'npm create vite@latest'
  await installer.scaffold();


  // Rename the created folder to src/
  const createdDir = path.join(process.cwd(), data.packageName);
  const targetDir = path.join(process.cwd(), 'vite-src');
  fs.renameSync(createdDir, targetDir);

  
  // Copy Neutralino config files
  const templateDir = process.env.NEUVITE_TEMPLATE_DIR
    ?? path.join(__dirname, '..', 'template-neutralinojs');
  fs.readdirSync(templateDir).forEach(file => {
    fs.copyFileSync(path.join(templateDir, file), path.join(process.cwd(), file));
  });


  // Add neutralino script to index.html and update title
  await installer.patchHtml(targetDir);


  // Update neutralino.config.json
  const neuConfigPath = path.join(process.cwd(), 'neutralino.config.json');
  const neuConfig = JSON.parse(fs.readFileSync(neuConfigPath, 'utf-8'));

  neuConfig.cli.binaryName = data.packageName;
  neuConfig.modes.window.title = data.projectName;
  fs.writeFileSync(neuConfigPath, JSON.stringify(neuConfig, null, 2));

  // Update package.json
  await installer.patchPackageJson(targetDir, modules);

  let doneMessage = '';


  // Install dependencies if requested
  const packageManager = data.packageManager ?? resolvePackageManager(undefined);
  if (data.installDependencies) {
    // Install neu binaries
    prompts.log.step('Installing neu binaries...');
    execSync('neu update', { stdio: ['ignore', 'ignore', 'inherit'] });

    // Install project dependencies with the configured package manager
    prompts.log.step(`Installing project dependencies with ${packageManager}...`);
    execSync(installCommand(packageManager), { stdio: ['ignore', 'ignore', 'inherit'], cwd: targetDir });
  } else {
    doneMessage += "Done. Now run:\n\n";
    doneMessage += c.dim(`    cd ${data.projectName}\n`);
    doneMessage += c.dim(`    neu update\n`);
    doneMessage += c.dim(`    cd ${path.basename(targetDir)}\n`);
    doneMessage += c.dim(`    ${installCommand(packageManager)}\n`);
  }

  // Start the app if requested
  if (data.openAppAfterCreation) {
    clear();
    printHeader();

    await startServer(targetDir);
  } else {

    if (data.installDependencies) {
      doneMessage += 'Done. Now run:\n\n';
      doneMessage += c.dim(`    cd ${data.projectName}\n`);
    } else doneMessage += c.dim(`    cd ..\n`);

    doneMessage += c.dim(`    neu vite dev\n`);
    prompts.outro(doneMessage);
  }
}