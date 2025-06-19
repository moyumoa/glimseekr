<template>
  <virtual-waterfall-cursor ref="waterfallCursorRef" :fetchPage="$api.folderPic.list" :getItemId="(item) => item._id"
    :getImageSrc="(item) => `${item.thumb_url}-thumb400.webp`" :params="{ folder_id: id }"
    :columnCount="{ 1080: 5, 860: 4, 560: 3 }" :gap="16">
    <template #header>
      <div class="pageoperbar">
        <div class="pageoperbar-title" v-if="!upLoading">
          <i-svg name="kejianyunpan" size="16" />
          <span class="pageoperbar-title-text">{{ query.folder || '照片列表' }}</span>
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
    <template #extra="{ item }">
      <div @click.stop="extra(item)">
        <div>{{ query.folder }}</div>
        <div>{{ item.name }}</div>
        <div>{{ item.size }}</div>
        <div>{{ item._id }}</div>
      </div>
    </template>
  </virtual-waterfall-cursor>
</template>

<script setup>
import { formatBytes, deepClone, debounce } from '@mvmoo/us'

import { $api } from '@/config/api.js'
const { id, query } = defineProps(['id', 'query'])
import { uploader } from '@/hooks'
const $up = uploader()
const upLoading = computed(() => $up.loading.value)

const waterfallCursorRef = ref(null)

const pendingItems = ref([])

const flushToTop = () => {
  if (pendingItems.value.length > 0) {
    waterfallCursorRef.value?.insertItemsToTop([...pendingItems.value])
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
      imgInfo.folder_id = imgInfo.folder
      // waterfallCursorRef.value?.insertItemToTop(imgInfo)
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
  // send({ changeCover: item })
  waterfallCursorRef.value?.removeItem(item._id)
}
</script>

<style lang="scss" scoped>
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
</style>
