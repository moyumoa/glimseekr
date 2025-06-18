import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import ModalHost from '@/dynamic-modules/modal-host.vue'

document.documentElement.classList.add('dark') // ✅ 应用暗黑主题类

import { createPinia } from 'pinia'
import piniaPersistedState from 'pinia-plugin-persistedstate'
import { ElCollapseTransition } from 'element-plus'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'element-plus/theme-chalk/el-notification.css'
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/base.css'

import router from './router' // ✨引入刚刚的router
import { setupDynamicRoutes } from './router/setupDynamicRoutes' // ✨引入动态路由的函数
async function bootstrap() {
  const app = createApp(App) // ✅ 创建 app 实例

  const pinia = createPinia() // ✅ 创建 pinia
  pinia.use(piniaPersistedState) // ✅ 使用 pinia 持久化插件
  app.use(pinia) // ✅ 挂上 pinia

  // await setupDynamicRoutes()
  app.use(router) // ✅ 挂上路由实例
  app.component(ElCollapseTransition.name, ElCollapseTransition)
  app.mount('#app') // ✅ 挂载到 DOM

  // ✅ 挂载 ModalHost 到 body（app 挂完之后执行）
  const div = document.createElement('div')
  document.body.appendChild(div)
  createApp(ModalHost).mount(div) // ✅ 这一步必须有
}

bootstrap()
