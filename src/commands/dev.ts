import type { NeuPluginModules } from "@/types";
import type { Command } from "commander";
import path from "node:path";
import { printHeader } from '@/utils/art';
import neu from '@/modules/neu';
import { resolvePackageManager } from '@/utils/pm';
import { startServer } from "@/modules/vite";
import { error } from "@/utils/log";

export default function neuViteDevCommand(_command: Command, modules: NeuPluginModules) {
  return async (options: { arch?: string }, _subcommand: Command) => {
    try {
      printHeader();

      const arch = options.arch || process.arch;
      const neuConfig = modules.config.get();
      const result = await neu.doctor(arch, neuConfig);
      if (!result) process.exit(1);

      const viteProjectPath = path.join(process.cwd(), neuConfig.cli.vite.projectPath);
      await startServer(viteProjectPath, resolvePackageManager(neuConfig));
    } catch (e: any) {
      error(e.message || String(e));
      process.exit(1);
    }
  };
}
