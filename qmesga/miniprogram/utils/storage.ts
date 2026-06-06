// utils/storage.ts - 笔记数据存储管理

export interface NoteItem {
  id: string
  type: 'voice' | 'drawing' | 'text'
  title: string
  content: string     // 文本内容 / 录音临时文件路径 / 画板图片路径
  template: string    // 使用的模板名称
  charCount: number
  duration: number    // 录音时长(秒)
  createdAt: number   // 时间戳
  updatedAt: number
}

export interface UserProfile {
  nickname: string
  avatarUrl: string
  userId: string
}

const NOTES_KEY = 'app_notes'
const PROFILE_KEY = 'app_profile'

/** 生成唯一 ID */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 获取全部笔记 */
export function getAllNotes(): NoteItem[] {
  try {
    return wx.getStorageSync(NOTES_KEY) || []
  } catch {
    return []
  }
}

/** 保存单条笔记 */
export function saveNote(note: Partial<NoteItem> & { type: NoteItem['type'] }): NoteItem {
  const notes = getAllNotes()
  const now = Date.now()
  const newNote: NoteItem = {
    id: note.id || generateId(),
    type: note.type,
    title: note.title || getDefaultTitle(note.type),
    content: note.content || '',
    template: note.template || '',
    charCount: note.charCount || 0,
    duration: note.duration || 0,
    createdAt: note.createdAt || now,
    updatedAt: now,
  }

  // 如果已存在则更新
  const idx = notes.findIndex((n) => n.id === newNote.id)
  if (idx >= 0) {
    notes[idx] = newNote
  } else {
    notes.unshift(newNote) // 新的在前
  }

  wx.setStorageSync(NOTES_KEY, notes)
  return newNote
}

/** 删除笔记 */
export function deleteNote(id: string): void {
  const notes = getAllNotes().filter((n) => n.id !== id)
  wx.setStorageSync(NOTES_KEY, notes)
}

/** 获取最近的笔记 */
export function getRecentNotes(limit: number = 10): NoteItem[] {
  return getAllNotes().slice(0, limit)
}

/** 按类型获取笔记 */
export function getNotesByType(type: NoteItem['type']): NoteItem[] {
  return getAllNotes().filter((n) => n.type === type)
}

/** 统计数据 */
export interface StatsData {
  totalNotes: number
  voiceCount: number
  drawingCount: number
  textCount: number
  thisWeekTotal: number
  lastWeekTotal: number
  weekGrowthRate: number
}

export function getStats(): StatsData {
  const notes = getAllNotes()
  const now = Date.now()
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  const thisWeekStart = now - oneWeek
  const lastWeekStart = thisWeekStart - oneWeek

  const thisWeekNotes = notes.filter((n) => n.createdAt >= thisWeekStart)
  const lastWeekNotes = notes.filter((n) => n.createdAt >= lastWeekStart && n.createdAt < thisWeekStart)

  const voiceCount = notes.filter((n) => n.type === 'voice').length
  const drawingCount = notes.filter((n) => n.type === 'drawing').length
  const textCount = notes.filter((n) => n.type === 'text').length

  const lastWeekTotal = lastWeekNotes.length || 1
  const weekGrowthRate = Math.round(((thisWeekNotes.length - lastWeekNotes.length) / lastWeekTotal) * 100 * 10) / 10

  return {
    totalNotes: notes.length,
    voiceCount,
    drawingCount,
    textCount,
    thisWeekTotal: thisWeekNotes.length,
    lastWeekTotal: lastWeekNotes.length,
    weekGrowthRate,
  }
}

/** 获取用户资料 */
export function getUserProfile(): UserProfile {
  try {
    return wx.getStorageSync(PROFILE_KEY) || { nickname: '用户', avatarUrl: '', userId: '' }
  } catch {
    return { nickname: '用户', avatarUrl: '', userId: '' }
  }
}

/** 保存用户资料 */
export function saveUserProfile(profile: Partial<UserProfile>): void {
  const current = getUserProfile()
  wx.setStorageSync(PROFILE_KEY, { ...current, ...profile })
}

function getDefaultTitle(type: NoteItem['type']): string {
  const date = new Date()
  const prefix = type === 'voice' ? '语音记录' : type === 'drawing' ? '手绘创意' : '文本笔记'
  return `${prefix} ${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
