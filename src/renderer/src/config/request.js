import axios from 'axios'
import { envs } from './public.js'
import { notify } from '@/utils/notify'
// 创建axios实例
const instance = axios.create({
  baseURL: envs.baseUrl,
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

let sessionKey = 'sessionObj'

// 请求拦截器：加 token
instance.interceptors.request.use(
  (config) => {
    const isToken = config.headers?.isToken === false
    const isRepeatSubmit = config.headers?.repeatSubmit === false

    const token = localStorage.getItem('mtttoken') || ''
    // 设置token
    if (token && !isToken) {
      config.headers['Authorization'] = token
    }

    // GET 请求拼接参数
    if (config.method === 'get' && config.params) {
      const urlParams = new URLSearchParams(config.params).toString()
      config.url += '?' + urlParams
      config.params = {}
    }

    // 防重复提交（post/put）
    if (!isRepeatSubmit && ['post', 'put'].includes(config.method)) {
      const requestData = {
        url: config.url,
        data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
        time: new Date().getTime()
      }

      const sizeLimit = 5 * 1024 * 1024
      if (JSON.stringify(requestData).length >= sizeLimit) {
        console.warn(`[${config.url}] 请求体超过5M，跳过重复校验`)
        return config
      }

      const sessionStr = sessionStorage.getItem(sessionKey)
      const lastRequest = sessionStr ? JSON.parse(sessionStr) : null
      const interval = 1000

      if (
        lastRequest &&
        lastRequest.url === requestData.url &&
        lastRequest.data === requestData.data &&
        requestData.time - lastRequest.time < interval
      ) {
        const msg = '数据正在处理，请勿重复提交'
        console.warn(`[${config.url}] ${msg}`)
        return Promise.reject(new Error(msg))
      }

      sessionStorage.setItem(sessionKey, JSON.stringify(requestData))
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理
instance.interceptors.response.use(
  (response) => {
    const newToken = response.headers['authorization'] || response.headers['Authorization']
    if (newToken) {
      localStorage.setItem('mtttoken', newToken)
    }

    const data = response.data

    if (data.errCode !== 0) {
      ;(
        ({
          401: () => notify.warning(data.errMsg || '登录已失效'),
          4003: () =>
            notify.error(data.errMsg || '空间已满', {
              title: '空间已满',
              duration: 0,
              showClose: true
            }),
          '-1': () => {
            notify.info(data.errMsg || '访问失败')
            history.back()
          }
        })[data.errCode] ||
        (() => {
          notify.warning(data.errMsg || '服务异常')
        })
      )?.()
      return Promise.reject(data)
    }
    return data
  },
  (error) => {
    console.warn('请求异常', error)
    notify.error(error.message || '服务器异常')
    return Promise.reject(error)
  }
)

export default instance
