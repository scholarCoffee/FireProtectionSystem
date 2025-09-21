<template>
  <view class="task-query-page">
    <!-- 搜索和筛选区 -->
    <view class="search-filters-container">
      <!-- 地址名称搜索和筛选按钮 -->
      <view class="search-filter-row">
        <view class="search-input-container">
          <image :src="serverUrl + '/static/icons/location/search.png'" class="search-icon" />
          <input 
            class="search-input"
            v-model="keyword"
            placeholder="输入救灾地址或编号"
            @input="onInput"
            @confirm="onSearch"
          />
        </view>
        
        <!-- 筛选按钮 -->
        <view class="filter-toggle" @tap="toggleFilters">
          <text class="filter-text">筛选</text>
          <image :src="serverUrl + '/static/icons/common/down.png'" class="filter-icon" :class="{ 'expanded': filtersExpanded }" />
        </view>
      </view>

      <!-- 筛选条件 -->
      <view class="filters-section" v-show="filtersExpanded">
        <view class="filters-grid">
          <!-- 救援单位 -->
          <view class="filter-item">
            <text class="filter-label">救援单位</text>
            <picker :value="unitIndex" :range="unitOptions" range-key="label" @change="onUnitChange" class="filter-picker">
              <view class="picker-box" :class="{ 'placeholder': unitIndex === 0 }">
                {{ (unitOptions[unitIndex] && unitOptions[unitIndex].label) || '请选择救援单位' }}
              </view>
            </picker>
          </view>

          <!-- 任务类型 -->
          <view class="filter-item">
            <text class="filter-label">任务类型</text>
            <picker :value="typeIndex" :range="taskTypeOptions" range-key="label" @change="onTypeChange" class="filter-picker">
              <view class="picker-box" :class="{ 'placeholder': typeIndex === 0 }">
                {{ (taskTypeOptions[typeIndex] && taskTypeOptions[typeIndex].label) || '请选择任务类型' }}
              </view>
            </picker>
          </view>

          <!-- 任务反馈状态 -->
          <view class="filter-item">
            <text class="filter-label">任务反馈</text>
            <picker :value="statusIndex" :range="statusOptions" range-key="label" @change="onStatusChange" class="filter-picker">
              <view class="picker-box" :class="{ 'placeholder': statusIndex === 0 }">
                {{ (statusOptions[statusIndex] && statusOptions[statusIndex].label) || '请选择任务反馈' }}
              </view>
            </picker>
          </view>

          <!-- 所在楼层 -->
          <view class="filter-item">
            <text class="filter-label">所在楼层</text>
            <picker :value="floorIndex" :range="floorOptions" range-key="label" @change="onFloorChange" class="filter-picker">
              <view class="picker-box" :class="{ 'placeholder': floorIndex === 0 }">
                {{ (floorOptions[floorIndex] && floorOptions[floorIndex].label) || '请选择楼层' }}
              </view>
            </picker>
          </view>

          <!-- 指派人员和操作按钮 -->
          <view class="filter-item-with-buttons">
            <text class="filter-label">指派人员</text>
            <view class="input-button-group">
              <input 
                class="filter-input"
                v-model="recordPerson"
                placeholder="请输入指派人员"
                @input="onInput"
              />
              <view class="button-group">
                <button class="reset-btn" @tap="resetFilters">重置</button>
                <button class="search-btn" @tap="onSearch">查询</button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  
    <!-- 列表 -->
    <scroll-view class="list" :style="{ height: listHeight }" scroll-y :lower-threshold="100" @scrolltolower="loadMore" refresher-enabled :refresher-triggered="refresherTriggered" @refresherrefresh="onRefresh">
      <view v-for="(item, idx) in list" :key="idx" class="card" :class="{ 'rescue-card': getTaskStatusClass(item.taskStatus) === 'status-rescue' }">
        <view class="card-header">
          <view class="address-info">
            <text class="address-name">{{ item.addressName }}</text>
            <!-- 高层小区显示楼层，非高层小区显示方向 -->
            <text class="floor-info" v-if="item.locationType === 1 && item.rescueFloor">{{ item.rescueFloor }}层</text>
            <text class="direction-info" v-if="item.locationType !== 1 && item.direction">{{ getDirectionName(item.direction) }}</text>
          </view>
          <view class="task-status" :class="getTaskStatusClass(item.feedbackStatus)">
            {{ getTaskStatusName(item.feedbackStatus) }}
          </view>
        </view>
        
        <view class="card-content">
          <view class="info-grid">
            <view class="info-item">
              <image :src="serverUrl + '/static/icons/location/factory.png'" class="info-icon" />
              <text class="info-text">{{ getFireUnitName(item.fireUnit) }}</text>
            </view>
            
            <view class="info-item">
              <image :src="serverUrl + '/static/icons/common/task.png'" class="info-icon" />
              <text class="info-text">{{ getTaskTypeName(item.taskType) }}</text>
            </view>
            
            <view class="info-item">
              <image :src="serverUrl + '/static/icons/common/time.png'" class="info-icon" />
              <text class="info-text">{{ formatTime(item.updateTime) }}</text>
            </view>
            
            <view class="info-item" v-if="item.issuePersonName">
              <image :src="serverUrl + '/static/icons/common/issuePerson.png'" class="info-icon" />
              <text class="info-text">{{ item.issuePersonName }}</text>
            </view>
          </view>
          
          <view class="extra-info" v-if="item.taskExtra && Object.keys(item.taskExtra).length > 0">
            <view class="extra-item" v-for="(value, key) in item.taskExtra" :key="key">
              <image :src="serverUrl + '/static/icons/common/power.png'" class="info-icon" />
              <text class="info-text">{{ getTaskTypeName(item.taskType) }}：{{ getTaskExtraValue(item.taskType, key, value) }}</text>
            </view>
          </view>
        </view>
        
        <view class="remark" v-if="item.remark">
          <text class="remark-label">备注：</text>
          <text class="remark-text">{{ item.remark }}</text>
        </view>
      </view>
      
      <view class="load-more">
        <button class="load-more-btn" :disabled="finished || isLoading" @tap="manualLoadMore">
          {{ isLoading ? '加载中...' : (finished ? '没有更多了' : '点击加载更多') }}
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { locationTabList } from '@/commons/mock/index.js'
import { directionOptions, locationTypeOptions } from '@/commons/js/fireStatus.js'

