<template lang="pug">
.listviewpage
  search-bar(@onAdd="addNewFolder")
  .warpper
    .board
      .board-left
        el-progress(type="dashboard" :percentage="Number(spaceInfo.percent)" :color="colors" :indeterminate="true" :width="88")
          template(#default="{ percentage }")
            span.percentage-value {{ percentage || 0 }}%
            span.percentage-label 已使用
      .board-right
        .board-right-item
          span.board-right-item-title 总空间
          span.board-right-item-t {{spaceInfo.totalDisplay || 0}}
        .board-right-item
          span.board-right-item-title 剩余可用
          span.board-right-item-t {{spaceInfo.remainDisplay || 0}}
        .board-right-item
          span.board-right-item-title 到期时间
          span.board-right-item-t {{expiration}}
    .board-bottom
      span.board-bottom-title 查看云空间详情
      span.board-bottom-t {{infos.expiration}}

    .vlist(ref="scrollRefs")
      .vlist-body
        //- @mouseleave="handlePopover(item._id, false)"
        .vlist-body-item(
          v-for="(item, index) in listRows" 
          :key="item._id" 
          :class="{'vlist-body-item-active': activeFolder?._id === item._id}"
          )
          //- @mouseenter="handlePopover(item._id, true)"
          .vlist-body-item-content(@click="handleFolder(item)")
            .vlist-body-item-left
              i.iconfont(class="icon-pics")
            .vlist-body-item-main
              template(v-if="editingId === item._id")
                el-input(
                  v-model="item.name"
                  size="small"
                  @blur="finishEdit(item)"
                  @keyup.enter.native="finishEdit(item)"
                  @keyup.esc.native="editingId = ''"
                  @click.stop
                )
              template(v-else)
                .vlist-body-item-main-t1 
                  span.vlist-body-item-main-t1-name {{ item.name }}
                  span.vlist-body-item-main-t1-desc {{formatBytes(item.photo_size)}}
                span.vlist-body-item-main-t2 
                  | {{item.photo_count || 0}} 张 · 照片
                  //- i.iconfont(class="icon-liuliangbao" style="font-size: 13px;margin: 0 5px")
                  //- | {{formatBytes(item.photo_size)}}
                  i.iconfont(class="icon-danxingjiqun" v-show="activeFolder?._id === item._id || showPopoverMap[item._id]")


            //- .vlist-body-item-right
            //-   i.iconfont(class="vlist-body-item-right-btn"
            //-     :class="showPopoverMap[item._id] || activeFolder?._id === item._id ? 'icon-danxingjiqun vlist-body-item-right-hover': 'icon-gengduo7'"
            //-   )
          Transition(name="slide-fade" mode="out-in")
            .popover-box(v-if="showPopoverMap[item._id] || activeFolder?._id === item._id")
              .popover-box-item(@click.stop="handleFolder(item, isUpload=true)") 
                i.iconfont(class="icon-foller" style="font-size: 14px;margin-right: 5px")
                .popover-box-item-text 添加照片
              .popover-box-item(@click.stop="startEdit(item)") 
                i.iconfont(class="icon-xiugai" style="font-size: 16px;margin-right: 5px")
                .popover-box-item-text 重命名
              .popover-box-item(@click.stop="delFolder(item)") 
                i.iconfont(class="icon-shanchu2" style="font-size: 14px;margin-right: 5px")
                .popover-box-item-text 删除

</template>
<script setup>
const formatBytes = (byte) => $us.formatBytes(byte)

const keyword = ref('')
const scrollRefs = ref(null)

/* 分页Hook */
import { usePaging } from '@/hooks'
const { list: listRows, onInit } = usePaging(scrollRefs, { apiName: 'space' })

/* 控制操作栏显示隐藏 */
const showPopoverMap = reactive({})
const handlePopover = (id, show) => {
  showPopoverMap[id] = show
}

/* 控制输入框显示隐藏 */
const editingId = ref('') // 当前正在编辑的相册ID
const originalNameMap = reactive({}) // 用于存储原始名称

/* 开始编辑相册名 */
const startEdit = (item) => {
  editingId.value = item._id
  originalNameMap[item._id] = item.name
}

/* 添加新相册(文件夹) */
const addNewFolder = $us.debounce(() => {
  // 直接创建一个新的相册 然后刷新列表
  const name = `${$us.parseTime(Date.now())}-新相册`
  $api.space.create({ name }).then(async (res) => {
    notify.success('创建成功')
    // await initList()

    // 手动在列表第一项添加新相册
    listRows.value.unshift(res.data)
    // 直接设置为编辑状态
    editingId.value = res.data._id
    originalNameMap[res.data._id] = res.data.name
  })
})

/* 提交修改 */
const finishEdit = (item) => {
  const original = originalNameMap[item._id] || ''
  const newName = item.name.trim()

  if (!newName) {
    notify.warning('名称不能为空')
    item.name = original
    editingId.value = ''
    delete originalNameMap[item._id]
    return
  }

  if (newName.length > 30) {
    notify.warning('名称最多 30 个字符')
    item.name = original
    editingId.value = ''
    delete originalNameMap[item._id]
    return
  }

  if (newName !== original) {
    $api.space.update({ _id: item._id, name: newName }).then(() => {
      notify.success('重命名成功')
    }).catch(() => {
      item.name = original
      notify.error('重命名失败')
    })
  }

  editingId.value = ''
  delete originalNameMap[item._id]
}

/* 删除相册 */
const delFolder = (item) => {
  ElMessageBox.confirm(`是否要删除 ${item.name} ?`, '系统提示', {
    type: 'warning',
    showCancelButton: true,
    cancelButtonText: '取消',
    confirmButtonText: '确定',
  }).then(() => {
    $api.space.delete({ _id: item._id }).then(async (res) => {
      notify.success('删除成功')
      // 手动从列表中移除
      const index = listRows.value.findIndex(i => i._id === item._id)
      if (index > -1) {
        listRows.value.splice(index, 1)
      }
    })
  })
}

/* 点击相册文件夹 */
const activeFolder = ref({})
const { send } = usePageEmitter('space', 's-space')
const handleFolder = (item, isUpload) => {
  if (item._id !== activeFolder.value._id) {
    send({ handleFolder: item }) // 设置头部信息
  }
  activeFolder.value = item // 设置当前选中的相册
  editingId.value = '' // 取消编辑状态
  delete originalNameMap[item._id] // 删除原始名称
  isUpload && upload(item) // 上传图片
}

usePageChannel('space', ['c-space'], (payload) => {
  const [key, option] = Object.entries(payload)[0]
    ; ({
      reload: async () => await updateListItem(option),
    }[key])?.()
})

// 更新列表单条数据
const updateListItem = async (params) => {
  const res = await $api.space.list({ folderId: params.folderId })
  const data = res.data[0]
  // 手动更新列表
  const _index = listRows.value.findIndex(i => i._id === data._id)
  listRows.value.splice(_index, 1, { ...listRows.value[_index], ...data })
}

/* 上传照片到相册 */
import { uploader } from '@/hooks'
const $up = uploader()
const upload = (item) => {
  const option = item
  $up.open({
    folderId: option._id,
    onComplete: async ({ ident, params, ...args }) => {
      console.log(`[${ident}] 上传完成:`, params, args)
      await updateListItem({ folderId: option._id })
      send({ reload: { folderId: option._id } })
    },
    onIntervalRefresh: () => {
      console.log(`间隔3张刷新一次`)
      updateListItem({ folderId: option._id })
      send({ reload: { folderId: option._id } })
    }
  })
}

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
  return infos.value.package_type === 'free' ? '永久使用' : infos.value.end_time
})

