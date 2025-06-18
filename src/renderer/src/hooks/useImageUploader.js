import { ref } from 'vue'
import { uploadToQiniu } from '@/config/upload'
import { $api } from '@/config/api.js'
import { v4 as uuidv4 } from 'uuid'
import { useBucketUpdater } from '@/hooks'
import { useStoreData } from '@/composables/useStoreData'
import Compressor from 'compressorjs'

// ====== 全局变量：共享 input 和上传状态 ======
let sharedInput = null
let inputCreated = false
let isUploading = false

export function useImageUploader() {
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

  // 初始化 input
  if (!inputCreated) {
    sharedInput = document.createElement('input')
    sharedInput.type = 'file'
    sharedInput.style.display = 'none'
    sharedInput.accept = 'image/jpeg, image/png, image/gif, image/webp, image/svg+xml'
    document.body.appendChild(sharedInput)
    inputCreated = true
  }

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

  const handleUpload = async (files) => {
    if (isUploading) {
      error.value = '已有上传任务，请稍候再试'
      return
    }

    resetStatus()
    loading.value = true
    isUploading = true
    total.value = files.length

    const { onEachComplete, onComplete } = defaultParams.value

    for (const file of files) {
      try {
        const imageSize = await getImageSizeSafe(file)

        const result = await uploadToServer(
          file,
          {
            bucket: spaceInfo.value.bucket,
            updateBucket
          },
          {
            ...defaultParams.value,
            width: imageSize.width,
            height: imageSize.height,
            size_source: imageSize.source
          }
        )

        uploadedUrls.value.push(result)
        successCount.value++

        if (typeof onEachComplete === 'function') {
          onEachComplete(result)
        }
      } catch (err) {
        failCount.value++
        failedFiles.value.push(file)
        // ✅ 如果是空间已满，终止后续上传
        if (err?.errCode === 4003) {
          error.value = '空间已满，已终止上传'
          console.warn('[上传终止] 空间已满')
          break
        }
        console.error('[上传失败]', err)
      }
    }

    loading.value = false
    isUploading = false
    sharedInput.value = null
    updateBucket()
    isCompleted.value = true

    // ✅ 最终回调：只返回 4 个字段
    if (typeof onComplete === 'function') {
      onComplete({
        total: total.value,
        successCount: successCount.value,
        failCount: failCount.value,
        failedFiles: failedFiles.value
      })
    }
  }

  const isValidImage = (file) => {
    return file.type.startsWith('image/') && /\.(jpe?g|png|gif|webp|svg)$/i.test(file.name)
  }

  const onSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validFiles = files.filter(isValidImage)

    if (validFiles.length < files.length) {
      error.value = '部分文件格式不支持，仅允许 jpg/png/gif/webp/svg'
    }

    if (!validFiles.length) return

    await handleUpload(validFiles)
  }

  const open = ({
    multiple = true,
    dent: identkey = '',
    onComplete,
    onEachComplete,
    ...options
  }) => {
    if (isUploading) return (error.value = '上传中，请等待完成')
    ident.value = identkey
    sharedInput.multiple = multiple
    defaultParams.value = {
      onComplete,
      onEachComplete,
      ...options
    }
    getQiniuToken()
    sharedInput.onchange = null
    sharedInput.removeEventListener('change', onSelect)
    sharedInput.addEventListener('change', onSelect, { once: true })
    sharedInput.click()
  }

  return {
    open,
    uploadedUrls,
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

// ✅ 读取图片尺寸（兼容 SVG）
function getImageSizeSafe(file, fallbackWidth = 800, fallbackHeight = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = function (event) {
      const img = new Image()
      img.onload = function () {
        resolve({
          width: img.width,
          height: img.height,
          source: 'local'
        })
      }
      img.onerror = function () {
        resolve({
          width: fallbackWidth,
          height: fallbackHeight,
          source: 'fallback'
        })
      }
      img.src = event.target.result
    }
    reader.onerror = function () {
      resolve({
        width: fallbackWidth,
        height: fallbackHeight,
        source: 'fallback'
      })
    }
    reader.readAsDataURL(file)
  })
}

// ✅ 获取七牛上传 token
const uploadToken = ref('')

const getQiniuToken = async () => {
  const res = await $api.qiniuToken()
  uploadToken.value = res.data.uploadToken
}

// ✅ 上传逻辑（保留原样）
const mimeToExt = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg'
}

async function uploadToServer(file, { bucket, updateBucket }, params = {}) {
  const { name, size, type, lastModified } = file
  const ext = mimeToExt[type] || 'jpg'
  const baseKey = `middle/images/${bucket}/${uuidv4()}-${Date.now()}`
  const originalKey = `${baseKey}.${ext}`
  const thumbKey = `${baseKey}-thumb.${ext}`

  const compressedFile = await new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.8,
      maxWidth: 1440,
      success: resolve,
      error: reject
    })
  })

  const originalRes = await uploadToQiniu(file, originalKey, uploadToken.value)
  const { key: originalUrl, hash } = originalRes

  const thumbRes = await uploadToQiniu(compressedFile, thumbKey, uploadToken.value)
  const { key: thumbUrl } = thumbRes

  const payload = {
    name,
    size,
    ptype: type,
    ext,
    lastModified,
    hash,
    url: originalUrl,
    original_url: originalUrl,
    thumb_url: thumbUrl,
    thumb_size: compressedFile.size,
    thumb_hash: thumbRes.hash,
    bucket,
    ...params
  }

  const result = await $api.space.picstorage(payload)

  if (result?.data?.used_storage !== undefined) {
    updateBucket({ used_storage: result.data.used_storage })
  }

  if (result.errCode !== 0) throw new Error('图片入库失败')

  return result?.data || {}
}
