import type { Command } from 'commander';
import { NeuPluginModules } from '@/types';
import neuViteDevCommand from '@/commands/dev';
import neuViteBuildCommand from '@/commands/build';
import neuViteCreateCommand from './commands/create';
import neuViteVersionCommand from './commands/version';

export default {
  command: 'vite',
  register: (command: Command, modules: NeuPluginModules) => {
    command.description('Integrate Vite into your Neutralinojs project');

    command
      .command('dev')
      .description('Start Vite development server with Neutralinojs')
      .option('--arch <arch>', 'Specify the architecture for Neutralinojs (e.g., x64, arm64)')
      .action(neuViteDevCommand(command, modules));
    
    // NOTE: keep the command API compatible with the CLI's bundled
    // commander (currently v7): no .argument(), no .choices().
    command
      .command('create [projectName]')
      .description('Create a new Neutralinojs project with Vite setup')
      .option('-t, --template <id>', 'template to scaffold (e.g. react-ts, vue-ts, sveltekit-ts)')
      .option('--pm <manager>', 'package manager to use: npm, pnpm, yarn or bun')
      .option('--install', 'install dependencies (runs "neu update" and the package manager install)')
      .option('--no-install', 'skip dependency installation')
      .option('--open', 'start the dev server after creation (requires --install)')
      .option('--no-open', 'do not start the dev server after creation')
      .option('--force', 'remove existing files when the target directory is not empty')
      .action(neuViteCreateCommand(command, modules));

    command
      .command('build')
      .description('Build the Vite project and bundle the Neutralinojs app')
      .option('-r, --release')
      .option('--embed-resources', 'embed resources in the binary')
      .option('--copy-storage')
      .option('--macos-bundle')
      .option('--clean')
      .option('--config-file <path>', 'specify the *.config.json file')
      .action(neuViteBuildCommand(command, modules));

    command
      .command('version')
      .description('Show the plugin version and check for updates on npm')
      .action(neuViteVersionCommand(command, modules));
  },
};