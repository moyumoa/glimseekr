// hooks/useModal.js
import { ref } from 'vue'

const modalKey = ref(null)  // 弹窗的 key
const modalId = ref(null)   // 弹窗的 id
const query = ref({})       // 弹窗的查询参数
const show = ref(false)     // 弹窗是否显示

let initialized = false     // 初始化标志

export function useModal() {
  // 如果没有初始化且当前环境为浏览器
  if (!initialized && typeof window !== 'undefined') {
    initialized = true

    // 同步弹窗状态
    const syncModalState = () => {
      // 检查当前路径是否包含弹窗信息
      const isFromModal = window.history.state?.__from_modal__ === true
      if (isFromModal) {
        // 如果是从弹窗跳转过来，解析 modalKey 和 modalId
        const match = location.pathname.match(/^\/([^/]+)\/([^/?#]+)/)
        if (match) {
          modalKey.value = match[1]
          modalId.value = match[2]
        } else {
          modalKey.value = null
          modalId.value = null
        }

        // 解析查询参数
        const search = new URLSearchParams(location.search)
        query.value = Object.fromEntries(search.entries())

        show.value = true  // 弹窗显示
      } else {
        modalKey.value = null
        modalId.value = null
        query.value = {}
        show.value = false  // 弹窗隐藏
      }
    }

    // 监听 popstate 事件，弹窗关闭时触发
    window.addEventListener('popstate', syncModalState)
    syncModalState()  // 初始化时同步一次状态
  }

  // 打开弹窗
  function openModal(key, id, params = {}) {
    // 构造弹窗 URL
    const url = new URL(location.origin + `/${key}/${id}`)
    // 追加查询参数
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }

    // 更新浏览器历史记录
    window.history.pushState({ __from_modal__: true }, '', url.pathname + url.search)
    window.dispatchEvent(new Event('popstate'))  // 触发 popstate 事件，更新状态
  }

  // 关闭弹窗
  function closeModal() {
    // 返回上一页
    window.history.back()  // 跳转到历史记录中的上一状态，关闭弹窗
  }

  // 返回弹窗的显示状态和相关信息
  return {
    show,
    modalKey,
    modalId,
    query,
    openModal,
    closeModal
  }
}
