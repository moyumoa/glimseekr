<template lang="pug">
	.container
		//- list-panel
			text 客户管理
		.screen
			el-descriptions(title="Width vertical list" direction="vertical" :column="4" :border="true" style="margin-top: 20px" extra="关联图册")
				
				el-descriptions-item(label="头像" :rowspan="2" :width="144" align="center")
					el-image(
						style="width: 100px; height: 100px"
						src="https://oss.cvxv.cn/public/20250409155211/compressed/20250409235210/IMG_5686.JPG"
					)

				el-descriptions-item(label="姓名/昵称" align="center" width="202px") 张三
				el-descriptions-item(label="电话" align="center" width="202px") 18100000000
				el-descriptions-item(label="地区" align="center" width="202px") 杭州
				el-descriptions-item(label="关联图册" align="center" width="404px" :span="3")
					el-tag(size="small") School
				el-descriptions-item(label="备注" width="750px" :span="4")
					| {{data}}
	</template>
<script setup>

const { data } = useStoreData('_customer')

watch(() => data.value, (newVal) => {
	// console.log('页面数据已更新', newVal)
	notify.success('页面数据已更新')
}, { immediate: true })


</script>

<style lang="scss" scoped>
.container {
	width: 100%;
	display: flex;
}
</style>
