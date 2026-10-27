<template>
  <div class="crossword">
    <div
      class="cw-clue"
      aria-live="polite"
    >
      <template v-if="activeWord">
        <span class="cw-clue-num">{{ activeWord.n }} {{ activeWord.d === 'a' ? 'по горизонтали' : 'по вертикали' }}</span>
        <span>{{ activeWord.q }}</span>
      </template>
      <span
        v-else
        class="cw-clue-hint"
      >Нажмите на клетку, чтобы начать</span>
    </div>

    <div class="cw-scroll">
      <div
        class="cw-grid"
        :style="{ gridTemplateColumns: `repeat(${W}, var(--cw-cell))` }"
        role="application"
        aria-label="Кроссворд"
      >
        <template
          v-for="i in total"
          :key="i"
        >
          <div
            v-if="!isWhite(i - 1)"
            class="cw-cell cw-block"
          />
          <div
            v-else
            class="cw-cell cw-white"
            :class="cellClass(i - 1)"
            @click="select(i - 1)"
          >
            <span
              v-if="numbers[i - 1]"
              class="cw-num"
            >{{ numbers[i - 1] }}</span>
            <span class="cw-letter">{{ cells[i - 1] }}</span>
          </div>
        </template>
      </div>
      <input
        ref="inputEl"
        class="cw-input"
        type="text"
        inputmode="text"
        autocomplete="off"
        autocapitalize="characters"
        autocorrect="off"
        spellcheck="false"
        aria-label="Ввод букв в кроссворд"
        @keydown="onKeydown"
        @input="onInput"
      >
    </div>

    <div class="cw-actions">
      <UButton
        :loading="checking"
        icon="i-lucide-check"
        @click="check"
      >
        Проверить
      </UButton>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-eraser"
        @click="clearAll"
      >
        Очистить
      </UButton>
    </div>

    <p
      v-if="summary"
      class="cw-summary"
      role="status"
      :class="{ 'cw-summary-done': summary.done }"
    >
      {{ summary.text }}
    </p>
    <p class="cw-help">
      Стрелки двигают по клеткам, Пробел или повторный клик меняет направление, Tab переходит к следующему слову. На телефоне сетку можно листать вбок
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { crosswordData } from '~/utils/crossword-data'

const { H, W, white, words } = crosswordData
const total = H * W
const STORE = 'lemicraft-crossword-v1'
const SALT = 'lemicraft-crossword:'
const ARROWS = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }

const cells = ref(Array(total).fill(''))
const active = ref(null)
const inputEl = ref(null)
const results = ref({})
const summary = ref(null)
const checking = ref(false)

const isWhite = i => white[i] === '1'

const wordCells = (w) => {
  const out = []
  for (let k = 0; k < w.len; k++) {
    out.push((w.r + (w.d === 'd' ? k : 0)) * W + w.c + (w.d === 'a' ? k : 0))
  }
  return out
}
const wordList = words.map(w => ({ ...w, idx: wordCells(w) }))

const numbers = (() => {
  const m = {}
  for (const w of wordList) m[w.idx[0]] = w.n
  return m
})()

const byCell = (() => {
  const m = {}
  wordList.forEach((w, wi) => {
    for (const c of w.idx) {
      m[c] = m[c] || {}
      m[c][w.d] = wi
    }
  })
  return m
})()

const activeWordIndex = computed(() => {
  if (!active.value) return null
  const at = byCell[active.value.cell]
  return at ? (at[active.value.dir] ?? at.a ?? at.d) : null
})
const activeWord = computed(() => activeWordIndex.value === null ? null : wordList[activeWordIndex.value])
const activeSet = computed(() => new Set(activeWord.value ? activeWord.value.idx : []))

function cellClass(i) {
  const cls = []
  if (activeSet.value.has(i)) cls.push('cw-in-word')
  if (active.value && active.value.cell === i) cls.push('cw-active')
  for (const wi of Object.values(byCell[i] || {})) {
    if (results.value[wi] === 'ok') cls.push('cw-ok')
    if (results.value[wi] === 'bad') cls.push('cw-bad')
  }
  return cls
}

function focusInput() {
  inputEl.value?.focus({ preventScroll: true })
}

function select(i) {
  const at = byCell[i]
  if (!at) return
  let dir = active.value?.dir || 'a'
  if (active.value && active.value.cell === i && at.a !== undefined && at.d !== undefined) {
    dir = dir === 'a' ? 'd' : 'a'
  } else if (at[dir] === undefined) {
    dir = dir === 'a' ? 'd' : 'a'
  }
  active.value = { cell: i, dir }
  focusInput()
}

function moveInWord(delta) {
  const w = activeWord.value
  if (!w) return
  const p = w.idx.indexOf(active.value.cell) + delta
  if (p >= 0 && p < w.idx.length) active.value = { ...active.value, cell: w.idx[p] }
}

function step(dr, dc) {
  if (!active.value) return
  let r = Math.floor(active.value.cell / W) + dr
  let c = (active.value.cell % W) + dc
  while (r >= 0 && r < H && c >= 0 && c < W) {
    if (isWhite(r * W + c)) {
      select(r * W + c)
      return
    }
    r += dr
    c += dc
  }
}

function nextWord(dir) {
  const cur = activeWordIndex.value ?? -1
  const n = wordList.length
  const wi = (cur + dir + n) % n
  active.value = { cell: wordList[wi].idx[0], dir: wordList[wi].d }
}

