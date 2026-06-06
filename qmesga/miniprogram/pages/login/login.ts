// pages/login/login.ts
import { saveUserProfile } from '../../utils/storage'
import { applyTheme, isDarkMode } from '../../utils/theme'

const _initDark = isDarkMode()

Page({
  data: {
    darkMode: _initDark,
  },

  onShow() {
    applyTheme(this)
  },

  loginWithWechat() {
    wx.getUserProfile({
      desc: '用于完善个人资料',
      success: (res) => {
        const app = getApp<IAppOption>()
        app.globalData.userInfo = res.userInfo
        app.globalData.isLoggedIn = true
        wx.setStorageSync('isLoggedIn', true)
        saveUserProfile({
          nickname: res.userInfo.nickName,
          avatarUrl: res.userInfo.avatarUrl,
        })
        wx.reLaunch({ url: '/pages/index/index' })
      },
      fail: () => {
        // Demo: skip real auth
        const app = getApp<IAppOption>()
        app.globalData.isLoggedIn = true
        wx.setStorageSync('isLoggedIn', true)
        wx.reLaunch({ url: '/pages/index/index' })
      },
    })
  },

  goToMobileLogin() {
    wx.navigateTo({ url: '/pages/mobile-login/mobile-login' })
  },
})