// onMounted(() => {
//   console.log('组件挂载了 ++')
// })
// onUnmounted(() => {
//   console.log('-- 组件卸载了 --')
// })
// onActivated(() => {
//   console.log('模块组件被激活')
// })
// onDeactivated(() => {
//   console.log('模块组件被缓存')
// })

// initList()

import { useBucketUpdater } from '@/hooks'
const { updateBucket } = useBucketUpdater()

onMounted(() => {
  updateBucket()
  onInit({
    limit: 30,
    ...(keyword.value && { name: keyword.value })
  })
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
  // background-color: var(--card-color);
  // border-radius: 8px;
  height: calc(100vh - var(--bottom-height) - var(--header-height) - 58px);
  display: flex;
  flex-direction: column;
}

.board {
  padding: 16px 16px 0 16px;
  box-sizing: border-box;
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
    margin: 0 12px;

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

$--icon-wh: 56px;
$--info-text-color: rgba(137, 207, 247, 0.72);

.vlist {
  flex: 1;
  margin-top: 12px;
  overflow-y: auto;
  // background-color: var(--card-color);
  // border-radius: 8px;
  // box-sizing: border-box;
  border-top: 1px solid var(--divider-color);

  &-body {
    padding: 8px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;

    &-item {
      margin: 6px 0;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s ease-in;

      &:hover {
        background-color: rgba(245, 245, 245, 0.05);
        transition: background-color 0.1s ease-out;

      }

      &-active {
        background-color: rgba(245, 245, 245, 0.05);
        color: var(--text-primary);
      }

      &-content {
        display: flex;
        justify-content: flex-start;
        align-items: center;
      }

      &-left {
        flex-shrink: 0;
        // width: $--icon-wh;
        height: $--icon-wh;
        // background-color: rgba(245, 245, 245, 0.025);
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 8px;
        position: relative;

        // 伪类在底部画一条线
        &:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 2px;
          right: 2px;
          height: 1px;
          // 缩放一半 形成0.5px
          transform: scaleY(0.8);
          // background-color: var(--divider-color);
          background: linear-gradient(-45deg,
              rgba(255, 255, 255, 0.085) 20%,
              rgba(255, 255, 255, 0.6) 50%,
              rgba(255, 255, 255, 0.085) 80%);
          border-radius: 8px;
        }

        i {
          font-size: 36px;
          // color: var(--text-secondary);
          color: transparent;
          background: linear-gradient(90deg,
              rgba(245, 245, 245, 0.6) 0%,
              rgba(137, 207, 247, 0.82) 50%,
              rgba(255, 255, 255, 0.4) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }

      &-main {
        width: 0;
        flex: 1;
        // margin: 0 8px;
        margin-left: 10px;
        display: flex;
        flex-direction: column;

        &-t1 {
          display: flex;
          align-items: flex-start;

          &-name {
            flex: 1;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-regular);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-right: 5px;
          }

          &-desc {
            flex-shrink: 0;
            font-size: 12px;
            font-weight: 400;
            color: var(--text-secondary);
          }
        }

        &-t2 {
          margin-top: 4px;
          font-size: 12px;
          font-weight: 400;
          // color: var(--text-secondary);
          color: rgba(137, 207, 247, 0.4);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: flex;
          justify-content: space-between;

          i {
            font-size: 15px;
            color: var(--text-regular);
          }
        }
      }

      &-right {
        flex-shrink: 0;
        display: flex;
        justify-content: center;
        align-items: center;

        // i {
        //   font-size: 20px;
        //   color: var(--text-secondary);
        //   font-weight: 600;
        // }

        &-btn {
          cursor: pointer;
          font-size: 22px;
          color: var(--text-secondary);
          font-weight: 600;
          // &:hover {
          //   color: var(--text-regular);
          // }

          transition: all 0.2s ease;
        }

        &-hover {
          color: var(--text-regular);
        }
      }

      .popover-box {
        width: 100%;
        height: 0;
        height: 1.2em;
        margin-top: 12px;

        overflow: hidden;
        // background-color: rgba(245, 245, 245, 0.05);
        border-radius: 0 0 8px 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: height, margin 0.2s ease;
        // pointer-events: none;
        // opacity: 0;

        // &-hover {
        //   height: 1.2em;
        //   margin-top: 12px;
        //   pointer-events: auto;
        //   // opacity: 1;
        // }

        &-item {
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          padding: 0 12px;
          transition: all 0.2s ease;

          &:hover {

            i,
            .popover-box-item-text {
              color: var(--text-primary);
            }
          }

          i {
            color: var(--text-secondary);
          }

          &-text {
            font-size: 13px;
            font-weight: 400;
            color: var(--text-secondary);
          }
        }
      }
    }
  }

  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.2s ease-out;
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    opacity: 0;
    height: 0;
    margin-top: 0;
  }

  .slide-fade-enter-to,
  .slide-fade-leave-from {
    opacity: 1;
    height: 1.2em;
    margin-top: 12px;
  }

}
</style>
