<template>
  <div ref="container" class="waterfall-container" :style="containerStyle" @scroll="handleScroll">
    <div v-for="(item, index) in visibleItems" :key="item[props.getItemId(item)]" :style="getItemStyle(item, index)" class="waterfall-item">
      <img v-if="item._id" :src="props.getImageSrc(item)" alt="item.title" class="waterfall-image" @load="onImageLoad(item._id, $event)" />
      <div v-else class="placeholder"></div>

      <!-- 插槽，允许外部传入 item-info 内容 -->
      <div class="item-info" :data-index="index" :ref="el => setItemInfoHeight(el, index)">
        <slot name="item-info" :item="item" :index="index"></slot>
      </div>
    </div>
    <div v-if="isLoading" class="loading-indicator">加载中...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';

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

// 动态获取 item-info 的高度
const itemInfoHeights = ref([]); // 存储每个 item-info 高度的数组
const imgRatiosRef = ref({});    // 存储图片比例

// 布局更新标志位
const isLayoutUpdating = ref(false);
const lastHeights = ref([]); // 缓存上一次的 item-info 高度


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
  const scrollPosition = containerEl.scrollTop + containerEl.clientHeight;
  const containerHeightVal = containerEl.scrollHeight;

  if (scrollPosition >= containerHeightVal - 100 && !isLoading.value) {
    fetchItems();
  }
};

// 计算每个项目的位置（top/left），根据列数进行布局
const calculateItemPositions = () => {
  if (isLayoutUpdating.value) return; // 防止死循环
  isLayoutUpdating.value = true;

  // 动态根据当前屏幕宽度选择列数
  const screenWidth = window.innerWidth;  // 获取屏幕宽度
  const columnCount = Object.keys(props.columnCount).find(
    key => screenWidth >= key
  ) || 3;  // 默认列数为 3
  const columnWidth = container.value.offsetWidth / columnCount;  // 列宽度

  const columnHeights = Array(columnCount).fill(0);  // 跟踪每一列的高度

  visibleItems.value = items.value.map((item, index) => {
    const aspectRatio = imgRatiosRef.value[item._id] || 1.5;
    const imgHeight = columnWidth * aspectRatio;
    const extraHeight = itemInfoHeights.value[index] || 0;
    const height = imgHeight + extraHeight + props.gap; // 图片高度 + item-info 高度 + 间距

    const columnIndex = index % columnCount;  // 根据索引分配列
    const left = columnIndex * (columnWidth + props.gap);
    const top = columnHeights[columnIndex];

    // 更新列的高度，为下一个项目分配空间
    columnHeights[columnIndex] += height;

    return {
      ...item,
      left,
      top,
      height,  // 设置每个项目的高度
    };
  });

  // 计算最大列高度，并更新容器高度
  containerHeight.value = Math.max(...columnHeights);  // 根据列的最大高度来设置容器高度

  // 在 DOM 更新后确保容器高度正确更新
  nextTick(() => {
    container.value.style.height = `${containerHeight.value}px`;
  });

  isLayoutUpdating.value = false;
};

// 计算容器样式
const containerStyle = computed(() => ({
  position: 'relative',
  width: '100%',
  overflowY: 'auto',
  height: `${containerHeight.value}px`,  // 使用动态计算的容器高度
}));

// 获取每个项目的样式（定位和宽高）
const getItemStyle = (item, index) => ({
  position: 'absolute',
  top: `${item.top}px`,
  left: `${item.left}px`,
  width: `${container.value.offsetWidth / Object.keys(props.columnCount).length}px`,
  height: `${item.height}px`,  // 使用动态计算的高度
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

// 组件挂载时获取数据
onMounted(() => {
  fetchItems();
});
</script>

<style scoped>
.waterfall-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.waterfall-item {
  position: absolute;
  width: 100%;
}

.waterfall-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.item-info {
  padding: 10px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-indicator {
  text-align: center;
  padding: 20px;
}
</style>
