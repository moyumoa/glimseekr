<template lang="pug">
	navigationbar
	.content
		.title {{title}}
		el-button(type="primary") 11231
</template>

<script>
export default {
	data () {
		return {
			title: 'Hello'
		}
	},
	onLoad () {
		const color = getComputedStyle(document.documentElement).getPropertyValue('--bg-color')
	},
	methods: {
		navito () {
			uni.navigateTo({
				url: '/pages/about/index'
			})
		}
	},

}
</script>

<style>
.content {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.logo {
	height: 200rpx;
	width: 200rpx;
	margin-top: 200rpx;
	margin-left: auto;
	margin-right: auto;
	margin-bottom: 50rpx;
	background: var(--bg-color);
}

.text-area {
	display: flex;
	justify-content: center;
}

.title {
	font-size: 36rpx;
}
</style>
