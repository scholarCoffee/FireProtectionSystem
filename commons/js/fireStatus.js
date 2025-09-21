import { locationTabList } from '@/commons/mock/index.js'

// 方向选项
export const directionOptions = [
  { value: 1, label: '东' },
  { value: 2, label: '西' },
  { value: 3, label: '南' },
  { value: 4, label: '北' },
  { value: 5, label: '东南' },
  { value: 6, label: '东北' },
  { value: 7, label: '西南' },
  { value: 8, label: '西北' }
]

// 位置类型选项
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