<template>
  <section ref="containerRef" class="virtual-waterfall-container" :style="containerStyle" @scroll.passive="onScroll">
    <header>
      <slot name="header" />
    </header>
    <div class="virtual-waterfall-inner" :style="innerStyle">
      <div v-for="item in visibleItems" :key="item._id" :ref="el => measureItemIfNeeded(item._id, el)"
        :data-id="props.getItemId(item)" :class="{ 'newly-inserted': item._justInserted }" :style="{
          position: 'absolute',
          top: item.top + 'px',
          left: item.left + 'px',
          width: columnWidth + 'px',
          aspectRatio: `${item.originalWidth || 1}/${item.originalHeight || 1}`,
        }">
        <slot :item="item" :columnWidth="columnWidth" :remove="() => removeItem(item._id)" />
      </div>
    </div>

    <div v-if="isLoading && isInitialLoading" class="center-loading">
      <el-icon>
        <Loading />
      </el-icon>
    </div>

    <el-empty v-if="!isLoading && allItems.length === 0 && !isInitialLoading" description=" "
      style="margin-top: 20%" />

    <div v-if="canManuallyLoadMore" class="center-load-more">
      <el-button @click="loadMore">加载更多</el-button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { debounce } from '@mvmoo/us'
import { ElButton, ElEmpty, ElIcon } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'


// === 参数定义 ===
const props = defineProps({
  itemWrapper: { type: [String, Object], default: 'div' },
  fetchPage: Function,
  getItemId: Function,
  pageSize: { type: Number, default: 20 },
  columnCount: { type: [Number, Object], default: 4 },
  defaultParams: { type: Object, default: () => ({}) },
  style: { type: Object, default: () => ({}) }
})

// === 样式控制参数 ===
const GUTTER = 16
const VIEWPORT_BUFFER = 1000
const VERTICAL_GAP = 16
const HORIZONTAL_GAP = 16
const MAX_REMOVED_ITEMS = 2000
const defaultWidth = 600
const defaultHeight = 450

// === 响应式状态 ===
const isInitialLoading = ref(true)
const containerRef = ref(null)
const rawContainerWidth = ref(0)
const debouncedContainerWidth = ref(0)
const scrollTop = ref(0)
const viewportHeight = ref(window.innerHeight)
const heightMap = ref({})
const items = ref([])
const itemIndexMap = ref({})
const removedIds = ref(new Set())
const isLoading = ref(false)
const hasMore = ref(true)
const nextCursor = ref(null)
const version = ref(0)

// === 容器样式计算 ===
const containerStyle = computed(() => Object.assign({
  height: '100%',
  overflowY: 'auto',
  boxSizing: 'border-box'
}, props.style))

const innerStyle = computed(() => Object.assign({
  position: 'relative',
  width: debouncedContainerWidth.value + 'px',
  maxWidth: currentColumnCount.value * (columnWidth.value + GUTTER) - GUTTER + 'px',
  margin: '0 auto',
  height: containerHeight.value + 'px'
}))

watch(items, () => {
  const map = {}
  items.value.forEach((item, index) => {
    map[props.getItemId(item)] = index
  })
  itemIndexMap.value = map
})

const reMeasureVisibleHeights = debounce(() => {
  nextTick(() => {
    const itemElements = containerRef.value?.querySelectorAll('[data-id]')
    let updated = false
    itemElements?.forEach(el => {
      const id = el.getAttribute('data-id')
      if (!id) return
      const item = positionedItems.value.find(i => i._id === id)
      if (!item) return
      if (item.top + item.height >= scrollTop.value - VIEWPORT_BUFFER &&
        item.top <= scrollTop.value + viewportHeight.value + VIEWPORT_BUFFER) {
        const h = el.offsetHeight
        if (heightMap.value[id] !== h) {
          heightMap.value[id] = h
          updated = true
        }
      }
    })
    if (updated) version.value++
  })
}, 300)

const currentColumnCount = ref(typeof props.columnCount === 'number' ? props.columnCount : 4)

const updateColumnCountByBreakpoint = () => {
  if (typeof props.columnCount === 'number') {
    currentColumnCount.value = props.columnCount
  } else {
    const width = debouncedContainerWidth.value
    const breakpoints = Object.entries(props.columnCount)
      .map(([w, cols]) => ({ width: +w, cols }))
      .sort((a, b) => b.width - a.width)
    for (const bp of breakpoints) {
      if (width <= bp.width) {
        currentColumnCount.value = bp.cols
      }
    }
  }
}

const columnWidth = computed(() => {
  return (debouncedContainerWidth.value - (currentColumnCount.value - 1) * HORIZONTAL_GAP) / currentColumnCount.value
})

const removeItem = (id) => {
  removedIds.value.add(id)
  if (removedIds.value.size > MAX_REMOVED_ITEMS) {
    items.value = items.value.filter(i => !removedIds.value.has(props.getItemId(i)))
    const newMap = {}
    for (const [k, v] of Object.entries(heightMap.value)) {
      if (!removedIds.value.has(k)) newMap[k] = v
    }
    heightMap.value = newMap
    removedIds.value.clear()
  }
}