export default {
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space',
      keyword: '',
      recordPerson: '',
      debounceTimer: null,
      filtersExpanded: false,
      unitOptions: [],
      taskTypeOptions: [],
      statusOptions: [],
      floorOptions: [],
      locationTypeOptions: locationTypeOptions,
      directionOptions: directionOptions,
      unitIndex: 0, 
      typeIndex: 0, 
      statusIndex: 0,
      floorIndex: 0,
      list: [],
      page: 1, 
      pageSize: 10, 
      finished: false, 
      loadingText: '向下拉取更多',
      listHeight: '60vh',
      isLoading: false,
      refresherTriggered: false,
      // 任务反馈状态选项
      taskFeedbackOptions: [
        { label: '请选择任务反馈', value: '', index: 0 },
        { label: '已接收', value: 'received', index: 1 },
        { label: '未接收', value: 'unreceived', index: 2 }
      ]
    }
  },
  async onLoad() {
    await this.loadStatic()
    this.initFloorOptions()
    this.fetch(true)
  },
  onReachBottom() { this.loadMore() },
  onReady() {
    this.computeListHeight()
    if (uni.onWindowResize) {
      uni.onWindowResize(this.computeListHeight)
    }
  },
  onUnload() {
    if (uni.offWindowResize) {
      uni.offWindowResize(this.computeListHeight)
    }
  },
  methods: {
    initFloorOptions() {
      this.floorOptions = [
        { label: '请选择楼层', value: '', index: 0 },
        ...Array.from({ length: 100 }, (_, i) => ({
          label: `${i + 1}层`,
          value: String(i + 1),
          index: i + 1
        }))
      ]
    },
    computeListHeight() {
      try {
        const sys = uni.getSystemInfoSync() || {}
        const windowHeight = sys.windowHeight || 600
        const q = uni.createSelectorQuery()
        q.select('.search-filters-container').boundingClientRect()
        q.exec((res) => {
          const containerRect = res && res[0]
          const topOffset = (containerRect && (containerRect.top + containerRect.height)) || 0
          const padding = 24
          const h = windowHeight - topOffset - padding
          const px = (h > 220 ? h : 220) + 'px'
          this.listHeight = px
        })
      } catch(e) {
        this.listHeight = '60vh'
      }
    },
    async loadStatic() {
      // 先检查本地存储是否有数据
      const cachedUnits = uni.getStorageSync('static_fireUnits')
      const cachedTypes = uni.getStorageSync('static_taskTypes')
      
      // 如果本地有数据，直接使用
      if (cachedUnits && cachedTypes) {
        this.unitOptions = [
          { label: '请选择救援单位', value: '', index: 0 },
          ...cachedUnits
        ]
        this.taskTypeOptions = [
          { label: '请选择任务类型', value: '', index: 0 },
          ...cachedTypes
        ]
        this.statusOptions = this.taskFeedbackOptions
        return
      }
      
      // 如果本地没有数据，从接口获取
      const req = (key) => new Promise((resolve, reject) => {
        uni.request({ url: this.serverUrl + '/static/data', method: 'GET', data: { type: 'fireUnits', key }, success: resolve, fail: reject })
      })
      try {
        const [units, types] = await Promise.all([
          req('unitList'), 
          req('taskList')
        ])
        
        // 处理数据并缓存到本地存储
        const unitList = ((units && units.data && units.data.data) ? units.data.data : []).map((it, i) => ({ label: it.data1, value: String(it.data2), index: i + 1 }))
        const typeList = ((types && types.data && types.data.data) ? types.data.data : []).map((it, i) => ({ label: it.data1, value: String(it.data2), index: i + 1 }))
        
        // 缓存到本地存储
        uni.setStorageSync('static_fireUnits', unitList)
        uni.setStorageSync('static_taskTypes', typeList)
        
        this.unitOptions = [
          { label: '请选择救援单位', value: '', index: 0 },
          ...unitList
        ]
        this.taskTypeOptions = [
          { label: '请选择任务类型', value: '', index: 0 },
          ...typeList
        ]
        this.statusOptions = this.taskFeedbackOptions
      } catch(e) {
        console.error('加载静态数据失败:', e)
      }
    },
    fetch(reset = false, cb) {
      if (reset) { this.page = 1; this.list = []; this.finished = false }
      if (this.finished && !reset) { cb && cb(); return }
      const params = {
        page: this.page, 
        pageSize: this.pageSize,
        unit: (this.unitOptions[this.unitIndex] && this.unitOptions[this.unitIndex].value) || '',
        taskType: (this.taskTypeOptions[this.typeIndex] && this.taskTypeOptions[this.typeIndex].value) || '',
        taskFeedback: (this.statusOptions[this.statusIndex] && this.statusOptions[this.statusIndex].value) || '',
        floor: (this.floorOptions[this.floorIndex] && this.floorOptions[this.floorIndex].value) || '',
        recordPerson: (this.recordPerson || '').trim(),
        keyword: (this.keyword || '').trim()
      }
      this.isLoading = true
      uni.request({
        url: this.serverUrl + '/task/list',
        method: 'GET',
        data: params,
        success: (res) => {
          if (res?.data?.code === 200) {
            const { data: list, pagination } = res.data
            this.list = this.page === 1 ? list : this.list.concat(list)
            this.page = pagination.page || this.page
            this.finished = !pagination.hasNext || this.page >= pagination.pages
            this.loadingText = this.finished ? '没有更多了' : '向下拉取更多'
          } else {
            this.list = []; this.finished = true
          }
          cb && cb()
        },
        fail: () => { this.list = []; this.finished = true; cb && cb() },
        complete: () => { this.isLoading = false } 
      })
    },
    loadMore() { if (!this.finished && !this.isLoading) { this.page += 1; this.fetch() } },
    manualLoadMore() { this.loadMore() },
    onSearch() { this.fetch(true) },
    onInput() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => this.fetch(true), 300)
    },
    onRefresh() {
      this.refresherTriggered = true
      this.fetch(true, () => { this.refresherTriggered = false })
    },
    onUnitChange(e) { this.unitIndex = Number(e.detail.value); this.fetch(true) },
    onTypeChange(e) { this.typeIndex = Number(e.detail.value); this.fetch(true) },
    onStatusChange(e) { this.statusIndex = Number(e.detail.value); this.fetch(true) },
    onFloorChange(e) { this.floorIndex = Number(e.detail.value); this.fetch(true) },
    resetFilters() {
      this.unitIndex = 0
      this.typeIndex = 0
      this.statusIndex = 0
      this.floorIndex = 0
      this.recordPerson = ''
      this.keyword = ''
      this.fetch(true)
    },
    toggleFilters() {
      this.filtersExpanded = !this.filtersExpanded
    },
    getFireUnitName(unitValue) {
      const unit = this.unitOptions.find(item => item.value === String(unitValue))
      return unit ? unit.label : `救援单位${unitValue}`
    },
    getTaskTypeName(typeValue) {
      const type = this.taskTypeOptions.find(item => item.value === String(typeValue))
      return type ? type.label : `类型${typeValue}`
    },
    getDirectionName(directionValue) {
      const direction = this.directionOptions.find(item => item.value === Number(directionValue))
      return direction ? direction.label : `方向${directionValue}`
    },
    getTaskStatusName(statusValue) {
      const status = this.statusOptions.find(item => item.value === String(statusValue))
      return status ? status.label : `状态${statusValue}`
    },
    getTaskStatusClass(statusValue) {
      const status = this.statusOptions.find(item => item.value === String(statusValue))
      if (!status) return 'status-unknown'
      
      if (status.value === 'received') {
        return 'status-received'
      } else if (status.value === 'unreceived') {
        return 'status-unreceived'
      }
      return 'status-unknown'
    },
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    },
    getTaskExtraValue(taskType, key, value) {
      // 火场供水 - 从消防单位静态配置读取供水目标
      if (taskType === '5' && key === 'supplyTarget') {
        const unit = this.unitOptions.find(item => item.value === value)
        return unit ? unit.label : `${value}个供水点`
      }
      
      // 人员搜救 - 显示单位房间号
      if (taskType === '6' && key === 'rescueLocation') {
        return `单位房间号：${value}`
      }
      
      // 其他情况直接显示值
      return value
    }
  }
}
</script>

