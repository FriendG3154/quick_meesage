// app.ts
import { isDarkMode } from './utils/theme'
import { userApi } from './utils/api'

App<IAppOption>({
  globalData: {
    userInfo: null as WechatMiniprogram.UserInfo | null,
    isLoggedIn: false,
    statusBarHeight: 0,
    navBarHeight: 0,
    darkMode: false,
    userId: '',
  },
  onLaunch() {
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.statusBarHeight = systemInfo.statusBarHeight || 0
    this.globalData.navBarHeight = (systemInfo.statusBarHeight || 0) + 44
    this.globalData.darkMode = isDarkMode()

    // 检查本地登录状态
    const isLoggedIn = wx.getStorageSync('isLoggedIn') || false
    const userId = wx.getStorageSync('userId') || ''
    this.globalData.isLoggedIn = isLoggedIn
    this.globalData.userId = userId

    // 未登录时跳转到登录页
    if (!isLoggedIn) {
      wx.reLaunch({ url: '/pages/login/login' })
    }

    // 监听系统主题变化
    wx.onThemeChange(() => {
      this.globalData.darkMode = isDarkMode()
      const pages = getCurrentPages()
      pages.forEach((p: any) => {
        if (typeof p.applyTheme === 'function') {
          p.applyTheme()
        }
      })
    })
  },
})
