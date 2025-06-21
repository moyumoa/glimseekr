import { ref, computed } from 'vue'
import { uploadToQiniu } from '@/config/upload'
import { $api } from '@/config/api.js'
import { v4 as uuidv4 } from 'uuid'
import { useBucketUpdater } from '@/hooks'
import { useStoreData } from '@/composables/useStoreData'
import Compressor from 'compressorjs'

// ====== 全局变量：共享 input 和队列 ======
let sharedInput = null
let inputCreated = false
let processing = false
let pendingParams = null
const QUEUE_CACHE_KEY = 'imageUploadHistory'
const MAX_QUEUE_CACHE = 100

function loadQueueCache() {
  try {
    const raw = localStorage.getItem(QUEUE_CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('[loadQueueCache]', err)
    return []
  }
}

function saveQueueCache(list) {
  try {
    const cache = list.slice(-MAX_QUEUE_CACHE).map((g) => ({
      id: g.id,
      status: g.status,
      tasks: g.tasks.map((t) => ({ name: t.name, status: t.status }))
    }))
    localStorage.setItem(QUEUE_CACHE_KEY, JSON.stringify(cache))
  } catch (err) {
    console.error('[saveQueueCache]', err)
  }
}

const queueState = ref(loadQueueCache())
const needsResume = ref(false)

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

  if (!inputCreated) {
    sharedInput = document.createElement('input')
    sharedInput.type = 'file'
    sharedInput.style.display = 'none'
    sharedInput.accept = 'image/jpeg, image/png, image/gif, image/webp, image/svg+xml'
    document.body.appendChild(sharedInput)
    inputCreated = true
  }

  const resetTaskStatus = () => {
    isCompleted.value = false
    uploadedUrls.value = []
    error.value = null
    total.value = 0
    successCount.value = 0
    failCount.value = 0
    failedFiles.value = []
  }


  const isValidImage = (file) => {
    return file.type.startsWith('image/') && /\.(jpe?g|png|gif|webp|svg)$/i.test(file.name)
  }

   function addGroup(files, params) {
    const group = {
      id: uuidv4(),
      status: 'waiting',
      params,
      tasks: files.map((f) => ({ file: f, name: f.name, status: 'waiting' }))
    }
    queueState.value.push(group)
    saveQueueCache(queueState.value)
    return group
  }

  const onSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validFiles = files.filter(isValidImage)

    if (validFiles.length < files.length) {
      error.value = '部分文件格式不支持，仅允许 jpg/png/gif/webp/svg'
    }

    if (!validFiles.length) return

    const group = addGroup(validFiles, pendingParams)

    pendingParams = null

    // 如果存在旧的未完成任务，先等待用户处理
    if (!processing) {
      const firstUnfinished = queueState.value.find((g) => g.status !== 'done')
      if (firstUnfinished && firstUnfinished.id !== group.id) {
        needsResume.value = true
        return
      }
    }

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
    pendingParams = {
      ...defaultParams.value,
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

  const setDefaults = (opts = {}) => {
    Object.assign(defaultParams.value, opts)
  }

  const getQueue = () => queueState.value

  const getRecentQueue = () => queueState.value.slice(-MAX_QUEUE_CACHE)

  const clearQueue = () => {
    queueState.value = []
    saveQueueCache(queueState.value)
  }

  const removeGroup = (id) => {
    const idx = queueState.value.findIndex((g) => g.id === id)
    if (idx > -1) {
      queueState.value.splice(idx, 1)
      saveQueueCache(queueState.value)
    }
  }

  const hasUnfinished = computed(() => queueState.value.some((g) => g.status !== 'done'))

  const continuePending = () => {
    needsResume.value = false
    processQueue()
  }

  async function processQueue() {
    if (processing) return
    const group = queueState.value.find((g) => g.status !== 'done')
    if (!group) {
      loading.value = false
      saveQueueCache(queueState.value)
      return
    }
    processing = true
    loading.value = true
    await handleGroup(group)
    processing = false
    processQueue()
  }

  async function handleGroup(group) {
    resetTaskStatus()
    group.status = 'processing'
    total.value = group.tasks.length
    const { onEachComplete, onComplete } = group.params
    let aborted = false

    for (const task of group.tasks) {
      if (task.status === 'done') continue
      try {
        const statusUpdater = (s) => {
          task.status = s
          saveQueueCache(queueState.value)
        }
        const imageSize = await getImageSizeSafe(task.file)
        const result = await uploadToServer(
          task.file,
          {
            bucket: spaceInfo.value.bucket,
            updateBucket
          },
          {
            ...group.params,
            width: imageSize.width,
            height: imageSize.height,
            size_source: imageSize.source
          },
          statusUpdater
        )

        task.status = 'done'
        task.result = result
        saveQueueCache(queueState.value)

        uploadedUrls.value.push(result)
        successCount.value++

        if (typeof onEachComplete === 'function') {
          onEachComplete(result)
        }
      } catch (err) {
        task.status = 'error'
        task.error = err
        saveQueueCache(queueState.value)

        failCount.value++
        failedFiles.value.push(task.file)
        if (err?.errCode === 4003) {
          error.value = '空间已满，已终止上传'
          aborted = true
          break
        }
        if (err?.code === 'ERR_NETWORK') {
          error.value = '网络错误，请检查网络连接'
          aborted = true
          break
        }
        console.error('[上传失败]', err)
      }
    }

    updateBucket()
    isCompleted.value = !aborted
    group.status = aborted ? 'error' : 'done'
    saveQueueCache(queueState.value)

    if (!aborted && typeof onComplete === 'function') {
      onComplete({
        total: total.value,
        successCount: successCount.value,
        failCount: failCount.value,
        failedFiles: failedFiles.value
      })
    }

    if (aborted) needsResume.value = true
    resetTaskStatus()
  }

  return {
    open,
    setDefaults,
    getQueue,
    getRecentQueue,
    clearQueue,
    removeGroup,
    hasUnfinished,
    continuePending,
    uploadedUrls,
    loading,
    error,
    total,
    successCount,
    failCount,
    failedFiles,
    isCompleted,
    ident,
    queue: queueState,
    needsResume
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
  const ext = mimeToExt[type] || 'jpg'
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

/* 

查看队列状态

queue（或 getQueue()）返回完整队列，可实时查看每个任务的 status、result、error 等信息。

getRecentQueue() 返回最近 100 条上传记录。

clearQueue() 可手动清空队列。

队列信息会自动存储到 localStorage，页面刷新后仍可获取最近 100 条记录，键名为 imageUploadHistory

状态说明：

waiting：已加入队列，等待上传

compressing：正在压缩（若需要生成缩略图）

uploading：正在上传到服务器

done：上传成功

error：上传失败
*/