<style scoped>
.task-query-page {
  min-height: 100vh;
  background: #f5f9ff;
}

.search-filters-container {
  background: #fff;
  margin: 12rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.06);
  overflow: hidden;
}

/* 搜索和筛选按钮行 */
.search-filter-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid #e6f4ff;
}

.search-input-container {
  display: flex;
  align-items: center;
  height: 64rpx;
  padding: 0 24rpx;
  border: 2rpx solid #e6f4ff;
  border-radius: 32rpx;
  background: #f8faff;
  box-shadow: 0 2rpx 6rpx rgba(24, 144, 255, 0.06);
  transition: all 0.3s ease;
  flex: 1;
}

.search-input-container:focus-within {
  border-color: #1890ff;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.12);
}

.search-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 100%;
  padding: 0;
  border: none;
  background: none;
  font-size: 26rpx;
  color: #333;
  outline: none;
  box-shadow: none;
}

/* 筛选按钮样式 */
.filter-toggle {
  display: flex;
  align-items: center;
  gap: 6rpx;
  height: 48rpx;
  padding: 0 16rpx;
  background: #f8faff;
  border: 2rpx solid #e6f4ff;
  border-radius: 24rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.filter-toggle:active {
  background: #e6f7ff;
  border-color: #1890ff;
}

.filter-icon {
  width: 20rpx;
  height: 20rpx;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.filter-icon.expanded {
  transform: rotate(180deg);
}

.filter-text {
  font-size: 22rpx;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
}

/* 筛选条件区域 */
.filters-section {
  padding: 16rpx 20rpx;
  border-top: 1rpx solid #e6f4ff;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.filter-item-with-buttons {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  grid-column: 1 / -1;
}

.input-button-group {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.filter-label {
  font-size: 22rpx;
  color: #666;
  font-weight: 500;
}

.filter-picker {
  width: 100%;
}

.picker-box {
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 8rpx;
  border: 2rpx solid #e6f4ff;
  background: #f8faff;
  padding: 0 12rpx;
  font-size: 22rpx;
  color: #333;
  transition: all 0.3s ease;
}

.picker-box.placeholder {
  color: #999;
}

.picker-box:active {
  border-color: #1890ff;
  background: #e6f7ff;
}

.filter-input {
  flex: 1;
  height: 56rpx;
  padding: 0 12rpx;
  border: 2rpx solid #e6f4ff;
  border-radius: 8rpx;
  background: #f8faff;
  font-size: 22rpx;
  color: #333;
  box-sizing: border-box;
}

.filter-input:focus {
  border-color: #1890ff;
  background: #e6f7ff;
}

.button-group {
  display: flex;
  gap: 16rpx;
}

.reset-btn {
  height: 56rpx;
  padding: 0 40rpx;
  border-radius: 28rpx;
  background: #f5f5f5;
  border: 2rpx solid #e0e0e0;
  color: #666;
  font-size: 20rpx;
  font-weight: 500;
  transition: all 0.3s ease;
}

.reset-btn:active {
  background: #e8e8e8;
  transform: scale(0.95);
}

.reset-btn::after {
  border: none;
}

.search-btn {
  height: 56rpx;
  padding: 0 40rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  border: none;
  color: #fff;
  font-size: 20rpx;
  font-weight: 600;
  box-shadow: 0 2rpx 6rpx rgba(24, 144, 255, 0.25);
  transition: all 0.3s ease;
}

.search-btn:active {
  transform: scale(0.95);
  box-shadow: 0 1rpx 4rpx rgba(24, 144, 255, 0.35);
}

.list {
  background: #fff;
  margin: 0 12rpx 12rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.06);
}

.card {
  margin: 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #f0f0f0;
  padding: 20rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.04);
  background: #fff;
  transition: all 0.3s ease;
}

.card:active {
  transform: scale(0.98);
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.address-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
}

.address-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.floor-info {
  font-size: 20rpx;
  color: #666;
  background: #f0f8ff;
  padding: 4rpx 8rpx;
  border-radius: 6rpx;
  border: 1rpx solid #d6e4ff;
  flex-shrink: 0;
}

.direction-info {
  font-size: 20rpx;
  color: #666;
  background: #fff7e6;
  padding: 4rpx 8rpx;
  border-radius: 6rpx;
  border: 1rpx solid #ffd591;
  flex-shrink: 0;
}

.task-status {
  padding: 6rpx 12rpx;
  border-radius: 16rpx;
  font-size: 20rpx;
  font-weight: 500;
  color: #fff;
  text-align: center;
  min-width: 80rpx;
  flex-shrink: 0;
}

.task-status.status-completed {
  background: linear-gradient(135deg, #52c41a, #73d13d);
}

.task-status.status-progress {
  background: linear-gradient(135deg, #fa8c16, #ffa940);
}

.task-status.status-rescue {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.4);
  animation: pulse 2s infinite;
  font-weight: 600;
  font-size: 22rpx;
  min-width: 100rpx;
  border: 2rpx solid #fff;
}

.task-status.status-received {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.4);
  font-weight: 600;
  font-size: 22rpx;
  min-width: 100rpx;
  border: 2rpx solid #fff;
  animation: receivedPulse 2s infinite;
}

.task-status.status-unreceived {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.4);
  font-weight: 600;
  font-size: 22rpx;
  min-width: 100rpx;
  border: 2rpx solid #fff;
  animation: unreceivedPulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.4);
  }
  50% {
    box-shadow: 0 6rpx 16rpx rgba(255, 77, 79, 0.6);
  }
  100% {
    box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.4);
  }
}

