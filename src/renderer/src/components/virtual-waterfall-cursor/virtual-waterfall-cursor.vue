<template>
  <div ref="container" class="waterfall-container" :style="containerStyle" @scroll.passive="handleScroll">
    <header>
      <slot name="header" />
    </header>
    <div class="waterfall-inner" :style="innerStyle">
      <section v-for="item in visibleItems" :key="item[props.getItemId(item)]" :style="getItemStyle(item)"
        class="waterfall-item" :class="{ 'newly-inserted': item._justInserted }" :data-index="item.__index">
        <div v-if="item._id" class="image-wrapper" :class="{ loaded: loadedMap[item._id] }"
          :style="aspectRatioStyle(item)">
          <img :src="props.getImageSrc(item)" alt="item.title" class="waterfall-image"
            :class="{ loaded: loadedMap[item._id] }" @load="onImageLoad(item._id, $event)" />
        </div>
        <div v-else class="placeholder"></div>

        <!-- 插槽，允许外部传入 item-info 内容 -->
        <div class="item-info" :data-index="item.__index" :ref="(el) => setItemInfoHeight(el, item.__index)">
          <slot name="extra" :item="item" :index="item.__index"></slot>
        </div>
      </section>

      <div v-if="canManuallyLoadMore" class="center-load-more">
        <el-button text @click="loadMore">加载更多</el-button>
      </div>
    </div>
    <div v-if="isLoading" class="loading-indicator">
      <el-icon>
        <Loading />
      </el-icon>
    </div>
    <div style="height: 16px;" />
    <el-empty v-if="!isLoading && visibleItems.length === 0" description=" " style="margin-top: 20%" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { debounce, throttle } from '@mvmoo/us'
import { ElButton, ElEmpty, ElIcon } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'


// Props定义
const props = defineProps({
  fetchPage: Function,    // 获取数据的接口函数
  getItemId: Function,    // 获取项目ID的函数
  getImageSrc: Function,  // 获取图片地址的函数
  params: Object,         // 自定义请求参数
  columnCount: Object,    // 列数配置，根据不同屏幕宽度调整列数
  pageSize: {
    type: Number,
    default: 20, // 默认每页加载的条数
  },
  defaultParams: {
    type: Object,
    default: () => ({}),  // 默认的请求参数
  },
  gap: {
    type: Number,
    default: 16,  // 默认卡片之间的间距
  },
});

const DEFAULTWIDTH = 600; // 默认宽度
const DEFAULTHEIGHT = 450; // 默认高度

// 响应式变量
const container = ref(null);
const items = ref([]);
const visibleItems = ref([]);
const isLoading = ref(false);
const containerHeight = ref(0);
const nextCursor = ref(null);  // 游标分页
const hasMore = ref(true);     // 是否还有更多数据

const containerWidth = ref(0);
const currentColumnCount = ref(3);
const scrollTop = ref(0);
const viewportHeight = ref(window.innerHeight);
const itemPositions = ref([]);
const VIEWPORT_BUFFER = 1000;
const itemIndexMap = ref({});

const canManuallyLoadMore = computed(() => hasMore.value && !isLoading.value && containerHeight.value < viewportHeight.value)

// 维护每列的高度，便于增量布局
const columnHeights = ref([]);
let lastColumnCount = 0;

const rebuildIndexMap = () => {
  const map = {};
  items.value.forEach((item, index) => {
    map[props.getItemId(item)] = index;
  });
  itemIndexMap.value = map;
};

const throttledLayout = throttle(() => calculateItemPositions(), 100);

// 动态获取 item-info 的高度
const itemInfoHeights = ref([]); // 存储每个 item-info 高度的数组
const imgRatiosRef = ref({});    // 存储图片比例
const loadedMap = ref({}) // 记录图片是否加载完成

// 布局更新标志位
const isLayoutUpdating = ref(false);
const lastHeights = ref([]); // 缓存上一次的 item-info 高度

let resizeObserver;

