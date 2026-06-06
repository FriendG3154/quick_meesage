// pages/voice-record/voice-record.ts
import { saveNote } from '../../utils/storage'
import { applyTheme, isDarkMode } from '../../utils/theme'

const BASE_WAVEFORM = [24, 32, 48, 64, 80, 56, 72, 48, 40, 56, 32, 24]
const RECORDING_WAVEFORMS = [
  [24, 48, 80, 64, 96, 72, 88, 56, 40, 64, 36, 20],
  [32, 64, 96, 80, 72, 88, 56, 80, 48, 32, 60, 28],
  [20, 40, 72, 96, 80, 64, 88, 40, 72, 56, 44, 32],
  [28, 56, 88, 72, 96, 80, 48, 72, 56, 40, 52, 24],
]

const _initDark = isDarkMode()

Page({
  data: {
    statusBarHeight: 0,
    contentTop: 132,
    darkMode: _initDark,
    isRecording: false,
    isPaused: false,
    timerDisplay: '00:00',
    waveformBars: BASE_WAVEFORM,
    transcriptionText: '按下麦克风按钮开始录音...',
    template: '',
  },

  _recManager: null as WechatMiniprogram.RecorderManager | null,
  _seconds: 0,
  _timerInterval: null as ReturnType<typeof setInterval> | null,
  _waveInterval: null as ReturnType<typeof setInterval> | null,
  _waveIdx: 0,
  _tempFilePath: '',
  _finishing: false,
  _stopped: false,

  onShow() {
    this.applyTheme()
  },

  applyTheme() {
    applyTheme(this)
  },

  onLoad(options: { template?: string }) {
    const sysInfo = wx.getSystemInfoSync()
    const sb = sysInfo.statusBarHeight || 0
    this.setData({
      statusBarHeight: sb,
      contentTop: sb + 44 + 32,
      template: options.template || '',
    })
    this._recManager = wx.getRecorderManager()
    this._recManager.onStop((res) => {
      this._tempFilePath = res.tempFilePath
      this._stopped = true
      if (this._finishing) {
        this._finishing = false
        this._doSaveAndExit(res.tempFilePath)
      }
    })
    this._recManager.onError(() => {
      // 如果正在完成保存或已经成功停止，忽略错误（部分设备会同时触发 onStop 和 onError）
      if (this._finishing || this._stopped) {
        this._finishing = false
        return
      }
      wx.showToast({ title: '录音出错', icon: 'none' })
      // 不调用 _stopAll()（其中会再次调用 stop() 导致循环触发 onError），直接清理状态
      this._stopTimer()
      this._stopWaveform()
      this._seconds = 0
      this.setData({
        isRecording: false,
        isPaused: false,
        timerDisplay: '00:00',
        waveformBars: BASE_WAVEFORM,
      })
    })
  },

  onUnload() {
    this._stopAll()
  },

  toggleRecording() {
    if (this.data.isRecording) {
      this._pauseRecording()
    } else if (this.data.isPaused) {
      this._resumeRecording()
    } else {
      this._startRecording()
    }
  },

  _startRecording() {
    this._stopped = false
    if (this._recManager) {
      this._recManager.start({ format: 'mp3', sampleRate: 16000, numberOfChannels: 1 })
    }
    this.setData({
      isRecording: true,
      isPaused: false,
      transcriptionText: '...正在识别语音内容，请继续说话...',
    })
    this._startTimer()
    this._startWaveform()
  },

  _resumeRecording() {
    if (this._recManager) {
      this._recManager.resume()
    }
    this.setData({
      isRecording: true,
      isPaused: false,
      transcriptionText: '...正在识别语音内容，请继续说话...',
    })
    this._startTimer()
    this._startWaveform()
  },

  _pauseRecording() {
    if (this._recManager) {
      this._recManager.pause()
    }
    this.setData({ isRecording: false, isPaused: true })
    this._stopTimer()
    this._stopWaveform()
    this.setData({ waveformBars: BASE_WAVEFORM })
  },

  _startTimer() {
    this._timerInterval = setInterval(() => {
      this._seconds++
      const m = Math.floor(this._seconds / 60).toString().padStart(2, '0')
      const s = (this._seconds % 60).toString().padStart(2, '0')
      this.setData({ timerDisplay: `${m}:${s}` })
    }, 1000)
  },

  _stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval)
      this._timerInterval = null
    }
  },

  _startWaveform() {
    this._waveInterval = setInterval(() => {
      this._waveIdx = (this._waveIdx + 1) % RECORDING_WAVEFORMS.length
      this.setData({ waveformBars: RECORDING_WAVEFORMS[this._waveIdx] })
    }, 300)
  },

  _stopWaveform() {
    if (this._waveInterval) {
      clearInterval(this._waveInterval)
      this._waveInterval = null
    }
  },

  _stopAll() {
    this._stopTimer()
    this._stopWaveform()
    if (this._recManager) {
      this._recManager.stop()
    }
    this._seconds = 0
    this.setData({
      isRecording: false,
      isPaused: false,
      timerDisplay: '00:00',
      waveformBars: BASE_WAVEFORM,
    })
  },

  discardRecording() {
    if (!this.data.isRecording && !this.data.isPaused && this._seconds === 0) {
      wx.navigateBack()
      return
    }
    wx.showModal({
      title: '丢弃录音',
      content: '确定要丢弃当前录音吗？',
      confirmText: '丢弃',
      confirmColor: '#ba1a1a',
      success: (res) => {
        if (res.confirm) {
          this._stopAll()
          wx.navigateBack()
        }
      },
    })
  },

  finishRecording() {
    if (this._seconds === 0) {
      wx.showToast({ title: '请先开始录音', icon: 'none' })
      return
    }
    this._finishing = true
    this._stopTimer()
    this._stopWaveform()
    if (this._recManager) {
      this._recManager.stop()
    }
  },

  _doSaveAndExit(filePath: string) {
    const duration = this._seconds

    // 保存录音记录到存储
    saveNote({
      type: 'voice',
      content: filePath,
      template: this.data.template,
      duration,
    })

    this._seconds = 0
    this.setData({
      isRecording: false,
      isPaused: false,
      timerDisplay: '00:00',
      waveformBars: BASE_WAVEFORM,
    })

    wx.showToast({ title: '录音已保存！', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 1500)
  },

  goBack() {
    if (this.data.isRecording || this.data.isPaused) {
      this.discardRecording()
    } else {
      wx.navigateBack()
    }
  },
})
