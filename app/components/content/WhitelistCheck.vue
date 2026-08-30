<template>
  <div class="whitelist-check">
    <div class="check-card">
      <div class="check-row">
        <UInput
          v-model="nick"
          placeholder="Ваш никнейм"
          size="lg"
          class="check-input"
          @keyup.enter="check"
        />
        <UButton size="lg" :loading="loading" @click="check">Проверить</UButton>
      </div>

      <Transition name="fade">
        <div v-if="result" :key="result.nick" class="result" :class="result.found ? 'result-ok' : 'result-fail'">
          <UIcon :name="result.found ? 'i-lucide-check-circle-2' : 'i-lucide-x-circle'" class="w-5 h-5 flex-shrink-0" />
          <div>
            <p class="result-title">
              {{ result.found ? `${result.nick} есть в whitelist` : `${result.nick} не найден в whitelist` }}
            </p>
            <p v-if="result.found && result.banned" class="result-note">
              На этот аккаунт наложено наказание — подключиться может не получиться, подробности в Discord
            </p>
            <p v-else-if="!result.found" class="result-note">
              Если оплатили недавно — подождите до 5 минут, иначе проверьте ник или напишите в Discord
            </p>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const API_BASE = 'https://lemicraft.ru'

const nick = ref('')
const loading = ref(false)
const result = ref(null)

async function check() {
  const q = nick.value.trim()
  if (!q) return
  loading.value = true
  result.value = null
  try {
    const res = await $fetch(`${API_BASE}/api/players`, { query: { search: q } })
    const match = res.players.find(p => p.name?.toLowerCase() === q.toLowerCase())
    result.value = { nick: match ? match.name : q, found: !!match, banned: !!match?.banned }
  } catch {
    result.value = { nick: q, found: false, banned: false }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.whitelist-check { margin: 1.5rem 0; }

.check-card {
  background: rgb(var(--color-gray-50));
  border: 1px solid rgb(var(--color-gray-200));
  border-radius: 12px;
  padding: 1.5rem;
}
.dark .check-card {
  background: rgb(var(--color-gray-900));
  border-color: rgb(var(--color-gray-800));
}

.check-row { display: flex; gap: 0.5rem; }
.check-input { flex: 1; }

.result {
  margin-top: 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding-top: 1rem;
  border-top: 1px solid rgb(var(--color-gray-200));
}
.dark .result { border-top-color: rgb(var(--color-gray-800)); }

.result-ok { color: rgb(34 197 94); }
.result-fail { color: rgb(239 68 68); }

.result-title { font-size: 0.9375rem; font-weight: 600; color: rgb(var(--color-gray-900)); }
.dark .result-title { color: rgb(var(--color-gray-100)); }

.result-note { font-size: 0.8125rem; color: rgb(var(--color-gray-600)); margin-top: 0.25rem; }
.dark .result-note { color: rgb(var(--color-gray-400)); }

.fade-enter-active, .fade-leave-active { transition: opacity 200ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .check-row { flex-direction: column; }
}
</style>
