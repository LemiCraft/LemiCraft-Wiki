<script setup lang="ts">
const props = defineProps<{
  type: 'website' | 'article' | 'breadcrumb'
  data: any
}>()

const getJsonLd = () => {
  const baseData = {
    '@context': 'https://schema.org'
  }

  switch (props.type) {
    case 'website':
      return {
        ...baseData,
        '@type': 'WebSite',
        name: 'LemiCraft Wiki',
        url: 'https://wiki.lemicraft.ru',
        description: 'База знаний Minecraft сервера LemiCraft',
        ...props.data
      }
    
    case 'article':
      return {
        ...baseData,
        '@type': 'Article',
        headline: props.data.title,
        description: props.data.description,
        datePublished: props.data.datePublished,
        dateModified: props.data.dateModified,
        author: {
          '@type': 'Organization',
          name: 'LemiCraft Team'
        },
        publisher: {
          '@type': 'Organization',
          name: 'LemiCraft',
          logo: {
            '@type': 'ImageObject',
            url: 'https://wiki.lemicraft.ru/logo.webp'
          }
        }
      }
    
    case 'breadcrumb':
      return {
        ...baseData,
        '@type': 'BreadcrumbList',
        itemListElement: props.data.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url
        }))
      }
    
    default:
      return {}
  }
}

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(getJsonLd())
    }
  ]
})
</script>

<template>
  <div />
</template>