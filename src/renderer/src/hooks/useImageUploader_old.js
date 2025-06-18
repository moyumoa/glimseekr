// hooks/useImageUploader.js
import { ref, unref, onUnmounted, getCurrentInstance } from 'vue'
import { uploadToQiniu } from '@/config/upload'
import { $api } from '@/config/api.js'
import { v4 as uuidv4 } from 'uuid'
import { useBucketUpdater } from '@/hooks'
import { useStoreData } from '@/composables/useStoreData'
import Compressor from 'compressorjs'

// ====== 🧩 全局变量：共享 input 元素和上传锁 ======
let sharedInput = null
let inputCreated = false
let isUploading = false

/**
 * useImageUploader - 全局共享 input、上传状态的图片上传 Hook
 */
export function useImageUploader() {
  // ====== 📦 响应式状态 ======
  const ident = ref('')
  const defaultParams = ref({})
  const loading = ref(false)
  const uploadedUrls = ref([])
  const error = ref(null)
  const total = ref(0)
  const successCount = ref(0)
  const failCount = ref(0)
  const failedFiles = ref([])
  const isCompleted = ref(false)

  const { updateBucket } = useBucketUpdater()
  const { data: spaceInfo } = useStoreData('uspace')

  // ====== 🧪 初始化 input（只执行一次） ======
  if (!inputCreated) {
    sharedInput = document.createElement('input')
    sharedInput.type = 'file'
    sharedInput.style.display = 'none'
    sharedInput.accept = 'image/jpeg, image/png, image/gif, image/webp'
    document.body.appendChild(sharedInput)
    inputCreated = true
  }

  // ====== 📌 重置上传状态 ======
  const resetStatus = () => {
    loading.value = false
    isCompleted.value = false
    uploadedUrls.value = []
    error.value = null
    total.value = 0
    successCount.value = 0
    failCount.value = 0
    failedFiles.value = []
  }

  // ====== 📤 上传主逻辑（串行） ======
  const handleUpload = async (files) => {
    if (isUploading) {
      error.value = '已有上传任务，请稍候再试'
      return
    }

    resetStatus()
    loading.value = true
    isUploading = true
    total.value = files.length

    const { onIntervalRefresh, refreshInterval = 0 } = defaultParams.value

    for (const file of files) {
      try {
        const url = await uploadToServer(
          file,
          {
            bucket: spaceInfo.value.bucket,
            updateBucket
          },
          defaultParams.value
        )
        uploadedUrls.value.push(url)
        successCount.value++

        // ✅ 每 N 张触发刷新（仅在传了回调 + 多图上传时生效）
        if (
          files.length > 2 &&
          typeof onIntervalRefresh === 'function' &&
          refreshInterval > 2 &&
          successCount.value % refreshInterval === 0
        ) {
          await onIntervalRefresh(successCount.value)
        }
      } catch (err) {
        if (err) break
        failCount.value++
        failedFiles.value.push(file)
        console.error('[上传失败]', err)
      }
    }

    loading.value = false
    isUploading = false
    sharedInput.value = null // 允许选择相同文件再次上传

    // console.log('✅ 上传完成:', {
    //   成功: successCount.value,
    //   失败: failCount.value,
    //   失败文件: failedFiles.value
    // })

    updateBucket() // 更新空间使用量
    isCompleted.value = true

    // ====== 📦 上传完成后，触发回调 ======
    const { onComplete: callback, ...args } = defaultParams.value
    if (typeof callback === 'function') {
      callback({
        ident: ident.value, // 唯一标识
        total: total.value, // 总数
        successCount: successCount.value, // 成功数
        failCount: failCount.value, // 失败数
        // uploadedUrls: uploadedUrls.value, // 成功的 URL
        failedFiles: failedFiles.value, // 失败的文件
        params: args // 传入的参数
      })
    }
  }

  // ====== 🧪 图片合法性校验 ======
  const isValidImage = (file) => {
    return file.type.startsWith('image/') && /\.(jpe?g|png|gif|webp)$/i.test(file.name)
  }

  // ====== 📥 处理 input change 事件 ======
  const onSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validFiles = files.filter(isValidImage)

    if (validFiles.length < files.length) {
      error.value = '部分文件格式不支持，仅允许 jpg/png/gif/webp'
    }

    if (!validFiles.length) return

    await handleUpload(validFiles)
  }

  // ====== 🧭 主接口：外部调用上传入口 ======
  /**
   * 打开图片上传选择框并启动上传流程
   *
   * @param {Object} options 配置项
   * @param {boolean} [options.multiple=true] 是否允许多选图片
   * @param {string} [options.ident=''] 上传任务标识（用于区分用途）
   * @param {string} options.folderId 当前文件夹 ID，会传入入库接口
   * @param {Object} [options.params] 附加参数，将合并进入库 payload
   * @param {function} [options.onComplete] 所有图片上传完成时触发的回调
   * @param {number} [options.refreshInterval] 每成功上传 N 张图片时触发刷新（仅多图上传有效）
   * @param {function} [options.onIntervalRefresh] 每间隔 N 张上传成功时触发的回调（如用于刷新视图）
   *
   * @example
   * $up.open({
   *   multiple: true,
   *   folderId: 'abc123',
   *   refreshInterval: 3,
   *   onIntervalRefresh: () => refreshList(),
   *   onComplete: ({ successCount }) => console.log('上传完成', successCount)
   * })
   */
  const open = ({
    multiple = true,
    dent: identkey = '',
    onComplete,
    ...options }) => {
    if (isUploading) return (error.value = '上传中，请等待完成')
    ident.value = identkey // 唯一标识
    sharedInput.multiple = multiple
    defaultParams.value = {
      onComplete,
      refreshInterval: 3,
      ...options
    }
    getQiniuToken()
    // ✅ 每次调用都重新绑定 onSelect，确保有效
    sharedInput.onchange = null // 清空旧的（保险）
    sharedInput.removeEventListener('change', onSelect)
    sharedInput.addEventListener('change', onSelect, { once: true }) // 关键点
    sharedInput.click()
  }

  return {
    open, // 触发上传
    uploadedUrls, // 成功 URL
    loading,
    error,
    total,
    successCount,
    failCount,
    failedFiles,
    isCompleted,
    ident
  }
}

