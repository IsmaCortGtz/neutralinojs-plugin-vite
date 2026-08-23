import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import plugin from '@/index';

function buildProgram() {
  const program = new Command();
  program.name('neu');
  plugin.register(program.command(plugin.command), {} as never);
  return program;
}

describe('plugin registration', () => {
  it('exposes the vite command group with all documented subcommands', () => {
    const program = buildProgram();
    const viteCommand = program.commands[0];

    expect(plugin.command).toBe('vite');
    const subNames = viteCommand.commands.map((c) => c.name());
    for (const expected of ['dev', 'create', 'build', 'version']) {
      expect(subNames).toContain(expected);
    }
  });

  it('build exposes the same flags as neu build', () => {
    const program = buildProgram();
    const buildCommand = program.commands[0].commands.find((c) => c.name() === 'build')!;
    const flags = buildCommand.options.map((o) => o.long);

    for (const flag of ['--release', '--embed-resources', '--copy-storage', '--macos-bundle', '--clean', '--config-file']) {
      expect(flags).toContain(flag);
    }
  });
});
