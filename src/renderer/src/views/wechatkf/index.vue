<template lang="pug">
  .warps
    text.tips 由于小程序客服助手属于微信网页端功能 暂不支持应用内直接使用
    text.tips 请点击下方按钮打开客服助手
    text.warps-btn(@tap="open") {{titleText}}
    text.tips 若打开失败可复制下方链接到浏览器打开
    text.link(@tap="copy") {{url}}
</template>

<script setup>
const titleText = ref('打开小程序客服助手')
const url = ref('https://mpkf.weixin.qq.com/kf/home')
const open = () => {
  window.open(url.value, '_blank')
}
const copy = () => {
  // 复制链接到剪贴板
  console.log('复制链接到剪贴板', url.value)
  uni.setClipboardData({
    data: url.value,
    // 不显示自带的提示框
    showToast: false,
    success: () => {
      // ElNotification.success({ message: '复制成功', duration: 2000, position: 'top-left' })
      notify.success('复制成功')
    },
    fail: () => {
      notify.error('复制失败')
    }
  })
}
</script>

<style lang="scss" scoped>
.warps {
  height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .warps-btn {
    font-size: 20px;
    font-weight: bold;
    color: var(--text-primary);
    cursor: pointer;
    background-color: var(--success-color);
    padding: 10px 20px;
    border-radius: 5px;
    margin: 50px 0;
  }

  .tips {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 5px;
  }

  .link {
    font-size: 14px;
    color: var(--text-link);
    cursor: pointer;
  }
}

.warps-btn:hover {
  background-color: var(--success-color-hover);
  color: var(--text-primary-hover);
  transition: background-color 0.15s ease;
}

.link:hover {
  text-decoration: underline;
}
</style>
