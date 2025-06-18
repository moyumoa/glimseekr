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
      .vlist-body
        .vlist-body-item(:class="{'vlist-body-item-active': activeFolder?._id === item._id}" v-for="(item, index) in rowList" :key="item._id")
          .vlist-body-item-center
            i.iconfont(class="icon-wenjianjia")
            .vlist-body-item-center-main
              span.vlist-body-item-center-main-t1 9999
              span.vlist-body-item-center-main-t2 张
          .vlist-body-item-bottom
            span.vlist-body-item-bottom-title {{item.name}}
            span.vlist-body-item-bottom-desc 9999.99 MB
            i.iconfont(class="icon-xiugai btn-edit" @click.stop="operationForm(item)")
              span 重命名

          .vlist-body-item-hover
            i.iconfont(class="icon-shanchu2 btn-del" @click.stop="delFolder(item)")
            i.iconfont(class="icon-preview btn-preview" @click.stop="handleFolder(item)")
            //- el-button(text class="btn-add") 
              //- i.iconfont(class="icon-foller")
              //- span.vlist-body-item-hover-t 添加照片

el-dialog(draggable v-model="dialogVisible" :title="title" width="540" @closed="cancel")
  el-form(:model="mform" :rules="rules" ref="mformRef" label-position="top" class='mfromclass' size="large")
    el-form-item(label="相册名称" prop="name")
      el-input(v-model="mform.name" placeholder="请输入相册名称" maxlength="8" show-word-limit)
    //- el-form-item(label="相册描述" prop="remark")
    //-   el-input(v-model="mform.remark" :autosize="{ minRows: 3, maxRows: 5 }" maxlength="50" show-word-limit type="textarea" placeholder="请输入相册描述")
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
    { min: 1, max: 8, message: '长度在 1 到 8 个字符', trigger: 'blur' }
  ],
}
const savaLoading = ref(false)
const cancel = () => {
  dialogVisible.value = false
  mformRef.value.resetFields()
  mform.value = {}
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
    $api.space.delete({ _id: item._id }).then(async (res) => {
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

$--icon-wh: 72px;
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
    margin-top: 12px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    padding: 0 12px;
    box-sizing: border-box;

    &-item {
      width: calc((100% / 3) - 8px);
      margin-right: 12px;
      margin-bottom: 12px;
      // background-color: var(--card-color);
      // background-color: #000;
      border-radius: 8px;
      padding: 6px;
      box-sizing: border-box;
      // cursor: pointer;
      position: relative;
      transition: all 0.2s ease-out;

      &:nth-child(3n) {
        margin-right: 0;
      }

      &:hover {
        background-color: var(--card-color);
      }

      &:hover &-hover {
        z-index: 1;
        opacity: 1;
      }

      &:hover &-center-main {
        opacity: 0;
      }
      &:hover .btn-edit {
        opacity: 0.8;
      }
      &:hover &-bottom-title  {
        // width: calc(100% - 48px);
        opacity: 0.1;
      }

      &-active {
        background-color: rgba(0, 0, 0, 0.3);
      }


      &-hover {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        height: calc($--icon-wh + 8px);
        z-index: -1;
        opacity: 0;
        border-radius: 8px;
        transition: all 0.2s ease-out;
        // background-color: rgba(255, 255, 255, 0.5);
        // backdrop-filter: blur(8px);

        // .btn-edit {
        //   position: absolute;
        //   top: 6px;
        //   left: 6px;
        //   transition: all 0.2s ease-out;
        //   color: var(--text-primary);
        //   opacity: 0.8;

        //   &:hover {
        //     transform: scale(1.1);
        //     opacity: 1;
        //   }
        // }

        .btn-del {
          position: absolute;
          top: 6px;
          right: 6px;
          z-index: 1;
          color: var(--error-color);
          transition: all 0.2s ease-out;
          opacity: 0.8;

          &:hover {
            transform: scale(1.1);
            opacity: 1;
          }
        }

        .btn-preview {
          position: absolute;
          top: 60%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 28px;
          transition: all 0.2s ease-out;
          color: var(--text-primary);
          opacity: 0.5;
          cursor: pointer;

          &:hover {
            // transform: translate(-50%, -50%) scale(1.15);
            opacity: 1;
          }
        }

        .btn-add {
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translate(-50%);
        }

        &-t {
          font-size: 12px;
          font-weight: 400;
          color: var(--text-secondary);
          // margin-left: 5px;
        }

      }

      &-center {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;

        i {
          line-height: 1;
          font-size: $--icon-wh;
          // color: rgba(137, 207, 247, 0.8);
          font-weight: lighter;
          transform: scaleX(1.1);
          // 渐变背景
          background: linear-gradient(90deg,
              rgba(245, 245, 245, 0.6) 0%,
              rgba(137, 207, 247, 0.6) 50%,
              rgba(255, 255, 255, 0.4) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

        }


        &-main {
          position: absolute;
          top: 55%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          // flex-direction: column;
          justify-content: center;
          align-items: center;
          color: var(--text-secondary);
          opacity: 1;

          &-t1 {
            font-size: 13px;
            font-weight: 400;
            // color: $--info-text-color;
            // transform: translateY(6px);
          }

          &-t2 {
            font-size: 12px;
            font-weight: 400;
            // color: $--info-text-color;
            transform: scale(0.85) translate(1px, 0.5px);
          }
        }
      }

      &-bottom {
        display: flex;
        // justify-content: center;
        align-items: center;
        flex-direction: column;
        position: relative;

        .btn-edit {
          position: absolute;
          top: 0;
          // right: 6px;
          left: 0;
          right: 0;
          transition: all 0.2s ease-out;
          color: var(--text-primary);
          font-size: 15px;
          // width: 24px;
          height: 18px;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;

          span{
            font-size: 12px;
            font-weight: 400;
            color: var(--text-primary);
            // transform: scale(0.85) translateY(-0.5px);
          }
          
          // &::after{
          //   content: '重命名';
          //   position: absolute;
          //   top: 0;
          //   left: 0;
          //   right: 0;
          //   bottom: 0;
          //   font-size: 12px;
          //   display: flex;
          //   justify-content: center;
          //   align-items: center;
          // }

          &:hover {
            transform: scale(1.1);
            opacity: 1;
            color: var(--text-primary)
          }
        }

        &-title {
          width: 100%;
          font-size: 13px;
          font-weight: 400;
          color: var(--text-regular);
          text-align: center;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        &-desc {
          font-size: 12px;
          font-weight: 400;
          // color: var(--primary-color);
          color: $--info-text-color;
          text-align: center;
          transform: scale(0.85) translateY(-0.5px);
        }
      }
    }
  }

}
</style>
