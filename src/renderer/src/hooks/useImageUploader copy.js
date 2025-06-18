import { ref, unref, onUnmounted } from 'vue'
import { uploadToQiniu } from '@/config/upload'
import { $api } from '@/config/api.js'
import { v4 as uuidv4 } from 'uuid'

// 全局共享的 input 元素（只创建一次）
let sharedInput = null
let inputCreated = false

// 全局上传锁，防止多组件同时上传
let isUploading = false

/**
 * useImageUploader - 全局单 input + 单任务控制的图片上传 Hook
 */
export function useImageUploader() {
  // const defaultMultiple = ref(true) // 是否支持多图上传
  const defaultParams = ref({})
  // 响应式状态
  const loading = ref(false) // 是否正在上传
  const uploadedUrls = ref([]) // 成功上传的图片 URL 列表
  const error = ref(null) // 错误提示信息

  const total = ref(0) // 总共待上传文件数量
  const successCount = ref(0) // 成功上传数量
  const failCount = ref(0) // 上传失败数量
  const failedFiles = ref([]) // 上传失败的 File 对象列表

  // 初始化 input，只创建一次 DOM 元素
  if (!inputCreated) {
    sharedInput = document.createElement('input')
    sharedInput.type = 'file'
    sharedInput.style.display = 'none'
    document.body.appendChild(sharedInput)
    inputCreated = true
  }

  // 设置 input 属性（多选 + 类型限制）
  // sharedInput.multiple = defaultMultiple
  sharedInput.accept = 'image/jpeg, image/png, image/gif, image/webp'

  /**
   * 重置所有上传状态
   */
  const resetStatus = () => {
    loading.value = false
    uploadedUrls.value = []
    error.value = null
    total.value = 0
    successCount.value = 0
    failCount.value = 0
    failedFiles.value = []
  }

  /**
   * 上传处理逻辑（串行上传每张图）
   */
  const handleUpload = async (files) => {
    if (isUploading) {
      error.value = '已有上传任务，请稍候再试'
      return
    }

    resetStatus()
    loading.value = true
    isUploading = true
    total.value = files.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const url = await uploadToServer(file, defaultParams.value) // 调用上传函数
        uploadedUrls.value.push(url)
        successCount.value++
      } catch (err) {
        console.error('[上传失败]', err)
        failCount.value++
        failedFiles.value.push(file)
      }
    }

    // console.log('上传完成:', {
    //   成功: successCount.value,
    //   失败: failCount.value,
    //   失败文件: failedFiles.value
    // })

    // 任务结束
    loading.value = false
    isUploading = false
    sharedInput.value = '' // 清空 input，允许选择相同文件再次上传
  }

  const isValidImage = (file) => {
    const validType = file.type.startsWith('image/')
    const validExt = /\.(jpe?g|png|gif|webp)$/i.test(file.name)
    return validType && validExt
  }

  /**
   * 处理 input change 事件（用户选完文件）
   */
  const onSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // 筛选合法图片文件
    const validFiles = files.filter(isValidImage)

    // 如果有非法文件，可设置错误提示（可选）
    if (validFiles.length < files.length) {
      error.value = '部分文件格式不支持，仅允许上传 jpg/png/gif/webp'
    }

    if (!validFiles.length) return

    await handleUpload(files)
  }

  // 清理之前绑定的事件，防止重复绑定
  sharedInput.onchange = null
  // 注册新的监听，once:true 确保只触发一次（防止覆盖冲突）
  // sharedInput.addEventListener('change', onSelect, { once: true })
  // 先解绑，防止重复绑定（这一步很重要）
  sharedInput.removeEventListener('change', onSelect)
  // 再绑定（持续生效）
  sharedInput.addEventListener('change', onSelect)

  /**
   * 供外部调用的接口，触发上传选择框
   */
  const uploadImages = ({ multiple = true, ...options }) => {
    if (isUploading) return (error.value = '上传中，请等待完成')
    // defaultMultiple.value = multiple // 是否多选
    sharedInput.multiple = multiple // 设置多选
    defaultParams.value = options // 其他参数
    // console.log({
    //   原生属性: sharedInput,
    //   其他参数: defaultParams.value
    // })
    getQiniuToken() // 获取七牛云 token
    sharedInput.click()
  }

  /**
   * 组件卸载时清理 input 事件
   */
  onUnmounted(() => {
    sharedInput.onchange = null
  })

  // 返回上传接口和状态
  return {
    uploadImages, // 触发上传
    uploadedUrls, // 上传成功的图片链接
    loading, // 是否正在上传
    error, // 错误信息
    total, // 总共上传文件数
    successCount, // 成功数量
    failCount, // 失败数量
    failedFiles // 上传失败的文件列表
  }
}

const uploadToken = ref('')
/* 获取七牛云token */
const getQiniuToken = async () => {
  const res = await $api.qiniuToken()
  uploadToken.value = res.data.uploadToken
}

/**
 * 图片上传逻辑（项目统一上传接口）
 * 可根据业务替换为 axios、$api 等
 */
import { useBucketUpdater } from '@/hooks/useBucketUpdater'
const { updateBucket } = useBucketUpdater()
const { data: spaceInfo, set: setInfos } = useStoreData('uspace')
const mimeToExt = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
}
async function uploadToServer(file, params) {
  const { name, size, type, lastModified } = file
  const ext = mimeToExt[type]
  const qnkey = `middle/images/${spaceInfo.value.bucket}/${uuidv4()}-${Date.now()}.${ext}` // 七牛云存储的文件名
  const res = await uploadToQiniu(file, qnkey, uploadToken.value)
  const { hash, key } = res

  /* 图片入库 */
  const data = {
    name,
    size,
    ptype: type,
    ext,
    lastModified,
    hash,
    url: key,
    bucket: spaceInfo.value.bucket,
    ...params
  }
  const result = await $api.space.picstorage(data)
  updateBucket({ used_storage: result.data.used_storage }) // 更新空间信息
  if (result.errCode !== 0) {
    throw new Error('图片入库失败')
  }
}
