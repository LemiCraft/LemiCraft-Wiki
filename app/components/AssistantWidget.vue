<script setup lang="ts">
interface Msg { role: 'user' | 'assistant', content: string, sources?: { title: string, url: string }[], error?: boolean }

const API = 'https://lemicraft.ru/api/assistant/chat'
const route = useRoute()

const open = ref(false)
const bar = ref<HTMLElement | null>(null)
const input = ref('')
const loading = ref(false)
const messages = ref<Msg[]>([])
const listEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

const examples = ['Как установить лаунчер?', 'Почему не заходит на сервер?', 'Как поставить моды?']

onMounted(() => {
  try { messages.value = JSON.parse(sessionStorage.getItem('wiki-ai') || '[]') } catch {}
})
watch(messages, (v) => {
  try { sessionStorage.setItem('wiki-ai', JSON.stringify(v.slice(-12))) } catch {}
}, { deep: true })

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function render(text: string) {
  return esc(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code class="px-1 rounded bg-elevated">$1</code>')
    .replace(/\n/g, '<br>')
}

async function scrollDown() {
  await nextTick()
  listEl.value?.scrollTo({ top: listEl.value.scrollHeight, behavior: 'smooth' })
}

async function ask(q: string) {
  q = q.trim()
  if (!q || loading.value) return
  open.value = true
  messages.value.push({ role: 'user', content: q })
  input.value = ''
  loading.value = true
  scrollDown()
  const history = messages.value.slice(-6).map(m => ({ role: m.role, content: m.content }))
  const title = document.querySelector('h1')?.textContent?.trim()
  if (title && route.path !== '/') history[history.length - 1]!.content = `${q} (страница вики: ${title})`
  try {
    const res = await $fetch<any>(API, { method: 'POST', body: { messages: history } })
    messages.value.push({ role: 'assistant', content: res.answer || 'Не удалось получить ответ', sources: res.sources })
  } catch (e: any) {
    const status = e?.statusCode || e?.status
    const text = status === 429 ? 'Слишком часто. Подожди минуту и спроси снова'
      : status === 403 ? 'Помощник сейчас недоступен. Спроси в Discord'
        : 'Не получилось ответить. Попробуй ещё раз'
    messages.value.push({ role: 'assistant', content: text, error: true })
  } finally {
    loading.value = false
    scrollDown()
  }
}

function focusInput() {
  inputEl.value?.focus()
}
function close() {
  open.value = false
  inputEl.value?.blur()
}
function clear() {
  messages.value = []
}

function onKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
    e.preventDefault()
    focusInput()
  } else if (e.key === 'Escape' && open.value) {
    close()
  }
}
function onDocClick(e: MouseEvent) {
  if (open.value && bar.value && !bar.value.contains(e.target as Node)) open.value = false
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.addEventListener('click', onDocClick)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <ClientOnly>
    <div
      ref="bar"
      class="fixed z-40 bottom-3 left-1/2 -translate-x-1/2 w-[min(24rem,calc(100vw-1.5rem))] flex flex-col gap-2"
    >
      <Transition name="ai">
        <section
          v-if="open && (messages.length || loading)"
          class="flex flex-col max-h-[60dvh] rounded-2xl border border-default bg-default shadow-2xl overflow-hidden"
          role="dialog"
          aria-label="ИИ-помощник LemiCraft"
        >
          <header class="flex items-center gap-2 pl-4 pr-2 py-2 border-b border-default">
            <UIcon
              name="i-lucide-bot"
              class="size-4 text-primary"
            />
            <p class="flex-1 text-sm font-semibold text-highlighted">
              Помощник LemiCraft
            </p>
            <UButton
              icon="i-lucide-rotate-ccw"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Новый чат"
              @click="clear"
            />
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Закрыть"
              @click="close"
            />
          </header>

          <div
            ref="listEl"
            class="overflow-y-auto px-4 py-3 space-y-3"
            role="log"
            aria-live="polite"
          >
            <div
              v-for="(m, i) in messages"
              :key="i"
              :class="m.role === 'user' ? 'flex justify-end' : ''"
            >
              <div
                class="max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                :class="m.role === 'user' ? 'bg-primary text-inverted' : (m.error ? 'bg-error/10 text-error' : 'bg-elevated text-default')"
              >
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-html="render(m.content)" />
                <div
                  v-if="m.sources?.length"
                  class="flex flex-wrap gap-1.5 pt-2"
                >
                  <a
                    v-for="s in m.sources"
                    :key="s.url"
                    :href="s.url"
                    class="text-xs px-2 py-1 rounded-md border border-default text-muted hover:text-highlighted"
                  >{{ s.title }}</a>
                </div>
              </div>
            </div>

            <div
              v-if="loading"
              class="flex items-center gap-2 text-sm text-muted"
            >
              <UIcon
                name="i-lucide-loader-circle"
                class="size-4 animate-spin"
              />
              Думаю...
            </div>
          </div>
        </section>
      </Transition>

      <Transition name="ai">
        <div
          v-if="open && !messages.length"
          class="flex flex-wrap justify-center gap-2"
        >
          <UButton
            v-for="e in examples"
            :key="e"
            color="neutral"
            variant="outline"
            size="sm"
            class="bg-default"
            @click="ask(e)"
          >
            {{ e }}
          </UButton>
        </div>
      </Transition>

      <form
        class="flex items-center gap-2 rounded-xl border border-default bg-default/95 backdrop-blur shadow-lg pl-3 pr-1.5 py-1.5 focus-within:border-primary transition-colors"
        @submit.prevent="ask(input)"
      >
        <UIcon
          name="i-lucide-sparkles"
          class="size-4 text-primary shrink-0"
        />
        <input
          ref="inputEl"
          v-model="input"
          type="text"
          maxlength="1000"
          placeholder="Спросить ИИ..."
          aria-label="Вопрос"
          autocomplete="off"
          class="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted"
          @focus="open = true"
        >
        <span class="hidden sm:flex items-center gap-1 text-xs text-muted shrink-0">
          <UKbd value="ctrl" />
          <UKbd value="I" />
        </span>
        <UButton
          type="submit"
          icon="i-lucide-arrow-up"
          size="sm"
          :disabled="!input.trim() || loading"
          aria-label="Отправить"
        />
      </form>
    </div>
  </ClientOnly>
</template>

<style scoped>
.ai-enter-active { transition: opacity .2s ease, transform .22s cubic-bezier(.23, 1, .32, 1); }
.ai-leave-active { transition: opacity .14s ease; }
.ai-enter-from { opacity: 0; transform: translateY(8px); }
.ai-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .ai-enter-active, .ai-leave-active { transition: none; }
}
</style>
