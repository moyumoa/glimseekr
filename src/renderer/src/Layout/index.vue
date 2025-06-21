<!-- Layout.vue -->
<template>
  <section>
    <div class="layout">
      <Headerbar v-if="isElectron !== 'web'" />
      <div class="layout-content">
        <Sidebar />
        <div class="layout-main">
          <router-view />
          <!-- <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view> -->
        </div>
      </div>
    </div>
  </section>

</template>

<script setup>
import Headerbar from './components/Headerbar.vue'
import Sidebar from './components/Sidebar.vue'

const isElectron = computed(() => {
  // return navigator.userAgent.toLowerCase().includes('electron');
  const platform = window.myElectron?.platform
  // 判断是在哪个平台上运行
  return platform === 'win32' || platform === 'linux' || platform === 'darwin' ? platform : 'web'
})

// 判断是否登录
const { data: userInfo } = useStoreData('user')
const mtttoken = localStorage.getItem('mtttoken')

if (userInfo.value?._id && mtttoken) {
  window?.myElectron?.loginSuccess()
}

</script>

<style lang="scss" scoped>
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);

  &-content {
    padding: 0 24px;
    box-sizing: border-box;
    width: 88%;
    margin: 0 auto;
    flex: 1;
    display: flex;
    flex-direction: row;
    justify-content: center;
    transition: width 0.3s ease-in-out;

    @media (max-width: 1480px) {
      width: 100%;
    }

    .layout-main {
      height: calc(100vh - var(--header-height) - 2em);
      max-height: calc(100vh - var(--header-height) - 2em);
      min-height: calc(100vh - var(--header-height) - 2em);
      margin-top: 1em;
      box-sizing: border-box;
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      width: 0;
      flex: 1 0 auto;
      // overflow-x: hidden;
      // overflow-y: hidden;
      // // 不显示滚动条
      // scrollbar-width: none; /* Firefox */
      // -ms-overflow-style: none; /* Internet Explorer and Edge */
      // &::-webkit-scrollbar {
      //   display: none; /* Chrome, Safari, and Opera */
      // }
    }
  }
}
</style>
