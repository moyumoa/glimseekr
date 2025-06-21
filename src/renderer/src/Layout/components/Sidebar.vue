<template>
	<div class="sidebar">
		<div class="sidebar-warp">
			<div class="sidebar-item" v-for="(item, index) in sidebars" :key="index"
				:class="{ actived: route.path.startsWith(item.path) }" @click="navito(item)">
				<i-svg :name="item.icon" :size="item.size" />
				<span class="sidebar-item-title">{{ item.title }}</span>
			</div>
			<div class="sidebar-item" :class="{ actived: route.path.startsWith('/personal') }"
				@click="navito({ path: '/personal' })">
				<i-svg name="gerenzhongxin" :size="20" />
				<span class="sidebar-item-title">{{ userInfo?.nickname || '我的' }}</span>
			</div>
		</div>
		<Footerbar />
	</div>
</template>

<script setup>
const { data: userInfo } = useStoreData('user')

import Footerbar from '@/Layout/components/Footerbar.vue'

import { dynamicLayoutRoute } from '@/router'
const sidebars = computed(() => {
	const routes = dynamicLayoutRoute.children
		.filter(route => route.meta?.side)
		.map(route => ({
			...route.meta,
			// path只保留有效路径 去掉动态参数 例如 /space/:id? => /space
			path: `/${route.path.replace(/(:\w+\??)/g, '').replace(/\/$/, '')}`,
		}))
	return routes
})
import { useRouter, useRoute } from 'vue-router'
const route = useRoute()
const router = useRouter()
const navito = async (item) => {
	if (route.path === item.path) return
	await router.push(item.path)
}
</script>

<style lang="scss">
$--top: 48px;
// $--top-height: 144px;
$--top-height: 24px;


.sidebar {
	flex-shrink: 0;
	margin-right: 24px;
	width: var(--side-width);
	padding: calc(48px + 24px) 0;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	position: relative;
}


.sidebar ::-webkit-scrollbar {
	display: none;
	scrollbar-width: thin;
}

.sidebar-item {
	display: flex;
	align-items: center;
	// width: 100%;
	padding: 0 24px;
	box-sizing: border-box;
	height: 48px;
	font-size: 15px;
	font-weight: 500;
	margin: 0 0 12px 0;
	cursor: pointer;
	color: var(--text-secondary);
	opacity: 0.8;
	transition: all 0.15s ease-out;
	border-radius: 52px;

	&:hover {
		color: var(--text-primary);
		opacity: 0.9;
	}

	&-title {
		margin-left: 12px;
		font-size: 16px;
	}
}

.actived {
	color: var(--text-primary);
	opacity: 1;
	// background-color: #2c2f33; // 除了第一个才有背景色
	// 渐变色
	background: linear-gradient(90deg,
			rgba(255, 255, 255, 0.06) 20%,
			rgba(255, 255, 255, 0.04) 50%,
			rgba(255, 255, 255, 0.025) 80%);
	background-size: 100% 100%;
	position: relative;
}
</style>
