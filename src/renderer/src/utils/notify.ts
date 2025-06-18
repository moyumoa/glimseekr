import { ElNotification, NotificationOptions, NotificationParamsTyped } from 'element-plus'

const baseConfig: Partial<NotificationParamsTyped> = {
  zIndex: 99999,
  offset: 32,
  duration: 3000,
  position: 'top-right',
  showClose: true
} as Record<string, any>

export const notify = {
  success(msg: string, options: Partial<NotificationParamsTyped> = {}) {
    return ElNotification.success({ message: msg, ...baseConfig as object, ...options as object })
  },
  error(msg: string, options: Partial<NotificationParamsTyped> = {}) {
    return ElNotification.error({ message: msg, ...baseConfig, ...options as object })
  },
  warning(msg: string, options: Partial<NotificationParamsTyped> = {}) {
    return ElNotification.warning({ message: msg, ...baseConfig, ...options as object })
  },
  info(msg: string, options: Partial<NotificationParamsTyped> = {}) {
    return ElNotification.info({ message: msg, ...baseConfig, ...options as object })
  }
}
