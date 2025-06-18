<template>
  <virtual-waterfall-cursor
    :fetchPage="$api.folderPic.list"
    :getItemId="(item) => item._id"
    :getImageSrc="(item) => item.thumb_url"
    :params="{ folder_id: '5377d5c0684bd99202b194e63697e9a3' }"
    :columnCount="{ 1920: 5, 1080: 4, 960: 3, 650: 2 }"
    :gap="16"
  >
    <template #item-info="{ item }">
      <div>
        <div>{{ item.name }}</div>
        <div>{{ item.size }}</div>
        <div>测试内容超长会如何测试内容超长会如何测试内容超长会如何测试内容超长会如何测试内容超长会如何测试内容超长会如何</div>
      </div>
    </template>
  </virtual-waterfall-cursor>
</template>

<script setup>
// 示例中导入API或其他所需的模块
import { $api } from '@/config/api.js'
</script>
