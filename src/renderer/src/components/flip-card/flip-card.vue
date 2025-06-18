<template>
  <div
    class="cardContainer"
    :class="{ flipped: isFlipped }"
    :style="{ height: lockHeightOnFlip ? '100%' : containerHeight + 'px' }"
  >
    <div class="cardFace cardFront" ref="frontRef">
      <slot name="front" :flip="flipToBack" />
    </div>
    <div
      class="cardFace cardBack"
      ref="backRef"
      :class="{ fullHeight: lockHeightOnFlip }"
    >
      <template v-if="showBack">
        <div class="backHeader">
          <div class="backButton" @click="handleBack">
            <i class="backButton_icon">
              <i-svg name="ah5taocan" size="14" />
            </i>
            <span class="backButton_text">{{ backButtonText }}</span>
          </div>
          <div class="backTitle">{{ backTitle }}</div>
          <div class="backOper" v-if="extra">保存</div>
        </div>
        <div class="backMain">
          <slot name="back" :flip="flipToFront" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import ResizeObserver from 'resize-observer-polyfill'

const props = defineProps({
  backTitle: String,
  extra: { type: Boolean, default: false },
  showBack: { type: Boolean, default: true },
  backButtonText: { type: String, default: '返回' },
  onBack: Function,
  lockHeightOnFlip: { type: Boolean, default: false }
})

const isFlipped = ref(false)
const containerHeight = ref(0)
const frontRef = ref(null)
const backRef = ref(null)
let observer = null

function updateHeight() {
  const el = isFlipped.value ? backRef.value : frontRef.value
  if (el) {
    containerHeight.value = el.offsetHeight
  }
}

function observeResize() {
  if (props.lockHeightOnFlip) return
  const el = isFlipped.value ? backRef.value : frontRef.value
  if (!el) return
  observer = new ResizeObserver(() => updateHeight())
  observer.observe(el)
  updateHeight()
}

if (!props.lockHeightOnFlip) {
  watch(isFlipped, () => {
    observer?.disconnect()
    nextTick(() => {
      observeResize()
    })
  })
}

onMounted(() => {
  if (!props.lockHeightOnFlip) {
    observeResize()
  } else {
    updateHeight()
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

const flipToFront = () => (isFlipped.value = false)
const flipToBack = () => (isFlipped.value = true)
const toggle = () => (isFlipped.value = !isFlipped.value)

function handleBack() {
  props.onBack?.()
  flipToFront()
}

defineExpose({ flipToFront, flipToBack, toggle })
</script>

<style scoped>
.cardContainer {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.cardFace {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.cardFront {
  z-index: 2;
  opacity: 1;
  transform: translateX(0);
}
.cardBack {
  z-index: 1;
  opacity: 0;
  transform: translateX(30px);
  background-color: var(--card-color);
  border-radius: 12px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
}
.fullHeight {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.flipped .cardFront {
  opacity: 0;
  transform: translateX(-30px);
  z-index: 1;
}
.flipped .cardBack {
  opacity: 1;
  transform: translateX(0);
  z-index: 2;
}
.backHeader {
  height: 40px;
  padding: 0 12px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.035);
  display: flex;
  align-items: center;
}
.backButton {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 15px;
  color: var(--primary-color);
}
.backButton:hover {
  opacity: 0.72;
}
.backButton_icon {
  line-height: 0;
  transform: rotate(180deg);
  margin-right: 5px;
}
.backTitle {
  flex: 1;
  font-size: 16px;
  margin: 0 24px;
  color: var(--text-primary);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.backOper {
  color: var(--primary-color);
  font-size: 15px;
  cursor: pointer;
}
.backOper:hover {
  opacity: 0.72;
}
.backMain {
  padding: 0 12px;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  position: relative;
}
</style>
