import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Activity Challenge Bot",
  description: "A Telegram bot for tracking competition scores among Aalto guilds",
  base: '/activity-challenge-bot/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Contributing', link: '/CONTRIBUTING' },
      { text: 'Point System', link: '/point-system' }
    ],
    sidebar: [
      {
        text: 'Documentation',
        items: [
          { text: 'Contributing', link: '/CONTRIBUTING' },
          { text: 'Point System', link: '/point-system' }
        ]
      }
    ]
  }
})