<template lang="pug">
section
	.section-header
		Transition(name="slide-up")
			.headoper(v-if="!upLoading")
				.operselect
					el-checkbox(v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAllChange" :label="checkLable")
				.operbox
					slot/
				.operselect
					el-button(link :type=" selectedCount ? 'danger' : 'info'" :disabled="!selectedCount" @click="deleteSelect") 
						i.iconfont(class="icon-shanchu2" style="font-size: 16px;margin-right: 5px;")
						|删除已选
			.uploading(v-else)
				i.iconfont(class="icon-jiazai uploading-icon")
				.uploading-text 正在上传中 ({{$up.successCount.value}}/{{$up.total.value}})
				.uploading-text-desc 请勿关闭窗口
	.listview(ref="hostingRef")
		.listview-header
		Waterfall(
			:infinite-scroll-disabled="false"
			:list="listRows" 
			:key-field="'_id'"
			:has-around-gutter="true"
			:breakpoints="breakpoints"
			:animation-duration="500"
			:background-color="'transparent'"
			:lazyload="true"
			:delay="300"
			:pos-duration="300"
			:loadProps="loadProps"
		)
			template(#default="{ item, thumb_url, index }")
				.card
					LazyImg.card-lazyimg(:url="item.thumb_url" :alt="item.name" :key="index" @click="openImg(item)")
					.pic-info(@click="checkSelected(item)")
						span.pic-info-title {{item.name}}
						.pic-info-box
							span.pic-info-box-size {{ formatBytes(item.size) }}
							el-checkbox(:model-value="!!checkedPics[item._id]"  label="" @change="checkSelected(item)")
		.loading
			.loading-text(v-if="disabled && !pagingLoading")
				span.loading-text-1 {{ '没有更多数据了' }}
			.loading-text(v-else)
				el-icon.loading-icon
					Loading
				span.loading-text-1 加载中...
				//- span.loading-text-1 {{ pagingLoading ? '加载中...' : '' }}
</template>
<script setup>
import { LazyImg, Waterfall } from 'vue-waterfall-plugin-next'
import 'vue-waterfall-plugin-next/dist/style.css'
import loadingicon from '@/assets/loading.png'
import erroricon from '@/assets/error.png'
import { Loading } from '@element-plus/icons-vue'
import breakpoints from './breakpoints'
const loadProps = { loading: loadingicon, error: erroricon }

const props = defineProps({
	params: { type: Object, default: () => ({}) },
	apiName: { type: String, default: '' }
})

import { uploader } from '@/hooks'
const $up = uploader()
const upLoading = computed(() => $up.loading.value)

/* 分页Hook */
const hostingRef = ref(null)
import { usePaging } from '@/hooks'
const { list: listRows, onInit, loading: pagingLoading, disabled, tryFill } = usePaging(hostingRef, { apiName: props.apiName })

const formatBytes = byte => $us.formatBytes(byte)

const openImg = item => window.open(`${item.original_url}#internal-preview`, '_blank', 'noopener,noreferrer')

const checkAll = ref(false)
const isIndeterminate = ref(false)
const checkedPics = ref({})

// 已选长度
const selectedCount = computed(() => Object.keys(checkedPics.value).length)

// 全选/已选x张文案
const checkLable = computed(() => selectedCount.value ? `已选 ${selectedCount.value} 张` : '全选')

// 全选
const handleCheckAllChange = (val) => {
	checkedPics.value = val ? listRows.value.reduce((acc, item) => {
		acc[item._id] = item
		return acc
	}, {}) : {}
	isIndeterminate.value = false
}

// 选中图片
const checkSelected = item => {
	const id = item._id;
	if (checkedPics.value[id]) {
		delete checkedPics.value[id];
	} else {
		checkedPics.value[id] = item;
	}

	const checkedCount = Object.keys(checkedPics.value).length;
	const total = listRows.value.length;

	checkAll.value = checkedCount === total;
	isIndeterminate.value = checkedCount > 0 && checkedCount < total;
}

const deleteSelect = () => {
}

onMounted(() => {
	onInit({ folder_id: props.params.folderId, limit: 30 })
})

</script>

<style lang="scss" scoped>
.section-header {
	padding: 0 16px;
	box-sizing: border-box;
	height: var(--header-oper-bar-height);
	line-height: var(--header-oper-bar-height);
}

.headoper {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	box-sizing: border-box;

	.operselect {
		flex-shrink: 0;
		width: 120px;

		&:last-child {
			text-align: right;
		}
	}

	.operbox {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}
}

.uploading {
	display: flex;
	align-items: center;

	&-icon {
		font-size: 16px;
		margin-right: 8px;
		animation: loadingrotate 0.3s infinite linear;
	}

	&-text {
		color: var(--text-secondary);
		font-size: 14px;
		background: linear-gradient(-90deg,
				rgba(255, 255, 255, 0.2) 20%,
				rgba(255, 255, 255, 0.6) 50%,
				rgba(255, 255, 255, 0.2) 80%);
		background-size: 200% 100%;
		background-position: 40% center;
		will-change: background-position;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: shimmer 3s infinite linear;

		@keyframes shimmer {
			0% {
				background-position: 200% center;
			}

			50% {
				background-position: 0% center;
			}

			100% {
				background-position: -200% center;
			}
		}

		&-desc {
			margin-left: 24px;
			color: var(--warning-color);
			opacity: 0.4;
			font-size: 12px;
		}
	}
}

.slide-up-enter-active,
.slide-up-leave-active {
	transition: all 0.25s ease-out;
}

.slide-up-enter-from {
	opacity: 0;
	transform: translateY(30px);
}

.slide-up-leave-to {
	opacity: 0;
	transform: translateY(-30px);
}

.waterfall-list {
	transform: translateY(-6px);
}

.listview {
	height: calc(100vh - var(--bottom-height) - var(--header-height) - var(--header-oper-bar-height));
	// padding-top: 50px;
	box-sizing: border-box;
	overflow-y: auto;
}

.card {
	border-radius: 6px;
	overflow: hidden;
	background-color: var(--card-color);

	&-lazyimg {
		overflow: hidden;
		cursor: pointer;
	}
}

.pic-info {
	padding: 8px 12px;
	display: flex;
	flex-direction: column;
	cursor: pointer;

	&-title {
		width: 100%;
		color: var(--text-regular);
		font-size: 14px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&-box {
		display: flex;
		justify-content: space-between;
		align-items: center;

		&-size {
			color: var(--text-secondary);
			font-size: 12px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
}

.loading {
	height: 80px;
	display: flex;
	justify-content: center;
	align-items: center;

	&-text {
		font-size: 14px;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
	}

	&-icon {
		font-size: 18px;
		color: var(--text-secondary);
		margin-right: 5px;
		animation: loadingrotate 2s infinite linear;
	}

}

@keyframes loadingrotate {
	0% {
		transform: rotate(0deg);
	}

	100% {
		transform: rotate(360deg);
	}
}
</style>

<style>
/* 旋转动画 */
@keyframes lazy_img_loading_rotate {
	0% {
		transform: rotate(0deg);
	}

	100% {
		transform: rotate(360deg);
	}
}

.lazy__img[lazy=loading] {
	animation: lazy_img_loading_rotate 1s linear infinite;
}
</style>