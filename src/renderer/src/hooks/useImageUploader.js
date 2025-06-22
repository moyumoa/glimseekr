import { ref, computed } from 'vue'
import { uploadToQiniu } from '@/config/upload'
import { $api } from '@/config/api.js'
import { v4 as uuidv4 } from 'uuid'
import { useBucketUpdater } from '@/hooks'
import { useStoreData } from '@/composables/useStoreData'
import Compressor from 'compressorjs'

// ====== 全局变量：共享 input ======
let sharedInput = null
let inputCreated = false
const processing = ref(false)
// 单一上传队列
const queueState = ref([])

export function useImageUploader(defaultOptions = {}) {
  const ident = ref('')
  const defaultParams = ref({
    apiFn: $api.space.picstorage,
    compressOptions: { quality: 0.8, maxWidth: 1440 },
    uploadOriginal: true,
    uploadThumb: true,
    urlSource: 'original',
    ...defaultOptions
  })
  const uploadedUrls = ref([])
  const error = ref(null)

  const isCompleted = ref(false)
  const { updateBucket } = useBucketUpdater()
  const { data: spaceInfo } = useStoreData('uspace')

  // 初始化 input
  if (!inputCreated) {
    sharedInput = document.createElement('input')
    sharedInput.type = 'file'
    sharedInput.style.display = 'none'
    sharedInput.accept = 'image/jpeg, image/png, image/gif, image/webp, image/svg+xml, .raw'
    document.body.appendChild(sharedInput)
    inputCreated = true
  }

  const total = computed(() => queueState.value.length)
  const successCount = computed(() => queueState.value.filter((t) => t.status === 'done').length)
  const failCount = computed(() => queueState.value.filter((t) => t.status === 'error').length)
  const failedFiles = computed(() =>
    queueState.value.filter((t) => t.status === 'error').map((t) => t.file)
  )
  const loading = computed(() => processing.value)

  const resetStatus = () => {
    isCompleted.value = false
    uploadedUrls.value = []
    error.value = null
    queueState.value = []
  }

  const isValidImage = (file) => {
    const extMatch = /\.(jpe?g|png|gif|webp|svg|raw)$/i.test(file.name)
    return file.type.startsWith('image/') || extMatch
  }

  const onSelect = (params) => async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validFiles = files.filter(isValidImage)

    if (validFiles.length < files.length) {
      error.value = '部分文件格式不支持，仅允许 jpg/png/gif/webp/svg/raw'
    }

    if (!validFiles.length) return

    const tasks = validFiles.map((f) => ({
      file: f,
      name: f.name,
      status: 'waiting',
      params
    }))

    queueState.value.push(...tasks)
    processQueue()
  }

  const open = ({
    multiple = true,
    dent: identkey = '',
    onComplete,
    onEachComplete,
    ...options
  }) => {
    ident.value = identkey
    sharedInput.multiple = multiple
    const params = {
      ...defaultParams.value,
      onComplete,
      onEachComplete,
      ...options
    }
    getQiniuToken()
    sharedInput.onchange = null
    sharedInput.removeEventListener('change', onSelect(params))
    sharedInput.addEventListener('change', onSelect(params), { once: true })
    sharedInput.click()
  }

  const setDefaults = (opts = {}) => {
    Object.assign(defaultParams.value, opts)
  }

  async function processQueue() {
    if (processing.value) return
    const task = queueState.value.find((t) => t.status === 'waiting')
    if (!task) {
      if (!queueState.value.length) return
      finalizeQueue()
      return
    }
    processing.value = true
    await handleTask(task)
    processing.value = false
    processQueue()
  }

  async function handleTask(task) {
    task.status = 'processing'
    const { onEachComplete, ...params } = task.params

    try {
      const statusUpdater = (s) => {
        task.status = s
      }

      const imageSize = await getImageSizeSafe(task.file)
      const result = await uploadToServer(
        task.file,
        {
          bucket: spaceInfo.value.bucket,
          updateBucket
        },
        {
          ...params,
          width: imageSize.width,
          height: imageSize.height,
          size_source: imageSize.source
        },
        statusUpdater
      )

      task.status = 'done'
      task.result = result
      uploadedUrls.value.push(result)
      if (typeof onEachComplete === 'function') {
        onEachComplete(result)
      }
    } catch (err) {
      task.status = 'error'
      task.error = err
      if (err?.errCode === 4003) {
        error.value = '空间已满，已终止上传'
      } else if (err?.code === 'ERR_NETWORK') {
        error.value = '网络错误，请检查网络连接'
      } else {
        console.error('[上传失败]', err)
      }
    }
  }

  function finalizeQueue() {
    const summary = {
      total: total.value,
      successCount: successCount.value,
      failCount: failCount.value,
      failedFiles: failedFiles.value
    }
    const callbacks = new Set()
    queueState.value.forEach((t) => {
      if (typeof t.params.onComplete === 'function') {
        callbacks.add(t.params.onComplete)
      }
    })

    callbacks.forEach((cb) => cb(summary))

    updateBucket()
    isCompleted.value = true
    resetStatus()
  }

  return {
    open,
    setDefaults,
    getQueue: () => queueState.value,
    clearQueue: resetStatus,
    uploadedUrls,
    loading,
    error,
    total,
    successCount,
    failCount,
    failedFiles,
    isCompleted,
    ident,
    queue: queueState
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
  'image/svg+xml': 'svg',
  'image/x-adobe-dng': 'dng',
  'image/x-canon-cr2': 'cr2'
}

