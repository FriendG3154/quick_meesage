// pages/index/index.ts
import { getRecentNotes, deleteNote } from '../../utils/storage'
import { applyTheme, isDarkMode } from '../../utils/theme'
import { messageApi } from '../../utils/api'
import type { NoteItem } from '../../utils/storage'

const app = getApp<IAppOption>()
const _initDark = isDarkMode()

Page({
  data: {
    statusBarHeight: 0,
    darkMode: _initDark,
    recentNotes: [] as NoteItem[],
    hasNotes: false,
    userId: '',
    isLoading: false,
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: systemInfo.statusBarHeight || 0 })

    // 获取用户ID
    const userId = wx.getStorageSync('userId') || ''
    this.setData({ userId })
  },

  onShow() {
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

  /** 从后端加载笔记列表 */
  async _loadRecentNotes() {
    const userId = this.data.userId
    if (!userId) {
      // 未登录，使用本地数据
      const notes = getRecentNotes(5)
      this.setData({ recentNotes: notes, hasNotes: notes.length > 0 })
      return
    }

    this.setData({ isLoading: true })
    try {
      const result = await messageApi.list({ userId, pageSize: 5 })
      const items = (result as any)?.items || []
      // 转换后端数据格式为前端格式
      const notes: NoteItem[] = items.map((item: any) => ({
        id: item.id,
        type: item.type as 'voice' | 'drawing' | 'text',
        title: item.title || this.getDefaultTitle(item.type),
        content: item.content || '',
        template: item.template || '',
        charCount: item.charCount || 0,
        duration: item.duration || 0,
        createdAt: new Date(item.createdAt).getTime(),
        updatedAt: new Date(item.updatedAt).getTime(),
      }))
      this.setData({ recentNotes: notes, hasNotes: notes.length > 0 })
    } catch (err) {
      console.error('加载笔记失败:', err)
      // 回退到本地数据
      const notes = getRecentNotes(5)
      this.setData({ recentNotes: notes, hasNotes: notes.length > 0 })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  getDefaultTitle(type: string): string {
    const date = new Date()
    const prefix = type === 'voice' ? '语音记录' : type === 'drawing' ? '手绘创意' : '文本笔记'
    return `${prefix} ${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
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
    if (type === 'voice') return '\u{1F3A4}'
    if (type === 'drawing') return '\u{270F}\u{FE0F}'
    return '\u{1F4DD}'
  },

  getTypeLabel(type: string): string {
    if (type === 'voice') return '语音'
    if (type === 'drawing') return '手绘'
    return '文本'
  },

  /** 删除笔记（调用后端接口） */
  async deleteNoteItem(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    wx.showModal({
      title: '删除笔记',
      content: '确定要删除这条笔记吗？',
      confirmText: '删除',
      confirmColor: '#ba1a1a',
      success: async (res) => {
        if (res.confirm) {
          try {
            await messageApi.softDelete(id)
            wx.showToast({ title: '已删除', icon: 'success' })
            this._loadRecentNotes()
          } catch (err) {
            console.error('删除失败:', err)
            // 回退到本地删除
            deleteNote(id)
            this._loadRecentNotes()
            wx.showToast({ title: '已删除', icon: 'success' })
          }
        }
      },
    })
  },
})
