// pages/statistics/statistics.ts
import { getStats } from '../../utils/storage'
import { applyTheme, isDarkMode } from '../../utils/theme'
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
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 0 })
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

  _loadStats() {
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
    })
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  },
})
