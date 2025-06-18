import { ref, reactive, watch, onUnmounted, onDeactivated, onActivated, nextTick } from 'vue'
import { $api } from '@/config/api.js'
import { $us } from '@/utils/index.js'

export function usePaging(
  elRef,
  { name = 'paging', distance = 300, apiName = '', debounceTime = 200 } = {}
) {
  if (!apiName) {
    console.error(`[${name}] 请传入有效的 apiName`)
    return
  }

  const list = ref([])
  const loading = ref(false)
  const disabled = ref(false)

  const defaultParams = reactive({
    page: 1,
    limit: 30
  })

  /**
   * 主加载逻辑函数（分页加载）
   */
  const handler = async () => {
    if (loading.value || !elRef.value || disabled.value) return

    const el = elRef.value
    const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (scrollBottom <= distance) {
      loading.value = true
      try {
        const result = await $api[apiName].list(defaultParams)
        const data = result.data || []

        list.value = defaultParams.page === 1 ? data : list.value.concat(data)
        disabled.value = data.length < defaultParams.limit
        defaultParams.page++
      } catch (err) {
        console.error(`[${name}] 分页请求失败:`, err)
      } finally {
        loading.value = false
      }
    }
  }

  const throttledHandler = $us.debounce(handler, debounceTime)
  let hasBound = false

  const bindScroll = () => {
    if (elRef.value && !hasBound) {
      elRef.value.addEventListener('scroll', throttledHandler)
      hasBound = true
    }
  }

  const unbindScroll = () => {
    if (elRef.value && hasBound) {
      elRef.value.removeEventListener('scroll', throttledHandler)
      hasBound = false
    }
  }

  /**
   * 初始化分页（页面挂载时调用）
   */
  const onInit = async (newParams = {}) => {
    defaultParams.page = 1
    defaultParams.limit = newParams.limit || 30
    Object.assign(defaultParams, newParams)
    list.value = []
    disabled.value = false

    await handler() // 只加载第一页，立即返回，组件渲染后手动调用 tryFill()
    // await tryFill()
  }

  /**
   * 组件渲染完成后，手动调用以检查是否还需要补页
   */
  const tryFill = async () => {
    await nextTick()
    const el = elRef.value
    if (!el || disabled.value || loading.value) return

    const notFull = el.scrollHeight <= el.clientHeight + distance
    // console.log(`[${name}] tryFill:`, {
    //   scrollHeight: el.scrollHeight,
    //   clientHeight: el.clientHeight,
    //   scrollTop: el.scrollTop,
    //   distance,
    //   notFull
    // })
    if (notFull) {
      await handler()
    }
  }

  watch(elRef, (newEl, _, onCleanup) => {
    if (newEl) {
      bindScroll()
      onCleanup(unbindScroll)
    }
  })

  onDeactivated(unbindScroll)
  onActivated(bindScroll)
  onUnmounted(unbindScroll)

  return {
    list,
    loading,
    disabled,
    onInit,
    loadMore: handler, // 手动加载下一页
    tryFill, // 👈 由组件在 @rendered 时触发
    reset: () => {
      defaultParams.page = 1
      list.value = []
      disabled.value = false
    },
    params: defaultParams
  }
}
