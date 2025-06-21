import { ref } from 'vue'

const modalKey = ref(null)
const modalId = ref(null)
const query = ref({})
const show = ref(false)

let mode = 'popup'

let initialized = false

export function useModal(options = {}) {
  if (options?.mode) {
    mode = options.mode
  }

  if (mode === 'route' && !initialized && typeof window !== 'undefined') {
    initialized = true
    window.addEventListener('popstate', () => {
      const isFromModal = window.history.state?.__from_modal__ === true
      show.value = isFromModal
      if (isFromModal) {
        const match = location.pathname.match(/^\/([^/]+)\/([^/?#]+)/)
        if (match) {
          modalKey.value = match[1]
          modalId.value = match[2]
        }
        const search = new URLSearchParams(location.search)
        query.value = Object.fromEntries(search.entries())
      } else {
        modalKey.value = null
        modalId.value = null
        query.value = {}
      }
    })
  }

  function openModal(key, id, params = {}) {
    modalKey.value = key
    modalId.value = id
    query.value = params
    show.value = true

    if (mode === 'route') {
      const url = new URL(location.origin + `/${key}/${id}`)
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v)
      }
      window.history.pushState({ __from_modal__: true }, '', url.pathname + url.search)
      window.dispatchEvent(new Event('popstate'))
    }
  }

  function closeModal() {
    if (mode === 'route') {
      window.history.back()
    } else {
      show.value = false
      modalKey.value = null
      modalId.value = null
      query.value = {}
    }
  }

  return {
    modalKey,
    modalId,
    query,
    show,
    openModal,
    closeModal
  }
}
