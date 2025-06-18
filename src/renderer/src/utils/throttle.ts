export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait = 100,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let lastCallTime = 0
  let lastArgs: any[] | null = null

  const { leading = true, trailing = true } = options

  const invoke = () => {
    lastCallTime = Date.now()
    func.apply(null, lastArgs!)
    lastArgs = null
  }

  const throttled = function (this: any, ...args: any[]) {
    const now = Date.now()
    const remaining = wait - (now - lastCallTime)
    lastArgs = args

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      if (leading || lastCallTime === 0) {
        invoke()
      }
    } else if (trailing && !timeout) {
      timeout = setTimeout(() => {
        timeout = null
        if (trailing && lastArgs) invoke()
      }, remaining)
    }
  }

  throttled.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    lastArgs = null
    lastCallTime = 0
  }

  return throttled as T & { cancel: () => void }
}
