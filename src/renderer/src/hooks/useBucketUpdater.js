// hooks/useBucketUpdater.js
import { ref } from 'vue'
import { useStoreData } from '@/composables/useStoreData'
import { $api } from '@/config/api'

export function useBucketUpdater() {
  const loading = ref(false)
  const error = ref(null)

  const { set } = useStoreData('uspace')

  /**
   * 更新空间信息
   * @param {Object} info - 可选，如果传了就直接 set，不传则自动请求接口
   */
  const updateBucket = async (info = null) => {
    loading.value = true
    error.value = null

    try {
      if (info && typeof info === 'object') return set(info) // ✅ 直接手动更新
      const res = await $api.space.bucket() // ✅ 接口获取最新信息
      set(res.data)
      // console.log('✅ 更新空间信息成功:', res.data)
    } catch (err) {
      console.error('❌ 更新空间信息失败:', err)
      error.value = err.message || '未知错误'
    } finally {
      loading.value = false
    }
  }

  return {
    updateBucket, // 更新空间信息
    loading,
    error
  }
}
