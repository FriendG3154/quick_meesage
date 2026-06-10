// pages/login/login.ts
import { saveUserProfile } from '../../utils/storage'
import { applyTheme, isDarkMode } from '../../utils/theme'
import { userApi } from '../../utils/api'

const _initDark = isDarkMode()

Page({
  data: {
    darkMode: _initDark,
    isLoggingIn: false,
  },

  onShow() {
    applyTheme(this)
  },

  /** 微信小程序快捷登录 */
  async wxQuickLogin() {
    if (this.data.isLoggingIn) return

    this.setData({ isLoggingIn: true })
    wx.showLoading({ title: '登录中...' })

    try {
      // 1. 调用 wx.login 获取 code
      const loginRes = await new Promise<WechatMiniprogram.LoginSuccessCallbackResult>((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        })
      })

      if (!loginRes.code) {
        throw new Error('获取登录凭证失败')
      }

      // 2. 获取用户头像和昵称
      const userInfoRes = await this._getUserProfile()

      // 3. 调用后端 wxLogin 接口（code换openid，自动注册）
      const result = await userApi.wxLogin({
        code: loginRes.code,
        wxName: userInfoRes.nickName || '微信用户',
        avatarUrl: userInfoRes.avatarUrl || '',
      })

      // 4. 保存登录状态到全局
      const app = getApp<IAppOption>()
      app.globalData.isLoggedIn = true
      app.globalData.userId = result.user.id
      wx.setStorageSync('isLoggedIn', true)
      wx.setStorageSync('userId', result.user.id)
      saveUserProfile({
        nickname: result.user.wxName || '微信用户',
        userId: result.user.id,
      })

      wx.hideLoading()

      // 5. 显示欢迎提示
      if (result.isNewUser) {
        wx.showToast({ title: '注册成功！', icon: 'success' })
      } else {
        wx.showToast({ title: '登录成功！', icon: 'success' })
      }

      // 6. 跳转到首页
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/index/index' })
      }, 800)
    } catch (err) {
      wx.hideLoading()
      console.error('微信登录失败:', err)
      wx.showModal({
        title: '登录失败',
        content: err instanceof Error ? err.message : '请检查网络后重试',
        showCancel: false,
        confirmText: '知道了',
      })
    } finally {
      this.setData({ isLoggingIn: false })
    }
  },

  /**
   * 获取用户头像和昵称
   * 使用 wx.getUserProfile 或 wx.getUserInfo
   */
  _getUserProfile(): Promise<{ nickName: string; avatarUrl: string }> {
    return new Promise((resolve) => {
      // 优先使用 wx.getUserProfile（需要用户点击触发）
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          resolve({
            nickName: res.userInfo.nickName,
            avatarUrl: res.userInfo.avatarUrl,
          })
        },
        fail: () => {
          // 降级使用 wx.getUserInfo
          wx.getUserInfo({
            success: (res) => {
              resolve({
                nickName: res.userInfo.nickName,
                avatarUrl: res.userInfo.avatarUrl,
              })
            },
            fail: () => {
              // 如果都失败了，返回默认值
              resolve({
                nickName: '微信用户',
                avatarUrl: '',
              })
            },
          })
        },
      })
    })
  },
})
