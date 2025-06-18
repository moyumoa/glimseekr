<template>
  <Transition name="nested" mode="out-in">
    <keep-alive>
      <component :is="innerComp" :key="cpageData.pageKey" />
    </keep-alive>
  </Transition>
</template>

<script setup>
import { defineAsyncComponent, ref, watch } from 'vue'
import Loadingview from '@/Layout/components/simulateDynamic.vue'
const { data: cpageData } = useStoreData('cpage')

// 1. 动态组件引用
// const innerComp = ref(null)

const innerComp = shallowRef(null) 
// 2. 获取模块
const modules = import.meta.glob('@/dynamic-modules/side/*.vue')
watch(() => cpageData.value.sider, (newSider) => {
  if (!newSider) {
    innerComp.value = null
    return
  }

  const path = `/src/dynamic-modules/side/${newSider}.vue`
  const loader = modules[path]

  if (!loader) {
    console.warn('组件找不到:', path)
    innerComp.value = null
    return
  }

  const asyncComp = defineAsyncComponent({
    loader,
    delay: 200,
    timeout: 3000,
    loadingComponent: Loadingview,
    errorComponent: {
      template: '<div>加载失败</div>'
    }
  })

  innerComp.value = markRaw(asyncComp) // ✅ 避免异步组件被 Vue 深度代理
}, { immediate: true })

</script>
