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
    siteName: 'LemiCraft Wiki'
  },
  header: {
    title: 'LemiCraft Wiki',
    to: '/',
    logo: {
      alt: '',
      light: '',
      dark: ''
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
        icon: 'i-lucide-messages-square',
        to: 'https://lemicraft.ru/discord',
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
        icon: 'i-lucide-messages-square',
        to: 'https://lemicraft.ru/discord',
        target: '_blank',
        'aria-label': 'Discord'
      },
      {
        icon: 'i-lucide-book-open',
        to: 'https://lemicraft.ru/rules',
        target: '_blank',
        'aria-label': 'Правила'
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
