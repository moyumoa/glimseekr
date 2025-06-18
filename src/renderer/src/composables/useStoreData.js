import { computed } from 'vue'
import { useStore } from '@/stores'

/**
 * space 数据状态封装：按 key 存取状态
 * @param {string} key - space 唯一标识
 */
export const useStoreData = (key) => {
  const store = useStore()

  return {
    /**
     * 获取 space 的状态（响应式）
     */
    data: computed(() => store.getDatasInfo(key)),

    /**
     * 设置状态（合并，不会覆盖整个对象）
     */
    set: (info) => store.setDatasInfo(key, info),

    /**
     * 清除该 space 的缓存
     */
    clear: () => store.clearDatasInfo(key)
  }
}
