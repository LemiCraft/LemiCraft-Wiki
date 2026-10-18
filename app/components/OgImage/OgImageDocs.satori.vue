<script lang="ts" setup>
const props = withDefaults(defineProps<{ title?: string, description?: string, headline?: string }>(), {
  title: 'LemiCraft Wiki',
  description: ''
})

const title = computed(() => props.title.slice(0, 60))
const description = computed(() => props.description.slice(0, 160))
</script>

<template>
  <div class="w-full h-full flex flex-col justify-between p-[72px] bg-[#141213]">
    <div class="flex items-center">
      <div class="w-[16px] h-[16px] rounded-full bg-[#ab141c]" />
      <span class="ml-4 text-[30px] font-bold text-[#ff8a8a]">{{ headline || 'LemiCraft Wiki' }}</span>
    </div>
    <div class="flex flex-col">
      <div class="text-[76px] leading-[1.05] font-bold text-[#f4f1f2]">{{ title }}</div>
      <div v-if="description" class="mt-8 text-[32px] leading-[1.4] text-[#bfb7ba]">{{ description }}</div>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-[26px] text-[#a8a1a4]">wiki.lemicraft.ru</span>
      <div class="w-[180px] h-[6px] bg-[#ab141c]" />
    </div>
  </div>
</template>
