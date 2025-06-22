<template>

  <virtual-waterfall v-show="!paramsId" ref="waterfallRef" :fetchPage="$api.space.list" :belong="belong"
    :getItemId="item => item._id" :columnCount="{ 1920: 5, 1080: 4, 960: 3, 650: 2 }">
    <template #header>
      <div class="pageoperbar">
        <div class="pageoperbar-inner">
          <div class="pageoperbar-leftbar liquid-glass" @click="addNewItem" v-loading="creactLoading">
            <i-svg name="foller" size="14" />
            <span class="pageoperbar-leftbar-title">新建相册</span>
          </div>
          <div class="searchbar liquid-glass">
            <el-input class="searchbar-ipt" v-model="keyword" :prefix-icon="Search" clearable placeholder="相册名称搜索" />
          </div>
        </div>
      </div>
    </template>
    <template #default="{ item, columnWidth, remove }">
      <flip-card lockHeightOnFlip :ref="el => el && flipCardMap.set(item._id, el)">
        <template #front="{ flip }">
          <!-- @click="openModalHook('folder', item._id, { folder: item.name })" -->
          <!--  -->
          <div class="vw-crad" @click="openSubPage(`/fast-delivery/details/${item._id}/${item.name}`)">
            <img v-if="item.cover" :src="`${item.cover}-thumb400.webp`" alt="" class="vw-crad-img" />
            <!--  :class="{'vw-crad-body-center': !item.cover}" -->
            <div class="vw-crad-body">
              <div class="vw-crad-body-title">
                <span class="vw-crad-body-title-text">
                  <i-svg name="kejianyunpan" size="16" class="vw-crad-body-title-icon" />
                  {{ item.name }}
                </span>
              </div>
              <div class="vw-crad-body-content spacebetween">
                <span class="vw-crad-body-content-desc">
                  {{ item.photo_count }} 张照片
                  {{ formatBytes(item.photo_size) }}
                </span>
                <div class="extra" @click.stop="() => handleFlip(item, flip)">
                  <i-svg name="gengduo6" size="14" class="extra-icon" />
                </div>
              </div>
            </div>

            <div class="positoin-timer">
              更新于 {{ formatSmartTime(item.update_time) }}
            </div>
          </div>
        </template>

        <template #back="{ flip }">
          <el-input type="text" v-model="folderName" placeholder="相册名称" :maxlength="30"
            @blur="finishEdit({ item, flip })" @keyup.enter.native="finishEdit({ item, flip })" />

          <div class="actionbar">
            <span class="actionbar-t">删除此相册</span>
            <el-button text @click.stop="delFolder({ item, remove, flip })">
              <i-svg name="shanchu2" size="16" color="#d4433b" />
            </el-button>
          </div>
        </template>

      </flip-card>

    </template>
  </virtual-waterfall>

  <router-view v-if="paramsId" />

</template>
<script setup>
const belong = 'fastdelivery'
import { formatSmartTime } from '@mvmoo/us'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const paramsId = computed(() => route.params.id)
const query = computed(() => route.query)


import { formatBytes, deepClone } from '@mvmoo/us'
import { $api } from '@/config/api.js'
import { Search } from '@element-plus/icons-vue'

const keyword = ref('')

const waterfallRef = ref(null)
const creactLoading = ref(false)

