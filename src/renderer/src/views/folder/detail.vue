<template>
  <paged-waterfall ref="waterfallCursorRef" :fetchPage="$api.folderPic.list" :getItemId="(item) => item._id"
    :getImageSrc="(item) => `${item.thumb_url}-thumb400.webp`" :params="{ folder_id: id }" :pageSize="30"
    :columnCount="{ 1080: 5, 860: 4, 560: 3 }" :gap="16">
    <template #header>
      <div class="pageoperbar">

        <div class="pageoperbar-title" v-if="!upLoading">
          <div class="backbox" @click="closeSubPage()">
            <i-svg name="ah5taocan" class="backbox-icon" size="16" />
            <span class="backbox-text">返回</span>
          </div>
          <i-svg name="kejianyunpan" size="16" />
          <span class="pageoperbar-title-text">{{ title || '照片列表'
            }}</span>
        </div>
        <div class="uploading" v-else>
          <i-svg name="jiazai" size="16" class="uploading-icon" />
          <span class="uploading-text">正在上传中 ({{ $up.successCount.value }}/{{ $up.total.value }})</span>
          <span class="uploading-text-desc">请勿关闭窗口</span>
        </div>

        <div class="pageoperbar-center">
          <div class="pageoperbar-center-node" @click.stop="checkAllChange">
            <div class="select-sele" :class="checkedClass" />
            <span class="pageoperbar-center-node-text">已选</span>
            <span>{{ checkedCount }}</span>
            <span class="pageoperbar-center-node-text">张 {{ totalCount }}</span>
          </div>
        </div>

        <div class="pageoperbar-inner">
          <!-- <span class="uploading-text-desc">已选 张</span> -->
          <!-- <span class="uploading-text-desc" v-if="$up.selectedCount.value > 0">总计 {{ formatBytes($up.selectedSize.value) }}</span> -->

          <div class="pageoperbar-inner-item" @click="upload(id)">
            <i-svg name="choseimage" size="14" />
            <span class="pageoperbar-inner-item-title">上传照片</span>
          </div>
        </div>
      </div>
    </template>
    <template #extra="{ item }">
      <div class="extrabox" @click.stop="selectorItem(item)">
        <div class="extrabox-left">
          <div class="extrabox-left-title">{{ item.name }}</div>
          <div class="extrabox-left-desc">{{ formatBytes(item.size) }} </div>
        </div>
        <div class="extrabox-right">
          <div class="select-sele" :class="{ 'select-sele-active': !!checkedPics[item._id] }"
            @click.stop="selectorItem(item)" />
        </div>
      </div>
    </template>
  </paged-waterfall>
</template>

<script setup>
import { useModal, useSubPage } from '@/hooks'
const { closeSubPage } = useSubPage()

import { formatBytes, deepClone, debounce } from '@mvmoo/us'

import { $api } from '@/config/api.js'
const { id, title } = defineProps(['id', 'title'])
import { uploader } from '@/hooks'
const $up = uploader()
const upLoading = computed(() => $up.loading.value)

const waterfallCursorRef = ref(null)

const pendingItems = ref([])

const flushToTop = () => {
  waterfallCursorRef.value?.insertItemsToTop([...pendingItems.value])
  pendingItems.value = []
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

      console.log(`已上传 张`, pendingItems.value.length)
      // ✨ 每上传几张立即插入一次
      if (pendingItems.value.length >= 5) {
        flushToTop()
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

const checkedPics = ref({})
const checkedCount = computed(() => Object.keys(checkedPics.value)?.length || 0)
const totalCount = computed(() => waterfallCursorRef.value?.items.length || 0)

const checkAllChange = () => {
  const total = totalCount.value;
  if (checkedCount.value === total) {
    checkedPics.value = {};
  } else {
    checkedPics.value = deepClone(waterfallCursorRef.value?.items.reduce((acc, item) => {
      acc[item._id] = 1;
      return acc;
    }, {}));
  }
}

const checkedClass = computed(() => {
  if (checkedCount.value === 0) {
    return 'default-selected ';
  } else if (checkedCount.value === totalCount.value) {
    return 'select-sele-active';
  } else {
    return 'half-selected';
  }
});

const selectorItem = (item) => {
  const id = item._id;
  if (checkedPics.value[id]) {
    delete checkedPics.value[id];
  } else {
    checkedPics.value[id] = 1;
  }
}

</script>

<style lang="scss" scoped>
.backbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 15px;
  color: var(--text-primary);
  padding-right: 12px;
  margin-right: 12px;
  position: relative;

  // 在结尾(右边)加一条分割线
  &::before {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 80%;
    background-color: var(--border-bottom-color);
  }

  &:hover {
    color: var(--text-soft);
  }

  &-icon {
    transform: rotate(180deg);
    line-height: 0;
    margin-right: 5px;
  }

  &-text {
    font-size: 14px;
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
  backdrop-filter: blur(64px);
  -webkit-backdrop-filter: blur(64px);
  // background-color: rgba(18, 18, 18, 1);
  // background-color: #303133;
  // background-color: #2c2e32;

  // 在底部加阴影
  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.2);

  &-title {
    flex: 1 0 auto;
    width: 0;
    display: flex;
    align-items: center;
    font-size: 16px;
    color: var(--text-primary);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &-text {
      margin-left: 8px;
      font-size: 14px;
      font-weight: 400;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-icon {
      font-size: 18px;
      color: var(--text-primary);
    }
  }

  &-center {
    flex: 1 0 auto;
    width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    &-node {
      display: flex;
      align-items: center;
      font-size: 15px;
      color: var(--text-regular);
      cursor: pointer;

      &>span {
        margin-left: 4px;
        // 禁止选中
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      &-text {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
  }

  &-inner {
    flex: 1 0 auto;
    width: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    box-sizing: border-box;

    &-item {
      flex-shrink: 0;
      height: calc(var(--oper-item-height) - 4px);
      border-radius: calc(var(--oper-item-height) - 4px);
      padding: 0 24px;
      margin-right: 12px;
      display: flex;
      align-items: center;
      cursor: pointer;
      color: var(--text-soft);
      // background-color: var(--bg-color);
      background-color: #1c1c1c;
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
        // 禁止选中
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
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
    flex-shrink: 0;
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

.extrabox {
  display: flex;
  align-items: flex-end;
  padding: 8px 8px 0;
  box-sizing: border-box;
  cursor: pointer;
  color: var(--text-regular);

  &-left {
    flex: 1 0 auto;
    width: 0;
    display: flex;
    flex-direction: column;
    font-size: 14px;

    &-title {
      margin-bottom: 4px;
      word-break: break-all;
      // 最多显示两行
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      /* 限制为两行 */
      -webkit-box-orient: vertical;
      /* 必须设置 */
    }

    &-desc {
      font-size: 12px;
      color: var(--text-secondary);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
  }

  &-right {
    flex-shrink: 0;
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;
    cursor: pointer;
  }
}

.select-sele {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  font-size: 12px;

  &-active {
    border-color: var(--text-soft);

    &::before {
      content: '';
      width: 50%;
      height: 50%;
      border-radius: 50%;
      background-color: var(--text-soft);
      display: block;
    }
  }
}

.default-selected {
  width: 16px;
  height: 16px;
  border-radius: 5px;
}

.half-selected {
  border-color: var(--text-soft);
  width: 16px;
  height: 16px;
  border-radius: 5px;

  &::before {
    content: '';
    width: 50%;
    height: 2px;
    background-color: var(--text-soft);
    display: block;
  }
}
</style>
