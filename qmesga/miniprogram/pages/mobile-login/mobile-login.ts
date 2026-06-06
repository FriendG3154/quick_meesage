// pages/mobile-login/mobile-login.ts
import { saveUserProfile } from '../../utils/storage'
import { applyTheme, isDarkMode } from '../../utils/theme'

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

  doLogin() {
    if (!this.data.canLogin) return
    wx.showLoading({ title: '登录中...' })
    setTimeout(() => {
      wx.hideLoading()
      const app = getApp<IAppOption>()
      app.globalData.isLoggedIn = true
      wx.setStorageSync('isLoggedIn', true)
      // 保存手机号用户信息
      const phone = this.data.phone
      saveUserProfile({
        nickname: '手机用户',
        userId: `USER_${phone.slice(-4)}`,
      })
      wx.reLaunch({ url: '/pages/index/index' })
    }, 1200)
  },

  goBackToWechatLogin() {
    wx.navigateBack()
  },
})
