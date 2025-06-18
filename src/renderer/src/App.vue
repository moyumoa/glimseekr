<template>
	<router-view />
</template>

<script setup>
import { onMounted } from 'vue'

/**
 * 批量设置 CSS 变量
 * @param {Object} vars - 变量名和对应值的对象（不需要加 -- 前缀）
 */
function setCssVars (vars = {}) {
	const root = document.documentElement
	Object.entries(vars).forEach(([key, value]) => {
		root.style.setProperty(`--${key}`, value)
	})
}

onMounted(() => {
	const platform = window.myElectron?.platform
	const isWeb = !['win32', 'linux', 'darwin'].includes(platform)

	if (isWeb) {
		setCssVars({
			'header-height': '0px',
		})
	} else {
		setCssVars({
			'header-height': '40px',
		})
	}
})

</script>
<style lang="scss" scoped></style>
