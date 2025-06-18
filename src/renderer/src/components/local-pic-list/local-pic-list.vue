<template lang="pug">
section
	.headerbar1(v-if="calcStorageStats.isEnough")
		span.headerbar1-title
			|本次上传任务共 {{ calcStorageStats.uploadSizeFormatted }} 总计 {{ selectedImages.length }} 张
		span.headerbar1-Loading
			|上传中: 0/{{ selectedImages.length }} 张
	.headerbar2(v-else)
		span.headerbar2-title
			|可用空间不足: 本次上传任务共 {{ calcStorageStats.uploadSizeFormatted }} 总计 {{ selectedImages.length }} 张 请删除部分照片后点击右侧的上传按钮以继续
		el-button(@click="upload") 
			i.iconfont(class="icon-shangchuan1" style="font-size: 20px;margin-right: 5px")
			|上传
	.listview
		.listview-box
			.card(v-for="(item, index) in selectedImages" :key="item._id")
				img(style="width: 128px; height: 128px; object-fit: cover" :src="item.url" @click="openImg(item)")
				.pic-info(@click="checkSelected(item)")
					span.pic-info-title {{item.pname}}
					.pic-info-box
						span.pic-info-box-size {{ item.psize }}
						//- el-checkbox(v-model="item.selected" label="" @click="checkSelected(item)")
						input(type="checkbox" v-model="item.selected" )
	el-image-viewer(v-if="showPreview" :url-list="srcList" show-progress :initial-index="index" @close="showPreview = false")
	input(type="file" accept="image/*" multiple ref="fileInput" style="display: none" @change="handleFileChange")
</template>
<script setup>
import { v4 as uuidv4 } from 'uuid';
import BigNumber from 'bignumber.js'

const fileInput = ref(null)
const selectedImages = ref([]) // 存储本地预览的图片地址
const isSelectAll = ref(false) // 是否全选
const selectList = ref([]) // 选中的图片列表
const checkSelected = (item) => {
	item.selected = !item.selected
	if (item.selected) {
		selectList.value.push(item)
	} else {
		const index = selectList.value.findIndex(i => i._id === item._id)
		if (index !== -1) {
			selectList.value.splice(index, 1)
		}
	}
	isSelectAll.value = selectList.value.length === selectedImages.value.length
}


const { data: infos, set: setInfos } = useStoreData('uspace')
// 可用空间是否足够
const calcStorageStats = computed(() => {
	// 可用空间（byte）
	const available = new BigNumber(infos.value.total_storage_limit || 0)

	// 上传任务总大小（byte）
	const uploadSize = selectedImages.value.reduce((acc, item) => {
		return acc.plus(item.size || 0)
	}, new BigNumber(0))

	const isEnough = available.isGreaterThanOrEqualTo(uploadSize)

	const obj = {
		available, // 可用空间
		uploadSize, // 上传任务总大小
		isEnough, // 是否足够
		availableFormatted: $us.formatBytes(available), // 格式化可用空间
		uploadSizeFormatted: $us.formatBytes(uploadSize) // 格式化上传任务总大小
	}
	return obj
})


usePageChannel('space', ['opers'], (payload, from) => {
	console.log(`✅ 来自${from}的消息：`, payload)
	const [key, value] = Object.entries(payload)[0]
	const handlers = {
		addPic: () => {
			if (selectedImages.value.length > 0) {
				ElMessage({
					message: '请先完成当前上传任务',
					type: 'warning'
				})
				return
			}
			if (fileInput.value) {
				fileInput.value.click()
				getQiniuToken()
			}
		},
		selectAll: (val) => {
			console.log('全选:', val)
			isSelectAll.value = val
			if (val) {
				selectList.value = selectedImages.value.map(item => item)
				selectedImages.value.forEach(item => {
					item.selected = true
				})
			} else {
				selectList.value = []
				selectedImages.value.forEach(item => {
					item.selected = false
				})
			}
		},
		deleteSelect: () => {
			selectedImages.value = selectedImages.value.filter(item => !item.selected)
			selectList.value = []
			isSelectAll.value = false
		}
	}
	handlers[key]?.(value)
})

