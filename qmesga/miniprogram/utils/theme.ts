// utils/theme.ts
export type ThemeMode = 'system' | 'light' | 'dark'

export function getThemeMode(): ThemeMode {
  return (wx.getStorageSync('themeMode') as ThemeMode) || 'system'
}

export function setThemeMode(mode: ThemeMode) {
  wx.setStorageSync('themeMode', mode)
}

export function isDarkMode(): boolean {
  const mode = getThemeMode()
  if (mode === 'dark') return true
  if (mode === 'light') return false
  // Follow system
  try {
    const sysInfo = wx.getSystemInfoSync()
    return sysInfo.theme === 'dark'
  } catch {
    return false
  }
}

export function getThemeModeText(): string {
  const mode = getThemeMode()
  if (mode === 'light') return '明亮模式'
  if (mode === 'dark') return '暗黑模式'
  return '跟随系统'
}

/** Apply the current theme to a page instance */
export function applyTheme(page: any) {
  const dark = isDarkMode()
  page.setData({ darkMode: dark })
  wx.setBackgroundColor({
    backgroundColor: dark ? '#0F0F0F' : '#f9f9f9',
    backgroundColorTop: dark ? '#0F0F0F' : '#f9f9f9',
    backgroundColorBottom: dark ? '#0F0F0F' : '#f9f9f9',
  })
}
