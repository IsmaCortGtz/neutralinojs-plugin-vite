import { spawnSync } from 'node:child_process';
import c from 'picocolors';

export function log(...args: unknown[]) {
  console.log(c.bgCyan(c.black(c.bold(' Info '))), ...args);
}

export function error(...args: unknown[]) {
  console.log(c.bgRed(c.white(c.bold(' Error '))), ...args);
}

export function warn(...args: unknown[]) {
  console.log(c.yellow(c.bold('warn')), ...args);
}

export function raw(...args: unknown[]) {
  console.log(...args);
}

export function icon(status: boolean) {
  if (status) return c.green('✓');
  return c.red('✗');
}

export function clear() {
  console.clear();
  if (!process.stdout.isTTY) return;

  // 1️⃣ ANSI (rápido, no spawnea procesos)
  try {
    process.stdout.write('\x1Bc');
    return;
  } catch {}

  // 2️⃣ Fallback real
  const cmd = process.platform === 'win32' ? 'cls' : 'clear';
  spawnSync(cmd, {
    stdio: 'inherit',
    shell: true
  });
}

export default {
  log,
  error,
  warn,
  raw,
  clear,
  icon
};