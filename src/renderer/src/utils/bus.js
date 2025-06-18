import mitt from 'mitt'

// 创建mitt实例
const bus = mitt()

export const useBus = () => {
  return {
    // 发送事件
    emit: bus.emit,

    // 监听事件
    on: bus.on,

    // 取消监听事件
    off: bus.off,

    // 只监听一次事件
    once(eventName, callback) {
      const wrapper = (...args) => {
        callback(...args)
        bus.off(eventName, wrapper) // 事件触发后自动解绑
      }
      bus.on(eventName, wrapper)
    }
  }
}
