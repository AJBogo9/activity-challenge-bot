import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Your Project",
  description: "Project description",
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