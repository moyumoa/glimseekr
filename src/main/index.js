import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let win = null
let splash = null
function createSplashWindow() {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    center: true,
    show: true
    // closable: false, // 防止用户提前关闭
  })

  splash.loadFile(join(__dirname, '../renderer/splash.html'))
}

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1280,
    height: 960,
    minWidth: 1280,
    minHeight: 960,
    show: true, // 页面加载完才显示窗口（避免白屏）
    fullscreenable: false, // 禁止全屏
    autoHideMenuBar: true, // 隐藏菜单栏
    frame: true, // 是否显示窗口边框
    titleBarStyle: 'hiddenInset', // macOS 下更简洁的标题栏 可选值有hiddenInset|default
    trafficLightPosition: { x: 10, y: 10 }, // macOS 下的红绿灯位置
    backgroundColor: '#000000', // 窗口背景色
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false, // 禁用 Node.js 集成
      contextIsolation: true, // 启用上下文隔离
      devTools: true, // 是否启用开发者工具
      webSecurity: true, // 是否启用网页安全
      sandbox: false
    }
  })

  // win.maximize()
  // win.setMinimumSize(1280, 960)

  win.on('ready-to-show', () => {
    win.show()
  })

  // 👇 禁止缩放行为
  win.webContents.on('did-finish-load', () => {
    win.webContents.setZoomFactor(1)
    win.webContents.setVisualZoomLevelLimits(1, 1)
  })

  win.webContents.on('before-input-event', (event, input) => {
    const isZoomShortcut =
      (input.control || input.meta) && ['+', '-', '=', 'Add', 'Subtract'].includes(input.key)
    if (isZoomShortcut) event.preventDefault()
  })

  // 👇 监听前端双击触发的 toggle-maximize 事件
  ipcMain.on('toggle-maximize', () => {
    const focused = BrowserWindow.getFocusedWindow()
    if (!focused) return
    focused.isMaximized() ? focused.unmaximize() : focused.maximize()
  })

  ipcMain.on('login-success', () => {
    if (win) win.maximize()
  })

  /*  win.webContents.setWindowOpenHandler((details) => {
    if (details.url.startsWith('https://oss.cvxv.cn')) {
      // 允许自己内部打开新窗口
      return { action: 'allow' }
    }
    // 其它的，比如奇怪的网址，全部用默认浏览器打开！
    shell.openExternal(details.url)
    return { action: 'deny' }
  }) */

  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsedUrl = new URL(url)

      if (
        parsedUrl.searchParams.get('internal') === '1' ||
        parsedUrl.hash === '#internal-preview'
      ) {
        return { action: 'allow' }
      }

      shell.openExternal(url)
      return { action: 'deny' }
    } catch (err) {
      console.error('🚨 无法解析 URL:', url, err)
      shell.openExternal(url)
      return { action: 'deny' }
    }
  })

  // 页面加载完成再显示主窗口
  win.webContents.on('did-finish-load', () => {
    if (splash && !splash.isDestroyed()) {
      splash.close()
      splash = null
    }

    if (win && !win.isDestroyed()) {
      win.show()
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

//这个方法将在Electron完成时被调用
//初始化，并准备创建浏览器窗口。
//某些api只能在此事件发生后使用。
app.whenReady().then(() => {
  createSplashWindow() // 👈 先显示 loading 页

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = `
      default-src 'self' oss.cvxv.cn;
      img-src 'self' blob: data: oss.cvxv.cn glimseekr-oss.sigohub.cc svhh0fws8.hd-bkt.clouddn.com devtool.tech;
      style-src 'self' 'unsafe-inline' oss.cvxv.cn;
      script-src 'self' oss.cvxv.cn;
      font-src 'self' oss.cvxv.cn;
      connect-src 'self' oss.cvxv.cn upload-cn-east-2.qiniup.com up-z0.qiniup.com 127.0.0.1:3000;
    `
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp.replace(/\n/g, '')] // ⚡去掉多余换行
      }
    })
  })

  createWindow()

  // 设置windows应用的用户模型id
  electronApp.setAppUserModelId('com.electron')

  //在开发中默认使用F12打开或关闭DevTools
  //忽略生产环境中的CommandOrControl + R。
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  app.on('activate', function () {
    //在macOS上，通常会在应用程序中重新创建一个窗口
    //单击dock图标，没有其他窗口打开。
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

//当所有窗口都关闭时退出，除了macOS。在那里，这很常见
//让应用程序及其菜单栏保持活动状态，直到用户退出
//显式地使用Cmd + Q。
app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('second-instance', () => {
  if (win) {
    // 如果用户尝试打开另一个窗口，聚焦主窗口
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
