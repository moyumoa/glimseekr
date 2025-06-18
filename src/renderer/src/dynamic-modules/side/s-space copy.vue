<template lang="pug">
.listviewpage
  search-bar(@onAdd="operationForm")
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

    .vlist(ref="scrollRef")
      .vlist-item(:class="{'vlist-item-active': activeFolder?._id === item._id}" v-for="(item, index) in rowList" :key="item._id")
        .overview
          span.overview-t 相册照片 999 张 丨 占用空间 9999.99 MB
        .vlist-item-body(@click="handleFolder(item)")
          .vlist-item-body-left
            .vlist-item-body-left-icon
              i.iconfont(class="icon-pics")
          .vlist-item-body-center
            span.vlist-item-body-center-title {{item.name}}
            span.vlist-item-body-center-t {{item.remark}}
        .vlist-item-bottom
          .vlist-item-bottom-item
            el-button(text @click="operationForm(item)")
              i.iconfont(class="icon-xiugai1")
              span.vlist-item-bottom-item-t 编辑
          .vlist-item-bottom-item
            el-button(text) 
              i.iconfont(class="icon-foller")
              span.vlist-item-bottom-item-t 添加照片
          .vlist-item-bottom-item
            el-button(text @click="delFolder(item)")
              i.iconfont(class="icon-shanchu2")
              span.vlist-item-bottom-item-t 删除



