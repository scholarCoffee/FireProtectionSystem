import { locationTabList } from '@/commons/mock/index.js'

// 方向选项
export const directionOptions = [
  { value: 1, label: '正东' },
  { value: 2, label: '东南' },
  { value: 3, label: '东北' },
  { value: 4, label: '正南' },
  { value: 5, label: '南西' },
  { value: 6, label: '南北' },
  { value: 7, label: '正北' },
  { value: 8, label: '北西' },
  { value: 9, label: '北东' },
  { value: 10, label: '正西' },
  { value: 11, label: '西南' },
  { value: 12, label: '西北' },
]

// 单位类型选项
export const locationTypeOptions = locationTabList

// 任务反馈状态
export const taskFeedbackOptions = [
  { value: 1, label: '已接收' },
  { value: 2, label: '未接收' }
]

// 静态配置缓存键
export const STATIC_CACHE_KEYS = {
  FIRE_UNITS: 'fireUnits',
  FIRE_CARS: 'fireCars', 
  TASK_TYPES: 'taskTypes',
  TASK_STATUSES: 'taskStatuses'
}

// 搜救力量选项
export const searchPowerOptions = ['2人', '3人', '4人']

// 搜救结果选项
export const searchResultOptions = ['待定', '1人', '2人', '3人及以上']

// 排烟力量选项
export const smokePowerOptions = ['1台排烟机', '2台排烟机', '1台细水雾', '2台细水雾'] 