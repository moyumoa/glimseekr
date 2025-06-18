<template>
  <div class="progressive-image" :style="{ aspectRatio: ratio }">
    <img
      :src="thumbUrl"
      class="preview low"
      alt=""
    />
    <img
      :src="fullUrl"
      class="preview full"
      alt=""
      @load="loaded = true"
      :class="{ show: loaded }"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  url: String,              // 原图地址
  width: Number,            // 原图宽度
  height: Number,           // 原图高度
  thumbWidth: { type: Number, default: 300 }, // 缩略图宽度
  quality: { type: Number, default: 80 }
})

const loaded = ref(false)

const ratio = computed(() => {
  return props.width && props.height
    ? `${props.width} / ${props.height}`
    : '4 / 3'
})

// ${Math.round(props.thumbWidth)}
const thumbUrl = computed(() =>
  // `${props.url}?imageView2/2/w/600/q/${props.quality}/interlace/1/format/webp`
  `${props.url}-thumb400.webp`
)

const fullUrl = computed(() => props.url)
</script>

<style scoped>
.progressive-image {
  background-color: var(--card-color);
  position: relative;
  width: 100%;
  overflow: hidden;
}

.preview {
  width: 100%;
  height: auto;
  position: absolute;
  top: 0;
  left: 0;
  transition: opacity 0.5s ease;
  display: block;
}

.preview.low {
  filter: blur(5px);
  transform: scale(1.02);
  z-index: 1;
}

.preview.full {
  opacity: 0;
  z-index: 2;
}

.preview.full.show {
  opacity: 1;
}
</style>
