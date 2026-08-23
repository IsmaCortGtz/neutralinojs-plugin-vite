import { CreateData, NeuPluginModules } from "@/types";
import { spawnSync } from "node:child_process";
import fs from 'node:fs';
import path from 'node:path';
import { createSvelteKitCommand, createViteCommand, resolvePackageManager } from "@/utils/pm";

class BaseInstaller {
  protected projectData: CreateData;

  constructor(projectData: CreateData) {
    this.projectData = projectData;
  }

  protected async getNeuLibVersion(modules: NeuPluginModules): Promise<string> {
    const config = modules.config.get();
    if (config?.cli?.clientVersion) return config?.cli?.clientVersion;
    if (config?.cli?.binaryVersion) return config?.cli?.binaryVersion;

    const res = await fetch('https://registry.npmjs.org/@neutralinojs/lib');
    const resData = await res.json();
    return resData['dist-tags'].latest;
  }

  public async patchPackageJson(targetDir: string, modules: NeuPluginModules) {
    const packageJsonPath = path.join(targetDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    packageJson.dependencies = { ...packageJson.dependencies, '@neutralinojs/lib': await this.getNeuLibVersion(modules) };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

export class ViteInstaller extends BaseInstaller {
  public async scaffold() {
    const pm = this.projectData.packageManager ?? resolvePackageManager(undefined);
    const { cmd, args } = createViteCommand(pm, this.projectData.packageName, this.projectData.variant);
    spawnSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'] });
  }

  public async patchHtml(targetDir: string) {
    const indexPath = path.join(targetDir, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf-8');
    indexContent = indexContent.replace(
      /<title>[\s\S]*?<\/title>/g,
      `<title>${this.projectData.projectName}</title>\n      <script src="/__neutralino_globals.js" vite-ignore></script>`
    );
    fs.writeFileSync(indexPath, indexContent);
  }
}

export class SvelteInstaller extends BaseInstaller {
  public async scaffold() {
    const pm = this.projectData.packageManager ?? resolvePackageManager(undefined);
    const { cmd, args } = createSvelteKitCommand(pm, this.projectData.variant, this.projectData.packageName);
    spawnSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'] });
  }

  public async patchHtml(targetDir: string) {
    const indexPath = path.join(targetDir, 'src', 'app.html');
    let indexContent = fs.readFileSync(indexPath, 'utf-8');
    indexContent = indexContent.replace(`<head>`, `<head>\n    <script src="/__neutralino_globals.js" vite-ignore></script>`);
    fs.writeFileSync(indexPath, indexContent);
  }
}

export default function getInstaller(projectData: CreateData) {
  if (projectData.installer === 'vite') return new ViteInstaller(projectData);
  else if (projectData.installer === 'sv') return new SvelteInstaller(projectData);

  throw new Error(`Unknown installer: ${projectData.installer}`);
}