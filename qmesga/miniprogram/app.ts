// app.ts
import { isDarkMode } from './utils/theme'

App<IAppOption>({
  globalData: {
    userInfo: null as WechatMiniprogram.UserInfo | null,
    isLoggedIn: false,
    statusBarHeight: 0,
    navBarHeight: 0,
    darkMode: false,
  },
  onLaunch() {
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.statusBarHeight = systemInfo.statusBarHeight || 0
    this.globalData.navBarHeight = (systemInfo.statusBarHeight || 0) + 44
    this.globalData.darkMode = isDarkMode()

    // Check local login status
    const isLoggedIn = wx.getStorageSync('isLoggedIn') || false
    this.globalData.isLoggedIn = isLoggedIn

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