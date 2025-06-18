// router/setupDynamicRoutes.js
import router from '@/router'

/**
 * 动态注册路由，并可根据白名单控制哪些页面提前预加载
 * @param {Object} options
 * @param {Boolean} options.preload 是否启用预加载（默认 true）
 * @param {Array} options.preloadWhitelist 要预加载的 path 白名单（默认全部）
 */
export async function setupDynamicRoutes({ preload = true, preloadWhitelist = [] } = {}) {
  const menuList = [
    {
      path: 'space/:id?',
      name: 'Space',
      component: 'views/space/index.vue',
      meta: { basePath: '/space', title: '云储空间', sider: 's-space', headr: 'h-space' }
    },
    {
      path: 'customer',
      name: 'Customer',
      component: 'views/customer/index.vue',
      meta: { basePath: '/customer', title: '客户信息', sider: 's-customer', headr: 'h-customer' }
    },
    {
      path: 'client-photo',
      name: 'ClientPhoto',
      component: 'views/client-photo/index.vue',
      meta: { basePath: '/client-photo', title: '选片管理' }
    },
    {
      path: 'portfolio',
      name: 'Portfolio',
      component: 'views/portfolio/index.vue',
      meta: { basePath: '/portfolio', title: '作品集' }
    },
    {
      path: 'settings',
      name: 'Settings',
      component: 'views/settings/index.vue',
      meta: { basePath: '/settings', title: '更多' }
    },
    {
      path: 'wechatkf',
      name: 'WeChatKF',
      component: 'views/wechatkf/index.vue',
      meta: { basePath: '/wechatkf', title: '微信会话' }
    },
    {
      path: 'personal',
      name: 'Personal',
      component: 'views/personal/index.vue',
      meta: { basePath: '/personal', title: '个人中心' }
    },
    { path: 'user', name: 'User', component: 'views/user/index.vue' }
  ]

  const modules = import.meta.glob('/src/views/**/*.vue')

  for (const item of menuList) {
    const realPath = `/src/${item.component}`
    const loadComponent = modules[realPath]

    if (!loadComponent) {
      console.warn(`❗ 组件没找到：${item.component}`)
      continue
    }

    // ✅ 根据白名单控制是否提前加载
    if (preload && (preloadWhitelist.length === 0 || preloadWhitelist.includes(item.path))) {
      loadComponent()
    }

    router.addRoute('Layout', {
      ...item,
      component: loadComponent
    })
  }
}
