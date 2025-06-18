<template lang="pug">
	Headerbar
	.loginbox(:class="{successLogin}")
		el-form( :model="mform" ref="formRef" :rules="rules" class="login-form")
			el-form-item( prop="phone")
				.login-form-ipt
					el-input(v-model="mform.phone" placeholder="请输入手机号")
						template(#prefix)
							i.iconfont(class="icon-shoujihao" style="font-size: 18px; margin-right: 5px")
			el-form-item(prop="captcha")
				.login-form-ipt
					el-input(v-model="mform.captcha" placeholder="请输入验证码")
						template(#prefix)
							i.iconfont(class="icon-yaoqingma" style="font-size: 18px; margin-right: 5px")
					el-button(text :disabled="captchaDisabled" @click="sendCode") {{captchaText}}
			el-form-item
				el-button(type="success" text bg class="btnstyle" :loading="loading" @click="onSubmit") 登录
</template>

<script setup>
import { setupDynamicRoutes } from '@/router/setupDynamicRoutes';
import Headerbar from '@/Layout/components/Headerbar.vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const { data: userInfo, set: setUserInfo } = useStoreData('user')
const { data: userSpace, set: setUserSpace } = useStoreData('uspace')

// setTimeout(() => {
// 	window?.myElectron?.loginSuccess()
// }, 1000);

const loading = ref(false)
const successLogin = ref(false)

const rules = {
	phone: [
		{ required: true, message: '请输入手机号', trigger: 'blur' },
		{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
	],
	captcha: [
		{ required: true, message: '请输入验证码', trigger: 'blur' },
	],
}

const mform = ref({
	phone: '15000000004',
	captcha: '123456',
	uuid: '12345678-1234-1234-1234-123456789012'
})

const formRef = ref(null)
const onSubmit = async () => {
	await formRef.value.validate((valid) => {
		if (!valid) return notify.error('请检查手机号和验证码')
		// window?.myElectron?.loginSuccess()
		loading.value = true
		$api.auth.login({
			phone: mform.value.phone,
			code: mform.value.captcha,
			uuid: mform.value.uuid
		})
			.then(async (res) => {
				successLogin.value = true
				notify.success(`欢迎回来，${res.data.nickname}`)
				window?.myElectron?.loginSuccess()
				const { space, ...udata } = res.data
				setUserInfo(udata)
				setUserSpace(space)

				// await setupDynamicRoutes({
				// 	preload: true,
				// 	preloadWhitelist: ['space', 'customer', 'client-photo', 'portfolio']
				// });

				router.push('/')
			})
			.catch((err) => {
				mform.value.captcha = ''
			})
			.finally(() => {
				// formRef.value.resetFields()
				loading.value = false
			})
	})
}

const codeTime = 30 	// 验证码倒计时
const captchaText = ref('获取验证码')
const captchaDisabled = ref(false)
const time = ref(codeTime)
const timer = ref(null)


const STORAGE_KEY = 'captchaEndTime' // 本地存储的 key

const sendCode = async () => {
	if (captchaDisabled.value) return
	await $api.auth.sendCode({
		phone: mform.value.phone,
		uuid: mform.value.uuid
	})
		.then(() => {
			notify.success('验证码已发送')
		})
		.catch((err) => {
			if (err.code === 1001) {
				captchaDisabled.value = true
				captchaText.value = '获取验证码'
			}
		})

	const endTime = Date.now() + time.value * 1000 // 当前时间 + 倒计时时长
	localStorage.setItem(STORAGE_KEY, endTime) // 保存结束时间戳

	startCountdown(endTime)
}

const startCountdown = (endTime) => {
	captchaDisabled.value = true

	const countdown = () => {
		if (timer.value) clearTimeout(timer.value)

		const now = Date.now()
		const diff = Math.floor((endTime - now) / 1000)

		if (diff > 0) {
			time.value = diff
			captchaText.value = `${time.value}秒后重发`
			timer.value = setTimeout(countdown, 1000)
		} else {
			captchaDisabled.value = false
			captchaText.value = '获取验证码'
			time.value = codeTime
			localStorage.removeItem(STORAGE_KEY) // 倒计时结束后清除
			if (timer.value) clearTimeout(timer.value)
			timer.value = null
		}
	}
	countdown()
}

// 页面加载时恢复倒计时
onMounted(() => {
	localStorage.removeItem('mtttoken')
	const savedEndTime = localStorage.getItem(STORAGE_KEY)
	if (savedEndTime) {
		const endTime = parseInt(savedEndTime)
		if (endTime > Date.now()) {
			startCountdown(endTime)
		} else {
			// 结束时间过了，清掉
			localStorage.removeItem(STORAGE_KEY)
		}
	}
})

// 页面卸载时清除计时器
onUnmounted(() => {
	if (timer.value) {
		clearTimeout(timer.value)
	}
})

</script>

<style lang="scss" scoped>
.loginbox {
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: var(--bg);
	opacity: 1;
	transition: opacity 0.15s ease-in-out;


	.login-form {
		width: 280px;

		&-ipt {
			width: 100%;
			height: 44px;
			display: flex;
			align-items: center;
			background-color: var(--card-color);
			border-radius: 5px;
			margin-top: 5px;
		}
	}

	.btnstyle {
		width: 100%;
		height: 44px;
		margin-top: 10%;
		border-radius: 5px;
		font-size: 15px;
		font-weight: bold;
	}
}

.successLogin {
	opacity: 0;
}
</style>
