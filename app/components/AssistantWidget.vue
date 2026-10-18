<script setup lang="ts">
interface Msg { role: 'user' | 'assistant', content: string, sources?: { title: string, url: string }[], error?: boolean }

const API = 'https://lemicraft.ru/api/assistant/chat'
const route = useRoute()

const open = ref(false)
const input = ref('')
const loading = ref(false)
const messages = ref<Msg[]>([])
const listEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)

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

function toggle() {
  open.value = !open.value
  if (open.value) nextTick(() => inputEl.value?.focus())
}
function clear() {
  messages.value = []
}
</script>

<template>
  <ClientOnly>
    <div class="fixed bottom-4 right-4 z-40">
      <UButton
        v-if="!open"
        icon="i-lucide-bot"
        size="xl"
        class="rounded-full shadow-lg"
        aria-label="Спросить ИИ-помощника"
        @click="toggle"
      />
    </div>

    <Transition name="ai">
      <section
        v-if="open"
        class="fixed z-50 inset-x-3 bottom-3 h-[75dvh] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[24rem] sm:h-[34rem] flex flex-col rounded-2xl border border-default bg-default shadow-2xl overflow-hidden"
        role="dialog"
        aria-label="ИИ-помощник LemiCraft"
      >
        <header class="flex items-center gap-3 px-4 py-3 border-b border-default">
          <UIcon
            name="i-lucide-bot"
            class="size-5 text-primary"
          />
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-sm text-highlighted">
              Помощник LemiCraft
            </p>
            <p class="text-xs text-muted">
              Отвечает по этой вики
            </p>
          </div>
          <UButton
            v-if="messages.length"
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="ghost"
            aria-label="Новый чат"
            @click="clear"
          />
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            aria-label="Закрыть"
            @click="toggle"
          />
        </header>

        <div
          ref="listEl"
          class="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          role="log"
          aria-live="polite"
        >
          <div
            v-if="!messages.length"
            class="h-full flex flex-col items-center justify-center text-center gap-3"
          >
            <p class="font-semibold text-highlighted">
              Спроси про сервер, лаунчер или моды
            </p>
            <p class="text-sm text-muted">
              С оплатой и банами лучше сразу в тикет на сайте
            </p>
            <div class="flex flex-col gap-2 w-full pt-2">
              <UButton
                v-for="e in examples"
                :key="e"
                color="neutral"
                variant="outline"
                block
                @click="ask(e)"
              >
                {{ e }}
              </UButton>
            </div>
          </div>

          <div
            v-for="(m, i) in messages"
            :key="i"
            :class="m.role === 'user' ? 'flex justify-end' : ''"
          >
            <div
              class="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
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

        <form
          class="flex items-end gap-2 p-3 border-t border-default"
          @submit.prevent="ask(input)"
        >
          <textarea
            ref="inputEl"
            v-model="input"
            rows="1"
            maxlength="1000"
            placeholder="Задай вопрос"
            aria-label="Вопрос"
            class="flex-1 resize-none rounded-lg border border-default bg-transparent px-3 py-2 text-base outline-none focus:border-primary max-h-28"
            @keydown.enter.exact.prevent="ask(input)"
          />
          <UButton
            type="submit"
            icon="i-lucide-send"
            :disabled="!input.trim() || loading"
            aria-label="Отправить"
          />
        </form>
        <p class="px-4 pb-2 text-xs text-muted text-center">
          ИИ может ошибаться. Не пиши личные данные
        </p>
      </section>
    </Transition>
  </ClientOnly>
</template>

<style scoped>
.ai-enter-active { transition: opacity .2s ease, transform .22s cubic-bezier(.23, 1, .32, 1); }
.ai-leave-active { transition: opacity .14s ease; }
.ai-enter-from { opacity: 0; transform: translateY(10px) scale(.98); }
.ai-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .ai-enter-active, .ai-leave-active { transition: none; }
}
</style>