async function uploadToServer(file, { bucket, updateBucket }, params = {}, statusCb = () => {}) {
  const {
    apiFn = $api.space.picstorage,
    compressOptions = {},
    uploadOriginal = true,
    uploadThumb = true,
    urlSource = uploadOriginal ? 'original' : 'thumb',
    ...rest
  } = params
  const { name, size, type, lastModified } = file
  const ext = mimeToExt[type] || name.split('.').pop() || 'jpg'
  const baseKey = `middle/images/${bucket}/${uuidv4()}-${Date.now()}`
  const originalKey = `${baseKey}.${ext}`
  const thumbKey = `${baseKey}-thumb.${ext}`

  let compressedFile = null
  if (uploadThumb || (!uploadOriginal && urlSource === 'thumb')) {
    statusCb('compressing')
    compressedFile = await new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.8,
        maxWidth: 1440,
        ...compressOptions,
        success: resolve,
        error: reject
      })
    })
  }

  let originalRes = null
  if (uploadOriginal) {
    statusCb('uploading')
    originalRes = await uploadToQiniu(file, originalKey, uploadToken.value)
  }

  let thumbRes = null
  if (uploadThumb) {
    statusCb('uploading')
    const upFile = compressedFile || file
    thumbRes = await uploadToQiniu(upFile, thumbKey, uploadToken.value)
  }

  const payload = {
    name,
    size,
    ptype: type,
    ext,
    lastModified,
    bucket,
    ...rest
  }

  if (uploadOriginal && originalRes) {
    payload.original_url = originalRes.key
    payload.hash = originalRes.hash
    if (urlSource === 'original') payload.url = originalRes.key
  }

  if (uploadThumb && thumbRes) {
    payload.thumb_url = thumbRes.key
    payload.thumb_size = (compressedFile || file).size
    payload.thumb_hash = thumbRes.hash
    if (urlSource === 'thumb') {
      payload.url = thumbRes.key
      if (!payload.hash) payload.hash = thumbRes.hash
    }
  }

  const result = await apiFn(payload)

  if (result?.data?.used_storage !== undefined) {
    updateBucket({ used_storage: result.data.used_storage })
  }

  if (result.errCode !== 0) throw new Error('图片入库失败')
  statusCb('done')
  return result?.data || {}
}