// ====== 🪙 获取七牛云上传 token ======
const uploadToken = ref('')

const getQiniuToken = async () => {
  const res = await $api.qiniuToken()
  uploadToken.value = res.data.uploadToken
}

// ====== 🧱 上传到七牛 + 入库逻辑（含更新空间使用量） ======
const mimeToExt = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
}

async function uploadToServer(file, { bucket, updateBucket }, params = {}) {
  const { name, size, type, lastModified } = file
  const ext = mimeToExt[type]
  const baseKey = `middle/images/${bucket}/${uuidv4()}-${Date.now()}`
  const originalKey = `${baseKey}.${ext}`
  const thumbKey = `${baseKey}-thumb.${ext}`

  // ✅ 1️⃣ 压缩图
  const compressedFile = await new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.8,
      maxWidth: 1440,
      success: resolve,
      error: reject
    })
  })

  // ✅ 2️⃣ 上传原图
  const originalRes = await uploadToQiniu(file, originalKey, uploadToken.value)
  const { key: originalUrl, hash } = originalRes

  // ✅ 3️⃣ 上传压缩图（展示用）
  const thumbRes = await uploadToQiniu(compressedFile, thumbKey, uploadToken.value)
  const { key: thumbUrl } = thumbRes

  // ✅ 4️⃣ 调用接口记录图片信息
  const payload = {
    name,
    size,
    ptype: type,
    ext,
    lastModified,
    hash,
    url: originalUrl, // 原图地址作为主 url
    original_url: originalUrl, // 原图地址
    thumb_url: thumbUrl, // 🔁 增加压缩图地址
    thumb_size: compressedFile.size,
    thumb_hash: thumbRes.hash,
    bucket,
    ...params
  }

  const result = await $api.space.picstorage(payload)

  // ✅ 5️⃣ 更新空间状态
  if (result?.data?.used_storage !== undefined) {
    updateBucket({ used_storage: result.data.used_storage })
  }

  if (result.errCode !== 0) throw new Error('图片入库失败')

  return { originalUrl, thumbUrl }
}