@keyframes receivedPulse {
  0% {
    box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.4);
  }
  50% {
    box-shadow: 0 6rpx 16rpx rgba(82, 196, 26, 0.6);
  }
  100% {
    box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.4);
  }
}

@keyframes unreceivedPulse {
  0% {
    box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.4);
  }
  50% {
    box-shadow: 0 6rpx 16rpx rgba(255, 77, 79, 0.6);
  }
  100% {
    box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.4);
  }
}

.task-status.status-unknown {
  background: linear-gradient(135deg, #8c8c8c, #a6a6a6);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.info-icon {
  width: 20rpx;
  height: 20rpx;
  flex-shrink: 0;
  opacity: 0.7;
}

.info-text {
  font-size: 22rpx;
  color: #666;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 额外信息样式 - 简洁风格 */
.extra-info {
  margin-top: 8rpx;
  padding: 12rpx;
  background: #f0f8ff;
  border-radius: 8rpx;
  border-left: 3rpx solid #52c41a;
}

.extra-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

/* 备注样式 - 卡片风格 */
.remark {
  margin-top: 16rpx;
  padding: 12rpx;
  background: #fff;
  border-radius: 8rpx;
  border: 1rpx solid #e6f4ff;
  box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.05);
}

.remark-label {
  font-size: 20rpx;
  color: #666;
  font-weight: 500;
  margin-bottom: 4rpx;
}

.remark-text {
  font-size: 20rpx;
  color: #333;
  line-height: 1.4;
}

.load-more {
  text-align: center;
  color: #999;
  padding: 24rpx 0;
}

.load-more-btn {
  height: 64rpx;
  line-height: 64rpx;
  padding: 0 40rpx;
  border-radius: 32rpx;
  color: #999;
  font-size: 24rpx;
  font-weight: 500;
  transition: all 0.3s ease;
}

.load-more-btn:active {
  transform: scale(0.95);
}

.load-more-btn:disabled {
  color: #aaa;
  border-color: #f0f0f0;
  background: #f5f5f5;
}

/* 需要救援的卡片样式 */
.rescue-card {
  border: 2rpx solid #ff4d4f !important;
  background: linear-gradient(135deg, #fff5f5, #ffe6e6) !important;
  box-shadow: 0 4rpx 16rpx rgba(255, 77, 79, 0.2) !important;
  animation: rescuePulse 3s infinite;
}

@keyframes rescuePulse {
  0% {
    box-shadow: 0 4rpx 16rpx rgba(255, 77, 79, 0.2);
  }
  50% {
    box-shadow: 0 6rpx 20rpx rgba(255, 77, 79, 0.4);
  }
  100% {
    box-shadow: 0 4rpx 16rpx rgba(255, 77, 79, 0.2);
  }
}
</style> 