const loadMore = async () => {
  if (!hasMore.value || isLoading.value) return
  isLoading.value = true
  try {
    const lastItem = nextCursor.value || items.value.at(-1)
    const req = Object.assign({}, { limit: props.pageSize }, props.defaultParams)
    if (lastItem) {
      req.clt = lastItem.create_time
      req.cli = lastItem._id
    }
    const res = await props.fetchPage(req)
    const dataList = res?.data?.rows || res?.data?.list || res?.data || []
    const list = dataList.map(item => {
      item.originalWidth = item.width || defaultWidth
      item.originalHeight = item.height || defaultHeight
      return item
    })
    if (list.length < props.pageSize) hasMore.value = false
    items.value = items.value.concat(list)
    nextCursor.value = res?.next_cursor || null
  } finally {
    isLoading.value = false
    isInitialLoading.value = false
  }
}

const allItems = computed(() => items.value.filter(i => !removedIds.value.has(props.getItemId(i))))

const positionedItems = computed(() => {
  version.value
  const cols = Array(currentColumnCount.value).fill(0)
  return allItems.value.map(item => {
    const id = props.getItemId(item)
    const height = heightMap.value[id] || item.originalHeight || 0
    const col = cols.indexOf(Math.min(...cols))
    const top = cols[col]
    const left = col * (columnWidth.value + HORIZONTAL_GAP)
    cols[col] += height + VERTICAL_GAP
    return Object.assign({}, item, { _id: id, top, left, height })
  })
})

const containerHeight = computed(() => positionedItems.value.reduce((max, i) => Math.max(max, i.top + i.height), 0))

const visibleItems = computed(() => positionedItems.value.filter(i =>
  i.top + i.height >= scrollTop.value - VIEWPORT_BUFFER &&
  i.top <= scrollTop.value + viewportHeight.value + VIEWPORT_BUFFER
))

const canManuallyLoadMore = computed(() => hasMore.value && !isLoading.value && containerHeight.value < viewportHeight.value)

const onScroll = () => {
  const el = containerRef.value
  if (!el) return
  scrollTop.value = el.scrollTop
  viewportHeight.value = el.clientHeight
  const lastItem = positionedItems.value.at(-1)
  if (hasMore.value && lastItem && lastItem.top < scrollTop.value + viewportHeight.value + VIEWPORT_BUFFER) {
    loadMore()
  }
}

const measureItem = (id, el) => {
  if (!el) return
  nextTick(() => {
    const h = el.offsetHeight
    if (h === 0) return
    if (heightMap.value[id] !== h) {
      heightMap.value[id] = h
      version.value++
    }
  })
}

const measureItemIfNeeded = (id, el) => {
  if (!el || heightMap.value[id]) return
  measureItem(id, el)
}

const insertItemToTop = async (newItem) => {
  const id = props.getItemId(newItem)
  newItem.originalWidth = newItem.width || defaultWidth
  newItem.originalHeight = newItem.height || defaultHeight
  newItem._justInserted = true
  delete heightMap.value[id]
  items.value.unshift(newItem)
  await nextTick()
  const el = containerRef.value?.querySelector(`[data-id="${id}"]`)
  if (el) {
    measureItem(id, el)
    el.classList.add('newly-inserted')
    setTimeout(() => el.classList.remove('newly-inserted'), 400)
  }
  containerRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const insertItemsToTop = async (newItems = []) => {
  newItems.forEach(item => {
    item.originalWidth = item.width || defaultWidth
    item.originalHeight = item.height || defaultHeight
    delete heightMap.value[props.getItemId(item)]
  })
  items.value.unshift(...newItems)
  await nextTick()
  reMeasureVisibleHeights()
  containerRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const updateItem = async (id, newData = {}, mayAffectHeight = false) => {
  const index = itemIndexMap.value[id]
  if (index === undefined) return
  items.value[index] = { ...items.value[index], ...newData }
  // 指定了可能影响高度的更新
  if (mayAffectHeight) {
    delete heightMap.value[id]
    await nextTick()
    const el = containerRef.value?.querySelector(`[data-id="${id}"]`)
    if (el) measureItem(id, el)
  }
}

const updateItems = async (updates = []) => {
  let dirty = false
  updates.forEach(({ id, data }) => {
    const index = itemIndexMap.value[id]
    if (index !== undefined) {
      items.value[index] = { ...items.value[index], ...data }
      delete heightMap.value[id]
      dirty = true
    }
  })
  if (dirty) {
    await nextTick()
    reMeasureVisibleHeights()
  }
}

defineExpose({
  insertItemToTop,
  insertItemsToTop,
  updateItem,
  updateItems,
  removeItem
})

onMounted(() => {
  const resizeObserver = new ResizeObserver(([entry]) => {
    rawContainerWidth.value = entry.contentRect.width
  })
  if (containerRef.value) resizeObserver.observe(containerRef.value)

  watch(rawContainerWidth, debounce((w) => {
    debouncedContainerWidth.value = w
    updateColumnCountByBreakpoint()
    reMeasureVisibleHeights()
    onScroll()
  }, 300))

  updateColumnCountByBreakpoint()
  loadMore()

  onUnmounted(() => {
    resizeObserver.disconnect()
  })
})
</script>

<style scoped>
.virtual-waterfall-container {
  height: 100%;
  position: relative;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 22px;
}

header {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 10;
}

.virtual-waterfall-inner {
  height: 100%;
  position: relative;
  transition: padding-top 0.2s ease;
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

::-webkit-scrollbar {
  display: none;
}

.center-loading,
.center-load-more {
  text-align: center;
  padding: 24px;
}
</style>
