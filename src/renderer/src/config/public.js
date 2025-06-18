let baseUrl = ''

if (process.env.NODE_ENV === 'development') {
  baseUrl = '//127.0.0.1:3000' // 本地调试
} else if (process.env.NODE_ENV === 'production') {
  // baseUrl = 'https://cloud.glimseekr.cvxv.cn'
  baseUrl = 'http://127.0.0.1:3000'
}

export const envs = {
  baseUrl: baseUrl
}
