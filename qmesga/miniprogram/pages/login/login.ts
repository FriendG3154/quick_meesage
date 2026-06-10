// pages/login/login.ts
import { saveUserProfile } from '../../utils/storage'
import { applyTheme, isDarkMode } from '../../utils/theme'
import { userApi } from '../../utils/api'

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

  /** 调用后端微信登录接口 */
  async loginWithBackend() {
    wx.login({
      success: async (res) => {
        if (res.code) {
          try {
            // 实际项目中，这里需要将 code 发送到后端换取 openid
            // 这里使用模拟数据演示
            const result = await userApi.loginByWx({
              wxOpenid: `wx_${Date.now()}`,
              wxName: '微信用户',
            })

            const app = getApp<IAppOption>()
            app.globalData.isLoggedIn = true
            app.globalData.userId = result.user.id
            wx.setStorageSync('isLoggedIn', true)
            wx.setStorageSync('userId', result.user.id)
            saveUserProfile({
              nickname: result.user.wxName || '微信用户',
              userId: result.user.id,
            })
            wx.reLaunch({ url: '/pages/index/index' })
          } catch (err) {
            console.error('登录失败:', err)
            wx.showToast({ title: '登录失败', icon: 'none' })
          }
        }
      },
    })
  },

  goToMobileLogin() {
    wx.navigateTo({ url: '/pages/mobile-login/mobile-login' })
  },
})
