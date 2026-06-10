// pages/drawing/drawing.ts
import { saveNote } from '../../utils/storage'
import { applyTheme, isDarkMode } from '../../utils/theme'
import { messageApi, picApi } from '../../utils/api'

const _initDark = isDarkMode()

Page({
  data: {
    statusBarHeightRpx: 0,
    canvasTopRpx: 0,
    canvasHeightRpx: 0,
    canvasWidthPx: 375,
    canvasHeightPx: 600,
    darkMode: _initDark,
    toolbarExpanded: true,
    currentTool: 'pen',
    currentColor: '#0052FF',
    brushSize: 10,
    isEmpty: true,
    bgImage: '',
    colors: ['#0052FF', '#ba1a1a', '#002B85', '#ffb800', '#1a1c1c', '#6c7b6c'],
    userId: '',
    isSaving: false,
  },

  _ctx: null as WechatMiniprogram.CanvasContext | null,
  _isDrawing: false,
  _paths: [] as any[],
  _redoPaths: [] as any[],
  _currentPath: [] as any[],
  _canvasWidth: 375,
  _canvasHeight: 600,
  _bgImagePath: '' as string,

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const sbHeight = sysInfo.statusBarHeight || 0
    const canvasTop = sbHeight + 44
    this._canvasWidth = sysInfo.windowWidth
    this._canvasHeight = sysInfo.windowHeight - canvasTop
    const ratio = 750 / sysInfo.windowWidth
    this.setData({
      statusBarHeightRpx: Math.round(sbHeight * ratio),
      canvasTopRpx: Math.round(canvasTop * ratio),
      canvasHeightRpx: Math.round(this._canvasHeight * ratio)-200,
      canvasWidthPx: this._canvasWidth,
      canvasHeightPx: this._canvasHeight-300,
      userId: wx.getStorageSync('userId') || '',
    })
    this.applyTheme()

    setTimeout(() => {
      this._initCanvas()
    }, 200)
  },

  applyTheme() {
    applyTheme(this)
  },

  _initCanvas() {
    const ctx = wx.createCanvasContext('drawingCanvas', this)
    this._ctx = ctx
    this._drawBackground(ctx, () => {
      ctx.draw()
    })
  },

  _drawBackground(ctx: WechatMiniprogram.CanvasContext, cb?: () => void) {
    const bgColor = this.data.darkMode ? '#0F0F0F' : '#f9f9f9'
    ctx.setFillStyle(bgColor)
    ctx.fillRect(0, 0, this._canvasWidth, this._canvasHeight)
    if (this._bgImagePath) {
      ctx.drawImage(
        this._bgImagePath,
        0, 0,
        this._canvasWidth, this._canvasHeight
      )
    }
    if (cb) cb()
  },

  choosePhoto() {
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? 'album' : 'camera'
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: [sourceType as 'album' | 'camera'],
          success: (mediaRes) => {
            const tempPath = mediaRes.tempFiles[0].tempFilePath
            this._bgImagePath = tempPath
            this.setData({ bgImage: tempPath })
            this._redrawAll()
          },
        })
      },
    })
  },

  removePhoto() {
    this._bgImagePath = ''
    this.setData({ bgImage: '' })
    this._redrawAll()
  },

  onTouchStart(e: WechatMiniprogram.TouchEvent) {
    this._isDrawing = true
    const touch = e.touches[0] as any
    const x = touch.x as number
    const y = touch.y as number
    this._currentPath = [{ x, y }]
    this.setData({ isEmpty: false })
  },

  onTouchMove(e: WechatMiniprogram.TouchEvent) {
    if (!this._isDrawing || !this._ctx) return
    const touch = e.touches[0] as any
    const x = touch.x as number
    const y = touch.y as number
    const prev = this._currentPath[this._currentPath.length - 1]
    this._currentPath.push({ x, y })
    const ctx = this._ctx
    const isEraser = this.data.currentTool === 'eraser'
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(x, y)
    ctx.setStrokeStyle(isEraser ? (this.data.darkMode ? '#0F0F0F' : '#f9f9f9') : this.data.currentColor)
    ctx.setLineWidth(isEraser ? this.data.brushSize * 3 : this.data.brushSize)
    ctx.setLineCap('round')
    ctx.setLineJoin('round')
    ctx.stroke()
    ctx.draw(true)
  },

  onTouchEnd() {
    this._isDrawing = false
    if (this._currentPath.length > 0) {
      const bgColor = this.data.darkMode ? '#0F0F0F' : '#f9f9f9'
      this._paths.push({
        path: [...this._currentPath],
        color: this.data.currentTool === 'eraser' ? bgColor : this.data.currentColor,
        size: this.data.currentTool === 'eraser' ? this.data.brushSize * 3 : this.data.brushSize,
      })
      this._redoPaths = []
      this._currentPath = []
    }
  },

  selectTool(e: WechatMiniprogram.TouchEvent) {
    const tool = e.currentTarget.dataset.tool as string
    this.setData({ currentTool: tool })
  },

  selectColor(e: WechatMiniprogram.TouchEvent) {
    const color = e.currentTarget.dataset.color as string
    this.setData({ currentColor: color, currentTool: 'pen' })
  },

  setBrushSize(e: WechatMiniprogram.TouchEvent) {
    const size = e.currentTarget.dataset.size as number
    this.setData({ brushSize: size })
  },

  toggleToolbar() {
    this.setData({ toolbarExpanded: !this.data.toolbarExpanded })
  },

  undo() {
    if (this._paths.length === 0) return
    const undone = this._paths.pop()
    this._redoPaths.push(undone)
    this._redrawAll()
  },

  redo() {
    if (this._redoPaths.length === 0) return
    const redone = this._redoPaths.pop()
    this._paths.push(redone)
    this._redrawAll()
  },

  _redrawAll() {
    const ctx = this._ctx
    if (!ctx) return
    ctx.clearRect(0, 0, this._canvasWidth, this._canvasHeight)
    this._drawBackground(ctx)
    for (const p of this._paths) {
      if (p.path.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(p.path[0].x, p.path[0].y)
      for (let i = 1; i < p.path.length; i++) {
        ctx.lineTo(p.path[i].x, p.path[i].y)
      }
      ctx.setStrokeStyle(p.color)
      ctx.setLineWidth(p.size)
      ctx.setLineCap('round')
      ctx.setLineJoin('round')
      ctx.stroke()
    }
    ctx.draw()
    if (this._paths.length === 0 && !this._bgImagePath) this.setData({ isEmpty: true })
  },

  clearCanvas() {
    wx.showModal({
      title: '清除画板',
      content: '确定要清除所有内容吗？',
      confirmText: '清除',
      confirmColor: '#ba1a1a',
      success: (res) => {
        if (res.confirm) {
          this._paths = []
          this._redoPaths = []
          this._bgImagePath = ''
          this.setData({ bgImage: '' })
          this._initCanvas()
          this.setData({ isEmpty: true })
        }
      },
    })
  },

  /** 保存手绘作品 */
  async sendDrawing() {
    if (this.data.isEmpty) {
      wx.showToast({ title: '请先绘制内容', icon: 'none' })
      return
    }
    this.setData({ isSaving: true })
    wx.canvasToTempFilePath({
      canvasId: 'drawingCanvas',
      success: async (res) => {
        const userId = this.data.userId
        try {
          if (userId) {
            // 调用后端接口保存
            const result = await messageApi.create({
              userId,
              type: 'drawing',
              title: `手绘作品 ${new Date().toLocaleDateString('zh-CN')}`,
              content: res.tempFilePath,
            }) as any

            if (result?.id) {
              await picApi.create({
                userId,
                messageId: result.id,
                picUrl: res.tempFilePath,
              })
            }
          } else {
            // 未登录，保存到本地
            saveNote({
              type: 'drawing',
              content: res.tempFilePath,
            })
          }
          this.setData({ isSaving: false })
          wx.showToast({ title: '画作已保存！', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } catch (err) {
          console.error('保存失败:', err)
          // 回退到本地保存
          saveNote({
            type: 'drawing',
            content: res.tempFilePath,
          })
          this.setData({ isSaving: false })
          wx.showToast({ title: '画作已保存！', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      },
      fail: () => {
        this.setData({ isSaving: false })
        wx.showToast({ title: '保存失败', icon: 'none' })
      },
    }, this)
  },

  goBack() {
    wx.navigateBack()
  },
})
