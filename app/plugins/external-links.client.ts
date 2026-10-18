export default defineNuxtPlugin((nuxtApp) => {
  const mark = () => {
    document.querySelectorAll<HTMLAnchorElement>('main a[href^="http"]').forEach((a) => {
      if (new URL(a.href).hostname === location.hostname) return
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
    })
  }
  nuxtApp.hook('app:mounted', mark)
  nuxtApp.hook('page:finish', () => nextTick(mark))
})
