import type { TemplateInstaller, TemplateVariant } from '@/types';
import c from 'picocolors';

const frameworks: TemplateVariant[] = [
  {
    name: 'react',
    display: 'React',
    color: c.cyan,
    variants: [
      {
        name: 'react-ts',
        display: 'TypeScript',
        color: c.blue,
        installer: 'vite',
      },
      {
        name: 'react-compiler-ts',
        display: 'TypeScript + React Compiler',
        color: c.blue,
        installer: 'vite',
      },
      {
        name: 'react-swc-ts',
        display: 'TypeScript + SWC',
        color: c.blue,
        installer: 'vite',
      },
      {
        name: 'react',
        display: 'JavaScript',
        color: c.yellow,
        installer: 'vite',
      },
      {
        name: 'react-compiler',
        display: 'JavaScript + React Compiler',
        color: c.yellow,
        installer: 'vite',
      },
      {
        name: 'react-swc',
        display: 'JavaScript + SWC',
        color: c.yellow,
        installer: 'vite',
      },
    ]
  },
  {
    name: 'vue',
    display: 'Vue',
    color: c.green,
    variants: [
      {
        name: 'vue',
        display: 'JavaScript',
        color: c.yellow,
        installer: 'vite',
      },
      {
        name: 'vue-ts',
        display: 'TypeScript',
        color: c.blue,
        installer: 'vite',
      }
    ]
  },
  {
    name: 'preact',
    display: 'Preact',
    color: c.magenta,
    variants: [
      {
        name: 'preact-ts',
        display: 'TypeScript',
        color: c.blue,
        installer: 'vite',
      },
      {
        name: 'preact',
        display: 'JavaScript',
        color: c.yellow,
        installer: 'vite',
      },
    ]
  },
  {
    name: 'lit',
    display: 'Lit',
    color: c.redBright,
    variants: [
      {
        name: 'lit-ts',
        display: 'TypeScript',
        color: c.blue,
        installer: 'vite',
      },
      {
        name: 'lit',
        display: 'JavaScript',
        color: c.yellow,
        installer: 'vite',
      },
    ]
  },
  {
    name: 'svelte',
    display: 'Svelte',
    color: c.red,
    variants: [
      {
        name: 'svelte-ts',
        display: 'TypeScript',
        color: c.blue,
        installer: 'vite',
      },
      {
        name: 'svelte',
        display: 'JavaScript',
        color: c.yellow,
        installer: 'vite',
      },
      {
        name: 'sveltekit',
        display: 'SvelteKit',
        color: c.yellow,
        variants: [
          {
            name: 'ts',
            display: 'TypeScript',
            color: c.blue,
            installer: 'sv',
          },
          {
            name: 'jsdoc',
            display: 'JSDoc',
            color: c.yellow,
            installer: 'sv',
          },
          {
            name: 'no-types',
            display: 'JavaScript',
            color: c.yellow,
            installer: 'sv',
          },
        ]
      },
    ]
  },
  {
    name: 'solid',
    display: 'Solid',
    color: c.blue,
    variants: [
      {
        name: 'solid-ts',
        display: 'TypeScript',
        color: c.blue,
        installer: 'vite',
      },
      {
        name: 'solid',
        display: 'JavaScript',
        color: c.yellow,
        installer: 'vite',
      },
    ]
  },
  {
    name: 'qwik',
    display: 'Qwik',
    color: c.blueBright,
    variants: [
      {
        name: 'qwik-ts',
        display: 'TypeScript',
        color: c.blueBright,
        installer: 'vite',
      },
      {
        name: 'qwik',
        display: 'JavaScript',
        color: c.yellow,
        installer: 'vite',
      },
    ],
  }
];

export default {
  name: '',
  display: '',
  color: c.reset,
  variants: frameworks
}

/**
 * CLI-facing template ids for every selectable leaf of the tree.
 *
 * Leaf names are unique across the tree, except for the SvelteKit ones
 * ("ts", "jsdoc", "no-types"), which are too generic to be exposed as-is;
 * they get a "sveltekit-" prefix instead ("no-types" becomes "sveltekit-js").
 */
function cliTemplateId(leaf: TemplateVariant): string {
  return leaf.installer === 'sv'
    ? `sveltekit-${leaf.name === 'no-types' ? 'js' : leaf.name}`
    : leaf.name;
}

function collectLeaves(node: TemplateVariant, acc: Array<{ id: string; leaf: TemplateVariant }> = []) {
  if (!node.variants?.length) {
    acc.push({ id: cliTemplateId(node), leaf: node });
    return acc;
  }
  node.variants.forEach((child) => collectLeaves(child, acc));
  return acc;
}

const leaves = frameworks.reduce<Array<{ id: string; leaf: TemplateVariant }>>(
  (acc, framework) => collectLeaves(framework, acc),
  [],
);

export interface ResolvedTemplate {
  variant: TemplateVariant;
  installer: TemplateInstaller;
}

/** Resolves a CLI template id (e.g. "react-ts", "sveltekit-ts") or null when unknown. */
export function resolveTemplate(id: string): ResolvedTemplate | null {
  const match = leaves.find((entry) => entry.id === id.trim().toLowerCase());
  return match ? { variant: match.leaf, installer: match.leaf.installer || 'vite' } : null;
}

/** All valid CLI template ids. */
export function listTemplates(): string[] {
  return leaves.map((entry) => entry.id);
}