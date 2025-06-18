import BigNumber from 'bignumber.js'

export const $us = {
  // 深拷贝
  deepClone(obj) {
    let objClone = Array.isArray(obj) ? [] : {}
    if (obj && typeof obj === 'object') {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (obj[key] && typeof obj[key] === 'object') {
            objClone[key] = $us.deepClone(obj[key])
          } else {
            objClone[key] = obj[key]
          }
        }
      }
    }
    return objClone
  },

  /**
   * 格式化字节数为自动单位（B / KB / MB / GB）
   * @param {string | number} bytes 字节数
   * @returns {string} 返回带单位的字符串，如 "123 KB"、"2.34 MB"
   */
  formatBytes(bytes) {
    const size = new BigNumber(bytes || 0)
    const KB = new BigNumber(1000)
    const MB = KB.multipliedBy(1000)
    const GB = MB.multipliedBy(1000)

    if (size.isGreaterThanOrEqualTo(GB)) {
      return size.dividedBy(GB).toFixed(2, BigNumber.ROUND_DOWN) + ' GB'
    } else if (size.isGreaterThanOrEqualTo(MB)) {
      return size.dividedBy(MB).toFixed(2, BigNumber.ROUND_DOWN) + ' MB'
    } else if (size.isGreaterThanOrEqualTo(KB)) {
      return size.dividedBy(KB).toFixed(2, BigNumber.ROUND_DOWN) + ' KB'
    } else {
      return size.toFixed(0) + ' B'
    }
  },

  /**
   * 防抖函数
   * @param {Function} func 需要防抖的函数
   * @param {number} wait 等待时间，单位为毫秒
   */
  debounce (func, wait = 500) {
    let timeout
    return function (...args) {
      const context = this
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        func.apply(context, args)
      }, wait)
    }
  },

  /**
   * 格式化时间
   * @param {string | number | Date} time 时间戳或日期对象
   * @param {string} cFormat 格式化字符串，默认 '{y}-{m}-{d} {h}:{i}:{s}'
   * @returns {string} 格式化后的时间字符串
   */
  parseTime (time, cFormat) {
    if (!time) return ''
    if (arguments.length === 0) {
      return null
    }
    const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
    let date
    if (typeof time === 'object') {
      date = time
    } else {
      if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
        time = parseInt(time)
      }
      if (typeof time === 'number' && time.toString().length === 10) {
        time = time * 1000
      }
      date = new Date(time)
    }
    const formatObj = {
      y: date.getFullYear(),
      m: date.getMonth() + 1,
      d: date.getDate(),
      h: date.getHours(),
      i: date.getMinutes(),
      s: date.getSeconds(),
      a: date.getDay()
    }
    const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
      let value = formatObj[key]
      // Note: getDay() returns 0 on Sunday
      if (key === 'a') {
        return ['日', '一', '二', '三', '四', '五', '六'][value]
      }
      if (result.length > 0 && value < 10) {
        value = '0' + value
      }
      return value || 0
    })
    return time_str
  }
}
