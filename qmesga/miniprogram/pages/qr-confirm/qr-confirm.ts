// pages/qr-confirm/qr-confirm.ts
import { qrLoginApi } from '../../utils/api'

/**
 * 扫码确认登录页面
 * 小程序扫描二维码后跳转至此页面进行确认
 * 仅管理员(role=2)可登录管理后台
 */
Page({
  data: {
    token: '',
    loading: false,
    error: '',
    showConfirm: false,
    adminName: '',
  },

  onLoad(options: Record<string, string | undefined>) {
    const token = options.token || ''
    if (!token) {
      this.setData({ error: '无效的二维码' })
      return
    }

    // 检查用户是否已登录
    const userId = wx.getStorageSync('userId') || ''
    if (!userId) {
      this.setData({ error: '请先登录小程序' })
      return
    }

    this.setData({ token, showConfirm: true })
  },

  /**
   * 确认登录管理后台
   */
  async handleConfirm() {
    const { token } = this.data
    const userId = wx.getStorageSync('userId') || ''

    if (!userId) {
      wx.showToast({ title: '请先登录小程序', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      // 步骤1：调用扫码接口（后端会校验管理员权限）
      await qrLoginApi.scan({ token, userId })

      // 步骤2：调用确认接口
      await qrLoginApi.confirm({ token })

      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
      })

      // 延迟返回
      setTimeout(() => {
        wx.navigateBack({
          fail: () => {
            wx.switchTab({ url: '/pages/index/index' })
          },
        })
      }, 1500)
    } catch (err: any) {
      const errorMessage = err.message || '操作失败'
      this.setData({ error: errorMessage, loading: false })
      wx.showToast({ title: errorMessage, icon: 'none' })
    }
  },

  /**
   * 取消登录
   */
  handleCancel() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' })
      },
    })
  },
})
