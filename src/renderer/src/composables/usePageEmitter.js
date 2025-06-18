import { useBus } from '@/utils/bus'

export function usePageEmitter(pageName, fromModule) {
  const { emit } = useBus()

  const send = (payload) => {
    const eventName = `${pageName}-channel`
    emit(eventName, {
      from: fromModule,
      payload
    })
  }

  return {
    send
  }
}