el-dialog(draggable v-model="dialogVisible" :title="title" width="540")
  el-form(:model="mform" :rules="rules" ref="mformRef" label-position="top" class='mfromclass' size="large")
    el-form-item(label="相册名称" prop="name")
      el-input(v-model="mform.name" placeholder="请输入相册名称" maxlength="18" show-word-limit)
    el-form-item(label="相册描述" prop="remark")
      el-input(v-model="mform.remark" :autosize="{ minRows: 3, maxRows: 5 }" maxlength="50" show-word-limit type="textarea" placeholder="请输入相册描述")
  template(#footer)
    el-button(@click="cancel") 取消
    el-button(type="primary" :loading="savaLoading" @click="seveForm") 保存


</template>
<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const title = ref('新建云相册')
const dialogVisible = ref(false)
const mform = ref({
  name: '',
  remark: ''
})
const mformRef = ref(null)
const rules = {
  name: [
    { required: true, message: '请输入相册名称', trigger: 'blur' },
    { min: 1, max: 18, message: '长度在 1 到 18 个字符', trigger: 'blur' }
  ],
}
const savaLoading = ref(false)
const cancel = () => {
  dialogVisible.value = false
  // 重置表单
  mformRef.value.resetFields()
}
const seveForm = () => {
  mformRef.value.validate(async (valid) => {
    if (valid) {
      savaLoading.value = true
      const subInfo = { ...mform.value }

      if (subInfo._id) {
        $api.space.update(subInfo).then(async (res) => {
          notify.success('修改成功')
          dialogVisible.value = false
          savaLoading.value = false
          mformRef.value.resetFields()
          // await initList()
          // 手动更新已修改的数据
          const index = rowList.value.findIndex(item => item._id === subInfo._id)
          if (index > -1) {
            rowList.value.splice(index, 1, { ...rowList.value[index], ...res.data })
          }
        }).finally(() => {
          savaLoading.value = false
        })

      } else {
        $api.space.create(subInfo).then(async (res) => {
          notify.success('创建成功')
          dialogVisible.value = false
          savaLoading.value = false
          mformRef.value.resetFields()
          await initList()
        }).finally(() => {
          savaLoading.value = false
        })
      }
    }
  })
}

/* 删除相册 */
const delFolder = (item) => {
  ElMessageBox.confirm(`是否要删除 ${item.name} ?`, '系统提示', {
    type: 'warning',
    showCancelButton: true,
    cancelButtonText: '取消',
    confirmButtonText: '确定',
  }).then(() => {
    $api.space.delete({_id: item._id}).then(async (res) => {
      notify.success('删除成功')
      // 手动从列表中移除
      const index = rowList.value.findIndex(i => i._id === item._id)
      if (index > -1) {
        rowList.value.splice(index, 1)
      }
    })
  }).catch(() => {
    // console.log('取消删除')
  })
}

const activeFolder = ref({})
const { send } = usePageEmitter('space', 's-space')

const handleFolder = (item) => {
  activeFolder.value = item
  send(item)
  // router.push({ path: `/space/${item._id}`, replace: true })
}

const paging = reactive({
  page: 1,
  limit: 10
})
const keyword = ref('')
const scrollRef = ref(null)
const rowList = ref([])
const isloadmore = ref(true)

/* 获取相册列表 */
const getList = async (callback) => {
  const params = {
    ...paging,
    name: keyword.value
  }
  const res = await $api.space.list(params)
  callback ? callback(res.data) : rowList.value = rowList.value.concat(res.data);
  isloadmore.value = paging.limit <= res.data.length;
}

/* 初始化列表 */
const initList = async () => {
  rowList.value = []
  paging.page = 1
  isloadmore.value = true
  await getList((data) => {
    rowList.value = data
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
  // 如果infos.package_type === 'free'，则返回 永久使用 其它则返回end_time
  return infos.value.package_type === 'free' ? '永久使用' : infos.value.end_time
})

const operationForm = (option) => {
  if (option) {
    title.value = '编辑云相册'
    mform.value = $us.deepClone(option)
  } else {
    title.value = '新建云相册'
    mform.value = {}
  }
  dialogVisible.value = true

  // console.log('点击添加' )
  // send({ hello: 'space页面，我来啦！' })
}
// onMounted(() => {
//   console.log('组件挂载了 ++')
// })
// onUnmounted(() => {
//   console.log('组件卸载了 --')
// })
// onActivated(() => {
//   console.log('模块组件被激活')
// })
// onDeactivated(() => {
//   console.log('模块组件被缓存')
// })

initList()
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

.vlist {
  flex: 1;
  margin-top: 12px;
  overflow-y: auto;
  // background-color: var(--card-color);
  // border-radius: 8px;
  // box-sizing: border-box;
  border-top: 1px solid var(--divider-color);

  &-item {
    display: flex;
    flex-direction: column;
    color: var(--text-secondary);
    position: relative;
    // padding-top: 16px;
    transition: background-color 0.15s ease;
    overflow: hidden;
    transition: all 0.2s ease-out;

    &:hover {
      background-color: var(--hover-bg);
    }

    &:active {
      background-color: var(--active-bg);
    }

    &-active {
      // background-color: var(--active-bg);
      background: linear-gradient(90deg,
          rgba(255, 255, 255, 0.06) 20%,
          rgba(255, 255, 255, 0.04) 50%,
          rgba(255, 255, 255, 0.025) 80%);
      background-size: 100% 100%;
      position: relative;

      // 伪类在左侧加一条线
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 3px;
        height: 100%;
        background-color: var(--text-primary);
        opacity: 0.8;
        border-radius: 0 3px 3px 0;
        z-index: 1;
      }
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
      height: 1px;
      background-color: var(--border-bottom-color);
      transform: scaleY(0.5);
      transform-origin: bottom center;
    }

    &:last-child::before {
      display: none;
    }

    .overview {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 8px 0 4px;
      box-sizing: border-box;
      width: 100%;


      &-t {
        font-size: 12px;
        font-weight: 400;
        color: rgba(110, 124, 193, 0.7);
        transform: scale(0.9);
      }
    }

    &-body {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      box-sizing: border-box;
      height: 68px;
      padding: 0 12px;
      box-sizing: border-box;
      cursor: pointer;
      position: relative;
      // margin-top: 12px;

      &-left {
        flex-shrink: 0;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        margin-right: 12px;


        &-icon {
          width: $--icon-wh;
          height: $--icon-wh;
          background-color: rgba(0, 0, 0, 0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 8px;

          i {
            font-size: 32px;
            color: var(--text-secondary);
          }
        }

      }

      &-center {
        height: 100%;
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 4px 0;
        box-sizing: border-box;

        &-title {
          font-size: 14px;
          // font-weight: 500;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1;
        }

        &-t {
          max-width: 100%;
          font-size: 12px;
          font-weight: 400;
          color: var(--text-disabled);
          // 只显示两行 超出省略
          display: -webkit-box;
          -webkit-line-clamp: 2; // 限制行数
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 4px;
        }
      }
    }


    &-bottom {
      margin: 12px 0;
      display: flex;
      justify-content: space-around;
      align-items: center;

      &-item {
        display: flex;
        justify-content: center;
        align-items: center;

        i {
          color: var(--text-secondary);
          margin-right: 5px;
        }

        &:first-child i {
          font-size: 16px;
        }

        &:nth-child(2) i {
          font-size: 14px;
        }

        &:last-child i {
          font-size: 14px;
        }

        &-t {
          font-size: 13px;
          font-weight: 400;
          color: var(--text-secondary);
        }
      }
    }
  }
}
</style>
