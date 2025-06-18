<template lang="pug">
  .navigationbar.drag-area(@dblclick="handleDoubleClick" :style="{right: offset, 'left': left}")
    i.iconfont(class="icon-liulanqi" :style="{'font-size': '15px', 'font-weight': 400, 'margin-top': '1px'}")
    text.navigationbar-title {{ data.title || 'GlimSeekr · 芥光寻影' }}
  
  .navigationbar-placeholder
</template>

<script setup>
const props = defineProps({
  offset: {
    type: String,
    default: '0'
  },
  left: {
    type: String,
    default: '72px'
  }
})
const { data } = useStoreData('cpage')

const handleDoubleClick = ()=> {
  if (window.myElectron?.isElectron) {
    window.myElectron.toggleMaximize()
  }
}

</script>

<style lang="scss" scoped>
$--height: 60px;
.navigationbar{
  position: fixed;
  top: 0;
  // left: calc(72px + 375px);
  left: 72px;
  right: 0;
  height: $--height;
  // background-color: var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 0 12px;
  box-sizing: border-box;
  // -webkit-app-region: no-drag; // 防止拖动窗口
  color: var(--text-secondary);

  &-title{
    font-size: 14px;
    font-weight: 400;
    margin-left: 5px;
  }
}

.navigationbar-placeholder{
  height: $--height;
  background: linear-gradient(to right, #181a1c 0%, var(--card-color) 100%);
}
</style>