<template>
  <div class="bottom-status-bar" @click="navito">
    <div class="bsb-item" :style="upLoading ? animationStyle : defaultStyle">
      <i-svg name="chuanshuliebiao" :class="{ 'upt-uploading': upLoading }" size="16" />
      <span class="bsb-item-t" :class="{ 'upt-uploading': upLoading }">{{ upLoading ? upStatusText : '暂无上传任务' }}</span>
    </div>

    <div class="bsb-item">
      <div class="bsb-item-space" @click="openModalHook('space', null, { title: '空间使用情况' })">
        <i-svg name="wangpanjihuo" size="16" />
        <span class="bsb-item-space-t">已用 {{ spaceInfo.usedDisplay }} / {{ spaceInfo.totalDisplay }}</span>
        <i-svg name="ah5taocan" size="12" />
      </div>
    </div>

    <el-progress :percentage="Number(spaceInfo.percent)" :stroke-width="6" :color="colors" :show-text="false"
      :striped="upLoading" :striped-flow="upLoading" />

    <div class="desc">
      <span class="desc-text">套餐有效期至</span>
      <span class="desc-text">2022/02/02</span>
    </div>
  </div>
</template>

<script setup>
const { data: infos } = useStoreData('uspace')
const spaceInfo = computed(() => {
  return calcStorageStats(infos.value.total_storage_limit, infos.value.used_storage)
})
const colors = [
  { color: '#67c23a', percentage: 30 },   // 绿色：健康
  { color: '#91cb74', percentage: 50 },   // 介于绿和黄之间
  { color: '#e6a23c', percentage: 66 },   // 橙黄：需注意
  { color: '#f39c12', percentage: 78 },   // 深橙：高风险
  { color: '#d60000', percentage: 90 },  // 红色：已用尽
  { color: '#d60000', percentage: 100 },  // 红色：已用尽
]

import { useModal } from '@/hooks'
const { openModal: openModalHook, show: showModalHook } = useModal({ mode: 'popup' })


import { uploader } from '@/hooks'
const $up = uploader()

const upLoading = computed(() => $up.loading.value)
const upQueue = computed(() => $up.queue.value.length)

const upStatusText = computed(() => {
  return `正在上传 (${$up.successCount.value}/${$up.queue.value.length})`
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

import { useRouter } from 'vue-router'
const router = useRouter()
const navito = () => {
}

</script>

<style lang="scss">
.bottom-status-bar {

  position: absolute;
  left: 0;
  bottom: 36px;
  z-index: 1;

  width: calc(100% - 16px);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.bsb-item {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  margin-bottom: 12px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  &:last-child {
    margin-bottom: 0;
  }

  &-t {
    margin-left: 6px;
    font-size: 12px;
  }

  &-space {
    width: 100%;
    display: flex;
    align-items: center;
    // justify-content: center;
    // margin-right: 12px;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: var(--text-primary);
      -webkit-text-fill-color: var(--text-primary);
    }

    &-t {
      flex: 1;
      margin-left: 6px;
    }
  }
}

.desc {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  opacity: 0.8;

  .desc-text {
    transform: scaleY(0.95);
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
