import type { Command } from 'commander';
import { NeuPluginModules } from '@/types';
import neuViteDevCommand from '@/commands/dev';
import neuViteBuildCommand from '@/commands/build';
import neuViteCreateCommand from './commands/create';

export default {
  command: 'vite',
  register: (command: Command, modules: NeuPluginModules) => {
    command.description('Integrate Vite into your Neutralinojs project');

    command
      .command('dev')
      .description('Start Vite development server with Neutralinojs')
      .option('--arch <arch>', 'Specify the architecture for Neutralinojs (e.g., x64, arm64)')
      .action(neuViteDevCommand(command, modules));
    
    command
      .command('create')
      .description('Create a new Neutralinojs project with Vite setup')
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
  },
};