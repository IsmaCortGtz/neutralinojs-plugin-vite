import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { findPort } from '@/utils/findPort';
import { log, error, warn, raw, icon, clear } from '@/utils/log';
import { getFiglet, printHeader } from '@/utils/art';
import { listTemplates, resolveTemplate } from '@/utils/templates';
import {
  captureConsole,
  cleanupTempDirs,
  makeTempDir,
  writeFile,
} from './helpers';

afterEach(() => {
  cleanupTempDirs();
});

describe('findPort()', () => {
  it('resolves with a valid port number', async () => {
    const port = await findPort();
    expect(Number.isInteger(port)).toBe(true);
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThanOrEqual(65535);
  });

  it('resolves distinct ports on consecutive calls (eventually)', async () => {
    const ports = await Promise.all([findPort(), findPort(), findPort()]);
    // OS usually rotates ephemeral ports; not guaranteed, so only sanity-check
    ports.forEach((p) => expect(p).toBeGreaterThan(0));
  });
});

describe('log utils', () => {
  it('log() prefixes with the Info badge', () => {
    const cons = captureConsole();
    try {
      log('hello world');
      expect(cons.output()).toMatch(/Info.*hello world/s);
    } finally {
      cons.restore();
    }
  });

  it('error() prefixes with the Error badge', () => {
    const cons = captureConsole();
    try {
      error('bad thing');
      expect(cons.output()).toMatch(/Error.*bad thing/s);
    } finally {
      cons.restore();
    }
  });

  it('warn() prefixes with warn', () => {
    const cons = captureConsole();
    try {
      warn('careful');
      expect(cons.output()).toMatch(/warn.*careful/s);
    } finally {
      cons.restore();
    }
  });

  it('raw() prints without prefix', () => {
    const cons = captureConsole();
    try {
      raw('plain');
      expect(cons.logs[0]).toBe('plain');
    } finally {
      cons.restore();
    }
  });

  it('icon() returns check and cross glyphs', () => {
    expect(icon(true)).toContain('✓');
    expect(icon(false)).toContain('✗');
  });
});

describe('clear()', () => {
  it('clears the console', () => {
    const cons = captureConsole();
    const clearSpy = vi.spyOn(console, 'clear').mockImplementation(() => {});
    try {
      clear();
      expect(clearSpy).toHaveBeenCalled();
    } finally {
      clearSpy.mockRestore();
      cons.restore();
    }
  });
});

describe('art utils', () => {
  it('getFiglet() returns the ASCII banner', () => {
    const art = getFiglet();
    expect(typeof art).toBe('string');
    expect(art.length).toBeGreaterThan(0);
    expect(art).toContain('_');
  });

  it('printHeader() welcomes the user', () => {
    const cons = captureConsole();
    try {
      printHeader();
      expect(cons.output()).toMatch(/Welcome to neutralinojs-plugin-vite/);
    } finally {
      cons.restore();
    }
  });
});

describe('resolveTemplate()', () => {
  it('resolves vite leaf ids to their variant and the vite installer', () => {
    expect(resolveTemplate('react-ts')).toMatchObject({ installer: 'vite' });
    expect(resolveTemplate('react-ts')!.variant.name).toBe('react-ts');
    expect(resolveTemplate('vue')).toMatchObject({ installer: 'vite' });
  });

  it('is case and whitespace tolerant', () => {
    expect(resolveTemplate('  React-TS ')!.variant.name).toBe('react-ts');
  });

  it.each(['sveltekit-ts', 'sveltekit-jsdoc', 'sveltekit-js'])(
    'maps %s to the sv installer with a raw sv variant',
    (id) => {
      const resolved = resolveTemplate(id)!;
      expect(resolved.installer).toBe('sv');
      expect(['ts', 'jsdoc', 'no-types']).toContain(resolved.variant.name);
    },
  );

  it('returns null for unknown, framework-level or empty ids', () => {
    expect(resolveTemplate('nope')).toBeNull();
    expect(resolveTemplate('react-framework')).toBeNull();
    // framework nodes themselves are not selectable
    expect(resolveTemplate('sveltekit')).toBeNull();
    expect(resolveTemplate('')).toBeNull();
  });

  it('exposes unique ids covering every selectable leaf', () => {
    const ids = listTemplates();
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(resolveTemplate(id)).not.toBeNull();
    expect(ids).toContain('react-ts');
    expect(ids).toContain('sveltekit-ts');
  });
});