// 获取数据的函数，使用游标分页
const fetchItems = async () => {
  if (!hasMore.value) return;

  isLoading.value = true;
  const lastItem = nextCursor.value || items.value.at(-1);
  const req = Object.assign({}, { limit: props.pageSize }, props.params, props.defaultParams);

  if (lastItem) {
    req.clt = lastItem.create_time;
    req.cli = lastItem[props.getItemId(lastItem)];
  }

  try {
    const res = await props.fetchPage(req);
    const dataList = res?.data?.rows || res?.data?.list || res?.data || [];

    // 处理数据，并赋值宽高
    const list = dataList.map(item => {
      item.originalWidth = item.width || 300;  // 默认宽度
      item.originalHeight = item.height || 200;  // 默认高度
      return item;
    });

    if (list.length < props.pageSize) hasMore.value = false;
    const start = items.value.length;
    items.value = items.value.concat(list);
    list.forEach((item, idx) => {
      itemIndexMap.value[props.getItemId(item)] = start + idx;
    });
    nextCursor.value = res?.next_cursor || null;

    // 仅对新增部分计算位置
    calculateItemPositions(true);

  } catch (error) {
    console.error('数据加载失败:', error);
  } finally {
    isLoading.value = false;  // 无论成功或失败，设置加载状态为 false
  }
};

// 滚动事件处理，加载更多数据
const handleScroll = throttle(() => {
  const containerEl = container.value;
  scrollTop.value = containerEl.scrollTop;
  viewportHeight.value = containerEl.clientHeight;
  const scrollPosition = scrollTop.value + viewportHeight.value;
  const containerHeightVal = containerEl.scrollHeight;

  // console.log(`Scroll Position: ${scrollPosition}, Container Height: ${containerHeightVal}`);
  // scrollPosition >= containerHeightVal - 100 && !isLoading.value

  if (scrollPosition >= containerHeightVal - VIEWPORT_BUFFER && !isLoading.value) {
    fetchItems();
  }
  updateVisibleItems();
  reMeasureVisibleHeights();
}, 200);

// 手动触发加载更多数据
const loadMore = () => {
  if (canManuallyLoadMore.value) {
    fetchItems();
  }
};

// 计算每个项目的位置（top/left），根据列数进行布局
const itemWidth = ref(0);

const updateColumnCount = () => {
  const width = containerWidth.value;
  const breakpoints = Object.entries(props.columnCount)
    .map(([w, cols]) => ({ width: +w, cols }))
    .sort((a, b) => b.width - a.width);
  let cols = 2;
  for (const bp of breakpoints) {
    if (width >= bp.width) {
      cols = bp.cols;
      break;
    }
  }
  currentColumnCount.value = cols;
  itemWidth.value = (containerWidth.value - (cols - 1) * props.gap) / cols;
};

const updateVisibleItems = () => {
  visibleItems.value = itemPositions.value.filter(i =>
    i.top + i.height >= scrollTop.value - VIEWPORT_BUFFER &&
    i.top <= scrollTop.value + viewportHeight.value + VIEWPORT_BUFFER
  );
};

const calculateItemPositions = (incremental = false) => {
  if (isLayoutUpdating.value) return; // 防止死循环
  isLayoutUpdating.value = true;

  updateColumnCount();

  if (!incremental || lastColumnCount !== currentColumnCount.value) {
    columnHeights.value = Array(currentColumnCount.value).fill(0);
    itemPositions.value = [];
    incremental = false;
  }
  lastColumnCount = currentColumnCount.value;


  const startIndex = incremental ? itemPositions.value.length : 0;

  for (let i = startIndex; i < items.value.length; i++) {
    const item = items.value[i];
    const ratio = imgRatiosRef.value[item._id] || 1.5;
    const imgHeight = itemWidth.value * ratio;
    const extraHeight = itemInfoHeights.value[i] || 0;
    const height = imgHeight + extraHeight;

    const columnIndex = columnHeights.value.indexOf(Math.min(...columnHeights.value));
    const left = columnIndex * (itemWidth.value + props.gap);
    const top = columnHeights.value[columnIndex];
    columnHeights.value[columnIndex] += height + props.gap;

    const pos = { ...item, __index: i, left, top, height };
    if (incremental) {
      itemPositions.value.push(pos);
    } else {
      itemPositions.value[i] = pos;
    }
  }

  containerHeight.value = Math.max(...columnHeights.value) - props.gap;
  if (containerHeight.value < 0) containerHeight.value = 0;

  nextTick(() => {
    container.value.style.height = containerHeight.value > 0 ? `${containerHeight.value}px` : '100%';
  });

  updateVisibleItems();
  isLayoutUpdating.value = false;
};

