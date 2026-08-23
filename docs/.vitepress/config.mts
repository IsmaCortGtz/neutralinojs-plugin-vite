import { defineConfig } from 'vitepress'
import githubAlerts from 'markdown-it-github-alerts'

export default defineConfig({
  lang: 'en-US',
  title: 'neutralinojs-plugin-vite',
  description:
    'Vite superpowers for your NeutralinoJS apps: instant HMR, any frontend framework, one-command builds.',
  // GitHub Pages project site: https://<user>.github.io/neutralinojs-plugin-vite/
  base: '/neutralinojs-plugin-vite/',
  ignoreDeadLinks: false,
  markdown: {
    config(md) {
      md.use(githubAlerts)
    }
  },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Reference', link: '/reference/commands' },
      { text: 'Contributing', link: '/contributing' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Creating a Project', link: '/guide/create-project' },
            { text: 'Existing Projects', link: '/guide/existing-project' },
            { text: 'Development Server', link: '/guide/development' },
            { text: 'Building & Distribution', link: '/guide/building' },
            { text: 'Updating the Plugin', link: '/guide/updating' }
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Commands', link: '/reference/commands' },
            { text: 'Configuration', link: '/reference/configuration' }
          ]
        }
      ],
      '/contributing': [
        {
          text: 'Project',
          items: [{ text: 'Contributing', link: '/contributing' }]
        }
      ]
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/IsmaCortGtz/neutralinojs-plugin-vite'
      }
    ],
    search: {
      provider: 'local'
    },
    outline: [2, 3],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © IsmaCortGtz & contributors'
    }
  }
})
