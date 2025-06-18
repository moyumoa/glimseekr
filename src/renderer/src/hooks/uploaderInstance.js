// hooks/uploaderInstance.js
import { useImageUploader } from '@/hooks'

// 全局共享的上传实例
// export const uploader = useImageUploader()

let _up_loader = null

export const uploader = () => {
  if (!_up_loader) {
    _up_loader = useImageUploader()
  }
  return _up_loader
}
