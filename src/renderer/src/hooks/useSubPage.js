// hooks/useSubPage.js
import { ref } from 'vue'

const show = ref(false)
const subPath = ref(null)
const query = ref({})

let initialized = false

export function useSubPage() {
  // 初始化 popstate 监听
  if (!initialized && typeof window !== 'undefined') {
    initialized = true

    const syncSubPageState = () => {
      const isFromSubPage = window.history.state?.__from_subpage__ === true
      show.value = isFromSubPage

      if (isFromSubPage) {
        subPath.value = location.pathname
        const search = new URLSearchParams(location.search)
        query.value = Object.fromEntries(search.entries())
      } else {
        subPath.value = null
        query.value = {}
      }
    }

    window.addEventListener('popstate', syncSubPageState)
    syncSubPageState() // 首次进入时判断状态
  }

  /**
   * 打开子页面（伪跳转）
   * @param {string} path - 目标路径，如 /detail/123
   * @param {object} [params={}] - 可选的 query 参数对象
   */
  function openSubPage(path, params = {}) {
    subPath.value = path
    query.value = params
    show.value = true

    const url = new URL(location.origin + path)
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
    window.history.pushState({ __from_subpage__: true }, '', url.pathname + url.search)
    window.dispatchEvent(new Event('popstate'))
  }

  /**
   * 关闭子页面（返回上一页）
   */
  function closeSubPage () {
    show.value = false
    subPath.value = null
    query.value = {}
    window.history.back()
  }

  return {
    show,
    subPath,
    query,
    openSubPage,
    closeSubPage,
  }
}
