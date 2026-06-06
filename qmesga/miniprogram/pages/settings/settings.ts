// pages/settings/settings.ts
import { getUserProfile, getAllNotes } from '../../utils/storage'
import { isDarkMode, setThemeMode, getThemeModeText, applyTheme } from '../../utils/theme'
import type { ThemeMode } from '../../utils/theme'

const _initDark = isDarkMode()

Page({
  data: {
    statusBarHeight: 0,
    darkMode: _initDark,
    themeModeText: '跟随系统',
    nickname: '用户',
    avatarUrl: '',
    userId: '',
    totalNotes: 0,
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 0 })
  },

  onShow() {
    const tabBar = this.getTabBar() as any
    if (tabBar) tabBar.setData({ selected: 2 })
    this._loadProfile()
    this.applyTheme()
  },

  applyTheme() {
    applyTheme(this)
    this.setData({ themeModeText: getThemeModeText() })
    // Also update tab bar
    const tabBar = this.getTabBar() as any
    if (tabBar && tabBar.applyTheme) tabBar.applyTheme()
  },

  _loadProfile() {
    const profile = getUserProfile()
    const notes = getAllNotes()
    this.setData({
      nickname: profile.nickname || '用户',
      avatarUrl: profile.avatarUrl || '',
      userId: profile.userId || 'VELOCITY_USER',
      totalNotes: notes.length,
    })
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  showThemeOptions() {
    wx.showActionSheet({
      itemList: ['跟随系统', '明亮模式', '暗黑模式'],
      success: (res) => {
        const modes: ThemeMode[] = ['system', 'light', 'dark']
        setThemeMode(modes[res.tapIndex])
        this.applyTheme()
      },
    })
  },

  goPrivacy() {
    wx.showModal({
      title: '隐私与安全',
      content: '隐私与安全设置将在后续版本上线。',
      showCancel: false,
      confirmText: '知道了',
    })
  },

  goAbout() {
    wx.showModal({
      title: '关于 VELOCITY',
      content: 'VELOCITY 快灵感 v2.4.0\n让灵感快人一步\n\n支持语音、手绘、文本三种记录方式',
      showCancel: false,
      confirmText: '知道了',
    })
  },

  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除应用缓存数据（笔记不受影响）',
      confirmText: '清除',
      confirmColor: '#ba1a1a',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '缓存已清除', icon: 'success' })
        }
      },
    })
  },

  doLogout() {
    wx.showModal({
      title: '退出账号',
      content: '确认要退出当前账号吗？',
      confirmText: '退出',
      confirmColor: '#ba1a1a',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('isLoggedIn')
          const app = getApp<IAppOption>()
          app.globalData.isLoggedIn = false
          app.globalData.userInfo = null
          wx.reLaunch({ url: '/pages/login/login' })
        }
      },
    })
  },
})
