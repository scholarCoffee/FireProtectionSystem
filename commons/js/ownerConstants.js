// 户主相关常量数据

// 住户情况选项
export const statusOptions = [
  { value: 1, label: '房间有人' },
  { value: 0, label: '房间无人' },
  { value: 2, label: '房间不确定' }
]

// 住户情况选项（包含"全部"选项，用于筛选）
export const statusFilterOptions = [
  { value: '', label: '全部' },
  { value: 1, label: '房间有人' },
  { value: 0, label: '房间无人' },
  { value: 2, label: '房间不确定' }
]

// 数字选择器选项 (1-100)
export const numberPickerOptions = Array.from({length: 100}, (_, i) => i + 1)

// 数字选择器选项 (包含"请选择"选项)
export const numberPickerOptionsWithEmpty = ['请选择', ...Array.from({length: 100}, (_, i) => i + 1)]

// 房间人数选项 (1-100)
export const peopleCountOptions = Array.from({length: 100}, (_, i) => i + 1)

// 根据状态值获取标签
export const getStatusLabel = (status) => {
  const statusMap = { 1: '房间有人', 0: '房间无人', 2: '房间不确定' }
  return statusMap[status] || '未知'
}

// 根据状态值获取样式类名
export const getStatusClass = (status) => {
  return status === 1 ? 'status-yes' : (status === 0 ? 'status-no' : 'status-unk')
}

// 格式化建筑信息
export const formatBuilding = (item) => {
  const b = item.building ? `${item.building}栋` : '-'
  const u = item.unit ? `${item.unit}单元` : ''
  const f = item.floor ? `${item.floor}层` : ''
  return [b, u, f].filter(Boolean).join(' ')
}

// 格式化面积信息
export const formatArea = (area) => {
  if (!area && area !== 0) return '-'
  const n = Number(area)
  if (Number.isNaN(n)) return '-'
  return `${n.toFixed(2)}㎡`
}
