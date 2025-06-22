<template>
  <div class="full-layout">
    <Transition name="fade">
      <aside v-show="show" class="full-layout-sidebar">
        <div class="full-layout-sidebar-top"></div>
        <slot name="side" />
        <Footerbar />
      </aside>
    </Transition>

    <main class="full-layout-content">
      <slot name="main" />
    </main>
  </div>
</template>
<script setup>
import Footerbar from '@/Layout/components/Footerbar.vue'
import { useSubPage } from '@/hooks'
const { show } = useSubPage()
</script>
<style lang="scss" scoped>
.fade-enter-active {
  transition: opacity 0.5s ease 2s, transform 0.5s ease 2s;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-enter-to {
  opacity: 1;
  transform: translateX(0);
  background-color: red;
}


.full-layout {
  width: 100%;
  height: 100%;
  display: flex;

  &-sidebar {
    flex-shrink: 0;
    margin-right: 24px;
    width: var(--side-width);
    padding: calc(var(--top-height) + 24px) 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;

    &-top {
      height: var(--top-height);
      width: 100%;
      background-color: var(--sidebar-bg);
    }

  }

  &-content {
    border-radius: 16px;
    flex-grow: 1;
    overflow: hidden;
    box-sizing: border-box;
  }
}

.show {
  opacity: 1;
}
</style>