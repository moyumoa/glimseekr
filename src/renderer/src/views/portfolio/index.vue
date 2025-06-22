<template>
  <virtual-waterfall ref="waterfallRef" class="waterfallview" :fetchPage="$api.folderPic.list"
     :defaultParams="{ folder: 'e647148e684bd99702b0e659094a9b58' }"
		 :getItemId="item => item._id"
    :columnCount="{ 1920: 5, 1080: 4, 960: 3, 650: 2 }">
    <template #header>
      <div class="pageoperbar">
        <div class="pageoperbar-title" v-if="!upLoading">
          <i-svg name="kejianyunpan" size="16" />
          <span class="pageoperbar-title-text">12312321</span>
        </div>
        <div class="uploading" v-else>
          <i-svg name="jiazai" size="16" class="uploading-icon" />
          <span class="uploading-text">正在上传中 ({{ $up.successCount.value }}/{{ $up.total.value }})</span>
          <span class="uploading-text-desc">请勿关闭窗口</span>
        </div>
        <div class="pageoperbar-inner">
          <div class="pageoperbar-inner-item" @click="upload(id)">
            <i-svg name="choseimage" size="14" />
            <span class="pageoperbar-inner-item-title">上传照片</span>
          </div>
        </div>
      </div>
    </template>
    <template #default="{ item, columnWidth, remove }">
      <ProgressiveImage :url="item.thumb_url" @click="navito(item)" />

      <div class="vw-crad-body" :style="{ ...(!item.thumb_url && { top: 0 }) }">
        <div class="vw-crad-body-title">
          <span class="vw-crad-body-title-text">
            {{ item.name }}
          </span>
        </div>
        <div class="vw-crad-body-content">
          <span class="vw-crad-body-content-desc">
            {{ formatBytes(item.size) }}
          </span>
        </div>
        <div class="vw-crad-body-oper" @click.stop="() => extra(item)">
          <i-svg name="gengduo6" size="14" class="vw-crad-body-oper-icon" />
        </div>
      </div>
    </template>
  </virtual-waterfall>

</template>
<script setup>
import { formatBytes, deepClone, debounce } from '@mvmoo/us'
import { $api } from '@/config/api.js'

const { id, query } = defineProps(['id', 'query'])
import { uploader } from '@/hooks'
const $up = uploader()
const upLoading = computed(() => $up.loading.value)

const waterfallRef = ref(null)

const pendingItems = ref([])

const flushToTop = () => {
  if (pendingItems.value.length > 0) {
    waterfallRef.value?.insertItemsToTop([...pendingItems.value])
    pendingItems.value = []
  }
}

const flushDebounced = debounce(flushToTop, 400)

const upload = () => {
  pendingItems.value = []
  $up.open({
    multiple: true,
    folder: id,
    onEachComplete: (imgInfo) => {
      imgInfo._id = imgInfo.sign
      imgInfo.folder = imgInfo.folder
      // waterfallRef.value?.insertItemToTop(imgInfo)
      pendingItems.value.push(imgInfo)

      // ✨ 每上传几张立即插入一次
      if (pendingItems.value.length >= 3) {
        flushToTop()
      } else {
        flushDebounced()
      }
    },
    onComplete: ({ total, successCount, failCount, failedFiles }) => {
      // ✨ 最终补一波剩下的
      flushToTop()
      console.log(`共 ${total} 张，成功 ${successCount}，失败 ${failCount}`)
      if (failCount > 0) {
        console.warn('失败文件列表:', failedFiles)
      }
    }

  })
}

const { send } = usePageEmitter('folder', 'detail')
const extra = (item) => {
  send({ changeCover: item })
}


