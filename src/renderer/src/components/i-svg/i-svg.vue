<script setup>
const { name } = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [Number, String],
    default: 24
  }
});

const icons = import.meta.glob('/src/assets/svg/*.svg', { eager: true });

const iconComponent = icons[`/src/assets/svg/${name}.svg`]?.default;
</script>

<template>
  <component :is="iconComponent" :style="{ width: size + 'px', height: size + 'px' }" />
</template>
