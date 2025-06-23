<template>
  <full-layout subhead="快速交付">
    <template #side>
      <div class="folder-info">

        <div class="folder-info-separate">
          <span>封面</span>
        </div>
        <div class="folder-info-cover">
          <img v-if="folderDetail?.cover" :src="folderDetail?.cover" class="folder-info-cover-img" />
        </div>
        <div class="folder-info-title">
          <span class="folder-info-title-text">
            <i-svg name="glphotoAlbum" size="16" class="folder-info-title-icon" />
            {{ folderDetail?.name }}
          </span>

        </div>
        <div class="folder-info-desc">
          <span class="folder-info-desc-text">照片数量：{{ folderDetail?.photo_count || 0 }}</span>
          <span class="folder-info-desc-text">所用空间：{{ formatBytes(folderDetail?.photo_size || 0) }}</span>
          <span class="folder-info-desc-text">最后更新：{{ formatSmartTime(folderDetail?.update_time, '/') }}</span>
        </div>
      </div>
    </template>
    <template #main>
      <paged-waterfall ref="waterfallCursorRef" :fetchPage="$api.folderPic.list" :getItemId="(item) => item._id"
        :getImageSrc="(item) => `${item.thumb_url}-thumb400.webp`" :params="{ folder: id }" :pageSize="30"
        :columnCount="{ 1080: 5, 860: 4, 560: 3 }" :gap="16">
        <template #header>
          <div class="pageoperbar">

            <div class="pageoperbar-center">
              <div class="pageoperbar-center-node" @click.stop="checkAllChange">
                <div class="select-sele" :class="checkedClass" style=" margin-right: 4px;" />
                <span class="pageoperbar-center-node-text">已选</span>
                <span>{{ checkedCount }}</span>
                <span class="pageoperbar-center-node-text">张</span>
              </div>
            </div>

            <div class="uploading" v-if="upLoading">
              <i-svg name="ziyuanzhongxin" size="16" class="uploading-icon" />
              <span class="uploading-text">正在上传中</span>
              <!-- <span class="uploading-text-desc">原则上不建议切换窗口</span> -->
            </div>


            <div class="pageoperbar-inner">
              <div class="pageoperbar-inner-item" @click="upload(id)">
                <i-svg name="choseimage" size="14" />
                <span class="pageoperbar-inner-item-title">批量操作</span>
              </div>
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
  </full-layout>

</template>

<script setup>
import { formatBytes, deepClone, debounce, parseTime, formatSmartTime } from '@mvmoo/us'
import { $api } from '@/config/api.js'
const { id, title } = defineProps(['id', 'title'])
const folderDetail = ref({})
const getFolderDetail = async () => {
  const res = await $api.space.detail(id)
  folderDetail.value = res.data
}
getFolderDetail()

import { uploader } from '@/hooks'
const $up = uploader({
  apiFn: $api.space.picstorage,
  compressOptions: { quality: 0.8, maxWidth: 1440 }, // 默认压缩参数
  uploadOriginal: false,  // 是否上传原图
  uploadThumb: true,     // 是否上传压缩图
  urlSource: 'original'  // payload.url 取值，可为 'original' 或 'thumb'
})
const upLoading = computed(() => $up.loading.value)

// 监听列队状态
const upQueue = computed(() => $up.queue.value)

const waterfallCursorRef = ref(null)

const pendingItems = ref([])

const flushToTop = () => {
  waterfallCursorRef.value?.insertItemsToTop([...pendingItems.value])
  pendingItems.value = []
}

const upload = () => {
  console.log('上传列队', $up.queue.value)
  pendingItems.value = []
  $up.open({
    multiple: true,
    folder: id,
    onEachComplete: (imgInfo) => {
      imgInfo._id = imgInfo.sign
      imgInfo.folder = imgInfo.folder
      // waterfallCursorRef.value?.insertItemToTop(imgInfo)
      pendingItems.value.push(imgInfo)
      // console.log('列队状态', upQueue.value)
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
.folder-info {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;

  &-separate {
    font-size: 13px;
    color: var(--text-disabled);
    text-align: center;
    margin: 12px 0 24px;
    position: relative;

    &>span {
      position: relative;
      z-index: 1;
      padding: 0 8px;
      background-color: var(--bg-color);
    }

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 10%;
      right: 10%;
      height: 1px;
      background-color: var(--divider-color);
      transform: translateY(-50%) scaleY(0.6);
      border-radius: 1px;
    }
  }

  &-cover {
    width: 100%;
    overflow: hidden;
    border-radius: 12px;
    margin-bottom: 24px;
    aspect-ratio: 3 / 4;
    border: 1px solid var(--divider-color);
    background-color: var(--hover-bg);
    box-sizing: border-box;

    &-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &-title {
    // display: flex;
    // align-items: center;
    // color: var(--text-soft);
    margin: 0 12px 24px;

    &-text {
      color: var(--text-regular);
      font-size: 14px;
      margin-bottom: 8px;
    }

    &-icon {
      margin-right: 2px;
      transform: translateY(2px);
    }
  }

  &-desc {
    font-size: 12px;
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    margin: 0 12px 24px;


    &-text {
      margin-bottom: 12px;
      white-space: nowrap; // 防止换行
      overflow: hidden; // 超出部分隐藏
      text-overflow: ellipsis; // 超出部分显示省略号
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
  backdrop-filter: blur(64px) saturate(150%);
  -webkit-backdrop-filter: blur(64px) saturate(150%);
  background-color: rgba(18, 18, 18, 0.2);
  // background-color: #303133;
  // background-color: #2c2e32;

  // 在底部加阴影
  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.2);

  &-center {
    flex: 1 0 auto;
    width: 0;
    display: flex;
    align-items: center;
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
  // color: var(--text-regular);

  &-icon {
    flex-shrink: 0;
    font-size: 16px;
    margin-right: 8px;
    animation: loadingrotate 0.6s infinite linear;
  }

  @keyframes loadingrotate {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  &-text {
    color: var(--text-secondary);
    font-size: 14px;
    background: linear-gradient(-90deg,
        rgba(255, 255, 255, 0.74) 20%,
        rgba(0, 255, 119, 0.92) 50%,
        rgba(183, 255, 0, 0.4) 80%);
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
