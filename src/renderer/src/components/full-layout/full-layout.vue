<template>
  <div class="full-layout">
    <Transition name="fade" appear v-if="show">
      <aside v-show="show" class="full-layout-sidebar">
        <div class="full-layout-sidebar-top">
          <div class="backbox" @click="closeSubPage()">
            <i-svg name="ah5taocan" class="backbox-icon" size="15" />
            <span class="backbox-text">返回</span>
          </div>
          <span class="backbox-subhead">{{ props.subhead }}</span>
        </div>

        <slot name="side" />
        <Footerbar style="bottom: 20px" />
      </aside>
    </Transition>

    <main class="full-layout-content">
      <slot name="main" />
    </main>
  </div>
</template>
<script setup>
import Footerbar from '@/Layout/components/Footerbar.vue'
const props = defineProps({
  subhead: {
    type: String,
    default: '',
  },
})
import { useSubPage } from '@/hooks'
const { show, closeSubPage } = useSubPage()
</script>
<style lang="scss" scoped>
.fade-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-enter-to {
  opacity: 0;
  transform: translateY(0);
}


.full-layout {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  width: 100%;
  height: 100%;
  display: flex;

  &-sidebar {
    flex-shrink: 0;
    margin-right: 24px;
    width: var(--side-width);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;

    &-top {
      height: 40px;
      padding: 8px 0;
      display: flex;
      align-items: center;
    }

  }

  &-content {
    border-radius: 16px;
    flex-grow: 1;
    overflow: hidden;
    box-sizing: border-box;
  }
}

.backbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 15px;
  color: var(--text-primary);
  padding-left: 2px;
  padding-right: 14px;
  margin-right: 12px;
  position: relative;
  transition: all 0.15s ease;

  // 在结尾(右边)加一条分割线
  &::before {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 72%;
    background-color: var(--text-secondary);
  }

  &:hover &-icon {
    color: var(--text-soft);
    transform: scale(1.1) rotate(180deg);
  }

  &:hover &-text {
    color: var(--text-soft);
    transform: scale(1.025);
  }

  &-icon {
    transform: rotate(180deg);
    line-height: 0;
    margin-right: 5px;
  }

  &-text {
    font-size: 15px;
  }

  &-subhead {
    font-size: 14px;
    color: var(--text-secondary);
  }
}
</style>