// 计算容器样式
const containerStyle = computed(() => ({
  position: 'relative',
  width: '100%',
  overflowY: 'auto',
  height: containerHeight.value > 0 ? `${containerHeight.value}px` : '100%',
}));

const innerStyle = computed(() => ({
  position: 'relative',
  height: containerHeight.value + 'px',
  width: containerWidth.value + 'px',
}));

// 获取每个项目的样式（定位和宽高）
const getItemStyle = (item) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: `${itemWidth.value}px`,
  height: `${item.height}px`, // 使用动态计算的高度
  transform: `translate(${item.left}px, ${item.top}px)`,
  willChange: 'transform',
});

// 为图片设置占位样式，防止加载过程高度塌陷
const aspectRatioStyle = (item) => {
  const ratio =
    imgRatiosRef.value[item._id] ||
    (item.originalHeight && item.originalWidth ? item.originalHeight / item.originalWidth : 1.5)
  return {
    height: `${itemWidth.value * ratio}px`,
    width: '100%'
  }
}

// 获取 item-info 的高度，并计算样式
const setItemInfoHeight = (el, index) => {
  if (el) {
    nextTick(() => {
      const newHeight = el.offsetHeight;

      // 只有高度发生变化时才更新，避免死循环
      if (newHeight !== lastHeights.value[index]) {
        itemInfoHeights.value[index] = newHeight; // 动态获取 item-info 的高度
        lastHeights.value[index] = newHeight; // 缓存当前高度
        calculateItemPositions(); // 重新计算位置
      }
    });
  }
};

const reMeasureVisibleHeights = debounce(() => {
  nextTick(() => {
    const els = container.value?.querySelectorAll('[data-index]')
    let changed = false
    els?.forEach((el) => {
      const idx = Number(el.getAttribute('data-index'))
      const infoEl = el.querySelector('.item-info')
      if (!infoEl) return
      const pos = itemPositions.value[idx]
      if (!pos) return
      if (
        pos.top + pos.height >= scrollTop.value - VIEWPORT_BUFFER &&
        pos.top <= scrollTop.value + viewportHeight.value + VIEWPORT_BUFFER
      ) {
        const h = infoEl.offsetHeight
        if (h && h !== itemInfoHeights.value[idx]) {
          itemInfoHeights.value[idx] = h
          changed = true
        }
      }
    })
    if (changed) calculateItemPositions()
  })
}, 300)

// 计算图片的比例
// const onImageLoad = (id, e) => {
//   const { naturalWidth, naturalHeight } = e.target;
//   if (naturalWidth === 0) return;
//   const ratio = naturalHeight / naturalWidth;
//   imgRatiosRef.value[id] = ratio;
//   calculateItemPositions();
// };
const onImageLoad = (id, e) => {
  const { naturalWidth, naturalHeight } = e.target
  if (naturalWidth === 0) return
  const ratio = naturalHeight / naturalWidth
  imgRatiosRef.value[id] = ratio
  loadedMap.value[id] = true
  calculateItemPositions()
}

const insertItemToTop = async (newItem) => {
  const id = props.getItemId(newItem)
  newItem.originalWidth = newItem.width || DEFAULTWIDTH
  newItem.originalHeight = newItem.height || DEFAULTHEIGHT
  newItem._justInserted = true
  delete imgRatiosRef.value[id]
  items.value.unshift(newItem)
  itemInfoHeights.value.unshift(0)
  await nextTick()
  reMeasureVisibleHeights()
  calculateItemPositions()
  setTimeout(() => {
    newItem._justInserted = false
  }, 400)
  container.value?.scrollTo({ top: 0, behavior: 'smooth' })
};

