<template lang="pug">
  .listviewpage
    search-bar(@onSearch="onSearch")
    .warpper
      .board
        .board-left
          el-progress(type="dashboard" :percentage="Number(spaceInfo.percent)" :color="colors" :indeterminate="true" :width="88")
            template(#default="{ percentage }")
              span.percentage-value {{ percentage || 0 }}%
              span.percentage-label 已使用
        .board-right
          .board-right-item
            .board-right-item-title 到期时间
            .board-right-item-t {{expiration}}
        
  </template>
  <script setup>
  const colors = [
    { color: '#67c23a', percentage: 10 },   // 绿色：健康
    { color: '#91cb74', percentage: 30 },   // 介于绿和黄之间
    { color: '#e6a23c', percentage: 50 },   // 橙黄：需注意
    { color: '#f39c12', percentage: 70 },   // 深橙：高风险
    { color: '#d60000', percentage: 100 },  // 红色：已用尽
  ]
  
  const { data: infos, set: setInfos } = useStoreData('uspace')
  const spaceInfo = computed(() => {
    return calcStorageStats(infos.value.total_storage_limit, infos.value.used_storage)
  })
  
  const expiration = computed(() => {
    // 如果infos.package_type === 'free'，则返回 永久使用 其它则返回end_time
    return infos.value.package_type === 'free' ? '永久使用' : infos.value.end_time
  })
  
  import { usePageEmitter } from '@/composables/usePageEmitter'
  const { send } = usePageEmitter('space', 's-space')
  const onSearch = (value) => {
    console.log('搜索:', value)
    send({ hello: 'space页面，我来啦！' })
  }
  
  onMounted(() => {
  console.log('2 - 组件挂载了 ++')
})
onUnmounted(() => {
  console.log('2 - 组件卸载了 --')
})
onActivated(() => {
  console.log('2 - 模块组件被激活')
})
onDeactivated(() => {
  console.log('2 - 模块组件被缓存')
})
  
  </script>
  
  <style lang="scss" scoped>
  .percentage-value {
    display: block;
    margin-top: 10px;
    font-size: 16px;
    font-weight: bold;
  }
  
  .percentage-label {
    display: block;
    margin-top: 10px;
    font-size: 12px;
  }
  
  .warpper {
    // margin: 8px;
    padding: 12px;
    box-sizing: border-box;
    // background-color: var(--card-color);
    // border-radius: 8px;
  }
  
  .board {
    display: flex;
    justify-content: space-between;
    align-items: center;
  
    &-left {
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  
    &-right {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
  
      &-item {
        // flex: 1 0 0;
        height: 100%;
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
  
        &-title {
          margin-bottom: 5px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-regular);
        }
  
        &-t {
          max-width: 100%;
          font-size: 12px;
          font-weight: 400;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  
    &-bottom {
      display: flex;
      justify-content: center;
      align-items: center;
      // margin-top: 12px;
      // background-color: var(--panel-color);
      background-color: var(--card-color);
      border-radius: 5px;
      padding: 8px 0;
  
      &-title {
        font-size: 12px;
        font-weight: 400;
        color: var(--text-secondary);
      }
  
      &-t {
        margin-left: 5px;
        font-size: 12px;
        font-weight: 400;
        color: var(--text-secondary);
      }
    }
  }
  </style>
  