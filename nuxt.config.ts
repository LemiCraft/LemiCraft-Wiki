// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    'nuxt-og-image',
    'nuxt-llms',
    '@nuxtjs/mcp-toolkit',
    '@nuxtjs/sitemap'
  ],

  llms: {
    domain: 'https://wiki.lemicraft.ru'
  },

  site: {
    url: 'https://wiki.lemicraft.ru',
    name: 'LemiCraft Wiki',
    description: 'База знаний Minecraft сервера LemiCraft',
    defaultLocale: 'ru'
  },

  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: {
        lang: 'ru'
      },
      title: 'Wiki LemiCraft Server',
      titleTemplate: '%s — LemiCraft Wiki',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'База знаний Minecraft сервера LemiCraft — инструкции, FAQ и гайды' },
        { name: 'keywords', content: 'lemicraft, minecraft, сервер, вики, гайд, инструкция' },
        { name: 'author', content: 'LemiCraft Team' },

        { property: 'og:site_name', content: 'LemiCraft Wiki' },
        { property: 'og:title', content: 'Wiki LemiCraft Server' },
        { property: 'og:description', content: 'База знаний LemiCraft' },
        { property: 'og:type', content: 'website' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://wiki.lemicraft.ru' }
      ]
    }
  },

  sitemap: {
    strictNuxtContentPaths: true,
    exclude: [
      '/admin/**',
      '/draft/**'
    ]
  },

  robots: {
    UserAgent: '*',
    Allow: '/',
    Sitemap: 'https://wiki.lemicraft.ru/sitemap.xml'
  },

  content: {
    build: {
      markdown: {
        toc: {
          searchDepth: 3
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
        '/',
        '/sitemap.xml'
      ],
      crawlLinks: true,
      autoSubfolderIndex: true
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
