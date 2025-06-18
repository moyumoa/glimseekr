<template lang="pug">
	.listview(ref="scrollRef")
		.listview-header
		Waterfall(
			:infinite-scroll-disabled="false"
			:list="lists" 
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
			template(#default="{ item, url, index }")
				.card
					LazyImg.card-lazyimg(:url="item.url" :alt="item.name" :key="index" @click="openImg(item)")
					.pic-info(@click="checkSelected(item)")
						span.pic-info-title {{item.name}}
						.pic-info-box
							span.pic-info-box-size {{ formatBytes(item.size) }}
							el-checkbox(v-model="item.selected" label="" @click="checkSelected(item)")
		.loading
			.loading-text(v-if="nomore")
				span.loading-text-1 {{ '没有更多数据了' }}
			.loading-text(v-else)
				el-icon.loading-icon
					Loading
				span.loading-text-1 {{ loading ? '加载中...' : '' }}
</template>
<script setup>
import { LazyImg, Waterfall } from 'vue-waterfall-plugin-next'
import 'vue-waterfall-plugin-next/dist/style.css'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { Loading } from '@element-plus/icons-vue'
import loadingicon from '@/assets/loading.png'
import erroricon from '@/assets/error.png'
const loadProps = {
	loading: loadingicon,
	error: erroricon
}
const breakpoints = {
	1920: {
		//当屏幕宽度小于等于1920
		rowPerView: 5
	},
	1200: {
		//当屏幕宽度小于等于1200
		rowPerView: 4
	},
	800: {
		//当屏幕宽度小于等于800
		rowPerView: 3
	},
	500: {
		//当屏幕宽度小于等于500
		rowPerView: 2
	}
}
const lists = ref([
	{
		"_id": "67f697b4816a3f73443b5f6c",
		"selection_code_id": "67f69773ce5ec9aecac1e363",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250409155211/compressed/20250409235210/IMG_5686.JPG",
		"original_image": "qiniu://public/20250409155210/original/20250409235210/IMG_5686.JPG",
		"name": "IMG_5686.JPG",
		"photo_type": "image/jpeg",
		"size": 250292,
		"creation_time": 1744213940631,
		"is_selected": 0,
		"download_count": 3,
		"download_time": 1744542095460
	},
	{
		"_id": "67f697b4816a3f73443b5f69",
		"selection_code_id": "67f69773ce5ec9aecac1e363",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250409155208/compressed/20250409235208/IMG_5683.JPG",
		"original_image": "qiniu://public/20250409155207/original/20250409235206/IMG_5683.JPG",
		"name": "IMG_5683.JPG",
		"photo_type": "image/jpeg",
		"size": 336940,
		"creation_time": 1744213940631,
		"is_selected": 0,
		"download_count": 2,
		"download_time": 1744540481424
	},
	{
		"_id": "67f697b4816a3f73443b5f6b",
		"selection_code_id": "67f69773ce5ec9aecac1e363",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250409155210/compressed/20250409235210/IMG_5685.JPG",
		"original_image": "qiniu://public/20250409155209/original/20250409235209/IMG_5685.JPG",
		"p'na'me": "IMG_5685.JPG",
		"photo_type": "image/jpeg",
		"size": 308142,
		"creation_time": 1744213940631,
		"is_selected": 0,
		"download_count": 2,
		"download_time": 1744542095466
	},
	{
		"_id": "67f697b4816a3f73443b5f6d",
		"selection_code_id": "67f69773ce5ec9aecac1e363",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250409155211/compressed/20250409235211/IMG_5687.JPG",
		"original_image": "qiniu://public/20250409155211/original/20250409235211/IMG_5687.JPG",
		"name": "IMG_5687.JPG",
		"photo_type": "image/jpeg",
		"size": 286146,
		"creation_time": 1744213940631,
		"is_selected": 0,
		"download_count": 2,
		"download_time": 1744542095509
	},
	{
		"_id": "67fb91487ae708f08af7abc1",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102509/compressed/20250413182508/CJ9A9341.jpg",
		"original_image": "qiniu://public/20250413102446/original/20250413182445/CJ9A9341.jpg",
		"name": "CJ9A9341.jpg",
		"photo_type": "image/jpeg",
		"size": 16839038,
		"creation_time": 1744539976028,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542449072
	},
	{
		"_id": "67fb91487ae708f08af7abcd",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102605/compressed/20250413182605/CJ9A9395.jpg",
		"original_image": "qiniu://public/20250413102603/original/20250413182603/CJ9A9395.jpg",
		"name": "CJ9A9395.jpg",
		"photo_type": "image/jpeg",
		"size": 7855765,
		"creation_time": 1744539976028,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542449721
	},
	{
		"_id": "67fb91487ae708f08af7abd0",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102612/compressed/20250413182611/CJ9A9404.jpg",
		"original_image": "qiniu://public/20250413102610/original/20250413182610/CJ9A9404.jpg",
		"name": "CJ9A9404.jpg",
		"photo_type": "image/jpeg",
		"size": 5453170,
		"creation_time": 1744539976028,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542450525
	},
	{
		"_id": "67fb91487ae708f08af7abd1",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102614/compressed/20250413182614/CJ9A9412.jpg",
		"original_image": "qiniu://public/20250413102612/original/20250413182612/CJ9A9412.jpg",
		"name": "CJ9A9412.jpg",
		"photo_type": "image/jpeg",
		"size": 6631338,
		"creation_time": 1744539976028,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542452789
	},
	{
		"_id": "67fb91487ae708f08af7abd2",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102616/compressed/20250413182615/CJ9A9420.jpg",
		"original_image": "qiniu://public/20250413102615/original/20250413182614/CJ9A9420.jpg",
		"name": "CJ9A9420.jpg",
		"photo_type": "image/jpeg",
		"size": 2281558,
		"creation_time": 1744539976028,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542452172
	},
	{
		"_id": "67fb90bffe975f827ad1714e",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102249/compressed/20250413182249/CJ9A9307.jpg",
		"original_image": "qiniu://public/20250413102247/original/20250413182247/CJ9A9307.jpg",
		"name": "CJ9A9307.jpg",
		"photo_type": "image/jpeg",
		"size": 5939141,
		"creation_time": 1744539839420,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542437843
	},
	{
		"_id": "67fb90bffe975f827ad1714c",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102244/compressed/20250413182243/CJ9A9304.jpg",
		"original_image": "qiniu://public/20250413102242/original/20250413182241/CJ9A9304.jpg",
		"name": "CJ9A9304.jpg",
		"photo_type": "image/jpeg",
		"size": 5857108,
		"creation_time": 1744539839420,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542437758
	},
	{
		"_id": "67fb90bffe975f827ad17151",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102258/compressed/20250413182257/CJ9A9313.jpg",
		"original_image": "qiniu://public/20250413102255/original/20250413182255/CJ9A9313.jpg",
		"name": "CJ9A9313.jpg",
		"photo_type": "image/jpeg",
		"size": 7680248,
		"creation_time": 1744539839420,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542443966
	},
	{
		"_id": "67fb90bffe975f827ad17153",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102305/compressed/20250413182305/CJ9A9317.jpg",
		"original_image": "qiniu://public/20250413102301/original/20250413182301/CJ9A9317.jpg",
		"name": "CJ9A9317.jpg",
		"photo_type": "image/jpeg",
		"size": 8226200,
		"creation_time": 1744539839420,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542439635
	},
	{
		"_id": "67fb90bffe975f827ad17155",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102322/compressed/20250413182321/CJ9A9326.jpg",
		"original_image": "qiniu://public/20250413102315/original/20250413182314/CJ9A9326.jpg",
		"name": "CJ9A9326.jpg",
		"photo_type": "image/jpeg",
		"size": 18328268,
		"creation_time": 1744539839420,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542451988
	},
	{
		"_id": "67fb90bffe975f827ad1714f",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102251/compressed/20250413182250/CJ9A9308.jpg",
		"original_image": "qiniu://public/20250413102249/original/20250413182249/CJ9A9308.jpg",
		"name": "CJ9A9308.jpg",
		"photo_type": "image/jpeg",
		"size": 5060835,
		"creation_time": 1744539839420,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542437873
	},
	{
		"_id": "67fb90bffe975f827ad17152",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102301/compressed/20250413182300/CJ9A9314.jpg",
		"original_image": "qiniu://public/20250413102258/original/20250413182258/CJ9A9314.jpg",
		"name": "CJ9A9314.jpg",
		"photo_type": "image/jpeg",
		"size": 7162697,
		"creation_time": 1744539839420,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542439986
	},
	{
		"_id": "67fb90bffe975f827ad17157",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102336/compressed/20250413182335/CJ9A9330.jpg",
		"original_image": "qiniu://public/20250413102329/original/20250413182328/CJ9A9330.jpg",
		"name": "CJ9A9330.jpg",
		"photo_type": "image/jpeg",
		"size": 17811854,
		"creation_time": 1744539839420,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542443396
	},
	{
		"_id": "67fb90bffe975f827ad17158",
		"selection_code_id": "67fb8c0e8a5c7825f95a21f8",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250413102344/compressed/20250413182344/CJ9A9332.jpg",
		"original_image": "qiniu://public/20250413102336/original/20250413182336/CJ9A9332.jpg",
		"name": "CJ9A9332.jpg",
		"photo_type": "image/jpeg",
		"size": 20429289,
		"creation_time": 1744539839420,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744542447673
	},
	{
		"_id": "67f697b4816a3f73443b5f6e",
		"selection_code_id": "67f69773ce5ec9aecac1e363",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250409155212/compressed/20250409235212/IMG_5688.JPG",
		"original_image": "qiniu://public/20250409155212/original/20250409235211/IMG_5688.JPG",
		"name": "IMG_5688.JPG",
		"photo_type": "image/jpeg",
		"size": 257988,
		"creation_time": 1744213940631,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744214097988
	},
	{
		"_id": "67f697b4816a3f73443b5f6a",
		"selection_code_id": "67f69773ce5ec9aecac1e363",
		"is_downloaded": 1,
		"url": "https://oss.cvxv.cn/public/20250409155209/compressed/20250409235209/IMG_5684.JPG",
		"original_image": "qiniu://public/20250409155209/original/20250409235208/IMG_5684.JPG",
		"name": "IMG_5684.JPG",
		"photo_type": "image/jpeg",
		"size": 303773,
		"creation_time": 1744213940631,
		"is_selected": 0,
		"download_count": 1,
		"download_time": 1744214098008
	}
])

const formatBytes = (byte) => ($us.formatBytes(byte))

const scrollRef = ref(null)
const loading = ref(false)
const nomore = ref(false)

const loadMore = () => {
	if (loading.value) return
	loading.value = true
	console.log('加载更多数据')

	setTimeout(() => {
		// 追加原有结构但改了 _id（比如加个时间戳）
		const newItems = lists.value.slice(0, 10).map(item => ({
			...item,
			_id: item._id + '-' + Date.now()
		}))
		lists.value.push(...newItems)
		setTimeout(() => {
			loading.value = false
		}, 1000);
	}, 500)
}

const openImg = (item => {
	window.open(item.url, '_blank', 'noopener,noreferrer')
})

useInfiniteScroll(scrollRef, loadMore, {
	distance: 500,
	disabled: loading
})

</script>

<style lang="scss" scoped>
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
		animation: loading 2s infinite linear;
	}

	@keyframes loading {
		0% {
			transform: rotate(0deg);
		}

		100% {
			transform: rotate(360deg);
		}
	}

}
</style>