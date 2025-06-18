<template lang="pug">
  i.iconfont(class="icon-liulanqi" :style="{'font-size': '15px', 'font-weight': 400, 'margin-top': '1px'}")
  span.navigationbar-title {{ titleText }}
</template>

<script setup>
const props = defineProps({
  titleText: {
    type: String,
    default: 'GlimSeekr · 芥光寻影'
  }
})
</script>

<style lang="scss" scoped>
.navigationbar-title {
  font-size: 14px;
  font-weight: 400;
  margin-left: 5px;
}
</style>