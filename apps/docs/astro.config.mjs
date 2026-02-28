// @ts-check
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
  integrations: [
    starlight({
      title: 'Kagi Docs',
      description: 'Documentation for the Kagi encrypted secret management API',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/YanceyOfficial/kagi'
        }
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'guides/introduction' },
            { label: 'Quick Start', slug: 'guides/quickstart' }
          ]
        },
        {
          label: 'Authentication',
          items: [
            { label: 'Access Keys', slug: 'authentication/access-keys' },
            { label: 'Scopes', slug: 'authentication/scopes' }
          ]
        },
        {
          label: 'API Reference',
          items: [
            { label: 'Overview', slug: 'api-reference/overview' },
            { label: 'Categories', slug: 'api-reference/categories' },
            { label: 'Entries', slug: 'api-reference/entries' },
            {
              label: 'Two-Factor Tokens',
              slug: 'api-reference/two-factor-tokens'
            },
            { label: 'Stats & Export', slug: 'api-reference/stats-and-export' },
            { label: 'AI Extraction', slug: 'api-reference/ai-extraction' },
            { label: 'Access Keys', slug: 'api-reference/access-keys' }
          ]
        }
      ],
      customCss: ['./src/styles/custom.css']
    })
  ]
})
