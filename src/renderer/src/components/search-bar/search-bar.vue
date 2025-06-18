<template lang="pug">
.searchbar
  el-input.searchbar-ipt(v-model="keyword" :prefix-icon="Search" clearable  placeholder="搜索")
  .searchbar-add(@click="add")
    .iconfont(class="icon-tianjia3 searchbar-add-icon")
</template>

<script setup>
import { Search } from '@element-plus/icons-vue'
const keyword = ref('')

const emit = defineEmits(['onSearch', 'onAdd'])
const add = () => {
  emit('onAdd')
}
</script>

<style lang="scss" scoped>
.searchbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  // background-color: var(--card-color);
  border-bottom: 1px solid var(--divider-color);

  &-ipt {
    flex: 1;
    // background-color: var(--panel-color);
    background-color: var(--card-color);

    border-radius: 5px;
    height: 36px;
    margin-right: 12px;
  }

  &-add {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &-icon {
      color: var(--text-regular);
      font-size: 22px;

      &:hover {
        color: var(--text-primary);
      }
    }
  }
}
</style>
