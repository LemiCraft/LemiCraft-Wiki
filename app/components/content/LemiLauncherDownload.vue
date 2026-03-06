<template>
  <div class="lemi-launcher-download">
    <a
      v-if="downloadUrl"
      :href="downloadUrl"
      class="download-btn"
      download
    >
      <svg class="download-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <div>
        <div class="download-title">Скачать LemiCraft Launcher</div>
        <div class="download-meta">{{ fileName }} · {{ fileSizeMb }} МБ · v{{ version }}</div>
      </div>
    </a>

    <div v-else-if="error" class="download-error">
      Не удалось загрузить информацию.
      <a href="https://github.com/KOTOKOPOLb/LemiCraft-Launcher/releases/latest" target="_blank" rel="noopener noreferrer">
        Скачать с GitHub ↗
      </a>
    </div>

    <div v-else class="download-loading">
      Загрузка...
    </div>
  </div>
</template>

<script setup>
  const { data, error } = await useAsyncData('lemi-launcher', () =>
    $fetch('https://lemicraft.ru/api/launcher/version')
  )

  const downloadUrl = computed(() => data.value?.downloadUrl ?? null)
  const fileName = computed(() => data.value?.fileName ?? null)
  const version = computed(() => data.value?.version ?? null)
  const fileSizeMb = computed(() =>
    data.value?.fileSize ? (data.value.fileSize / 1024 / 1024).toFixed(1) : null
  )
</script>

<style scoped>
  .lemi-launcher-download {
    margin: 1rem 0;
  }

  .download-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem 1.25rem;
    background: var(--accent-primary, #AB141C);
    color: white;
    border-radius: 0.625rem;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
  }

  .download-btn:hover {
    background: var(--accent-hover, #8f131a);
    transform: translateY(-2px);
  }

  .download-icon {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
  }

  .download-title {
    font-size: 1rem;
  }

  .download-meta {
    font-size: 0.8rem;
    opacity: 0.8;
    font-weight: 400;
    margin-top: 0.125rem;
  }

  .download-error {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .download-error a {
    color: var(--accent-primary, #AB141C);
    text-decoration: underline;
  }

  .download-loading {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
</style>