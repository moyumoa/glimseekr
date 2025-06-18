<template lang="pug">
.header-oper-bar
  el-button(text :disabled="!folderId" @click="$up.open({multiple: true, folderId: props.folderId})") 
    i.iconfont(class="icon-tianjiazhaopian1" style="font-size: 18px;margin-right: 5px")
    |添加照片
  el-button(text v-if="!selectLocal") 
    i.iconfont(class="icon-xuantu" style="font-size: 16px;margin-right: 5px")
    |关联选片册
  el-button(text v-if="!selectLocal") 
    i.iconfont(class="icon-a-20_lvhangxiangce_hei" style="font-size: 18px; margin-right: 5px")
    |关联作品集
  el-button(text @click="selectAll") 
    i.iconfont(:class=" hasSelect ? 'icon-tingyong':'icon-piliangcaozuo'")
    |{{ hasSelect ? '取消选中' : '全选'}}
  el-button(text :disabled="!hasSelect" @click="deleteSelect") 
    i.iconfont(class="icon-shanchu2" style="font-size: 16px;margin-right: 5px;")
    |删除已选
</template>
<script setup>
const props = defineProps({
  folderId: {
    type: String,
    default: ''
  },
  selectLocal: {
    type: Boolean,
    default: false
  }
})

// import { useImageUploader } from '@/hooks/useImageUploader'
// const { uploadImages, successCount } = useImageUploader()
// const success = computed(() => successCount.value)

import { uploader } from '@/hooks'
const $up = uploader()

// uploader.uploadImages(...)
// const success = computed(() => uploader.successCount)



const hasSelect = ref(false)
const selectedCount = ref(0)
usePageChannel('space', ['local-pic-list'], (payload) => {
  if ('hasSelect' in payload) {
    hasSelect.value = payload.hasSelect
    selectedCount.value = payload.count || 0
  }
})

const { send } = usePageEmitter('space', 'opers')

const selectAll = () => {
  if (!props.selectLocal) return
  hasSelect.value = !hasSelect.value
  send({ selectAll: hasSelect.value })
}

const deleteSelect = () => {
  send({ deleteSelect: true })
}

</script>

<style lang="scss" scoped>
.icon-tingyong,
.icon-shanchu2 {
  transform: translateY(-0.8px);
}

.icon-tingyong {
  font-size: 16px;
  margin-right: 5px;
}

.icon-piliangcaozuo {
  font-size: 14px;
  margin-right: 5px;
}
</style>