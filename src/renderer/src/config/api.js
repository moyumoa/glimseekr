import request from './request.js'

export const $api = {
  /* 登录 */
  auth: {
    login: (data) => request({ url: '/middle/af/login', method: 'post', data }),
    // 发送验证码
    sendCode: (data) => request({ url: '/middle/af/send-code', method: 'post', data }),
  },

  space: {
    /* 新建空间文件夹 */
    create: (data) => request({ url: '/middle/space/folder', method: 'post', data }),
    /* 查询空间文件夹 */
    list: (params) => request({ url: '/middle/space/folder', method: 'get', params }),
    /* 修改更新空间文件夹 */
    update: (data) => request({ url: '/middle/space/folder', method: 'put', data }),
    /* 删除空间文件夹 */
    delete: (data) => request({ url: '/middle/space/folder', method: 'delete', data }),
    /* 图片入库 */
    picstorage: (data) => request({ url: '/middle/space/picstorage', method: 'post', data }),
    /* 查询空间桶信息 */
    bucket: (params) => request({ url: '/middle/space/bucket', method: 'get', params }),
  },

  folderPic: {
    /* 查询相册内照片 */
    list: (params) => request({ url: '/middle/space/folder-pics', method: 'get', params }),
    /* 删除相册内照片 */
    delete: (data) => request({ url: '/middle/space/folder-pics', method: 'delete', data }),
  },

  /* 获取七牛云token */
  qiniuToken: (params) => request({ url: '/un/qn/tk', method: 'get', params })
}
