// pages/mobile-login/mobile-login.ts
import { saveUserProfile } from '../../utils/storage'
import { applyTheme, isDarkMode } from '../../utils/theme'
import { userApi } from '../../utils/api'

const _initDark = isDarkMode()

Page({
  data: {
    phone: '',
    code: '',
    codeSent: false,
    countdown: 60,
    canLogin: false,
    darkMode: _initDark,
  },

  _timer: null as ReturnType<typeof setTimeout> | null,

  onShow() {
    applyTheme(this)
  },

  onPhoneInput(e: WechatMiniprogram.Input) {
    this.setData({ phone: e.detail.value })
    this.checkCanLogin()
  },

  onCodeInput(e: WechatMiniprogram.Input) {
    this.setData({ code: e.detail.value })
    this.checkCanLogin()
  },

  checkCanLogin() {
    const { phone, code } = this.data
    this.setData({ canLogin: phone.length === 11 && code.length === 6 })
  },

  sendCode() {
    if (this.data.codeSent) return
    const { phone } = this.data
    if (phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    this.setData({ codeSent: true, countdown: 60 })
    wx.showToast({ title: '验证码已发送', icon: 'success' })
    this.startCountdown()
  },

  startCountdown() {
    const timer = setInterval(() => {
      const { countdown } = this.data
      if (countdown <= 1) {
        clearInterval(timer)
        this.setData({ codeSent: false, countdown: 60 })
      } else {
        this.setData({ countdown: countdown - 1 })
      }
    }, 1000)
  },

  /** 手机号登录 */
  async doLogin() {
    if (!this.data.canLogin) return
    wx.showLoading({ title: '登录中...' })

    try {
      const result = await userApi.loginByPhone({
        phone: this.data.phone,
        code: this.data.code,
      })

      wx.hideLoading()
      const app = getApp<IAppOption>()
      app.globalData.isLoggedIn = true
      app.globalData.userId = result.user.id
      wx.setStorageSync('isLoggedIn', true)
      wx.setStorageSync('userId', result.user.id)

      saveUserProfile({
        nickname: result.user.wxName || '手机用户',
        userId: result.user.id,
      })

      wx.reLaunch({ url: '/pages/index/index' })
    } catch (err) {
      wx.hideLoading()
      console.error('登录失败:', err)
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  },

  goBackToWechatLogin() {
    wx.navigateBack()
  },
})
