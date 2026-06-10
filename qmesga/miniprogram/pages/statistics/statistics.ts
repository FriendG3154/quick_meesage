// pages/statistics/statistics.ts
import { getStats } from '../../utils/storage'
import { applyTheme, isDarkMode } from '../../utils/theme'
import { userApi } from '../../utils/api'
import type { StatsData } from '../../utils/storage'

const _initDark = isDarkMode()

Page({
  data: {
    statusBarHeight: 0,
    darkMode: _initDark,
    totalNotes: 0,
    thisWeekTotal: 0,
    lastWeekTotal: 0,
    weekGrowthRate: '0',
    voiceCount: 0,
    drawingCount: 0,
    textCount: 0,
    voicePct: 0,
    drawingPct: 0,
    textPct: 0,
    userId: '',
    isLoading: false,
    hasBackendData: false,
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 0 })
    const userId = wx.getStorageSync('userId') || ''
    this.setData({ userId })
  },

  onShow() {
    const tabBar = this.getTabBar() as any
    if (tabBar) tabBar.setData({ selected: 0 })
    this.applyTheme()
    this._loadStats()
  },

  applyTheme() {
    applyTheme(this)
    const tabBar = this.getTabBar() as any
    if (tabBar && tabBar.applyTheme) tabBar.applyTheme()
  },

  /** 加载统计数据 */
  async _loadStats() {
    const userId = this.data.userId
    if (!userId) {
      // 未登录，使用本地数据
      this._loadLocalStats()
      return
    }

    this.setData({ isLoading: true })
    try {
      const stats = await userApi.getStats(userId) as any
      const total = stats.totalNotes || 1
      this.setData({
        totalNotes: stats.totalNotes || 0,
        thisWeekTotal: stats.thisWeekTotal || 0,
        lastWeekTotal: stats.lastWeekTotal || 0,
        weekGrowthRate: stats.weekGrowthRate > 0 ? `+${stats.weekGrowthRate}` : `${stats.weekGrowthRate}`,
        voiceCount: stats.voiceCount || 0,
        drawingCount: stats.drawingCount || 0,
        textCount: stats.textCount || 0,
        voicePct: Math.round(((stats.voiceCount || 0) / total) * 100),
        drawingPct: Math.round(((stats.drawingCount || 0) / total) * 100),
        textPct: Math.round(((stats.textCount || 0) / total) * 100),
        hasBackendData: true,
        isLoading: false,
      })
    } catch (err) {
      console.error('加载统计失败:', err)
      this._loadLocalStats()
    }
  },

  /** 加载本地统计数据 */
  _loadLocalStats() {
    const stats: StatsData = getStats()
    const total = stats.totalNotes || 1
    this.setData({
      totalNotes: stats.totalNotes,
      thisWeekTotal: stats.thisWeekTotal,
      lastWeekTotal: stats.lastWeekTotal,
      weekGrowthRate: stats.weekGrowthRate > 0 ? `+${stats.weekGrowthRate}` : `${stats.weekGrowthRate}`,
      voiceCount: stats.voiceCount,
      drawingCount: stats.drawingCount,
      textCount: stats.textCount,
      voicePct: Math.round((stats.voiceCount / total) * 100),
      drawingPct: Math.round((stats.drawingCount / total) * 100),
      textPct: Math.round((stats.textCount / total) * 100),
      hasBackendData: false,
      isLoading: false,
    })
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  },
})
