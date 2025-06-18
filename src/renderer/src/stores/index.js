import { defineStore } from 'pinia'

export const useStore = defineStore('dataStore', {
  state: () => ({
    datas: {},
    uinfos: {
      total: 0,
      used: 0,
      remain: 0,
      percent: 0,
      totalDisplay: '0MB',
      usedDisplay: '0MB',
      remainDisplay: '0MB'
    }
  }),

  persist: true,

  actions: {
    // 设置某个页面的信息
    setDatasInfo(dKey, info) {
      this.datas[dKey] = {
        ...(this.datas[dKey] || {}),
        ...info
      }
    },

    // 获取某个页面的信息
    getDatasInfo(dKey) {
      return this.datas[dKey] || {}
    },

    // 清除某个页面信息
    clearDatasInfo(dKey) {
      delete this.datas[dKey]
    },

    // 清空全部缓存
    clearAllDatas() {
      this.datas = {}
    }
  }
})
