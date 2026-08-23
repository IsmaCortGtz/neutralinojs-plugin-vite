import type { NeuPluginModules } from "@/types";
import type { Command } from "commander";
import c from "picocolors";
import { name as PLUGIN_NAME, version } from "../../package.json";
import { log, warn } from "@/utils/log";

/** Fetches the latest published version of this plugin from the npm registry (null when unavailable). */
export async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(PLUGIN_NAME)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const latest = data?.['dist-tags']?.latest;
    return typeof latest === 'string' ? latest : null;
  } catch {
    return null;
  }
}

/**
 * Compares two dotted numeric versions.
 * Returns a negative number if a < b, positive if a > b, and 0 if equivalent.
 * Prerelease suffixes are ignored (e.g. "1.0.0-beta" compares as "1.0.0").
 */
export function compareVersions(a: string, b: string): number {
  const toParts = (v: string) =>
    v.trim().replace(/^v/, '').split(/[.+-]/).map((n) => Number.parseInt(n, 10) || 0);

  const pa = toParts(a);
  const pb = toParts(b);
  const length = Math.max(pa.length, pb.length);

  for (let i = 0; i < length; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export default function neuViteVersionCommand(_command: Command, _modules: NeuPluginModules) {
  return async () => {
    log(`${PLUGIN_NAME} version: ${version}`);

    const latest = await fetchLatestVersion();
    if (!latest) {
      warn('Could not check the latest version on npm (offline or registry unreachable).');
      return;
    }

    const comparison = compareVersions(version, latest);
    if (comparison === 0) {
      log('You are using the latest version.');
    } else if (comparison > 0) {
      log(`You are ahead of the published version (${version} > ${latest}).`);
    } else {
      warn(
        `A new version of ${PLUGIN_NAME} is available: ${c.bold(latest)}. ` +
        'Update by running:\n\n' +
        c.dim(`    neu plugins --remove ${PLUGIN_NAME}\n`) +
        c.dim(`    neu plugins --add ${PLUGIN_NAME}\n`),
      );
    }
  };
}
