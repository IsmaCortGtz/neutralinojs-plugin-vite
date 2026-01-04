import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'rolldown';

export default defineConfig({
  input: [
    'src/index.ts',
  ],
  platform: 'node',
  external: ['node:net', 'node:fs', 'node:path', 'node:crypto', 'node:child_process', 'node:http'],
  output: {
    dir: 'dist',
    format: 'cjs',
    minify: true,
  },
  plugins: [
    {
      name: "alias",
      resolveId(source, importer) {
        if (source.startsWith("@/")) {
          const resolved = path.resolve(process.cwd(), "src", source.slice(2));

          // try with .ts
          if (fs.existsSync(resolved + ".ts")) {
            return resolved + ".ts";
          }

          // try with .js (in case you use generated JS files)
          if (fs.existsSync(resolved + ".js")) {
            return resolved + ".js";
          }

          return resolved; // fallback
        }
        return null;
      }
    }
  ]
});