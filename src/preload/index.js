import { contextBridge, ipcRenderer, shell } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('myElectron', {
      platform: process.platform, // 💡 关键：注入平台信息
      isElectron: true,
      toggleMaximize: () => ipcRenderer.send('toggle-maximize'),
      loginSuccess: () => ipcRenderer.send('login-success')
    }),
    contextBridge.exposeInMainWorld('shell',  {
      openExternal: (url) => shell.openExternal(url),
      openPath: (path) => shell.openPath(path)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
