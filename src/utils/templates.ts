import type { TemplateVariant } from '@/types';
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