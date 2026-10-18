<script setup lang="ts">
const { seo } = useAppConfig()

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'))
const { data: files } = useLazyAsyncData('search', () => queryCollectionSearchSections('docs'), {
  server: false
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=2' },
    { rel: 'icon', href: '/favicon.ico?v=2', sizes: 'any' },
    { rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png?v=2' }
  ],
  htmlAttrs: {
    lang: 'ru'
  }
})

useSeoMeta({
  titleTemplate: `%s | ${seo?.siteName}`,
  ogSiteName: seo?.siteName,
  twitterCard: 'summary_large_image'
})

provide('navigation', navigation)

const route = useRoute()
const showAssistant = ref(false)
onMounted(() => {
  try {
    if (route.query.ai === '1') localStorage.setItem('wiki-ai-enabled', '1')
    if (route.query.ai === '0') localStorage.removeItem('wiki-ai-enabled')
    showAssistant.value = localStorage.getItem('wiki-ai-enabled') === '1'
  } catch {}
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <AppHeader />

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <AppFooter />

    <AssistantWidget v-if="showAssistant" />

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
      />
    </ClientOnly>
  </UApp>
</template>
