<template>
  <section ref="containerRef" class="virtual-waterfall-container" :style="containerStyle" @scroll.passive="onScroll">
    <header>
      <slot name="header" />
    </header>
    <div class="virtual-waterfall-inner" :style="innerStyle">
      <!-- <div v-for="item in visibleItems" :key="item._id" :ref="el => measureItem(item._id, el)"
        class="virtual-waterfall-item" :style="{
          position: 'absolute',
          top: item.top + 'px',
          left: item.left + 'px',
          width: columnWidth + 'px'
        }">
        <slot :item="item" :columnWidth="columnWidth" :remove="() => removeItem(item._id)" />
      </div> -->

      <component :is="itemWrapper" v-for="item in visibleItems" :key="item._id" :ref="el => measureItem(item._id, el)"
        :style="{
          position: 'absolute',
          top: item.top + 'px',
          left: item.left + 'px',
          width: columnWidth + 'px'
        }">
        <slot :item="item" :columnWidth="columnWidth" :remove="() => removeItem(item._id)" />
      </component>

    </div>

    <div v-if="isLoading && isInitialLoading" class="center-loading">
      <el-icon>
        <Loading />
      </el-icon>
    </div>

    <el-empty v-if="!isLoading && allItems.length === 0 && !isInitialLoading" style="margin-top: 20%" />

    <div v-if="canManuallyLoadMore" class="center-load-more">
      <el-button @click="loadMore">加载更多</el-button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElButton, ElEmpty, ElIcon } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  itemWrapper: { type: [String, Object], default: 'div' },
  fetchPage: Function,
  getItemId: Function,
  pageSize: { type: Number, default: 20 },
  columnCount: { type: [Number, Object], default: 4 },
  defaultParams: { type: Object, default: () => ({}) },
  style: { type: Object, default: () => ({}) }
})

const GUTTER = 16
const VIEWPORT_BUFFER = 1000
const VERTICAL_GAP = 16
const HORIZONTAL_GAP = 16
const MAX_REMOVED_ITEMS = 2000

const containerRef = ref(null)
const containerWidth = ref(0)
const scrollTop = ref(0)
const viewportHeight = ref(window.innerHeight)
const heightMap = ref({})
const items = ref([])
const removedIds = ref(new Set())
const isLoading = ref(false)
const isInitialLoading = ref(true)
const hasMore = ref(true)
const nextCursor = ref(null)

const currentColumnCount = ref(
  typeof props.columnCount === 'number' ? props.columnCount : 4
)

const updateColumnCountByBreakpoint = () => {
  if (typeof props.columnCount === 'number') {
    currentColumnCount.value = props.columnCount
  } else {
    const width = window.innerWidth
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
  return (containerWidth.value - (currentColumnCount.value - 1) * HORIZONTAL_GAP) / currentColumnCount.value
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

const getRandomPlaceholder = (width = 600) => {
  const minHeight = 450
  const maxHeight = 800
  const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight
  const text = Math.random().toString(36).substring(2, 8)
  const bgArr = ['%23fb923c', '%23facc15', '%23a3e635', '%23a5f3fc', '%23c084fc']
  const bgIndex = Math.floor(Math.random() * bgArr.length)
  const bgColor = bgArr[bgIndex] || '%23facc15'
  return {
    width,
    height,
    url: `https://devtool.tech/api/placeholder/${width}/${height}?bgColor=${bgColor}`
  }
}

const loadMore = async () => {
  if (!hasMore.value || isLoading.value) return
  isLoading.value = true
  try {
    const lastItem = nextCursor.value || items.value.at(-1)
    const res = await props.fetchPage({
      limit: props.pageSize,
      ...props.defaultParams,
      ...(lastItem && {
        clt: lastItem.create_time,
        cli: lastItem._id
      })
    })

    const list = (res?.data?.rows || res?.data?.list || res?.data || []).map(item => {
      if (!item.originalWidth || !item.originalHeight) {
        const placeholder = getRandomPlaceholder()
        item.originalWidth = placeholder.width
        item.originalHeight = placeholder.height
        item.cover = placeholder.url
      }
      return item
    })

    if (list.length < props.pageSize) hasMore.value = false
    items.value.push(...list)
    nextCursor.value = res?.next_cursor || null
  } finally {
    isLoading.value = false
    isInitialLoading.value = false
  }
}

const allItems = computed(() => {
  return items.value.filter(i => !removedIds.value.has(props.getItemId(i)))
})


const positionedItems = computed(() => {
  const cols = Array(currentColumnCount.value).fill(0)
  return allItems.value.map(item => {
    const id = props.getItemId(item)
    const height = heightMap.value[id] || item.originalHeight || 0
    const col = cols.indexOf(Math.min(...cols))
    const top = cols[col]
    const left = col * (columnWidth.value + HORIZONTAL_GAP)
    cols[col] += height + VERTICAL_GAP
    return { ...item, _id: id, top, left, height }
  })
})

const containerHeight = computed(() => {
  return Math.max(...positionedItems.value.map(i => i.top + i.height), 0)
})

const visibleItems = computed(() => {
  return positionedItems.value.filter(i =>
    i.top + i.height >= scrollTop.value - VIEWPORT_BUFFER &&
    i.top <= scrollTop.value + viewportHeight.value + VIEWPORT_BUFFER
  )
})

const canManuallyLoadMore = computed(() => {
  return hasMore.value && !isLoading.value && containerHeight.value < viewportHeight.value
})

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
    if (heightMap.value[id] !== h) {
      heightMap.value[id] = h
    }
  })
}

const containerStyle = computed(() => ({
  height: '100%',
  overflowY: 'auto',
  boxSizing: 'border-box',
  ...props.style
}))

const innerStyle = computed(() => ({
  position: 'relative',
  width: containerWidth.value + 'px',
  maxWidth: currentColumnCount.value * (columnWidth.value + GUTTER) - GUTTER + 'px',
  margin: '0 auto',
  height: containerHeight.value + 'px'
}))

onMounted(() => {
  const resizeObserver = new ResizeObserver(([entry]) => {
    containerWidth.value = entry.contentRect.width
    updateColumnCountByBreakpoint()
  })
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
  updateColumnCountByBreakpoint()
  loadMore()
  window.addEventListener('resize', () => {
    updateColumnCountByBreakpoint()
    onScroll()
  })

  onUnmounted(() => {
    resizeObserver.disconnect()
    window.removeEventListener('resize', onScroll)
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
}

::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari, and Opera */
}

.virtual-waterfall-item {
  border-radius: var(--distance);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.center-loading,
.center-load-more {
  text-align: center;
  padding: 24px;
}
</style>