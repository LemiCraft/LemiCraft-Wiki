<script setup lang="ts">
import pageDates from '~/data/page-dates.json'
import type { ContentNavigationItem } from '@nuxt/content'
import { findPageHeadline } from '@nuxt/content/utils'

definePageMeta({
  layout: 'docs'
})

const route = useRoute()
const { toc } = useAppConfig()
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { data: page } = await useAsyncData(route.path, () => queryCollection('docs').path(route.path).first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: surround } = await useAsyncData(`surround:${route.path.replaceAll('/', '_')}`, () => {
  return queryCollectionItemSurroundings('docs', route.path, {
    fields: ['description']
  })
})

const title = page.value.seo?.title || page.value.title
const description = page.value.seo?.description || page.value.description
const keywords = page.value.seo?.keywords || ''

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  keywords,
  twitterCard: 'summary_large_image'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: `https://wiki.lemicraft.ru${route.path}`
    }
  ]
})

const updated = computed(() => {
  const iso = (pageDates as Record<string, string>)[page.value?.stem || '']
  return iso ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
})

const headline = computed(() => findPageHeadline(navigation?.value, page.value?.path))

defineOgImage('Docs', {
  title,
  description,
  headline: headline.value
})

const links = computed(() => {
  const links = []
  if (toc?.bottom?.edit) {
    links.push({
      icon: 'i-lucide-external-link',
      label: 'Edit this page',
      to: `${toc.bottom.edit}/${page?.value?.stem}.${page?.value?.extension}`,
      target: '_blank'
    })
  }

  return [...links, ...(toc?.bottom?.links || [])].filter(Boolean)
})

const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(Boolean)
  return paths.map((path, index) => ({
    name: path.charAt(0).toUpperCase() + path.slice(1),
    url: `https://wiki.lemicraft.ru/${paths.slice(0, index + 1).join('/')}`
  }))
})
</script>

<template>
  <UPage v-if="page">
    <SeoJsonLd
      type="article"
      :data="{
        title: page.title,
        description: page.description,
        datePublished: page.datePublished || '2025-01-01',
        dateModified: page.dateModified || new Date().toISOString()
      }"
    />
    <SeoJsonLd
      v-if="breadcrumbs.length"
      type="breadcrumb"
      :data="breadcrumbs"
    />

    <UPageHeader
      :title="page.title"
      :description="page.description"
      :headline="headline"
    >
      <template #links>
        <UButton
          v-for="(link, index) in page.links"
          :key="index"
          v-bind="link"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <p
        v-if="updated"
        class="-mt-4 mb-6 text-sm text-muted"
      >
        Обновлено {{ updated }}
      </p>
      <ContentRenderer
        v-if="page"
        :value="page"
      />

      <USeparator v-if="surround?.length" />

      <UContentSurround :surround="surround" />
    </UPageBody>

    <template
      v-if="page?.body?.toc?.links?.length"
      #right
    >
      <UContentToc
        :title="toc?.title"
        :links="page.body?.toc?.links"
        highlight
        highlight-color="primary"
        highlight-variant="circuit"
      >
        <template
          v-if="toc?.bottom"
          #bottom
        >
          <div
            class="hidden lg:block space-y-6"
            :class="{ '!mt-6': page.body?.toc?.links?.length }"
          >
            <USeparator
              v-if="page.body?.toc?.links?.length"
              type="dashed"
            />

            <UPageLinks
              :title="toc.bottom.title"
              :links="links"
            />
          </div>
        </template>
      </UContentToc>
    </template>
  </UPage>
</template>
