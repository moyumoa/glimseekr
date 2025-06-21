<!-- dynamic-modules/modal-host.vue -->
<template>
  <Teleport to="body">
    <div v-if="show && currentComponent" class="modal-mask" @click.self="closeModal">
      <Suspense>
        <component class="modal-body" :is="currentComponent" :id="modalId" :query="query" @close="closeModal" />
      </Suspense>
    </div>
  </Teleport>
</template>

<script setup>
import { defineAsyncComponent, computed } from 'vue'
import { useModal } from '@/hooks/useModal'
const { modalKey, modalId, query, show, closeModal } = useModal()

const modalMap = {
  folder: () => import('@/views/folder/component/folder-detail.vue'),
  space: () => import('@/views/user/index.vue'),
}

const currentComponent = computed(() => {
  const loader = modalMap[modalKey.value]
  return loader ? defineAsyncComponent(loader) : null
})

/* 锁定页面 */
const lockedPage = () => {
  document.body.style.overflow = 'hidden' // 禁止页面滚动
}

/* 解锁页面 */
const unlockedPage = () => {
  // 恢复页面滚动
  document.body.style.overflow = ''
}

watch(show, (val) => {
  if (val) {
    lockedPage()
  } else {
    unlockedPage()
  }
})

onMounted(() => {
  nextTick(() => {
    if (show.value) {
      lockedPage()
    } else {
      unlockedPage()
    }
  })

})

onUnmounted(() => {
  unlockedPage() // 确保在组件卸载时恢复页面状态
})

</script>

<style lang="scss" scoped>
.modal-mask {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.8);

  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  // backdrop-filter: blur(8px) saturate(150%);
  // -webkit-backdrop-filter: blur(8px) saturate(150%);
}

.modal-body {
  margin: 0 16em 0;
  // padding: 24px;
  box-sizing: border-box;
  background-color: var(--sidebar-bg);
  // border-radius: 12px;
  // box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: calc(100vh - var(--header-height) - 6em);
  min-height: calc(100vh - var(--header-height) - 6em);
  max-height: calc(100vh - var(--header-height) - 6em);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.44);
  box-shadow: inset 0 0 16px rgba(255, 255, 255, 0.025),
    0 4px 24px rgba(0, 0, 0, 0.2);
  // will-change: transform;
  overflow: visible;
  will-change: unset;
}
</style>