const insertItemsToTop = async (newItems = []) => {
  newItems.forEach((item) => {
    item.originalWidth = item.width || DEFAULTWIDTH
    item.originalHeight = item.height || DEFAULTHEIGHT
    delete imgRatiosRef.value[props.getItemId(item)]
    item._justInserted = true
  })
  items.value.unshift(...newItems)
  itemInfoHeights.value.unshift(...new Array(newItems.length).fill(0))
  rebuildIndexMap()
  await nextTick()
  reMeasureVisibleHeights()
  calculateItemPositions()
  setTimeout(() => {
    newItems.forEach((i) => (i._justInserted = false))
  }, 400)
  container.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const updateItem = async (id, data = {}, mayAffectHeight = false) => {
  const index = items.value.findIndex((i) => props.getItemId(i) === id)
  if (index === -1) return
  items.value[index] = { ...items.value[index], ...data }
  if (mayAffectHeight) {
    itemInfoHeights.value[index] = 0
  }
  await nextTick()
  reMeasureVisibleHeights()
  calculateItemPositions()
}

const updateItems = async (updates = []) => {
  let dirty = false
  updates.forEach(({ id, data, mayAffectHeight }) => {
    const index = itemIndexMap.value[id]
    if (index !== undefined) {
      items.value[index] = { ...items.value[index], ...data }
      if (mayAffectHeight) {
        itemInfoHeights.value[index] = 0
        dirty = true
      }
    }
  })
  await nextTick()
  if (dirty) reMeasureVisibleHeights()
  calculateItemPositions()
};


const removeItem = (id) => {
  const idx = items.value.findIndex((i) => props.getItemId(i) === id)
  if (idx === -1) return
  items.value.splice(idx, 1)
  itemInfoHeights.value.splice(idx, 1)
  delete imgRatiosRef.value[id]
  reMeasureVisibleHeights()
  calculateItemPositions()
  rebuildIndexMap()
}

const removeItems = (ids = []) => {
  const pairs = ids
    .map((id) => ({
      id,
      index: items.value.findIndex((i) => props.getItemId(i) === id)
    }))
    .filter((p) => p.index !== -1)
    .sort((a, b) => b.index - a.index)

  pairs.forEach(({ id, index }) => {
    items.value.splice(index, 1)
    itemInfoHeights.value.splice(index, 1)
    delete imgRatiosRef.value[id]
  })

  if (pairs.length) {
    reMeasureVisibleHeights()
    calculateItemPositions()
    rebuildIndexMap()
  }
}

defineExpose({
  insertItemToTop,
  insertItemsToTop,
  updateItem,
  updateItems,
  removeItem,
  removeItems
});

// 组件挂载时获取数据
onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => {
    containerWidth.value = entry.contentRect.width;
    throttledLayout();
  });
  if (container.value) {
    resizeObserver.observe(container.value);
    containerWidth.value = container.value.clientWidth;
  }
  fetchItems();
  throttledLayout();
});

onUnmounted(() => {
  resizeObserver && resizeObserver.disconnect();
});
</script>

<style scoped>
::-webkit-scrollbar {
  display: none;
}

.waterfall-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

header {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 10;
}

.waterfall-inner {
  position: relative;
  width: 100%;
  padding-bottom: 16px;
  box-sizing: border-box;
}

.waterfall-item {
  position: absolute;
  width: 100%;
  will-change: transform;
}

.image-wrapper {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background-color: var(--card-color);
  border: 1px solid var(--divider-color);
  transition: filter 0.4s ease;
  filter: blur(5px);
}

.image-wrapper.loaded {
  filter: none;
}

.placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--card-color);
}

.waterfall-image {
  width: 100%;
  /* height: auto; */
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.waterfall-image.loaded {
  opacity: 1;
}

.item-info {
  padding: 5px;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  /* 超出换行 */
  word-break: break-all;
  font-size: 14px;
  color: var(--text-regular);
}

.loading-indicator,
.center-load-more {
  text-align: center;
  padding: 24px;
}

.newly-inserted {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