const addNewItem = () => {
  const newItem = {
    _id: Date.now().toString(),
    name: '新相册',
    create_time: Date.now(),
    photo_count: 0,
    photo_size: 0
  }
  waterfallRef.value?.insertItemToTop(newItem)
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
const navito = (item) => {
}

</script>

<style lang="scss" scoped>
.waterfallview {
  // box-shadow: 0 2px 8px rgba(30, 30, 30, 0.8);
}

.vw-crad {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  width: 100%;
  height: 100%;
  // min-height: 132px;
  border-radius: 12px;
  // background-color: var(--card-color);
  overflow: hidden;
  cursor: pointer;
  position: relative;

  &:hover &-img {
    // 图片放大
    transform: scale(1.2);
    transition: transform 0.15s ease;
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
    background: linear-gradient(to bottom, rgba(239, 74, 28, 0) 0%, rgba(0, 0, 0, 0.25) 100%);
  }

  &-body {
    position: absolute;
    // top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 5;
    padding: 12px 12px 14px;
    font-size: 14px;

    &-title {
      color: var(--text-regular);
      margin-bottom: 8px;

      &-text {
        font-size: 14px;
        font-weight: 400;
      }

    }

    &-content {
      display: flex;
      align-items: center;
      margin-top: 4px;
      margin-right: 36px;

      &-desc {
        margin-right: 12px;
        font-size: 12px;
        color: var(--text-secondary);

        &:last-child {
          margin-right: 0;
        }
      }
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
}


.pageoperbar {
  margin-bottom: 12px;
  padding: 8px 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  // background: linear-gradient(to bottom, rgba(210, 15, 15, 0) 0%, rgba(0, 0, 0, 0.1) 100%);

  // 毛玻璃背景
  // backdrop-filter: blur(16px);
  // -webkit-backdrop-filter: blur(16px);
  // background-color: rgba(18, 18, 18, 1);
  // background-color: #303133;
  background-color: #2c2e32;

  // 在底部加阴影
  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.2);

  &-title {
    display: flex;
    align-items: center;
    font-size: 16px;
    color: var(--text-primary);
    font-weight: 500;

    &-text {
      margin-left: 8px;
      font-size: 14px;
      font-weight: 400;
    }

    &-icon {
      font-size: 18px;
      color: var(--text-primary);
    }
  }

  &-inner {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    box-sizing: border-box;

    &-item {
      height: calc(var(--oper-item-height) - 4px);
      border-radius: calc(var(--oper-item-height) - 4px);
      padding: 0 24px;
      margin-right: 12px;
      display: flex;
      align-items: center;
      cursor: pointer;
      color: var(--text-soft);
      background-color: var(--bg-color);
      transition: all 100ms ease-out;

      &:last-child {
        margin-right: 0;
      }

      &:hover {
        color: var(--text-primary);
        background-color: var(--border-bottom-color);

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

}

.uploading {
  display: flex;
  align-items: center;
  color: var(--text-regular);

  &-icon {
    font-size: 16px;
    margin-right: 8px;
    animation: loadingrotate 0.3s infinite linear;
  }

  &-text {
    color: var(--text-secondary);
    font-size: 14px;
    background: linear-gradient(-90deg,
        rgba(255, 255, 255, 0.2) 20%,
        rgba(255, 255, 255, 0.6) 50%,
        rgba(255, 255, 255, 0.2) 80%);
    background-size: 200% 100%;
    background-position: 40% center;
    will-change: background-position;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 3s infinite linear;

    @keyframes shimmer {
      0% {
        background-position: 200% center;
      }

      50% {
        background-position: 0% center;
      }

      100% {
        background-position: -200% center;
      }
    }

    &-desc {
      margin-left: 24px;
      color: var(--warning-color);
      opacity: 0.4;
      font-size: 12px;
    }
  }
}

.searchbar {
  flex-shrink: 0;
  width: 375px;
  height: var(--oper-item-height);
  border-radius: var(--oper-item-height);
  padding: 0 12px;
  box-sizing: border-box;
  display: flex;
  align-items: center;

  background-color: var(--panel-color);

  &:hover {
    background-color: var(--card-color);
  }

  &-ipt {
    flex: 1;
    border-radius: 5px;
    height: 36px;
    margin-right: 12px;
  }
}
</style>
