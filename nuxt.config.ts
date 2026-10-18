// https://nuxt.com/docs/api/configuration/nuxt-config
import { readFileSync } from 'node:fs'

let pageDates: Record<string, string> = {}
try { pageDates = JSON.parse(readFileSync('./app/data/page-dates.json', 'utf8')) } catch {}

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/fonts',
    'nuxt-og-image',
    'nuxt-llms',
    '@nuxtjs/sitemap'
  ],

  llms: {
    domain: 'https://wiki.lemicraft.ru'
  },

  fonts: {
    families: [{ name: 'Onest', provider: 'google', weights: [400, 700], subsets: ['cyrillic', 'latin'], global: true }]
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
    trailingSlash: true,
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'page', mode: 'out-in' },
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
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=2' },
        { rel: 'icon', href: '/favicon.ico?v=2', sizes: 'any' },
        { rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png?v=2' },
        { rel: 'canonical', href: 'https://wiki.lemicraft.ru/' }
      ]
    }
  },

  sitemap: {
    exclude: [
      '/admin/**',
      '/draft/**'
    ],
    urls: () => Object.entries(pageDates).map(([stem, lastmod]) => ({
      loc: `https://wiki.lemicraft.ru${stem === 'index' ? '/' : '/' + stem.split('/').map(p => p.replace(/^\d+\./, '').toLowerCase()).join('/')}`,
      lastmod
    }))
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
    asyncContext: true,
    payloadExtraction: false
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    preset: 'static',
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
