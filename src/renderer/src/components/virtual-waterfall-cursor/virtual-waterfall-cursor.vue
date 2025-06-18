<template>
  <div ref="container" class="waterfall-container" :style="containerStyle" @scroll.passive="handleScroll">
    <div class="waterfall-inner" :style="innerStyle">
      <div v-for="item in visibleItems" :key="item[props.getItemId(item)]" :style="getItemStyle(item)"
        class="waterfall-item">
        <img v-if="item._id" :src="props.getImageSrc(item)" alt="item.title" class="waterfall-image"
          @load="onImageLoad(item._id, $event)" />
        <div v-else class="placeholder"></div>

        <!-- 插槽，允许外部传入 item-info 内容 -->
        <div class="item-info" :data-index="item.__index" :ref="el => setItemInfoHeight(el, item.__index)">
          <slot name="item-info" :item="item" :index="item.__index"></slot>
        </div>
      </div>
      <div v-if="isLoading" class="loading-indicator">加载中...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { debounce } from '@mvmoo/us'


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

watch(items, () => {
  const map = {};
  items.value.forEach((item, index) => {
    map[props.getItemId(item)] = index;
  });
  itemIndexMap.value = map;
});

// 动态获取 item-info 的高度
const itemInfoHeights = ref([]); // 存储每个 item-info 高度的数组
const imgRatiosRef = ref({});    // 存储图片比例

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
    items.value = items.value.concat(list);
    nextCursor.value = res?.next_cursor || null;

    // 重新计算每个项目的位置
    calculateItemPositions();
  } catch (error) {
    console.error('数据加载失败:', error);
  } finally {
    isLoading.value = false;  // 无论成功或失败，设置加载状态为 false
  }
};

// 滚动事件处理，加载更多数据
const handleScroll = () => {
  const containerEl = container.value;
  scrollTop.value = containerEl.scrollTop;
  viewportHeight.value = containerEl.clientHeight;
  const scrollPosition = scrollTop.value + viewportHeight.value;
  const containerHeightVal = containerEl.scrollHeight;

  if (scrollPosition >= containerHeightVal - 100 && !isLoading.value) {
    fetchItems();
  }
  updateVisibleItems();
};

// 计算每个项目的位置（top/left），根据列数进行布局
const itemWidth = ref(0);

const updateColumnCount = () => {
  const width = containerWidth.value;
  const breakpoints = Object.entries(props.columnCount)
    .map(([w, cols]) => ({ width: +w, cols }))
    .sort((a, b) => b.width - a.width);
  let cols = 2;
  console.log('当前容器宽度:', width, '列数配置:', breakpoints);
  for (const bp of breakpoints) {
    if (width >= bp.width) {
      console.log(`使用列数配置: ${bp.cols} 列, 宽度 >= ${bp.width}`);
      cols = bp.cols;
      break;
    }
  }
  currentColumnCount.value = cols;
  itemWidth.value =
    (containerWidth.value - (cols - 1) * props.gap) / cols;
};

const updateVisibleItems = () => {
  visibleItems.value = itemPositions.value.filter(i =>
    i.top + i.height >= scrollTop.value - VIEWPORT_BUFFER &&
    i.top <= scrollTop.value + viewportHeight.value + VIEWPORT_BUFFER
  );
};

const calculateItemPositions = () => {
  if (isLayoutUpdating.value) return; // 防止死循环
  isLayoutUpdating.value = true;

  updateColumnCount(); // TODO 如果这里能加个防抖就更好了

  const columnHeights = Array(currentColumnCount.value).fill(0);

  itemPositions.value = items.value.map((item, index) => {
    const ratio = imgRatiosRef.value[item._id] || 1.5;
    const imgHeight = itemWidth.value * ratio;
    const extraHeight = itemInfoHeights.value[index] || 0;
    const height = imgHeight + extraHeight;

    const columnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    const left = columnIndex * (itemWidth.value + props.gap);
    const top = columnHeights[columnIndex];
    columnHeights[columnIndex] += height + props.gap;

    return { ...item, __index: index, left, top, height };
  });

  containerHeight.value = Math.max(...columnHeights) - props.gap;
  if (containerHeight.value < 0) containerHeight.value = 0;

  nextTick(() => {
    container.value.style.height =
      containerHeight.value > 0 ? `${containerHeight.value}px` : '100%';
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

// 计算图片的比例
const onImageLoad = (id, e) => {
  const { naturalWidth, naturalHeight } = e.target;
  if (naturalWidth === 0) return;
  const ratio = naturalHeight / naturalWidth;
  imgRatiosRef.value[id] = ratio;
  calculateItemPositions();
};

const insertItemToTop = async (newItem) => {
  const id = props.getItemId(newItem);
  newItem.originalWidth = newItem.width || 300;
  newItem.originalHeight = newItem.height || 200;
  delete imgRatiosRef.value[id];
  items.value.unshift(newItem);
  itemInfoHeights.value.unshift(0);
  await nextTick();
  calculateItemPositions();
  container.value?.scrollTo({ top: 0, behavior: 'smooth' });
};

const insertItemsToTop = async (newItems = []) => {
  newItems.forEach(item => {
    item.originalWidth = item.width || 300;
    item.originalHeight = item.height || 200;
    delete imgRatiosRef.value[props.getItemId(item)];
  });
  items.value.unshift(...newItems);
  itemInfoHeights.value.unshift(...new Array(newItems.length).fill(0));
  await nextTick();
  calculateItemPositions();
  container.value?.scrollTo({ top: 0, behavior: 'smooth' });
};

const updateItem = async (id, data = {}) => {
  const index = itemIndexMap.value[id];
  if (index === undefined) return;
  items.value[index] = { ...items.value[index], ...data };
  await nextTick();
  calculateItemPositions();
};

const updateItems = async (updates = []) => {
  updates.forEach(({ id, data }) => {
    const index = itemIndexMap.value[id];
    if (index !== undefined) {
      items.value[index] = { ...items.value[index], ...data };
    }
  });
  await nextTick();
  calculateItemPositions();
};

const removeItem = (id) => {
  const idx = itemIndexMap.value[id];
  if (idx === undefined) return;
  items.value.splice(idx, 1);
  itemInfoHeights.value.splice(idx, 1);
  delete imgRatiosRef.value[id];
  calculateItemPositions();
};

defineExpose({
  insertItemToTop,
  insertItemsToTop,
  updateItem,
  updateItems,
  removeItem,
});

// 组件挂载时获取数据
onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => {
    containerWidth.value = entry.contentRect.width;
    calculateItemPositions();
  });
  if (container.value) {
    resizeObserver.observe(container.value);
    containerWidth.value = container.value.clientWidth;
  }
  fetchItems();
  updateVisibleItems();
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

.waterfall-inner {
  position: relative;
  width: 100%;
}

.waterfall-item {
  position: absolute;
  width: 100%;
  will-change: transform;
}

.waterfall-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  border-radius: 16px;
  border: 1px solid var(--divider-color);
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
</style>
