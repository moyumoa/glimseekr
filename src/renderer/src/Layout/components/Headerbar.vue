<template>
  <div class="navigationbar drag-area" @dblclick="handleDoubleClick">
    <div class="glimseek-title">
      <span class="glimseek-title-t">GlimSeekr · 芥光寻影 & 云选片</span>
    </div>
  </div>

</template>

<script setup>
const props = defineProps({})

const handleDoubleClick = () => {
  if (window.myElectron?.isElectron) {
    window.myElectron.toggleMaximize()
  }
}

</script>

<style lang="scss" scoped>
$--height: var(--header-height);

.navigationbar {
  height: var(--header-height);
  line-height: var(--header-height);
  background-color: var(--navbar-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  // -webkit-app-region: no-drag; // 防止拖动窗口
  color: var(--text-secondary);
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
</style>