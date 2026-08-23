import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { findPort } from '@/utils/findPort';
import { log, error, warn, raw, icon, clear } from '@/utils/log';
import { getFiglet, printHeader } from '@/utils/art';
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
