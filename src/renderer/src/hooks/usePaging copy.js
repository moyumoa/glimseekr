import { ref, reactive, watch, onUnmounted, onDeactivated, onActivated } from 'vue'
import { $api } from '@/config/api.js'
import { $us } from '@/utils/index.js' // 假设你有 debounce 方法

/**
 * usePaging
 * @param {Ref<HTMLElement>} elRef - 监听滚动的 DOM 元素
 * @param {Object} options - 配置项
 * @param {string} options.name - 日志命名，用于控制台输出标识
 * @param {number} options.distance - 距底部多少像素触发加载
 * @param {string} options.apiName - 调用 $api 中的模块名
 * @param {Object} options.params - 请求的初始参数
 * @param {number} options.debounceTime - 滚动触发的节流间隔（毫秒）
 * @returns 返回分页状态与控制函数
 */
export function usePaging(elRef, {
  name = 'paging',           // 日志标识
  distance = 300,            // 默认触底阈值
  apiName = '',         // 默认 API 名
  params = ref({}),               // 传入的初始参数
  debounceTime = 200         // 节流时间
} = {}) {
  if (!apiName) {
    console.error(`[${name}] 请传入有效的 apiName`)
    return
  }

  // 列表数据
  const list = ref([])

  // 加载状态：请求进行中为 true
  const loading = ref(false)

  // 是否禁用继续加载（即没有更多数据）
  const disabled = ref(false)

  // 请求参数（响应式）
  const defaultParams = reactive({
    page: 1,
    limit: 10,
    ...params
  })

  /**
   * 主加载逻辑函数（分页请求 + 数据追加）
   */
  const handler = async () => {
    if (loading.value || !elRef.value || disabled.value) return

    const el = elRef.value
    const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight

    if (scrollBottom <= distance) {
      loading.value = true
      try {
        const result = await $api[apiName].list(defaultParams)

        // 如果是第一页，重置列表，否则追加
        list.value = defaultParams.page === 1
          ? result.data
          : list.value.concat(result.data)

        // 如果本页数据不足一页大小，禁用继续加载
        disabled.value = result.data.length < defaultParams.limit

        // 页码递增
        defaultParams.page++
      } catch (err) {
        console.error(`[${name}] 分页请求失败：`, err)
      } finally {
        loading.value = false
      }
    }
  }

  // 使用节流控制滚动触发频率
  const throttledHandler = $us.debounce(handler, debounceTime)

  // 标志位：是否已绑定事件，防止重复绑定
  let hasBound = false

  /**
   * 绑定滚动事件
   */
  const bindScroll = () => {
    if (elRef.value && !hasBound) {
      elRef.value.addEventListener('scroll', throttledHandler)
      hasBound = true
      console.log(`[${name}] 已绑定滚动事件`)
    }
  }

  /**
   * 解绑滚动事件
   */
  const unbindScroll = () => {
    if (elRef.value && hasBound) {
      elRef.value.removeEventListener('scroll', throttledHandler)
      hasBound = false
      console.log(`[${name}] 已解绑滚动事件`)
    }
  }

  /**
   * 外部调用初始化分页函数
   * 可传入参数合并、加载第一页
   */
  const onInit = async (newParams = {}) => {
    console.log(`[${name}] 初始化分页`)
    defaultParams.page = 1
    Object.assign(defaultParams, newParams)
    await handler()
  }

  /**
   * 响应式监听 elRef DOM 初始化绑定
   * 组件首次渲染时自动绑定 scroll 事件
   */
  watch(elRef, (newEl, _, onCleanup) => {
    if (newEl) {
      bindScroll()
      // 当 elRef 变化或组件卸载时解绑事件
      onCleanup(unbindScroll)
    }
  })

  /**
   * keep-alive 场景下：组件被缓存时解绑滚动
   */
  onDeactivated(unbindScroll)

  /**
   * keep-alive 场景下：组件恢复激活时重新绑定
   */
  onActivated(bindScroll)

  /**
   * 非 keep-alive 场景下：组件真正销毁时解绑
   */
  onUnmounted(unbindScroll)

  // 返回值暴露给外部组件使用
  return {
    list,                 // 数据列表
    loading,              // 加载状态
    disabled,             // 是否已到底部
    onInit,               // 外部初始化函数
    reset: () => {        // 重置分页数据
      defaultParams.page = 1
      list.value = []
      disabled.value = false
    },
    params: defaultParams // 当前参数（响应式）
  }
}