const { send } = usePageEmitter('space', 'local-pic-list')

watch(selectList, (newVal) => {
	if (newVal.length > 0) {
		send({ hasSelect: true, count: newVal.length })
	} else {
		send({ hasSelect: false })
	}
}, { deep: true })


const emit = defineEmits(['onSelectLocal'])
// 处理选择后的文件
const handleFileChange = (event) => {
	emit('onSelectLocal', true)
	const files = event.target.files
	if (!files || files.length === 0) return

	console.log('选择的文件:', files)
	selectedImages.value = [] // 清空原图
	for (let i = 0; i < files.length; i++) {
		// 使用本地临时路径渲染 禁止使用base64
		const file = files[i]
		const url = URL.createObjectURL(file)
		selectedImages.value.push({
			_id: uuidv4(),
			url: url,
			pname: file.name,
			ptype: file.type,
			psize: $us.formatBytes(file.size),
			size: file.size,
			selected: false,
			last_modified: file.lastModified,
		})
		upLoadPic(file, file.name)
	}

	

	srcList.value = selectedImages.value.map(item => item.url)

	// URL.createObjectURL(file)
	// const file = files[i]
	// const reader = new FileReader()
	// reader.onload = (e) => {
	// 	// 读取文件成功后，更新预览地址
	// 	// previewUrl.value = e.target.result
	// 	selectedImages.value.push({
	// 		_id: uuidv4(),
	// 		url: e.target.result,
	// 		name: file.name,
	// 		type: file.type,
	// 		size: file.size,
	// 		creation_time: Date.now(),
	// 		is_selected: 1
	// 	})
	// }
}

import { uploadToQiniu } from '@/config/upload'
const uploading = ref(false)
const upload = () => {
	if (selectedImages.value.length === 0) {
		ElMessage({
			message: '请先选择图片',
			type: 'warning'
		})
		return
	}

	if (!calcStorageStats.value.isEnough) {
		ElMessage({
			message: '可用空间不足',
			type: 'warning'
		})
		return
	}
	uploading.value = true
	// 处理上传逻辑
}

const upLoadPic = async (file, key) => {
	const res = await uploadToQiniu(file, key, uploadToken.value)
	console.log('上传结果:', res)
}



const showPreview = ref(false)
const srcList = ref([])

const openImg = (item => {
	showPreview.value = true
	// srcList.value = selectedImages.value.map(item => item.url)
})

const uploadToken = ref('')
/* 获取七牛云token */
const getQiniuToken = async () => {
	const res = await $api.qiniuToken()
	uploadToken.value = res.data.uploadToken
	console.log('获取七牛云token:', res)
}

defineExpose({})

</script>

<style lang="scss" scoped>
.headerbar1 {
	height: 56px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 16px;
	background-color: var(--card-color);
	border-bottom: 1px solid var(--divider-color);

	&-title {
		color: var(--text-regular);
		font-size: 14px;
	}

	&-Loading {
		color: var(--text-secondary);
		font-size: 14px;
	}
}

.headerbar2 {
	height: 56px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 16px;
	background-color: var(--card-color);
	border-bottom: 1px solid var(--divider-color);

	&-title {
		color: var(--error-color);
		font-size: 14px;
	}

}

.listview {
	height: calc(100vh - var(--bottom-height) - var(--header-height) - var(--header-oper-bar-height) - 68px);
	padding: 12px;
	box-sizing: border-box;
	overflow-y: auto;

	&-box {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: flex-start;
	}
}

.card {
	flex-shrink: 0;
	margin: 8px;
	width: 128px;
	border-radius: 6px;
	overflow: hidden;
	background-color: var(--card-color);
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
		margin-top: 4px;
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
</style>