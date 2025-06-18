<template lang="pug">
//- .h-space
//-   el-button(text) 
//-     i.iconfont(class="icon-tianjiazhaopian1" style="font-size: 18px;margin-right: 5px")
//-     |添加照片
//-   el-button(text) 
//-     i.iconfont(class="icon-xuantu" style="font-size: 16px;margin-right: 5px")
//-     |关联选片册
//-   el-button(text) 
//-     i.iconfont(class="icon-a-20_lvhangxiangce_hei" style="font-size: 18px; margin-right: 5px")
//-     |关联作品集
//-   el-button(text) 
//-     i.iconfont(class="icon-piliangcaozuo" style="font-size: 14.5px;margin-right: 5px")
//-     |批量操作

el-breadcrumb(:separator-icon="ArrowRight")
  el-breadcrumb-item(@click="reset") 
    span.title 全部照片
  el-breadcrumb-item(v-if="infos?.name") {{infos.name}}
</template>

<script setup>
import { ArrowRight } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()

const infos = ref({})
usePageChannel('space', ['s-space'], (payload, from) => {
  // infos.value = payload
  const [key, option] = Object.entries(payload)[0]
    ; ({
      handleFolder: async () => infos.value = option,
    }[key])?.()
})

const { send } = usePageEmitter('space', 's-space')

const reset = () => {
  send({_id: '',name: ''})
}
</script>

<style lang="scss" scoped>
.title{
  cursor: pointer;
}
</style>
