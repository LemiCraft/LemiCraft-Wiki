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
const ARROW = '<svg class="ai-chip-arrow" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>'

// ссылка на вики показывается названием страницы, на остальные сайты - доменом
function chip(rawUrl: string, label?: string) {
  let u: URL
  try {
    u = new URL(rawUrl.replace(/&amp;/g, '&'))
  } catch {
    return esc(rawUrl)
  }
  const host = u.hostname.replace(/^www\./, '')
  const own = host === 'wiki.lemicraft.ru'
  const text = label || (own ? decodeURIComponent(u.pathname).replace(/^\/|\/$/g, '') || 'Главная вики' : host)
  const icon = own ? '/favicon.svg?v=2' : `${u.origin}/favicon.ico`
  const attrs = own ? `href="${esc(u.pathname)}"` : `href="${esc(u.href)}" target="_blank" rel="noopener noreferrer"`
  return `<a ${attrs} class="ai-chip" title="${esc(u.href)}"><img src="${esc(icon)}" alt="" width="14" height="14" referrerpolicy="no-referrer" onerror="this.remove()"><span>${esc(text)}</span>${own ? '' : ARROW}</a>`
}

function render(text: string) {
  const stash: string[] = []
  const keep = (html: string) => `\uE000${stash.push(html) - 1}\uE001`
  let r = esc(text)
  r = r.replace(/`([^`\n]+)`/g, '<code class="ai-code">$1</code>')
  r = r.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  r = r.replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, (_m, label, url) => keep(chip(url, label)))
  r = r.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:!?])/g, (_m, pre, url) => pre + keep(chip(url)))
  r = r.replace(/^\s*[-*]\s+/gm, '• ').replace(/\n/g, '<br>')
  return r.replace(/\uE000(\d+)\uE001/g, (_m, n) => stash[Number(n)] ?? '')
}

// источники, чьи ссылки уже есть в ответе, не повторяем
function extraSources(m: Msg) {
  const seen = new Set<string>()
  return (m.sources || []).filter((src) => {
    const key = src.url.replace(/\/$/, '')
    if (seen.has(key) || m.content.includes(src.url)) return false
    seen.add(key)
    return true
  })
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

// ссылки на страницы вики открываются без перезагрузки
function onLinkClick(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/"]')
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return
  e.preventDefault()
  navigateTo(a.getAttribute('href')!)
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
      class="ai-bar fixed z-40 bottom-3 left-1/2 -translate-x-1/2 w-[min(24rem,calc(100vw-1.5rem))] flex flex-col gap-2"
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
            @click="onLinkClick"
          >
            <div
              v-for="m in messages"
              :key="m.id"
              class="flex gap-2.5"
              :class="m.role === 'user' ? 'justify-end' : 'items-start'"
            >
              <span
                v-if="m.role === 'assistant'"
                class="grid place-items-center size-7 mt-0.5 shrink-0 rounded-lg bg-primary/15 text-primary"
                aria-hidden="true"
              >
                <UIcon
                  name="i-lucide-bot"
                  class="size-4"
                />
              </span>
              <div
                v-if="m.role === 'user'"
                class="ai-user max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed bg-primary text-inverted whitespace-pre-wrap break-words"
              >
                {{ m.content }}
              </div>
              <div
                v-else
                class="flex flex-col gap-2 min-w-0 max-w-full"
              >
                <div
                  class="ai-bot px-3.5 py-2.5 text-sm leading-relaxed break-words"
                  :class="m.error ? 'bg-error/10 text-error' : 'bg-elevated text-default'"
                >
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-html="render(visibleText(m))" /><span
                    v-if="m.typing"
                    class="ai-caret"
                    aria-hidden="true"
                  />
                </div>
                <Transition name="ai-meta">
                  <div
                    v-if="!m.typing && extraSources(m).length"
                    class="flex flex-wrap gap-1.5"
                  >
                    <a
                      v-for="src in extraSources(m)"
                      :key="src.url"
                      :href="src.url"
                      class="ai-src"
                    >
                      <UIcon
                        name="i-lucide-book-open"
                        class="size-3.5 shrink-0"
                      />{{ src.title }}
                    </a>
                  </div>
                </Transition>
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
.ai-user { border-radius: 16px 16px 4px 16px; }
.ai-bot { border-radius: 4px 16px 16px 16px; text-wrap: pretty; }
.ai-bot :deep(strong) { font-weight: 700; color: var(--ui-text-highlighted); }
.ai-bot :deep(.ai-code) { padding: 1px 6px; border-radius: 6px; background: rgb(0 0 0 / .25); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
.ai-bot :deep(.ai-chip) { display: inline-flex; align-items: center; gap: 6px; vertical-align: middle; margin: 1px 2px; padding: 2px 9px 2px 6px; min-height: 26px; max-width: 100%; border-radius: 8px; border: 1px solid var(--ui-border-accented); background: var(--ui-bg); color: var(--ui-text); font-size: 13px; font-weight: 600; line-height: 1.4; text-decoration: none; white-space: nowrap; transition: border-color .2s ease, color .2s ease; }
.ai-bot :deep(.ai-chip span) { overflow: hidden; text-overflow: ellipsis; }
.ai-bot :deep(.ai-chip img) { width: 14px; height: 14px; border-radius: 4px; object-fit: contain; flex: 0 0 auto; }
.ai-bot :deep(.ai-chip-arrow) { flex: 0 0 auto; opacity: .7; }
.ai-bot :deep(.ai-chip:hover) { border-color: var(--ui-primary); color: var(--ui-primary); }
.ai-bot :deep(.ai-chip:focus-visible) { outline: 2px solid var(--ui-primary); outline-offset: 2px; }
.ai-caret { display: inline-block; width: 7px; height: 14px; margin-left: 2px; vertical-align: -2px; border-radius: 2px; background: var(--ui-primary); animation: ai-blink .9s steps(2) infinite; }
.ai-src { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--ui-border); color: var(--ui-text-muted); font-size: 12px; font-weight: 600; text-decoration: none; transition: border-color .2s ease, color .2s ease; }
.ai-src:hover { border-color: var(--ui-border-accented); color: var(--ui-text-highlighted); }
.ai-src:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: 2px; }
.ai-meta-enter-active { transition: opacity .3s ease .05s; }
.ai-meta-enter-from { opacity: 0; }
@keyframes ai-blink { 50% { opacity: 0; } }

.ai-bar { animation: ai-bar-in .5s cubic-bezier(.23, 1, .32, 1) .15s backwards; }
@keyframes ai-bar-in { from { opacity: 0; translate: 0 12px; } }

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
  .ai-bar { animation: none; }
  .ai-caret { animation: none; }
  .ai-meta-enter-active { transition: none; }
}
</style>
