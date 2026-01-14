export default defineAppConfig({
  ui: {
    colors: {
      primary: 'red',
      neutral: 'zinc'
    },
    footer: {
      slots: {
        root: 'border-t border-default',
        left: 'text-sm text-muted'
      }
    }
  },
  seo: {
    siteName: 'LemiCraft Wiki',
    description: 'База знаний Minecraft сервера LemiCraft'
  },
  header: {
    title: 'LemiCraft',
    to: '/',
    logo: {
      light: '/logo.webp',
      dark: '/logo.webp',
      alt: 'LemiCraft Logo'
    },
    search: true,
    colorMode: true,
    links: [
      {
        icon: 'i-lucide-home',
        to: 'https://lemicraft.ru',
        target: '_blank',
        'aria-label': 'Главная страница'
      },
      {
        icon: 'i-simple-icons-discord',
        to: 'https://discord.gg/ybC6QM8WTM',
        target: '_blank',
        'aria-label': 'Discord сервер'
      }
    ]
  },
  footer: {
    credits: '© 2026 LemiCraft. Все права защищены. Сервера LemiCraft не относятся к Mojang Studios',
    colorMode: false,
    links: [
      {
        icon: 'i-lucide-home',
        to: 'https://lemicraft.ru',
        target: '_blank',
        'aria-label': 'Главная'
      },
      {
        icon: 'i-lucide-mail',
        to: 'mailto:lemicraftteam@yandex.ru',
        target: '_blank',
        'aria-label': 'Поддержка'
      },
      {
        icon: 'i-simple-icons-discord',
        to: 'https://discord.gg/ybC6QM8WTM',
        target: '_blank',
        'aria-label': 'Discord'
      }
    ]
  },
  toc: {
    title: 'На этой странице'
  },
  search: {
    placeholder: 'Поиск по документации...',
    icon: 'i-lucide-search',
    fileIcon: {
      name: 'i-lucide-file-text'
    }
  }
})
