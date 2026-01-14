<template>
  <div class="launcher-download">
    <div class="download-card">
      <div v-if="detectedOS" class="platform-detection">
        <div class="badge">
          <UIcon :name="platformIcon" class="w-5 h-5" />
          <span>Ваша система: {{ platformName }}</span>
        </div>
      </div>

      <div class="download-buttons">
        <UButton
          v-for="platform in platforms"
          :key="platform.id"
          :color="platform.id === detectedOS ? 'primary' : 'gray'"
          :variant="platform.id === detectedOS ? 'solid' : 'outline'"
          size="xl"
          :icon="platform.icon"
          :to="platform.url"
          external
          target="_blank"
          class="download-btn"
        >
          <div class="btn-content">
            <span class="platform-name">{{ platform.name }}</span>
            <span class="file-info">{{ platform.fileType }}</span>
          </div>
        </UButton>
      </div>

      <details class="additional-platforms">
        <summary>Дополнительные платформы</summary>
        <div class="extra-buttons">
          <UButton
            v-for="extra in extraPlatforms"
            :key="extra.id"
            color="gray"
            variant="soft"
            size="lg"
            :icon="extra.icon"
            :to="extra.url"
            external
            target="_blank"
            class="extra-btn"
          >
            <div class="btn-content">
              <span class="platform-name">{{ extra.name }}</span>
              <span class="file-info">{{ extra.description }}</span>
            </div>
          </UButton>
        </div>
      </details>

      <div class="download-info">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          💡 Лаунчер полностью бесплатный и безопасный
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const detectedOS = ref(null)

const platforms = [
  {
    id: 'windows',
    name: 'Windows',
    icon: 'i-lucide-laptop',
    fileType: 'Установщик • .exe',
    url: 'https://dl.llaun.ch/legacy/installer'
  },
  {
    id: 'macos',
    name: 'macOS',
    icon: 'i-lucide-apple',
    fileType: 'Образ диска • .dmg',
    url: 'https://dl.llaun.ch/legacy/dmg'
  },
  {
    id: 'linux',
    name: 'Ubuntu / Debian',
    icon: 'i-lucide-package',
    fileType: 'Пакет • .deb',
    url: 'https://dl.llaun.ch/legacy/deb'
  }
]

const extraPlatforms = [
  {
    id: 'flathub',
    name: 'Flathub',
    icon: 'i-lucide-box',
    description: 'Для Linux с Flatpak (требуется лицензия)',
    url: 'https://lln4.cc/flathub'
  },
  {
    id: 'jar',
    name: 'Универсальный JAR',
    icon: 'i-lucide-file-code',
    description: 'Для всех платформ с Java',
    url: 'https://dl.llaun.ch/legacy/bootstrap'
  },
  {
    id: 'chromeos',
    name: 'Chrome OS',
    icon: 'i-lucide-chrome',
    description: 'Инструкция по установке',
    url: 'https://docs.legacylauncher.ru/faq/chromeos'
  }
]

const platformName = computed(() => {
  const platform = platforms.find(p => p.id === detectedOS.value)
  return platform ? platform.name : ''
})

const platformIcon = computed(() => {
  const platform = platforms.find(p => p.id === detectedOS.value)
  return platform ? platform.icon : 'i-lucide-laptop'
})

const detectOS = () => {
  const userAgent = window.navigator.userAgent.toLowerCase()
  const platform = window.navigator.platform.toLowerCase()

  if (platform.includes('win')) {
    return 'windows'
  } else if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'macos'
  } else if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux'
  }
  return null
}

onMounted(() => {
  detectedOS.value = detectOS()
})
</script>

<style scoped>
.launcher-download {
  margin: 2rem 0;
}

.download-card {
  background: rgb(var(--color-gray-50));
  border: 1px solid rgb(var(--color-gray-200));
  border-radius: 12px;
  padding: 2rem;
}

.dark .download-card {
  background: rgb(var(--color-gray-900));
  border-color: rgb(var(--color-gray-800));
}

.platform-detection {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgb(var(--color-primary-100));
  color: rgb(var(--color-primary-700));
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.dark .badge {
  background: rgb(var(--color-primary-900));
  color: rgb(var(--color-primary-300));
}

.download-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.download-btn {
  width: 100%;
  height: auto !important;
  padding: 1.25rem 1.5rem !important;
  transition: all 0.2s ease;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.btn-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  width: 100%;
}

.platform-name {
  font-size: 1rem;
  font-weight: 600;
}

.file-info {
  font-size: 0.75rem;
  opacity: 0.7;
}

.additional-platforms {
  margin: 1.5rem 0;
  border: 1px solid rgb(var(--color-gray-200));
  border-radius: 8px;
  padding: 1rem;
  background: rgb(var(--color-gray-100));
}

.dark .additional-platforms {
  background: rgb(var(--color-gray-800));
  border-color: rgb(var(--color-gray-700));
}

.additional-platforms summary {
  cursor: pointer;
  font-weight: 600;
  color: rgb(var(--color-gray-700));
  user-select: none;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dark .additional-platforms summary {
  color: rgb(var(--color-gray-300));
}

.additional-platforms summary::-webkit-details-marker {
  display: none;
}

.additional-platforms summary::before {
  content: '▶';
  display: inline-block;
  transition: transform 0.2s;
  font-size: 0.75rem;
}

.additional-platforms[open] summary::before {
  transform: rotate(90deg);
}

.extra-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.extra-btn {
  width: 100%;
  height: auto !important;
  padding: 1rem 1.25rem !important;
  transition: all 0.2s ease;
}

.extra-btn:hover {
  transform: translateY(-1px);
}

.download-info {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid rgb(var(--color-gray-200));
}

.dark .download-info {
  border-top-color: rgb(var(--color-gray-800));
}

@media (max-width: 768px) {
  .download-buttons,
  .extra-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
