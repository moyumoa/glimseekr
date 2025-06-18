<template lang="pug">
	.bottom-status-bar
		.bsb-left 
			.bsb-left-space
				i.iconfont(class="icon-yunchucun" style="font-size: 16px; font-weight: 400; margin-top: 1px;")
				text.bsb-left-space-t 云空间 {{spaceInfo.usedDisplay}} / {{spaceInfo.totalDisplay}}
			.glimseek-title(:style="uploadTaskStatus === 'uploading' ? animationStyle : defaultStyle")
				i.iconfont(class="icon-chuanshuliebiao" style="font-size: 18px")
			text.bsb-left-t(:class="`upt-${uploadTaskStatus}`") {{statusText}}

		.bsb-center
			.glimseek-title
				text.glimseek-title-t GlimSeekr · 芥光寻影 & 云选片
			//- .copyright -- 芥光云选 © 2025
		.bsb-right
			i.iconfont(class="icon-huiyuan1 bsb-right-icon" style="font-size: 18px")
			i.iconfont(class="icon-kefu1 bsb-right-icon" style="font-size: 15px")
			i.iconfont(class="icon-guanyuwomen bsb-right-icon" style="font-size: 19px")
			.manager-btn(v-if="true" @click="navito")
				i.iconfont(class="icon-chuanshuxiangmu" style="font-size: 15px;")
</template>

<script setup>
const { data: infos } = useStoreData('uspace')
const spaceInfo = computed(() => {
  return calcStorageStats(infos.value.total_storage_limit, infos.value.used_storage)
})

import { uploader } from '@/hooks'
const $up = uploader()

const animationStyle = ref({
  'animation-duration': '1.25s',
  background:
    'linear-gradient(-45deg, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0.2) 80%)',
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

const uploadTask = ref(null)
const uploadTaskStatus = ref('failed') // none, uploading, completed, failed
const dynamicUploadingText = ref('') // 动态文本（上传时）
const statusTextMap = {
  none: '暂无上传任务',
  completed: '上传成功 ✅',
  failed: '上传失败 ❌'
}

const statusText = computed(() => {
  return uploadTaskStatus.value === 'uploading'
    ? dynamicUploadingText.value || '正在上传(0/10)'
    : statusTextMap[uploadTaskStatus.value] || ''
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
  height: var(--bottom-height);
  background-color: var(--card-color); // 🩶 更低调柔和的黑色
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 9999;
  -webkit-app-region: no-drag; // 防止拖动窗口
  font-size: 12px;
  color: rgba(200, 200, 210, 0.35); // 🩶 更低调柔和的银灰色
  font-family:
    -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', 'Helvetica Neue',
    'Microsoft YaHei', sans-serif;
  letter-spacing: 0.5px; // 🩶 更宽松的字间距
  padding: 0 12px;
  box-sizing: border-box;
}

.bsb-left {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  color: var(--text-secondary);

  &-t {
    margin-left: 3px;
    font-size: 12px;
  }

  &-space {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;

    &-t {
      margin-left: 3px;
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

.glimseek-title {
  // margin-top: $--top;
  // margin-bottom: 12px;
  // height: 36px;
  // margin-left: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  text-align: center;

  // color: rgba(200, 200, 210, 0.75); // 🩶 更低调柔和的银灰色

  // 🌈 类似光斜切折射的渐变
  // 💡 提亮两侧区域，最低亮度 0.1
  // 🌟 中心高光，提升亮度感
  // 💡 渐变过渡不突兀
  background: linear-gradient(-45deg,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0.6) 50%,
      rgba(255, 255, 255, 0.1) 80%);
  background-size: 200% 100%;
  background-position: 40% center;
  will-change: background-position;

  // 🎯 关键点：让背景只影响文字
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; // 让文字变透明，由背景透出
  color: transparent; // 双保险

  font-family:
    -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', 'Helvetica Neue',
    'Microsoft YaHei', sans-serif;
  letter-spacing: 0.5px; // 🩶 更宽松的字间距

  animation: shimmer 12s infinite linear;
  // animation: shimmer 6s ease-in-out infinite;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.15); // 🩶 更柔和的阴影

  &-t {
    margin-right: 8px;

    &:last-child {
      margin-right: 0.5em;
    }
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% center;
  }

  50% {
    background-position: 0% center;
  }

  100% {
    background-position: 200% center;
    // -webkit-text-fill-color: rgba(200, 200, 210, 0.35);
  }

  // 70% {
  // 	background-position: 40% center;
  // }

  // 100% {
  // 	background-position: 200% center;
  // 	-webkit-text-fill-color: rgba(200, 200, 210, 0.75);
  // }
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
