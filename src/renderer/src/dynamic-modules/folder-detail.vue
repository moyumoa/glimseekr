<!-- folder-detail.vue -->
<template>
  <div class="detail">
    <h1>我是详情内容：{{ id }}</h1>
    <p>加载内容、图片、点赞等逻辑都写这里</p>
  </div>
</template>

<script setup>
const { id } = defineProps(['id'])
</script>
