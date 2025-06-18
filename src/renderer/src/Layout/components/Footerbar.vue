<template>
  <div class="bottom-status-bar" @click="navito">
    <div class="bsb-left" :style="upLoading ? animationStyle : defaultStyle">
      <i-svg name="chuanshuliebiao" size="16" />
      <span class="bsb-left-t" :class="{ 'upt-uploading': upLoading }">{{ upLoading ? upStatusText : '暂无上传任务' }}</span>
    </div>

    <div class="bsb-left">
      <div class="bsb-left-space">
        <i-svg name="wangpanjihuo" size="16" />
        <span class="bsb-left-space-t">空间用量 {{ spaceInfo.usedDisplay }} / {{ spaceInfo.totalDisplay }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const { data: infos } = useStoreData('uspace')
const spaceInfo = computed(() => {
  return calcStorageStats(infos.value.total_storage_limit, infos.value.used_storage)
})

import { uploader } from '@/hooks'
const $up = uploader()

const upLoading = computed(() => {
  return $up.loading.value
})

const upStatusText = computed(() => {
  return `正在上传 (${$up.successCount.value}/${$up.total.value})`
})

const animationStyle = ref({
  'animation-duration': '1.25s',
  background:
    'linear-gradient(-45deg, rgba(86, 188, 245, 0.3) 20%, rgba(86, 188, 245, 0.8) 50%, rgba(86, 188, 245, 0.2) 80%)',
  'background-size': '200% 100%',
  'background-position': '40% center',
  'will-change': 'background-position',
  '-webkit-background-clip': 'text',
  '-webkit-text-fill-color': 'transparent',
  color: 'transparent',
  'margin-top': '2px'
})

const defaultStyle = ref({
  animation: 'none',
  color: 'var(--text-secondary)',
  background: 'transparent',
  '-webkit-text-fill-color': 'var(--text-secondary)',
  'margin-top': '2px'
})


const { clear: clearUser } = useStoreData('user')
const { clear: clearUserSpace } = useStoreData('uspace')
import { useRouter } from 'vue-router'
const router = useRouter()
const navito = () => {
  // 临时在这里写一下退出登录逻辑
  // 1. 清除用户信息
  clearUser()
  clearUserSpace()
  localStorage.removeItem('mtttoken')
  // 2. 跳转到登录页
  router.push('/login')
}

</script>

<style lang="scss">
.bottom-status-bar {

  position: absolute;
  left: 0;
  bottom: 36px;
  z-index: 1;

  // width: 100%;
  border-radius: 12px;
  background-color: rgba(30, 30, 30, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(200, 200, 210, 0.35); // 🩶 更低调柔和的银灰色
  letter-spacing: 0.5px; // 🩶 更宽松的字间距
  padding: 12px;
  box-sizing: border-box;
  opacity: 0.9;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.bsb-left {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  &-t {
    margin-left: 6px;
    font-size: 12px;
  }

  &-space {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;

    &-t {
      margin-left: 6px;
    }
  }
}

.bsb-center {
  flex-shrink: 0;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.bsb-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  cursor: pointer;
  height: 100%;

  &-icon {
    margin-left: 12px;
    color: var(--text-primary);
    opacity: 0.8;
    transition: color 0.2s ease-in-out;

    &:hover {
      color: var(--text-primary);
      opacity: 1;
    }
  }

  .manager-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 100%;
    border-radius: 0;
    background-color: var(--primary-color);
    margin: 0 -12px 0 12px;
    box-sizing: border-box;
    cursor: pointer;
    color: rgba(245, 245, 245, 1);
    font-size: 15px;
    font-weight: 600;
    transition: all 0.1s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
      color: #fff;
    }
  }
}

.upt {
  &-uploading {
    color: #60a6f1;
    animation: none;
    -webkit-text-fill-color: #60a6f1;
    opacity: 1;
    background: transparent;
  }

  &-completed {
    color: #67c23a;
    animation: none;
    -webkit-text-fill-color: #67c23a;
    opacity: 1;
    background: transparent;
  }

  &-failed {
    color: #f56c6c;
    animation: none;
    -webkit-text-fill-color: #f56c6c;
    opacity: 1;
    background: transparent;
  }
}
</style>
