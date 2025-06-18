import { onMounted, onBeforeUnmount } from 'vue'
import { useBus } from '@/utils/bus'

export function usePageChannel(pageName, allowedModules, callback) {
  const { on, off } = useBus()

  const eventName = `${pageName}-channel`

  const handler = ({ from, payload }) => {
    if (allowedModules.includes(from)) {
      callback(payload, from)
    }
  }

  onMounted(() => {
    on(eventName, handler)
  })

  onBeforeUnmount(() => {
    off(eventName, handler)
  })
}