function touch(cell) {
  const hit = new Set(Object.values(byCell[cell] || {}).map(String))
  results.value = Object.fromEntries(Object.entries(results.value).filter(([k]) => !hit.has(k)))
  summary.value = null
}

function clearCell(cell) {
  cells.value[cell] = ''
  touch(cell)
}

function setLetter(ch) {
  if (!active.value) return
  cells.value[active.value.cell] = ch
  touch(active.value.cell)
  moveInWord(1)
}

function onKeydown(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const k = e.key
  if (ARROWS[k]) {
    e.preventDefault()
    step(...ARROWS[k])
  } else if (k === 'Tab') {
    e.preventDefault()
    nextWord(e.shiftKey ? -1 : 1)
  } else if (k === ' ' || k === 'Enter') {
    e.preventDefault()
    if (active.value) select(active.value.cell)
  } else if (k === 'Backspace') {
    e.preventDefault()
    if (!active.value) return
    if (!cells.value[active.value.cell]) moveInWord(-1)
    clearCell(active.value.cell)
  } else if (k === 'Delete') {
    e.preventDefault()
    if (active.value) clearCell(active.value.cell)
  }
}

function onInput(e) {
  const el = e.target
  const v = String(el.value || '')
  el.value = ''
  for (const ch of v.toLowerCase()) {
    if (/^[а-яё]$/.test(ch)) setLetter(ch === 'ё' ? 'е' : ch)
  }
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function check() {
  checking.value = true
  try {
    const res = {}
    let ok = 0
    let filled = 0
    for (let wi = 0; wi < wordList.length; wi++) {
      const w = wordList[wi]
      const letters = w.idx.map(c => cells.value[c])
      if (letters.some(l => !l)) continue
      filled++
      const same = await sha256(SALT + letters.join('').replace(/ё/g, 'е')) === w.h
      res[wi] = same ? 'ok' : 'bad'
      if (same) ok++
    }
    results.value = res
    const wrong = filled - ok
    const done = ok === wordList.length
    summary.value = {
      done,
      text: done
        ? 'Все 37 слов отгаданы, отличная работа'
        : `Отгадано слов: ${ok} из ${wordList.length}${wrong ? `, неверных: ${wrong}` : ''}${filled < wordList.length ? `, не заполнено до конца: ${wordList.length - filled}` : ''}`
    }
  } finally {
    checking.value = false
  }
}

function clearAll() {
  cells.value = Array(total).fill('')
  results.value = {}
  summary.value = null
}

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null')
    if (Array.isArray(saved) && saved.length === total) {
      cells.value = saved.map(x => (typeof x === 'string' ? x.slice(0, 1) : ''))
    }
  } catch {
    // localStorage недоступен или данные повреждены
  }
  watch(cells, (v) => {
    try {
      localStorage.setItem(STORE, JSON.stringify(v))
    } catch {
      // сохранение необязательно
    }
  }, { deep: true })
})
</script>

<style scoped>
.crossword {
  --cw-cell: 30px;
  margin: 1.5rem 0;
}

.cw-clue {
  min-height: 3rem;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.75rem;
  padding: 0.625rem 0.875rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--ui-border, #e5e7eb);
  border-radius: 10px;
  background: var(--ui-bg-muted, #f5f5f5);
  font-size: 0.9375rem;
}
.cw-clue-num { font-weight: 600; color: var(--ui-primary, #ab141c); }
.cw-clue-hint { color: var(--ui-text-muted, #6b7280); }

.cw-scroll {
  position: relative;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
}

.cw-grid {
  display: grid;
  grid-auto-rows: var(--cw-cell);
  width: max-content;
  border: 1px solid var(--ui-border, #d1d5db);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.cw-cell {
  position: relative;
  width: var(--cw-cell);
  height: var(--cw-cell);
  box-sizing: border-box;
}
.cw-block { background: var(--ui-bg-accented, #d4d4d8); }
.cw-white {
  background: var(--ui-bg, #fff);
  border: 1px solid var(--ui-border-accented, #9ca3af);
  cursor: pointer;
  transition: background-color 0.12s ease;
}
.cw-white.cw-in-word { background: color-mix(in srgb, var(--ui-primary, #ab141c) 14%, var(--ui-bg, #fff)); }
.cw-white.cw-active {
  background: color-mix(in srgb, var(--ui-primary, #ab141c) 32%, var(--ui-bg, #fff));
  outline: 2px solid var(--ui-primary, #ab141c);
  outline-offset: -2px;
  z-index: 1;
}
.cw-white.cw-ok { background: color-mix(in srgb, #22c55e 28%, var(--ui-bg, #fff)); }
.cw-white.cw-bad { background: color-mix(in srgb, #ef4444 28%, var(--ui-bg, #fff)); }

.cw-num {
  position: absolute;
  top: 1px;
  left: 2px;
  font-size: 9px;
  line-height: 1;
  color: var(--ui-text-muted, #6b7280);
  pointer-events: none;
}
.cw-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 1.0625rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--ui-text-highlighted, #111827);
  pointer-events: none;
}

.cw-input {
  position: absolute;
  left: 0;
  top: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  border: 0;
  padding: 0;
  font-size: 16px;
  pointer-events: none;
}

.cw-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
.cw-summary { margin-top: 0.75rem; font-weight: 600; font-size: 0.9375rem; }
.cw-summary-done { color: #16a34a; }
.cw-help { margin-top: 0.75rem; font-size: 0.8125rem; color: var(--ui-text-muted, #6b7280); }

@media (prefers-reduced-motion: reduce) {
  .cw-white { transition: none; }
}
</style>
