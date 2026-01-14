// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    'nuxt-og-image',
    'nuxt-llms',
    '@nuxtjs/mcp-toolkit'
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Wiki LemiCraft Server',
      titleTemplate: '%s — LemiCraft Wiki',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'База знаний LemiCraft' },
        { property: 'og:site_name', content: 'LemiCraft Wiki' },
        { property: 'og:title', content: 'Wiki LemiCraft Server' },
        { property: 'og:description', content: 'База знаний LemiCraft' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' }
      ]
    }
  },
  content: {
    build: {
      markdown: {
        toc: {
          searchDepth: 1
        }
      }
    }
  },
  experimental: {
    asyncContext: true
  },
  compatibilityDate: '2024-07-11',
  nitro: {
    prerender: {
      routes: [
        '/'
      ],
      crawlLinks: true,
      autoSubfolderIndex: false
    }
  },
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
  icon: {
    provider: 'iconify'
  }
})
