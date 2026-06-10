// utils/api.ts - tRPC API 客户端封装

type TrpcErrorResponse = {
  error?: {
    message?: string
    json?: {
      message?: string
    }
  }
}

const API_BASE_URLS = {
  develop: 'http://101.133.137.118:8080/api/trpc',
  trial: 'http://101.133.137.118:8080/api/trpc',
  release: 'http://101.133.137.118:8080/api/trpc',
} as const

function getBaseUrl(): string {
  const envVersion = wx.getAccountInfoSync?.().miniProgram.envVersion || 'release'
  return API_BASE_URLS[envVersion as keyof typeof API_BASE_URLS] || API_BASE_URLS.release
}

function getTrpcErrorMessage(data: unknown, statusCode: number): string {
  const errorData = data as TrpcErrorResponse
  return errorData.error?.json?.message || errorData.error?.message || `请求失败: ${statusCode}`
}

/**
 * 发送 tRPC 请求
 * @param path - tRPC 路由路径
 * @param input - 请求参数
 * @param type - 请求类型: query 用 GET, mutation 用 POST
 * @returns Promise<T>
 */
export async function trpcRequest<T = unknown>(
  path: string,
  input?: Record<string, unknown>,
  type: 'query' | 'mutation' = 'mutation'
): Promise<T> {
  const isQuery = type === 'query'

  let url = `${getBaseUrl()}/${path}`
  let method: 'GET' | 'POST' = isQuery ? 'GET' : 'POST'
  let data: Record<string, unknown> | undefined

  if (isQuery && input) {
    // query 过程: 参数编码到 URL query string (tRPC batch 格式)
    url += `?input=${encodeURIComponent(JSON.stringify({ json: input }))}`
  } else if (input) {
    // mutation 过程: 参数放在 body
    data = { json: input }
  }

  const options: WechatMiniprogram.RequestOption = {
    url,
    method,
    header: {
      'Content-Type': 'application/json',
    },
    data,
  }

  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseData = res.data as { result?: { data?: { json?: T } } }
          resolve((responseData.result?.data?.json ?? responseData.result?.data) as T)
        } else {
          const errorMessage = getTrpcErrorMessage(res.data, res.statusCode)
          reject(new Error(errorMessage))
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
    }>('user.wxLogin', data, 'mutation'),

  /** 获取用户信息 */
  getById: (id: string) =>
    trpcRequest('user.getById', { id }, 'query'),

  /** 获取用户统计 */
  getStats: (userId: string) =>
    trpcRequest('user.getStats', { userId }, 'query'),
}

/**
 * 二维码登录模块 API（管理端扫码登录）
 */
export const qrLoginApi = {
  /** 查询扫码状态 */
  checkStatus: (data: { token: string }) =>
    trpcRequest<{ status: string; user?: { id: string; wxName: string | null; role: number } }>('qrLogin.checkStatus', data, 'query'),

  /** 扫码 */
  scan: (data: { token: string; userId: string }) =>
    trpcRequest<{ success: boolean }>('qrLogin.scan', data, 'mutation'),

  /** 确认登录 */
  confirm: (data: { token: string }) =>
    trpcRequest<{ success: boolean }>('qrLogin.confirm', data, 'mutation'),
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
  }) => trpcRequest('message.create', data, 'mutation'),

  /** 获取笔记列表 */
  list: (data: {
    userId: string
    type?: 'text' | 'voice' | 'drawing'
    page?: number
    pageSize?: number
  }) => trpcRequest('message.list', data, 'query'),

  /** 软删除笔记 */
  softDelete: (id: string) =>
    trpcRequest('message.softDelete', { id }, 'mutation'),

  /** 全局统计 */
  getGlobalStats: () =>
    trpcRequest('message.getGlobalStats', undefined, 'query'),
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
  }) => trpcRequest('voice.create', data, 'mutation'),
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
  }) => trpcRequest('pic.create', data, 'mutation'),
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
  }) => trpcRequest('trash.moveToTrash', data, 'mutation'),
}
