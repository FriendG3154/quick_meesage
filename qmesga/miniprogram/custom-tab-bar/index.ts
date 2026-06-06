// custom-tab-bar/index.ts
import { isDarkMode } from '../utils/theme'

Component({
  data: {
    selected: 1,
    darkMode: false,
    list: [
      {
        pagePath: 'pages/statistics/statistics',
        text: '统计',
      },
      {
        pagePath: 'pages/index/index',
        text: '记录',
      },
      {
        pagePath: 'pages/settings/settings',
        text: '设置',
      },
    ],
  },
  lifetimes: {
    attached() {
      this.setData({ darkMode: isDarkMode() })
    },
  },
  methods: {
    switchTab(e: WechatMiniprogram.TouchEvent) {
      const data = e.currentTarget.dataset
      const url = data.path as string
      const index = data.index as number
      wx.switchTab({ url: '/' + url })
      this.setData({ selected: index })
    },
    applyTheme() {
      this.setData({ darkMode: isDarkMode() })
    },
    longPressTab(e: WechatMiniprogram.TouchEvent) {
      const index = e.currentTarget.dataset.index as number
      if (index === 1) {
        wx.navigateTo({ url: '/pages/voice-record/voice-record' })
      }
    },
  },
})
