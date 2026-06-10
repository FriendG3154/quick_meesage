// utils/api.ts - tRPC API 客户端封装

const BASE_URL = 'http://101.133.137.118:8080/api/trpc'

/**
 * 发送 tRPC 请求
 * @param path - tRPC 路由路径，如 "user.wxLogin"
 * @param input - 请求参数
 * @returns Promise<unknown>
 */
export async function trpcRequest<T = unknown>(
  path: string,
  input?: Record<string, unknown>
): Promise<T> {
  const url = `${BASE_URL}/${path}`

  const options: WechatMiniprogram.RequestOption = {
    url,
    method: input ? 'POST' : 'GET',
    header: {
      'Content-Type': 'application/json',
    },
    data: input ? { json: input } : undefined,
  }

  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = res.data as { result?: { data?: T } }
          resolve(data.result?.data?.json as T)
        } else {
          const errorData = res.data as { error?: { message?: string } }
          reject(new Error(errorData.error?.message || `请求失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'))
      },
    })
  })
}

/**
 * 用户模块 API
 */
export const userApi = {
  /** 微信小程序快捷登录（code换openid，自动注册） */
  wxLogin: (data: { code: string; wxName?: string; avatarUrl?: string }) =>
    trpcRequest<{
      user: {
        id: string
        wxOpenid: string | null
        wxName: string | null
        avatarUrl: string | null
        phone: string | null
        role: number
        isActive: boolean
      }
      isNewUser: boolean
    }>('user.wxLogin', data),

  /** 获取用户信息 */
  getById: (id: string) =>
    trpcRequest('user.getById', { id }),

  /** 获取用户统计 */
  getStats: (userId: string) =>
    trpcRequest('user.getStats', { userId }),
}

/**
 * 二维码登录模块 API（管理端扫码登录）
 */
export const qrLoginApi = {
  /** 扫码 */
  scan: (data: { token: string; userId: string }) =>
    trpcRequest<{ success: boolean }>('qrLogin.scan', data),

  /** 确认登录 */
  confirm: (data: { token: string }) =>
    trpcRequest<{ success: boolean }>('qrLogin.confirm', data),
}

/**
 * 笔记模块 API
 */
export const messageApi = {
  /** 创建笔记 */
  create: (data: {
    userId: string
    type: 'text' | 'voice' | 'drawing'
    title?: string
    content?: string
    template?: string
    charCount?: number
    duration?: number
  }) => trpcRequest('message.create', data),

  /** 获取笔记列表 */
  list: (data: {
    userId: string
    type?: 'text' | 'voice' | 'drawing'
    page?: number
    pageSize?: number
  }) => trpcRequest('message.list', data),

  /** 软删除笔记 */
  softDelete: (id: string) =>
    trpcRequest('message.softDelete', { id }),
}

/**
 * 语音模块 API
 */
export const voiceApi = {
  /** 创建语音记录 */
  create: (data: {
    userId: string
    messageId?: string
    url: string
    remark?: string
    content?: string
    duration?: number
  }) => trpcRequest('voice.create', data),
}

/**
 * 图片模块 API
 */
export const picApi = {
  /** 创建图片记录 */
  create: (data: {
    userId: string
    messageId?: string
    picUrl: string
    remark?: string
  }) => trpcRequest('pic.create', data),
}

/**
 * 回收站模块 API
 */
export const trashApi = {
  /** 移入回收站 */
  moveToTrash: (data: {
    sourceId: string
    sourceType: 'message' | 'pic' | 'voice'
    userId: string
    expiredAt: string
  }) => trpcRequest('trash.moveToTrash', data),
}
