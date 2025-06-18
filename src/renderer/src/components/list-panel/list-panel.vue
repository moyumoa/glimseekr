<template lang="pug">
  .listviewpage
    .searchbar
      el-input.searchbar-ipt(v-model="keyword" :prefix-icon="Search" clearable  placeholder="搜索")
      .searchbar-add
        i.iconfont(class="icon-dibucaozuolantubiao- searchbar-add-icon")
    slot
</template>
<script setup>
import { Search } from '@element-plus/icons-vue'
const keyword = ref('')
</script>

<style lang="scss" scoped>
.listviewpage {
  width: var(--oper-panel-width);
  height: calc(100vh - var(--bottom-height));
  background-color: var(--panel-color);

  display: flex;
  flex-direction: column;

  .searchbar {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    background-color: var(--card-color);
    border-bottom: 1px solid var(--divider-color);

    :deep(.el-input__wrapper) {
      border: none;
      box-shadow: none;
    }

    &-ipt {
      flex: 1;
      background-color: var(--panel-color);
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

}
</style>
