<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { header } = useAppConfig()
</script>

<template>
  <UHeader
    :ui="{ center: 'flex-1' }"
    :to="header?.to || '/'"
  >
    <UContentSearchButton
      v-if="header?.search"
      :collapsed="false"
      class="w-full"
    />

    <template
      v-if="header?.logo?.dark || header?.logo?.light || header?.title"
      #title
    >
      <div class="header-branding">
        <UColorModeImage
          v-if="header?.logo?.dark || header?.logo?.light"
          :light="header?.logo?.light!"
          :dark="header?.logo?.dark!"
          :alt="header?.logo?.alt"
          class="logo-image"
        />

        <span v-if="header?.title" class="logo-title">
          {{ header.title }}
        </span>
      </div>
    </template>

    <template #right>
      <UContentSearchButton
        v-if="header?.search"
        class="lg:hidden"
      />

      <UColorModeButton v-if="header?.colorMode" />

      <template v-if="header?.links">
        <UButton
          v-for="(link, index) of header.links"
          :key="index"
          v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
        />
      </template>
    </template>

    <template #body>
      <UContentNavigation
        highlight
        :navigation="navigation"
      />
    </template>
  </UHeader>
</template>

<style scoped>
  .header-branding {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: opacity 0.2s;
  }
  
  .header-branding:hover {
    opacity: 0.8;
  }
  
  .header-branding :deep(img) {
    width: 2.5rem !important;
    height: 2.5rem !important;
    border-radius: 0.5rem !important;
    flex-shrink: 0;
  }
  
  .logo-title {
    font-size: 1.125rem;
    font-weight: 700;
  }
</style>