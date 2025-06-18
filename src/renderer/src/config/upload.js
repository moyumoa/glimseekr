import axios from 'axios'

/**
 * 上传文件到七牛云
 * @param {File} file 要上传的文件
 * @param {string} token 七牛上传凭证（从后端获取）
 * @param {object} options 可选项：key（文件名）、uploadUrl（上传域名）、domain（CDN访问域名）
 * @returns {Promise<string>} 返回上传后的文件 URL
 */
const uploadUrl = 'https://up-z0.qiniup.com'
export async function uploadToQiniu(file, key, token) {
  return new Promise((resolve, reject) => {

    const formData = new FormData()
    formData.append('file', file)
    formData.append('token', token)
    formData.append('key', key)

    axios
      .post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then((response) => {
        if (response.status === 200) {
          resolve(response.data)
        } else {
          reject(new Error('上传失败'))
        }
      })
      .catch((error) => {
        reject(error)
      })
  })
}
