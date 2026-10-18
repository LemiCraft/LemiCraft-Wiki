import { execFileSync } from 'node:child_process'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = 'content'
const dates = {}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.md')) {
      try {
        const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', path], { encoding: 'utf8' }).trim()
        if (iso) dates[path.slice(root.length + 1).replace(/\.md$/, '')] = iso.slice(0, 10)
      } catch {}
    }
  }
}

walk(root)
if (Object.keys(dates).length) writeFileSync('app/data/page-dates.json', JSON.stringify(dates, null, 2) + '\n')
