import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: "Activity Challenge Bot",
    description: "A Telegram bot for tracking physical activity competitions among Aalto guilds",
    base: '/activity-challenge-bot/',
    lastUpdated: true,
    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Guide', link: '/guide/getting-started' },
        { text: 'Architecture', link: '/architecture/overview' },
        { text: 'Development', link: '/development/project-structure' },
        { text: 'Admin', link: '/admin/competition-setup' },
        { text: 'Reference', link: '/reference/point-system' }
      ],
      sidebar: [
        {
          text: 'Guides',
          collapsed: false,
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Local Development', link: '/guide/local-development' },
            { text: 'Environment Setup', link: '/guide/environment-setup' }
          ]
        },
        {
          text: 'Architecture',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'Database', link: '/architecture/database' },
            { text: 'Flows and Wizards', link: '/architecture/flows-and-wizards' },
            { text: 'Two-Message Manager', link: '/architecture/two-message-manager' }
          ]
        },
        {
          text: 'Development',
          collapsed: false,
          items: [
            { text: 'Project Structure', link: '/development/project-structure' },
            { text: 'Testing', link: '/development/testing' }
          ]
        },
        {
          text: 'Administration',
          collapsed: false,
          items: [
            { text: 'Competition Setup', link: '/admin/competition-setup' },
            { text: 'Guild Management', link: '/admin/guild-management' },
          ]
        },
        {
          text: 'Reference',
          collapsed: false,
          items: [
            { text: 'Point System', link: '/reference/point-system' },
            { text: 'Activity Hierarchy', link: '/reference/activity-hierarchy' }
          ]
        }
      ],
      lastUpdated: {
        text: 'Last updated',
        formatOptions: {
          dateStyle: 'medium',
        }
      },
      socialLinks: [
        { icon: 'github', link: 'https://github.com/AJBogo9/activity-challenge-bot' }
      ],
      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright © 2024-present'
      },
      search: {
        provider: 'local'
      }
    },
    mermaid: {
      // Optional: Mermaid config
      theme: 'default'
    }
  })
)