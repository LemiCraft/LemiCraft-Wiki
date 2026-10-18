<script setup lang="ts">
interface Msg { id: number, role: 'user' | 'assistant', content: string, sources?: { title: string, url: string }[], error?: boolean, typing?: boolean, shown?: number }

const API = 'https://lemicraft.ru/api/assistant/chat'
const route = useRoute()

const open = ref(false)
const bar = ref<HTMLElement | null>(null)
const input = ref('')
const loading = ref(false)
const messages = ref<Msg[]>([])
let nextId = 1
const list = ref<{ $el: HTMLElement } | null>(null)
const listEl = computed(() => list.value?.$el ?? null)
const inputEl = ref<HTMLInputElement | null>(null)

const examples = ['Как установить лаунчер?', 'Почему не заходит на сервер?', 'Как поставить моды?']

onMounted(() => {
  try { messages.value = JSON.parse(sessionStorage.getItem('wiki-ai') || '[]').map((m: Msg) => ({ role: m.role, content: m.content, sources: m.sources, error: m.error, id: nextId++ })) } catch {}
})
watch(messages, (v) => {
  try { sessionStorage.setItem('wiki-ai', JSON.stringify(v.slice(-12).map(({ id, typing, shown, ...rest }) => rest))) } catch {}
}, { deep: true })

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

function atBottom() {
  const el = listEl.value
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 60
}
async function scrollDown(smooth = true) {
  await nextTick()
  listEl.value?.scrollTo({ top: listEl.value.scrollHeight, behavior: smooth && !reduced() ? 'smooth' : 'auto' })
}

// ответ печатается, а список следует за текстом, пока читатель внизу
async function typeOut(msg: Msg) {
  const full = msg.content
  if (reduced()) {
    msg.typing = false
    return
  }
  const speed = Math.max(900, Math.min(2600, full.length * 3))
  const start = performance.now()
  await new Promise<void>((resolve) => {
    const frame = (now: number) => {
      const follow = atBottom()
      let n = Math.min(full.length, Math.floor((now - start) / 1000 * speed))
      while (n < full.length && n > 0 && !/\s/.test(full[n - 1]!)) n++
      msg.shown = n
      if (follow) scrollDown(false)
      if (n >= full.length) return resolve()
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })
  msg.typing = false
  scrollDown()
}

// недописанная разметка (**, `, [ссылка](...)) прячется, чтобы не мигали символы
function visibleText(m: Msg) {
  if (!m.typing || m.shown === undefined) return m.content
  let s = m.content.slice(0, m.shown)
  s = s.replace(/\[[^\]\n]*$/, '').replace(/\]\([^)\n]*$/, '').replace(/https?:\/\/\S*$/, '')
  if ((s.match(/\*\*/g) || []).length % 2) s = s.replace(/\*\*[^*]*$/, '')
  if ((s.match(/`/g) || []).length % 2) s = s.replace(/`[^`]*$/, '')
  return s
}

async function ask(q: string) {
  q = q.trim()
  if (!q || loading.value) return
  open.value = true
  messages.value.push({ id: nextId++, role: 'user', content: q })
  input.value = ''
  loading.value = true
  scrollDown()
  const history = messages.value.slice(-6).map(m => ({ role: m.role, content: m.content }))
  const title = document.querySelector('h1')?.textContent?.trim()
  if (title && route.path !== '/') history[history.length - 1]!.content = `${q} (страница вики: ${title})`
  try {
    const res = await $fetch<any>(API, { method: 'POST', body: { messages: history } })
    loading.value = false
    const msg: Msg = reactive({ id: nextId++, role: 'assistant', content: res.answer || 'Не удалось получить ответ', sources: res.sources, typing: true, shown: 0 })
    messages.value.push(msg)
    await typeOut(msg)
  } catch (e: any) {
    const status = e?.statusCode || e?.status
    const text = status === 429
      ? 'Слишком часто. Подожди минуту и спроси снова'
      : status === 403
        ? 'Помощник сейчас недоступен. Спроси в Discord'
        : 'Не получилось ответить. Попробуй ещё раз'
    messages.value.push({ id: nextId++, role: 'assistant', content: text, error: true })
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

          <TransitionGroup
            ref="list"
            name="ai-msg"
            tag="div"
            class="overflow-y-auto px-4 py-3 flex flex-col gap-3"
            role="log"
            aria-live="polite"
          >
            <div
              v-for="m in messages"
              :key="m.id"
              :class="m.role === 'user' ? 'flex justify-end' : ''"
            >
              <div
                class="max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                :class="m.role === 'user' ? 'bg-primary text-inverted' : (m.error ? 'bg-error/10 text-error' : 'bg-elevated text-default')"
              >
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-html="render(visibleText(m))" />
                <div
                  v-if="m.sources?.length && !m.typing"
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
              key="thinking"
              class="flex"
              role="status"
              aria-label="Помощник думает"
            >
              <div class="ai-think rounded-2xl bg-elevated px-4 py-3.5">
                <i /><i /><i />
              </div>
            </div>
          </TransitionGroup>
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
          class="flex-1 min-w-0 bg-transparent text-base sm:text-sm outline-none placeholder:text-muted"
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

.ai-msg-enter-active { transition: opacity .3s ease, transform .38s cubic-bezier(.23, 1, .32, 1); }
.ai-msg-enter-from { opacity: 0; transform: translateY(12px); }
.ai-msg-leave-active { transition: opacity .15s ease; position: absolute; }
.ai-msg-leave-to { opacity: 0; }
.ai-msg-move { transition: transform .3s ease; }

.ai-think { display: inline-flex; gap: 5px; }
.ai-think i { width: 6px; height: 6px; border-radius: 50%; background: var(--ui-text-muted); animation: ai-dot 1.2s ease-in-out infinite; }
.ai-think i:nth-child(2) { animation-delay: .15s; }
.ai-think i:nth-child(3) { animation-delay: .3s; }
@keyframes ai-dot { 0%, 60%, 100% { opacity: .35; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }

@media (prefers-reduced-motion: reduce) {
  .ai-enter-active, .ai-leave-active, .ai-msg-enter-active, .ai-msg-leave-active, .ai-msg-move { transition: none; }
  .ai-think i { animation: none; opacity: .7; }
}
</style>
