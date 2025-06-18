<template>
  <figure class="progressive-image">
    <img :src="thumbUrl" class="preview low" alt="" />
    <img :src="fullUrl" class="preview full" alt="" @load="loaded = true" :class="{ show: loaded }" />
  </figure>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  url: String,              // 原图地址
})

const loaded = ref(false)

const thumbUrl = computed(() =>
  `${props.url}-thumb400.webp`
)

const fullUrl = computed(() => props.url)
</script>

<style scoped>
.progressive-image {
  width: 100%;
  opacity: 0.1;
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
