<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const code = computed(() => Number(props.error?.status ?? props.error?.statusCode ?? 500))

const view = computed(() => {
  if (code.value === 404) return { title: 'Такой страницы нет', text: 'Возможно, её переименовали или в ссылке опечатка. Попробуй найти нужное через поиск' }
  return { title: 'Что-то сломалось', text: 'Мы уже видим ошибку. Обнови страницу или загляни позже' }
})

useHead({ htmlAttrs: { lang: 'ru' } })
useSeoMeta({ title: () => view.value.title, description: () => view.value.text, robots: 'noindex' })

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'))
const { data: files } = useLazyAsyncData('search', () => queryCollectionSearchSections('docs'), { server: false })
provide('navigation', navigation)

const { open: openSearch } = useContentSearch()

const links = [
  { to: '/home/introduction', label: 'Введение', icon: 'i-lucide-book-open' },
  { to: '/getting-started/buy', label: 'Начало игры', icon: 'i-lucide-rocket' },
  { to: '/faq', label: 'FAQ', icon: 'i-lucide-circle-help' }
]
</script>

<template>
  <UApp>
    <AppHeader />

    <main class="min-h-[calc(100dvh-8rem)] flex items-center justify-center px-4 py-16">
      <div class="flex flex-col items-center text-center gap-5 max-w-xl">
        <p class="text-base font-semibold text-primary">
          {{ code }}
        </p>

        <h1 class="text-3xl sm:text-4xl font-bold text-highlighted">
          {{ view.title }}
        </h1>
        <p class="text-muted text-lg">
          {{ view.text }}
        </p>

        <div class="flex flex-wrap items-center justify-center gap-3">
          <UButton
            to="/"
            size="lg"
            icon="i-lucide-home"
          >
            На главную вики
          </UButton>
          <UButton
            size="lg"
            color="neutral"
            variant="outline"
            icon="i-lucide-search"
            @click="openSearch = true"
          >
            Открыть поиск
          </UButton>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
          <UButton
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            :icon="l.icon"
            color="neutral"
            variant="soft"
          >
            {{ l.label }}
          </UButton>
        </div>

        <p class="text-sm text-muted pt-2">
          Не нашёл ответа? Спроси в
          <a
            href="https://discord.gg/hUjXjc9bQc"
            target="_blank"
            rel="noopener"
            class="text-primary underline underline-offset-2"
          >Discord</a>
        </p>
      </div>
    </main>

    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
      />
    </ClientOnly>
  </UApp>
</template>
