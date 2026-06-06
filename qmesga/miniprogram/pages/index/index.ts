// index.ts - Record Selection Page
import { getRecentNotes, deleteNote } from '../../utils/storage'
import { applyTheme, isDarkMode } from '../../utils/theme'
import type { NoteItem } from '../../utils/storage'

const app = getApp<IAppOption>()
const _initDark = isDarkMode()

Page({
  data: {
    statusBarHeight: 0,
    darkMode: _initDark,
    recentNotes: [] as NoteItem[],
    hasNotes: false,
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: systemInfo.statusBarHeight || 0 })
  },

  onShow() {
    // Update custom tab bar selected state
    const tabBar = this.getTabBar() as any
    if (tabBar) {
      tabBar.setData({ selected: 1 })
    }
    this.applyTheme()
    this._loadRecentNotes()
  },

  applyTheme() {
    applyTheme(this)
    const tabBar = this.getTabBar() as any
    if (tabBar && tabBar.applyTheme) tabBar.applyTheme()
  },

  _loadRecentNotes() {
    const notes = getRecentNotes(5)
    this.setData({ recentNotes: notes, hasNotes: notes.length > 0 })
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  goVoiceRecord() {
    wx.navigateTo({ url: '/pages/voice-record/voice-record' })
  },

  goDrawing() {
    wx.navigateTo({ url: '/pages/drawing/drawing' })
  },

  goTextNote() {
    wx.navigateTo({ url: '/pages/text-note/text-note' })
  },

  useTemplate(e: WechatMiniprogram.TouchEvent) {
    const name = e.currentTarget.dataset.name as string
    wx.navigateTo({ url: `/pages/text-note/text-note?template=${encodeURIComponent(name)}` })
  },

  getTypeIcon(type: string): string {
    if (type === 'voice') return '🎙'
    if (type === 'drawing') return '✏️'
    return '📝'
  },

  getTypeLabel(type: string): string {
    if (type === 'voice') return '语音'
    if (type === 'drawing') return '手绘'
    return '文本'
  },

  deleteNoteItem(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    wx.showModal({
      title: '删除笔记',
      content: '确定要删除这条笔记吗？',
      confirmText: '删除',
      confirmColor: '#ba1a1a',
      success: (res) => {
        if (res.confirm) {
          deleteNote(id)
          this._loadRecentNotes()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  },
})

