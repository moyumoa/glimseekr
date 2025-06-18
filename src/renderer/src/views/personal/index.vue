<template lang="pug">
	.screen
		el-descriptions(title="Width vertical list" direction="vertical" column="4" border style="margin-top: 20px" extra="关联图册")
		
			el-descriptions-item(label="头像" :rowspan="2" :width="144" align="center")
				el-image(
					style="width: 100px; height: 100px"
					src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
				)

			el-descriptions-item(label="姓名/昵称" align="center" width="202px") 张三
			el-descriptions-item(label="电话" align="center" width="202px") 18100000000
			el-descriptions-item(label="地区" align="center" width="202px") 杭州
			el-descriptions-item(label="关联图册" align="center" width="404px" :span="3")
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
				el-tag(size="small") School
			el-descriptions-item(label="备注" width="750px" :span="4")
				| No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province

</template>

<script setup>
</script>

<style lang="scss" scoped></style>
