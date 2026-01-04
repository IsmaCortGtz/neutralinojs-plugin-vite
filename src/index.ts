import type { Command } from 'commander';
import { NeuPluginModules } from '@/types';
import neuViteDevCommand from '@/commands/dev';
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
  },
};