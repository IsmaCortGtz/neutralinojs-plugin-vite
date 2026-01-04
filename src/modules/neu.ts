import c from 'picocolors';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { findPort } from '@/utils/findPort';
import { log, error, icon } from '@/utils/log';
import constants from '@/utils/constants';

export async function open(url: string, cwd: string = process.cwd()) {
  // Open log files for stdout and stderr
  const out = fs.openSync(path.join(cwd, 'neu-cli.log'), 'a');
  const err = fs.openSync(path.join(cwd, 'neu-cli.err.log'), 'a');

  const uuid = crypto.randomUUID();
  const port = await findPort();
  const newUrl = new URL(url);
  newUrl.searchParams.append('neutralinoViteUid', uuid);

  const isWindows = process.platform === 'win32';
  const neuProcess = spawn('npx', ['neu', 'run', '--', `--url=${newUrl.toString()}`, `--port=${port}`, '--logging-write-to-log-file=false', '--logging-enabled=true'], { cwd, shell: isWindows, stdio: ['ignore', out, err] });

  neuProcess.on('spawn', () => {
    log(`NeutralinoJS app started with UID: ${uuid}`);
  });
  
  neuProcess.on('close', (code) => {
    if (code === 0) return log(`NeutralinoJS app with UID: ${uuid} closed successfully.`);
    error(`NeutralinoJS app with UID: ${uuid} exited with code: ${code}`);
    process.exit(code);
  });

  // Restore original working directory
  return { uuid, port };
}

export async function doctor(arch: string, config: any, cwd: string = process.cwd()): Promise<boolean> {

  console.log(c.bold('Running pre-flight checks:'), '\n');

  const configExists = fs.existsSync(path.join(cwd, constants.files.configFile));
  console.log(' ', icon(configExists), 'NeutralinoJS configuration file found.');

  const vitePath = config?.cli?.vite?.projectPath;
  const viteConfigExists = vitePath && fs.existsSync(path.join(cwd, vitePath));
  console.log(' ', icon(viteConfigExists), 'Vite project found and configured.', !viteConfigExists ? c.gray(`(set "cli.vite.projectPath" in ${constants.files.configFile}).`) : '  ');

  const platform = process.platform;
  const validPlatform = platform in constants.files.binaries;
  console.log(' ', icon(validPlatform), `Platform (${platform}) supported.`);

  const binaries = constants.files.binaries[platform as keyof typeof constants.files.binaries];
  const validArch = validPlatform && (arch in binaries);
  console.log(' ', icon(validArch), `Architecture (${arch}) supported.`);

  const binaryExists = validArch && fs.existsSync(path.join(cwd, 'bin', binaries[arch as keyof typeof binaries]));
  console.log(' ', icon(binaryExists), 'NeutralinoJS binary found.', !binaryExists ? c.gray('(run "neu update" to download it).') : '  ');

  const passed = configExists && viteConfigExists && validPlatform && validArch && binaryExists;
  if (passed) {
    console.log(c.green('\nAll pre-flight checks passed!'));
  } else {
    console.error(c.red('\nSome pre-flight checks failed. Please fix the issues above and try again.\n'));
  }

  return passed;
}

export default {
  open,
  doctor,
};