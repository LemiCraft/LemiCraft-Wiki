<script setup lang="ts">
const colorMode = useColorMode()
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const isDark = computed(() => colorMode.value === 'dark')

function toggle() {
  const next = isDark.value ? 'light' : 'dark'
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || calm) {
    colorMode.preference = next
    return
  }
  document.startViewTransition(async () => {
    colorMode.preference = next
    await nextTick()
  })
}
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    square
    :aria-label="isDark ? 'Светлая тема' : 'Тёмная тема'"
    class="icon-press"
    @click="toggle"
  >
    <Transition
      name="icon-swap"
      mode="out-in"
    >
      <UIcon
        v-if="mounted"
        :key="isDark ? 'moon' : 'sun'"
        :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
        class="size-5"
      />
      <span
        v-else
        class="size-5"
      />
    </Transition>
  </UButton>
</template>
