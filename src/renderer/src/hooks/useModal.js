// hooks/useModal.js
import { ref } from 'vue'

const modalKey = ref(null)
const modalId = ref(null)
const query = ref({})
const show = ref(false)

let initialized = false

export function useModal() {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true

    const syncModalState = () => {
      const isFromModal = window.history.state?.__from_modal__ === true
      if (isFromModal) {
        const match = location.pathname.match(/^\/([^/]+)\/([^/?#]+)/)
        if (match) {
          modalKey.value = match[1]
          modalId.value = match[2]
        } else {
          modalKey.value = null
          modalId.value = null
        }

        const search = new URLSearchParams(location.search)
        query.value = Object.fromEntries(search.entries())

        show.value = true
      } else {
        modalKey.value = null
        modalId.value = null
        query.value = {}
        show.value = false
      }
    }

    window.addEventListener('popstate', syncModalState)
    syncModalState()
  }

  function openModal(key, id, params = {}) {
    const url = new URL(location.origin + `/${key}/${id}`)
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }

    window.history.pushState({ __from_modal__: true }, '', url.pathname + url.search)
    window.dispatchEvent(new Event('popstate'))
  }

  function closeModal() {
    window.history.back()
  }

  return {
    show,
    modalKey,
    modalId,
    query,
    openModal,
    closeModal,
  }
}
