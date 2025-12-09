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
            <picker :value="unitIndex" :range="unitOptions" range-key="label" @change="onUnitChange" @bindchange="onUnitChange" class="filter-picker">
              <view class="picker-box" :class="{ 'placeholder': unitIndex === 0 }">
                {{ (unitOptions[unitIndex] && unitOptions[unitIndex].label) || '请选择救援单位' }}
              </view>
            </picker>
          </view>

          <!-- 任务状态 -->
          <view class="filter-item">
            <text class="filter-label">任务状态</text>
            <picker :value="statusIndex" :range="statusOptions" range-key="label" @change="onStatusChange" @bindchange="onStatusChange" class="filter-picker">
              <view class="picker-box" :class="{ 'placeholder': statusIndex === 0 }">
                {{ statusOptions[statusIndex] ? statusOptions[statusIndex].label : '请选择任务状态' }}
              </view>
            </picker>
          </view>

          <!-- 时间区间行 -->
          <view class="time-row">
            <view class="time-item">
              <text class="time-label">开始时间</text>
              <picker mode="multiSelector" :value="startTimeIndex" :range="startTimeRange" @change="onStartTimeChange" @bindchange="onStartTimeChange" class="filter-picker">
                <view class="picker-box" :class="{ 'placeholder': !startTime }">
                  {{ startTime || '请选择开始时间' }}
                </view>
              </picker>
            </view>
            <view class="time-item">
              <text class="time-label">结束时间</text>
              <picker mode="multiSelector" :value="endTimeIndex" :range="endTimeRange" @change="onEndTimeChange" @bindchange="onEndTimeChange" class="filter-picker">
                <view class="picker-box" :class="{ 'placeholder': !endTime }">
                  {{ endTime || '请选择结束时间' }}
                </view>
              </picker>
            </view>
          </view>

          <!-- 参战人员和操作按钮 -->
          <view class="filter-item-with-buttons">
            <text class="filter-label">参战人员</text>
            <view class="input-button-group">
              <input 
                class="filter-input"
                v-model="recordPerson"
                placeholder="请输入参战人员"
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
      <uni-swipe-action>
        <uni-swipe-action-item v-for="(item, idx) in list" :key="idx" :right-options="getSwipeOptions(item)" @click="onSwipeClick($event, item)" @change="onSwipeClick($event, item)">
          <view class="card" :class="item.cardClass" @tap="goDetail(item)">
            <view class="card-header">
              <view class="address-info">
                <text class="address-name">{{ item.fireSituation.addressName }}</text>
              </view>
              <view class="task-status" :class="item.status === 1 ? 'status-unreceived' : (item.status === 2 ? 'status-received' : 'status-unknown')">
                {{ getTaskStatusName(item.status) }}
              </view>
            </view>
            
            <view class="card-content">
              <view class="info-grid">
                <!-- 救援单位信息 -->
                <view class="info-item full-width">
                  <image :src="serverUrl + '/static/icons/location/factory.png'" class="info-icon" />
                  <text class="info-text">{{ getRescueUnits(item.fireSituation && item.fireSituation.assignedUnits) }}</text>
                </view>
                
                <!-- 任务下达信息 -->
                <view class="info-row">
                  <view class="info-item">
                    <image :src="serverUrl + '/static/icons/common/issuePerson.png'" class="info-icon" />
                    <text class="info-text">{{ (item.fireSituation && item.fireSituation.issuePersonName) || '—' }}</text>
                  </view>
                  <view class="info-item">
                    <image :src="serverUrl + '/static/icons/common/time.png'" class="info-icon" />
                    <text class="info-text">{{ formatTime(item.fireSituation && item.fireSituation.issueTime) }}</text>
                  </view>
                </view>
              </view>
              
              <!-- 任务详情信息 -->
              <view class="extra-info" v-if="item.fireSituation && item.fireSituation.assignedUnits && item.fireSituation.assignedUnits.length > 0">
                <view class="extra-item" v-for="(unit, index) in item.fireSituation.assignedUnits" :key="index">
                  <view class="unit-info-row">
                    <image :src="serverUrl + '/static/icons/common/power.png'" class="info-icon" />
                    <text class="info-text">{{ unit.unitName }} - {{ getTaskTypeName(unit.taskType) }}{{ getTaskExtraInfo(unit.taskType, unit.taskExtra) }}</text>
                  </view>
                  <!-- 车辆信息显示在对应单位后面 -->
                  <view class="unit-car-info" v-if="getUnitCarInfo(unit)">
                    <text class="car-text">{{ getUnitCarInfo(unit) }}</text>
                  </view>
                </view>
              </view>
            </view>
            
            <view class="remark" v-if="item.remark">
              <text class="remark-label">备注：</text>
              <text class="remark-text">{{ item.remark }}</text>
            </view>
          </view>
        </uni-swipe-action-item>
      </uni-swipe-action>
      
      <view class="load-more">
        <view class="load-more-btn" :disabled="finished || isLoading" @tap="manualLoadMore">
          {{ isLoading ? '加载中...' : (finished ? '没有更多了' : '点击加载更多') }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { directionOptions, locationTypeOptions } from '@/commons/js/fireStatus.js'
import uniSwipeAction from '@dcloudio/uni-ui/lib/uni-swipe-action/uni-swipe-action.vue'
import uniSwipeActionItem from '@dcloudio/uni-ui/lib/uni-swipe-action-item/uni-swipe-action-item.vue'

export default {
  components: { uniSwipeAction, uniSwipeActionItem },
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space',
      keyword: '',
      recordPerson: '',
      startTime: '', // 新增：开始时间
      endTime: '', // 新增：结束时间
      startTimeIndex: [0, 0, 0, 0, 0], // 新增：开始时间选择器索引
      endTimeIndex: [0, 0, 0, 0, 0], // 新增：结束时间选择器索引
      startTimeRange: [[], [], [], [], []], // 新增：开始时间选择器数据
      endTimeRange: [[], [], [], [], []], // 新增：结束时间选择器数据
      debounceTimer: null,
      filtersExpanded: false,
      unitOptions: [],
      statusOptions: [],
      locationTypeOptions: locationTypeOptions,
      directionOptions: directionOptions,
      unitIndex: 0, 
      statusIndex: 0,
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
    this.initDateTimePickers()
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
    initDateTimePickers() {
      // 初始化时间选择器数据
      const now = new Date()
      const currentYear = now.getFullYear()
      
      // 生成年份 (当前年份前后5年)
      const years = []
      for (let i = currentYear - 5; i <= currentYear + 5; i++) {
        years.push(i)
      }
      
      // 生成月份
      const months = []
      for (let i = 1; i <= 12; i++) {
        months.push(i)
      }
      
      // 生成日期 (1-31)
      const days = []
      for (let i = 1; i <= 31; i++) {
        days.push(i)
      }
      
      // 生成小时 (0-23)
      const hours = []
      for (let i = 0; i < 24; i++) {
        hours.push(i)
      }
      
      // 生成分钟 (0-59)
      const minutes = []
      for (let i = 0; i < 60; i++) {
        minutes.push(i)
      }
      
      this.startTimeRange = [years, months, days, hours, minutes]
      this.endTimeRange = [years, months, days, hours, minutes]
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
      
      // 如果本地有数据，直接使用
      if (cachedUnits) {
        this.unitOptions = [
          { label: '请选择救援单位', value: '', index: 0 },
          ...cachedUnits
        ]
        this.statusOptions = this.taskFeedbackOptions
        return
      }
      
      // 如果本地没有数据，从接口获取
      const req = (key) => new Promise((resolve, reject) => {
        uni.request({ url: this.serverUrl + '/static/data', method: 'GET', data: { type: 'fireUnits', key }, success: resolve, fail: reject })
      })
      try {
        const units = await req('unitList')
        
        // 处理数据并缓存到本地存储
        const unitList = ((units && units.data && units.data.data) ? units.data.data : []).map((it, i) => ({ label: it.data1, value: String(it.data2), index: i + 1 }))
        
        // 缓存到本地存储
        uni.setStorageSync('static_fireUnits', unitList)
        
        this.unitOptions = [
          { label: '请选择救援单位', value: '', index: 0 },
          ...unitList
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
        status: (this.statusOptions[this.statusIndex] && this.statusOptions[this.statusIndex].value) || '',
        startTime: this.startTime || '',
        endTime: this.endTime || '',
        feedbackPersonName: (this.feedbackPersonName || '').trim(),
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
            // 为每个列表项添加样式类
            const processedList = list.map(item => {
              const statusClass = this.getTaskStatusClass(item.feedbackStatus)
              return {
                ...item,
                cardClass: statusClass === 'status-unreceived' ? 'rescue-card' : '',
                statusClass: statusClass
              }
            })
            this.list = this.page === 1 ? processedList : this.list.concat(processedList)
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
    onUnitChange(e) { 
      try {
        const value = e.detail ? e.detail.value : e.value
        this.unitIndex = Number(value)
        this.fetch(true)
      } catch (error) {
        console.error('onUnitChange error:', error)
      }
    },
    onStatusChange(e) { 
      try {
        const value = e.detail ? e.detail.value : e.value
        this.statusIndex = Number(value)
        this.fetch(true)
      } catch (error) {
        console.error('onStatusChange error:', error)
      }
    },
    onStartTimeChange(e) {
      try {
        const value = e.detail ? e.detail.value : e.value
        this.startTimeIndex = value
        const [year, month, day, hour, minute] = value
        this.startTime = `${this.startTimeRange[0][year]}-${String(this.startTimeRange[1][month]).padStart(2, '0')}-${String(this.startTimeRange[2][day]).padStart(2, '0')} ${String(this.startTimeRange[3][hour]).padStart(2, '0')}:${String(this.startTimeRange[4][minute]).padStart(2, '0')}`
        this.fetch(true)
      } catch (error) {
        console.error('onStartTimeChange error:', error)
      }
    },
    onEndTimeChange(e) {
      try {
        const value = e.detail ? e.detail.value : e.value
        this.endTimeIndex = value
        const [year, month, day, hour, minute] = value
        this.endTime = `${this.endTimeRange[0][year]}-${String(this.endTimeRange[1][month]).padStart(2, '0')}-${String(this.endTimeRange[2][day]).padStart(2, '0')} ${String(this.endTimeRange[3][hour]).padStart(2, '0')}:${String(this.endTimeRange[4][minute]).padStart(2, '0')}`
        this.fetch(true)
      } catch (error) {
        console.error('onEndTimeChange error:', error)
      }
    },
    resetFilters() {
      this.unitIndex = 0
      this.statusIndex = 0
      this.startTime = ''
      this.endTime = ''
      this.startTimeIndex = [0, 0, 0, 0, 0]
      this.endTimeIndex = [0, 0, 0, 0, 0]
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
    getDirectionName(directionValue) {
      const direction = this.directionOptions.find(item => item.value === Number(directionValue))
      return direction ? direction.label : `方向${directionValue}`
    },
    getTaskStatusName(statusValue) {
      // 根据taskStatus显示状态名称
      const statusMap = {
        1: '未接收',
        2: '已接收'
      }
      return statusMap[statusValue] || `状态${statusValue}`
    },
    getTaskStatusClass(statusValue) {
      // 根据taskStatus返回样式类
      const classMap = {
        1: 'status-unreceived',
        2: 'status-received'
      }
      return classMap[statusValue] || 'status-unknown'
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
    // 获取救援单位名称（所有单位）
    getRescueUnits(assignedUnits) {
      if (!assignedUnits || !Array.isArray(assignedUnits) || assignedUnits.length === 0) return '—'
      return assignedUnits.map(unit => unit.unitName).join('、')
    },
    // 获取任务类型名称
    getTaskTypeName(taskType) {
      const typeMap = {
        '1': '灭火救援',
        '2': '断电救援', 
        '3': '人员搜救',
        '4': '火场供水',
        '5': '火场供水',
        '6': '人员搜救'
      }
      return typeMap[taskType] || `类型${taskType}`
    },
    // 获取任务额外信息
    getTaskExtraInfo(taskType, taskExtra) {
      if (!taskExtra || Object.keys(taskExtra).length === 0) return ''
      
      const extraInfo = []
      for (const key in taskExtra) {
        if (taskExtra.hasOwnProperty(key)) {
          const value = taskExtra[key]
          if (taskType === '1' && key === 'firePower') {
            extraInfo.push(value)
          } else if (taskType === '2' && key === 'blockPower') {
            extraInfo.push(value)
          } else if (taskType === '3' && key === 'searchRoom') {
            extraInfo.push('房间号：' + value)
          } else if (taskType === '4' && key === 'supplyTarget') {
            extraInfo.push(value + '个供水点')
          } else if (taskType === '5' && key === 'supplyTarget') {
            extraInfo.push(value + '个供水点')
          } else if (taskType === '6' && key === 'rescueLocation') {
            extraInfo.push('房间号：' + value)
          } else {
            extraInfo.push(value)
          }
        }
      }
      return extraInfo.length > 0 ? ' (' + extraInfo.join(', ') + ')' : ''
    },
    // 获取单个单位的车辆信息
    getUnitCarInfo(unit) {
      if (!unit || !unit.carInfo || unit.carInfo.length === 0) return ''
      
      const cars = []
      unit.carInfo.forEach(car => {
        if (car.label) {
          cars.push(car.label)
        }
      })
      
      return cars.length > 0 ? cars.join('、') : ''
    },
    // 跳转到任务详情
    goDetail(item) {
      uni.navigateTo({ url: `/pages/data/taskDetail/index?taskId=${encodeURIComponent(item.taskId)}` })
    },
    // 根据任务状态获取滑动操作选项
    getSwipeOptions(item) {
      const status = item.status
      
      if (status === 1) {
        // 未接收 - 显示接收任务和拒绝接受
        return [
          { text: '接收任务', style: { backgroundColor: '#52c41a', color: '#fff' }, key: 'receive' },
          { text: '拒绝接受', style: { backgroundColor: '#fa8c16', color: '#fff' }, key: 'reject' }
        ]
      } else if (status === 2) {
        // 已接收 - 显示删除
        return [
          { text: '删除', style: { backgroundColor: '#ff4d4f', color: '#fff' }, key: 'delete' }
        ]
      } else {
        // 其他状态 - 默认选项
        return [
          { text: '查看详情', style: { backgroundColor: '#2db7f5', color: '#fff' }, key: 'detail' }
        ]
      }
    },
    // 处理滑动操作点击
    onSwipeClick(e, item) {
      try {
        // 微信小程序中事件参数可能不同，需要兼容处理
        let key = ''
        
        // 尝试不同的参数结构
        if (e && e.content && e.content.key) {
          key = e.content.key
        } else if (e && e.detail && e.detail.key) {
          key = e.detail.key
        } else if (e && e.key) {
          key = e.key
        } else if (e && typeof e === 'string') {
          key = e
        }
        
        console.log('Swipe click event:', e, 'key:', key)
        
        if (key === 'receive') {
          this.receiveTask(item)
        } else if (key === 'reject') {
          this.rejectTask(item)
        } else if (key === 'delete') {
          this.deleteTask(item)
        } else if (key === 'detail') {
          this.goDetail(item)
        }
      } catch (error) {
        console.error('onSwipeClick error:', error)
      }
    },
    // 接收任务
    async receiveTask(item) {
      try {
        await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/task/feedback/${item.taskId}`,
            method: 'PUT',
            success: resolve,
            fail: reject
          })
        })
        uni.showToast({ title: '任务已接收', icon: 'success' })
        this.fetch(true)
      } catch(e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    // 拒绝任务
    async rejectTask(item) {
      try {
        const confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认拒绝',
            content: '确定要拒绝接受这个任务吗？',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
          })
        })
        
        if (!confirmResult) return
        
        await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/task/delete/${item.taskId}`,
            method: 'DELETE',
            success: resolve,
            fail: reject
          })
        })
        uni.showToast({ title: '已拒绝任务', icon: 'success' })
        this.fetch(true)
      } catch(e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    // 删除任务
    async deleteTask(item) {
      try {
        const confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认删除',
            content: '确定要删除这个任务吗？删除后无法恢复。',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
          })
        })
        
        if (!confirmResult) return
        
        await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/task/delete/${item.taskId}`,
            method: 'DELETE',
            success: resolve,
            fail: reject
          })
        })
        uni.showToast({ title: '删除成功', icon: 'success' })
        this.fetch(true)
      } catch(e) {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.task-query-page {
  min-height: 100vh;
  background: #f5f9ff;
  padding: 21rpx;
}

.search-filters-container {
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.06);
  overflow: hidden;
  margin-bottom: 20rpx;
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
  padding: 0 20rpx;
  border: 2rpx solid #e6f4ff;
  border-radius: 32rpx;
  background: #f8faff;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.08);
  transition: all 0.3s ease;
  flex: 1;
}

.search-input-container:focus-within {
  border-color: #1890ff;
  background: #fff;
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.15);
  transform: translateY(-1rpx);
}

.search-icon {
  width: 24rpx;
  height: 24rpx;
  margin-right: 12rpx;
  flex-shrink: 0;
  opacity: 0.7;
  transition: all 0.3s ease;
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
  font-weight: 400;
}

/* 筛选按钮样式 */
.filter-toggle {
  display: flex;
  align-items: center;
  gap: 8rpx;
  height: 64rpx;
  padding: 0 20rpx;
  background: linear-gradient(135deg, #f8faff, #e6f7ff);
  border: 2rpx solid #e6f4ff;
  border-radius: 32rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.08);
}

.filter-toggle:active {
  background: linear-gradient(135deg, #e6f7ff, #d6e4ff);
  border-color: #1890ff;
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.15);
  transform: translateY(-1rpx);
}

.filter-icon {
  width: 20rpx;
  height: 20rpx;
  flex-shrink: 0;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.filter-icon.expanded {
  transform: rotate(180deg);
}

.filter-text {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
}

/* 筛选条件区域 */
.filters-section {
  padding: 20rpx 24rpx;
  border-top: 1rpx solid #e6f4ff;
  background: linear-gradient(135deg, #fafbff, #f0f8ff);
  border-radius: 0 0 12rpx 12rpx;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

/* 时间区间行 */
.time-row {
  display: flex;
  gap: 20rpx;
  grid-column: 1 / -1;
  margin-bottom: 20rpx;
}

.time-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.time-label {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

.filter-item-with-buttons {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  grid-column: 1 / -1;
}

.input-button-group {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.filter-label {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

.filter-picker {
  width: 100%;
}

.picker-box {
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 12rpx;
  border: 2rpx solid #e6f4ff;
  background: #fff;
  padding: 0 16rpx;
  font-size: 24rpx;
  color: #333;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 4rpx rgba(24, 144, 255, 0.05);
}

.picker-box.placeholder {
  color: #999;
}

.picker-box:active {
  border-color: #1890ff;
  background: #fff;
  box-shadow: 0 4rpx 8rpx rgba(24, 144, 255, 0.15);
  transform: translateY(-1rpx);
}

.filter-input {
  flex: 1;
  height: 56rpx;
  padding: 0 16rpx;
  border: 2rpx solid #e6f4ff;
  border-radius: 12rpx;
  background: #fff;
  font-size: 24rpx;
  color: #333;
  box-sizing: border-box;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 4rpx rgba(24, 144, 255, 0.05);
}

.filter-input:focus {
  border-color: #1890ff;
  background: #fff;
  box-shadow: 0 4rpx 8rpx rgba(24, 144, 255, 0.15);
  transform: translateY(-1rpx);
}

.button-group {
  display: flex;
  gap: 20rpx;
}

.reset-btn {
  height: 48rpx;
  padding: 0 24rpx;
  border-radius: 6rpx;
  background: #f5f5f5;
  border: 1rpx solid #d9d9d9;
  color: #666;
  font-size: 26rpx;
  font-weight: 400;
  line-height: 48rpx;
  min-width: 80rpx;
}

.reset-btn:active {
  background: #e8e8e8;
}

.reset-btn::after {
  border: none;
}

.search-btn {
  height: 48rpx;
  padding: 0 24rpx;
  border-radius: 6rpx;
  background: #1890ff;
  border: none;
  color: #fff;
  font-size: 26rpx;
  font-weight: 400;
  line-height: 48rpx;
  min-width: 80rpx;
}

.search-btn:active {
  background: #40a9ff;
}

.list {
  background: #fff;
  padding: 22rpx;
  box-sizing: border-box;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.06);
}

/* 滑动操作样式 */
.swipe-item {
  position: relative;
  overflow: hidden;
}

.swipe-actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  gap: 0;
}

.action-btn {
  height: 100%;
  border: none;
  border-radius: 0;
  color: #fff;
  font-size: 22rpx;
  padding: 0 20rpx;
}

.action-btn.receive {
  background: #52c41a;
}

.action-btn.delete {
  background: #ff4d4f;
}

.action-btn.detail {
  background: #2db7f5;
}

.swipe-content {
  background: #fff;
  will-change: transform;
  transition: transform 0.2s ease;
}

.card {
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #f0f0f0;
  padding: 26rpx;
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

.task-status.status-supporting {
  background: linear-gradient(135deg, #fa8c16, #ffa940);
  box-shadow: 0 4rpx 12rpx rgba(250, 140, 22, 0.4);
  font-weight: 600;
  font-size: 22rpx;
  min-width: 100rpx;
  border: 2rpx solid #fff;
  animation: supportingPulse 2s infinite;
}

@keyframes supportingPulse {
  0% {
    box-shadow: 0 4rpx 12rpx rgba(250, 140, 22, 0.4);
  }
  50% {
    box-shadow: 0 6rpx 16rpx rgba(250, 140, 22, 0.6);
  }
  100% {
    box-shadow: 0 4rpx 12rpx rgba(250, 140, 22, 0.4);
  }
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.info-item.full-width {
  grid-column: 1 / -1;
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
  margin-top: 12rpx;
  padding: 16rpx;
  background: linear-gradient(135deg, #f0f8ff, #e6f7ff);
  border-radius: 12rpx;
  border: 1rpx solid #d6e4ff;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.08);
}

.extra-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 16rpx;
  padding: 8rpx 0;
  border-bottom: 1rpx solid rgba(24, 144, 255, 0.1);
}

.unit-info-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.extra-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

/* 单位内车辆信息样式 */
.unit-car-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-left: 32rpx;
  margin-top: 6rpx;
  padding: 8rpx 12rpx;
  background: linear-gradient(135deg, #fff7e6, #ffecc7);
  border-radius: 8rpx;
  border: 1rpx solid #ffd591;
  box-shadow: 0 1rpx 4rpx rgba(250, 140, 22, 0.1);
}

.car-text {
  font-size: 20rpx;
  color: #d46b08;
  font-weight: 500;
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
  font-size: 13px;
  margin: 20px 0 12px 0;
  padding: 8px;
  border-radius: 6px;
  backdrop-filter: blur(10px);
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