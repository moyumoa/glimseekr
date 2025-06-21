<template>
<div @click="logout">点击退出</div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const logout = () => {
	// 清除用户数据
	useStoreData('user').clear()
	useStoreData('uspace').clear()
	
	router.push('/login')
}
</script>

<style lang="scss" scoped></style>
