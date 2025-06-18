import { onMounted, onUnmounted, watch } from 'vue'

export function useInfiniteScroll(elRef, callback, options = {}) {
  console.log('触底加载')
  const distance = options.distance || 300
  const disabled = options.disabled || ref(false)

  const handler = () => {
    if (!elRef.value || disabled.value) return

    const el = elRef.value
    const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight

    if (scrollBottom <= distance) {
      callback()
    }
  }

  onMounted(() => {
    elRef.value && elRef.value.addEventListener('scroll', handler)
  })

  onUnmounted(() => {
    elRef.value && elRef.value.removeEventListener('scroll', handler)
  })

  watch(elRef, (newEl, _, onCleanup) => {
    if (newEl) {
      newEl.addEventListener('scroll', handler)
      onCleanup(() => {
        newEl.removeEventListener('scroll', handler)
      })
    }
  })
}
