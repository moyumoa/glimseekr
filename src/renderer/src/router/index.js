import { createRouter, createWebHistory } from 'vue-router'

export const dynamicLayoutRoute = {
  path: '/',
  name: 'Layout',
  component: () => import('@/Layout/index.vue'),
  redirect: '/folder',
  children: [
    {
      path: '/folder/:id?',
      name: 'Folder',
      component: () => import('@/views/folder/index.vue'),
      meta: {
        basePath: '/folder',
        title: '云储空间',
        icon: 'wenjianjiadakai',
        size: 18,
        side: true
      }
    },
    {
      path: '/film-selection-delivery/:id?',
      name: 'FilmSelectionDelivery',
      component: () => import('@/views/deliver/film-selection-delivery.vue'),
      meta: {
        basePath: '/fast-delivery',
        title: '选片交付',
        icon: 'wenjianjiadakai',
        size: 18,
        side: true
      }
    },
    {
      path: '/fast-delivery/:id?',
      name: 'FastDelivery',
      component: () => import('@/views/deliver/fast-delivery.vue'),
      meta: {
        basePath: '/fast-delivery',
        title: '快速交付',
        icon: 'wenjianjiadakai',
        size: 18,
        side: true
      }
    },
    // {
    //   path: '/folder/detail/:id',
    //   name: 'FolderDetail',
    //   component: () => null
    // },
    {
      path: '/customer',
      name: 'Customer',
      meta: {
        basePath: '/customer',
        title: '客户资料',
        icon: 'kehuziliao',
        size: 18,
        side: true
      },
      component: () => import('@/views/customer/index.vue')
    },
    {
      path: '/client-photo',
      name: 'ClientPhoto',
      meta: {
        basePath: '/client-photo',
        title: '选片管理',
        icon: 'suoyouchangjing',
        size: 18,
        side: true
      },
      component: () => import('@/views/client-photo/index.vue')
    },
    {
      path: '/portfolio',
      name: 'Portfolio',
      meta: {
        basePath: '/portfolio',
        title: '作品集',
        icon: 'zhaopianqiang',
        size: 21,
        side: true
      },
      component: () => import('@/views/portfolio/index.vue')
    },
    {
      path: '/settings',
      name: 'Settings',
      meta: { basePath: '/settings', title: '更多功能', icon: 'gengduo', size: 18, side: true },
      component: () => import('@/views/settings/index.vue')
    },
    {
      path: '/personal',
      name: 'Personal',
      meta: { basePath: '/personal', title: '我的', icon: 'wode', size: 18, side: true },
      component: () => import('@/views/personal/index.vue')
    }

    //   {
    //     path: '/dashboard',
    //     name: 'Dashboard',
    //     meta: { basePath: '/dashboard', title: '首页' },
    //     component: () => import('@/views/dashboard/index.vue')
    //   }
  ]
}

const routes = [
  dynamicLayoutRoute,
  {
    path: '/details/:id',
    name: 'Details',
    meta: {
      layout: 'DetailsLayout', // 路由使用的布局
      title: '详情',
      icon: 'kehuziliao',
      size: 18,
      side: false
    },
    component: () => import('@/Layout/details.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // console.log('scrollBehavior', to, from, savedPosition)
    // 如果返回列表页，恢复滚动位置
    if (savedPosition) {
      return savedPosition
    }
    // 默认情况下，返回顶部
    return { top: 0 }
  }
})

// 白名单路由（无需登录）
const whiteList = ['/login', '/404']

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('mtttoken')
  if (token || whiteList.includes(to.path)) {
    next()
  } else {
    next('/login')
  }
})

export default router
