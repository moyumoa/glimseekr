export const sidebars = [
  // {
  // 	text: '首页',
  // 	path: '/',
  // 	icon: 'icon-kongzhitai',
  // 	size: '27px',
  // },
  // {
  //   text: '首页',
  //   path: '/dashboard',
  //   icon: 'kongzhitai',
  //   size: '25px'
  // },
  {
    text: '云空间',
    path: '/space',
    name: 'Space',
    icon: 'wenjianjiadakai',
    size: '28px',
    sComponent: () => import('@/dynamic-modules/side/s-space.vue'),
    // sComponent: markRaw(defineAsyncComponent(() => import('@/dynamic-modules/side/s-space.vue'))),
    hComponent: () => import('@/dynamic-modules/header/h-space.vue')
  },
  {
    text: '客户资料',
    path: '/customer',
    name: 'Customer',
    icon: 'kehuziliao',
    size: '24px',
    sComponent: () => import('@/dynamic-modules/side/s-customer.vue'),
  },
  {
    text: '选片管理',
    path: '/client-photo',
    name: 'ClientPhoto',
    // icon: 'xuantu',
    icon: 'suoyouchangjing',
    size: '26.5px'
  },
  {
    text: '作品集',
    path: '/portfolio',
    name: 'Portfolio',
    icon: 'zhaopianqiang',
    size: '31px'
  },
  {
    text: '更多功能',
    path: '/settings',
    name: 'Settings',
    icon: 'gengduo',
    size: '28px',
  },
  {
    text: '微信会话',
    path: '/wechatkf',
    name: 'WeChatKf',
    icon: 'weixinkefu1',
    size: '25px'
  },
  {
    text: '我的',
    path: '/personal',
    name: 'Personal',
    icon: 'wode',
    size: '28px'
  }
]
