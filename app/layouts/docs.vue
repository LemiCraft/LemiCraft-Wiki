<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const baseNavigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const navigation = computed(() => [
  ...(baseNavigation?.value ?? []),
  {
    title: 'API Reference',
    path: 'https://lemicraft.ru/api-reference',
    icon: 'i-lucide-code-2',
    target: '_blank',
  } as ContentNavigationItem,
])
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside>
          <UContentNavigation
            highlight
            :navigation="navigation"
          />
        </UPageAside>
      </template>

      <slot />
    </UPage>
  </UContainer>
</template>
