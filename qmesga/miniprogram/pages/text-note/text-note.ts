// pages/text-note/text-note.ts
import { saveNote } from '../../utils/storage'
import { applyTheme, isDarkMode } from '../../utils/theme'
import { messageApi } from '../../utils/api'

const _initDark = isDarkMode()

Page({
  data: {
    statusBarHeight: 0,
    metaBarTop: 88,
    darkMode: _initDark,
    scrollTop: 156,
    scrollBottom: 240,
    mdToolbarBottom: 160,
    actionsBottom: 0,
    charCount: 0,
    lastEdited: '刚刚',
    template: '',
    keyboardHeight: 0,
    hasDraft: false,
    formats: {} as Record<string, any>,
    userId: '',
    isSaving: false,
  },

  _autoSaveTimer: null as ReturnType<typeof setTimeout> | null,
  _editorCtx: null as WechatMiniprogram.EditorContext | null,

  TEMPLATES: {
    '会议纪要': '<h2>会议纪要</h2><p><strong>日期：</strong></p><p><strong>参与者：</strong></p><h3>议题</h3><ol><li></li></ol><h3>行动项</h3><ul data-list="check"><li></li></ul>',
    '读书笔记': '<h2>读书笔记</h2><p><strong>书名：</strong></p><p><strong>作者：</strong></p><h3>核心观点</h3><h3>金句摘录</h3><blockquote><p></p></blockquote><h3>个人感悟</h3>',
    '心情随笔': '<h2>心情随笔</h2><p><strong>日期：</strong>{{date}}</p><p>今天...</p>',
    '旅行日记': '<h2>旅行日记</h2><p><strong>目的地：</strong></p><p><strong>日期：</strong></p><h3>今日行程</h3><h3>特别记忆</h3>',
  } as Record<string, string>,

  onLoad(options: { template?: string }) {
    const sysInfo = wx.getSystemInfoSync()
    const sb = sysInfo.statusBarHeight || 0
    const topBarH = sb + 44

    this.setData({
      statusBarHeight: sb,
      metaBarTop: topBarH,
      scrollTop: topBarH + 68,
    })

    const templateName = options.template ? decodeURIComponent(options.template) : ''
    if (templateName) {
      this.setData({ template: templateName })
    }

    // 获取用户ID
    const userId = wx.getStorageSync('userId') || ''
    this.setData({ userId })

    wx.onKeyboardHeightChange((res) => {
      const kbHeight = res.height
      this.setData({
        keyboardHeight: kbHeight,
        scrollBottom: kbHeight > 0 ? kbHeight + 240 : 240,
        mdToolbarBottom: kbHeight > 0 ? kbHeight + 160 : 160,
        actionsBottom: kbHeight > 0 ? kbHeight : 0,
      })
    })
  },

  onShow() {
    applyTheme(this)
  },

  onUnload() {
    wx.offKeyboardHeightChange(() => {})
    if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer)
  },

  /** editor 组件就绪 */
  onEditorReady() {
    wx.createSelectorQuery()
      .select('#editor')
      .context((res) => {
        this._editorCtx = res.context as WechatMiniprogram.EditorContext

        const templateName = this.data.template
        if (templateName && this.TEMPLATES[templateName]) {
          const html = this.TEMPLATES[templateName].replace('{{date}}', new Date().toLocaleDateString('zh-CN'))
          this._editorCtx.setContents({
            html,
            success: () => this._updateCharCount(),
          })
        } else {
          // 尝试恢复草稿
          const draft = wx.getStorageSync('draft_note_html') as string
          if (draft) {
            this._editorCtx.setContents({
              html: draft,
              success: () => {
                this.setData({ hasDraft: true, lastEdited: '已恢复草稿' })
                this._updateCharCount()
              },
            })
          }
        }
      })
      .exec()
  },

  /** 格式状态变化 */
  onEditorStatusChange(e: any) {
    this.setData({ formats: e.detail })
  },

  /** 编辑器内容输入 */
  onEditorInput() {
    this.setData({ lastEdited: '刚刚' })
    this._updateCharCount()

    // 自动保存
    if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer)
    this._autoSaveTimer = setTimeout(() => {
      this._getHtml((html: string) => {
        wx.setStorageSync('draft_note_html', html)
      })
    }, 1500)
  },

  /** 获取编辑器 HTML 内容 */
  _getHtml(cb: (html: string) => void) {
    if (!this._editorCtx) return
    this._editorCtx.getContents({
      success: (res) => cb(res.html || ''),
    })
  },

  /** 更新字数统计 */
  _updateCharCount() {
    if (!this._editorCtx) return
    this._editorCtx.getContents({
      success: (res) => {
        const text = (res.text || '').replace(/\n/g, '')
        this.setData({ charCount: text.length })
      },
    })
  },

  // ===== 格式化操作 =====

  /** 加粗/斜体/下划线/删除线/引用 */
  formatText(e: WechatMiniprogram.TouchEvent) {
    if (!this._editorCtx) return
    const name = e.currentTarget.dataset.name as string
    this._editorCtx.format(name)
  },

  /** 标题 */
  formatHeading(e: WechatMiniprogram.TouchEvent) {
    if (!this._editorCtx) return
    const level = parseInt(e.currentTarget.dataset.level, 10)
    const current = this.data.formats.header
    // 再次点击取消标题
    this._editorCtx.format('header', current === level ? '0' : String(level))
  },

  /** 列表 */
  formatList(e: WechatMiniprogram.TouchEvent) {
    if (!this._editorCtx) return
    const type = e.currentTarget.dataset.type as string
    const current = this.data.formats.list
    this._editorCtx.format('list', current === type ? '' : type)
  },

  /** 对齐方式 */
  formatAlign(e: WechatMiniprogram.TouchEvent) {
    if (!this._editorCtx) return
    const align = e.currentTarget.dataset.align as string
    this._editorCtx.format('align', align)
  },

  /** 插入分割线 */
  insertDivider() {
    if (!this._editorCtx) return
    this._editorCtx.insertDivider()
  },

  /** 清除格式 */
  clearFormat() {
    if (!this._editorCtx) return
    this._editorCtx.removeFormat()
  },

  /** 撤销 */
  editorUndo() {
    if (!this._editorCtx) return
    this._editorCtx.undo()
  },

  /** 重做 */
  editorRedo() {
    if (!this._editorCtx) return
    this._editorCtx.redo()
  },

  // ===== 底部操作按钮 =====

  saveDraft() {
    this._getHtml((html: string) => {
      wx.setStorageSync('draft_note_html', html)
      this.setData({ lastEdited: '刚刚' })
      wx.showToast({ title: '草稿已保存', icon: 'success' })
    })
  },

  /** 保存笔记到后端 */
  async sendNote() {
    this._getHtml(async (html: string) => {
      const text = html.replace(/<[^>]+>/g, '')
      if (!text.trim()) {
        wx.showToast({ title: '请先输入内容', icon: 'none' })
        return
      }
      const charCount = this.data.charCount
      const userId = this.data.userId

      wx.showModal({
        title: '保存笔记',
        content: `确认保存这篇笔记吗？（${charCount} 字）`,
        confirmText: '保存',
        success: async (res) => {
          if (res.confirm) {
            this.setData({ isSaving: true })
            try {
              if (userId) {
                // 调用后端接口保存
                await messageApi.create({
                  userId,
                  type: 'text',
                  title: this.data.template || '文本笔记',
                  content: html,
                  template: this.data.template,
                  charCount,
                })
              } else {
                // 未登录，保存到本地
                saveNote({
                  type: 'text',
                  content: html,
                  template: this.data.template,
                  charCount,
                })
              }
              wx.removeStorageSync('draft_note_html')
              wx.showToast({ title: '笔记已保存！', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1500)
            } catch (err) {
              console.error('保存失败:', err)
              // 回退到本地保存
              saveNote({
                type: 'text',
                content: html,
                template: this.data.template,
                charCount,
              })
              wx.removeStorageSync('draft_note_html')
              wx.showToast({ title: '笔记已保存！', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1500)
            } finally {
              this.setData({ isSaving: false })
            }
          }
        },
      })
    })
  },

  goBack() {
    this._getHtml((html: string) => {
      const text = html.replace(/<[^>]+>/g, '')
      if (text.trim()) {
        wx.showModal({
          title: '离开笔记',
          content: '是否保存草稿后退出？',
          confirmText: '保存并退出',
          cancelText: '直接退出',
          success: (res) => {
            if (res.confirm) {
              wx.setStorageSync('draft_note_html', html)
              wx.showToast({ title: '草稿已保存', icon: 'success' })
            }
            wx.navigateBack()
          },
        })
      } else {
        wx.navigateBack()
      }
    })
  },
})