const addNewItem = async () => {
  if (creactLoading.value) return
  creactLoading.value = true
  try {
    const name = `${new Date().toLocaleDateString()}-新相册`.replace(/\//g, '-')
    const res = await $api.space.create({ name, belong })
    console.log('新建相册返回', res)
    waterfallRef.value?.insertItemToTop(res.data)
  } finally {
    creactLoading.value = false
  }

  // const newItem = {
  //   _id: Date.now().toString(),
  //   name: '新相册',
  //   create_time: Date.now(),
  //   photo_count: 0,
  //   photo_size: 0
  // }
}


const folderName = ref('')

const flipCardMap = new Map()  // key: id, value: flip-card 实例
const currentFlippedId = ref(null)

const handleFlip = (item, flip) => {
  const newId = item._id
  const prevId = currentFlippedId.value

  if (prevId && prevId !== newId) {
    const prevCard = flipCardMap.get(prevId)
    prevCard?.flipToFront?.()
  }

  currentFlippedId.value = newId
  folderName.value = item.name
  flip()
}


/* 提交修改 */
const finishEdit = ({ item, flip }) => {
  const original = item.name
  const newName = folderName.value.trim().replace(/\//g, '-')
  if (newName === original) return

  // item.name = newName
  waterfallRef.value?.updateItem(item._id, { name: newName })

  if (!newName) return notify.warning('名称不能为空')

  if (newName.length > 30) return notify.warning('名称最多 30 个字符')

  if (newName !== original) {
    $api.space.update({ _id: item._id, name: newName }).then(() => {
      notify.success('重命名成功')
      flip()
    }).catch(() => {
      waterfallRef.value?.updateItem(item._id, { name: original })
      notify.error('重命名失败')
    })
  }
}


/* 删除相册 */
const delFolder = ({ item, remove, flip }) => {
  ElMessageBox.confirm(`是否要删除 ${item.name} ?`, '系统提示', {
    type: 'warning',
    showCancelButton: true,
    cancelButtonText: '取消',
    confirmButtonText: '确定',
  }).then(() => {
    $api.space.delete({ _id: item._id }).then(async (res) => {
      remove()
      ElMessage.success('删除成功')
      flip()
    })
  })
}

/* 跳转详情 */
import { useModal, useSubPage } from '@/hooks'
const { openModal: openModalHook, show: showModalHook } = useModal()
const { openSubPage, closeSubPage } = useSubPage()
const navito = (item) => {
  // openModal('folder', item._id, { folder: item.name })
  // router.push({
  //   path: `/details/${item._id}`,
  //   query: { folder: item.name }
  // })
}

usePageChannel('folder', ['detail'], (payload) => {
  const [key, { folder: id, ...value }] = Object.entries(payload)[0];
  ({
    changeCover: () => {
      // 更新瀑布流中的封面
      waterfallRef.value?.updateItem(id, {
        cover: value.thumb_url,
        originalHeight: value.originalHeight,
        originalWidth: value.originalWidth
      }, true)
    }
  }[key] || (() => {
    console.warn(`未处理的消息类型: ${key}`, value)
  }))?.()
})

</script>

<style lang="scss" scoped>
.vw-crad {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  width: 100%;
  height: 100%;
  // min-height: 132px;
  border-radius: 12px;
  background-color: var(--card-color);
  overflow: hidden;
  cursor: pointer;
  position: relative;

  .positoin-timer{
    position: absolute;
    top: 0;
    left: 0;
    padding: 12px;
    font-size: 12px;
    color: var(--text-secondary);
  }

  &-img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(239, 74, 28, 0) 0%, rgba(0, 0, 0, 0.2) 100%);
  }

  &-body {
    position: absolute;
    // top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 12px 14px;
    font-size: 14px;

    &-title {
      color: var(--text-regular);
      margin-bottom: 8px;

      &-text {
        font-size: 14px;
        font-weight: 400;
      }

      &-icon {
        transform: translateY(3px);
      }
    }

    &-content {
      width: 100%;
      display: flex;
      align-items: center;
      margin-top: 4px;

      &-desc {
        margin-right: 12px;
        font-size: 12px;
        color: var(--text-secondary);

        &:last-child {
          margin-right: 0;
        }
      }

      .extra{
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        color: var(--text-secondary);
        transition: background-color 0.15s ease-out;

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        &-icon {
          font-size: 14px;
        }
      }
    }

    .spacebetween {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &-oper {
      position: absolute;
      right: 8px;
      bottom: 12px;
      cursor: pointer;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      trasnsition: background-color 0.15s ease-out;
      opacity: 0.8;

      color: var(--text-primary);
      background-color: rgba(0, 0, 0, 0.076);
      opacity: 1;

    }
  }

  &-body-center {
    top: 50%;
    transform: translateY(-50%);
  }
}

.actionbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  overflow: hidden;
  border-radius: 6px;
  // opacity: 0.8;

  &-t {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0 15px;
  }

  &-icon {
    color: var(--text-primary);
  }
}

.pageoperbar {
  height: var(--page-top-oper-height);
  display: flex;
  align-items: center;
  justify-content: center;

  &-inner {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 90%;
    max-width: 800px;
    padding: 0 16px;
    box-sizing: border-box;
  }

  &-leftbar {
    height: var(--oper-item-height);
    border-radius: var(--oper-item-height);
    padding: 0 24px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--text-secondary);
    overflow: hidden;

    :deep(.circular) {
      width: 22px;
    }

    // background-color: var(--card-color);
    transition: all 0.15s ease-out;

    &:hover {
      color: var(--text-primary);
      background-color: var(--panel-color);
    }

    &-title {
      margin-left: 8px;
      font-size: 14px;
    }

    &-icon {
      font-size: 18px;
    }
  }
}

.searchbar {
  margin: 0 16px;
  flex: 1;
  height: var(--oper-item-height);
  border-radius: var(--oper-item-height);
  padding: 0 12px;
  box-sizing: border-box;
  display: flex;
  align-items: center;

  // background-color: var(--card-color);

  &-ipt {
    flex: 1;
    border-radius: 5px;
    height: 36px;
    margin-right: 12px;
  }
}
</style>
