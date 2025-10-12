<template>
  <view class="fire-query-page">
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
                {{ (statusOptions[statusIndex] && statusOptions[statusIndex].label) || '请选择任务状态' }}
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

          <!-- 人员信息行 -->
          <view class="personnel-row">
            <view class="personnel-item">
              <text class="personnel-label">指派人员</text>
              <input 
                class="personnel-input"
                v-model="feedbackPersonName"
                placeholder="请输入任务下达人员"
                @input="onInput"
              />
            </view>
            <view class="personnel-item">
              <text class="personnel-label">记录人员</text>
              <input 
                class="personnel-input"
                v-model="issuePersonName"
                placeholder="请输入记录人员"
                @input="onInput"
              />
            </view>
          </view>

          <!-- 操作按钮行 -->
          <view class="button-row">
            <button class="reset-btn" @tap="resetFilters">重置</button>
            <button class="search-btn" @tap="onSearch">查询</button>
          </view>
        </view>
      </view>
    </view>
  
    <!-- 列表 -->
    <scroll-view class="list" :style="{ height: listHeight }" scroll-y :lower-threshold="100" @scrolltolower="loadMore" refresher-enabled :refresher-triggered="refresherTriggered" @refresherrefresh="onRefresh">
      <uni-swipe-action>
        <uni-swipe-action-item v-for="(item, idx) in list" :key="idx" :right-options="getSwipeOptions(item)" @click="onSwipeClick($event, item)" @change="onSwipeClick($event, item)">
          <view class="card" :class="(item.taskStatus == 3 ? 'rescue-card' : '') || (item.taskStatus == 4 ? 'supporting-card' : '')" @tap="goDetail(item)">
            <view class="card-header">
              <view class="address-info">
                <text class="address-name">{{ item.addressName }}</text>
              </view>
            </view>
            <!-- 状态进度条 -->
            <view class="status-route">
              <view class="route-container">
                <!-- 救援中标签 -->
                <view class="status-tag rescue-tag" :class="{ 'active': item.taskStatus == 2 }">
                  <view class="tag-dot"></view>
                  <text class="tag-label">救援中</text>
                  <view class="ripple" v-if="item.taskStatus == 2"></view>
                </view>
                
                <!-- 第一段连接线 -->
                <view class="route-line" v-if="item.taskStatus != 4">
                  <view class="line-base"></view>
                  <view class="line-progress" :class="item.taskStatus == 1 ? 'success' : (item.taskStatus == 3 ? 'warn' : (item.taskStatus == 4 ? 'supporting' : (item.taskStatus == 2 ? 'progress' : '')))" :style="{ width: getProgressWidth(item.taskStatus, 1) }"></view>
                </view>
                
                <!-- 需要支援标签 - 只有状态为3时显示 -->
                <view class="status-tag support-tag" :class="{ 'active': item.taskStatus == 3 }" v-if="item.taskStatus == 3">
                  <view class="tag-dot"></view>
                  <text class="tag-label">需要支援</text>
                  <view class="ripple" v-if="item.taskStatus == 3"></view>
                </view>
                
                <!-- 第二段连接线 - 只有状态为3或4时显示 -->
                <view class="route-line" v-if="item.taskStatus == 3 || item.taskStatus == 4">
                  <view class="line-base"></view>
                  <view class="line-progress" :class="item.taskStatus == 1 ? 'success' : (item.taskStatus == 3 ? 'warn' : (item.taskStatus == 4 ? 'supporting' : (item.taskStatus == 2 ? 'progress' : '')))" :style="{ width: getProgressWidth(item.taskStatus, 2) }"></view>
                </view>
                
                <!-- 正在支援标签 - 只有状态为4时显示 -->
                <view class="status-tag supporting-tag" :class="{ 'active': item.taskStatus == 4 }" v-if="item.taskStatus == 4">
                  <view class="tag-dot"></view>
                  <text class="tag-label">正在支援</text>
                  <view class="ripple" v-if="item.taskStatus == 4"></view>
                </view>
                
                <!-- 第三段连接线 - 只有状态为4时显示 -->
                <view class="route-line" v-if="item.taskStatus == 4">
                  <view class="line-base"></view>
                  <view class="line-progress" :class="item.taskStatus == 1 ? 'success' : (item.taskStatus == 3 ? 'warn' : (item.taskStatus == 4 ? 'supporting' : (item.taskStatus == 2 ? 'progress' : '')))" :style="{ width: getProgressWidth(item.taskStatus, 3) }"></view>
                </view>
                
                <!-- 已完成标签 -->
                <view class="status-tag complete-tag" :class="{ 'active': item.taskStatus == 1 }">
                  <view class="tag-dot"></view>
                  <text class="tag-label">已完成</text>
                </view>
              </view>
            </view>
            <view class="card-content">
              <view class="info-grid">
                <view class="info-item full-width">
                  <image :src="serverUrl + '/static/icons/location/factory.png'" class="info-icon" />
                  <text class="info-text">{{ getRescueUnits(item) }}</text>
                </view>
                <view class="info-row">
                  <view class="info-item">
                    <image :src="serverUrl + '/static/icons/common/issuePerson.png'" class="info-icon" />
                    <text class="info-text">{{ item.issuePersonName || '—' }}</text>
                  </view>
                  <view class="info-item">
                    <image :src="serverUrl + '/static/icons/common/time.png'" class="info-icon" />
                    <text class="info-text">{{ formatTime(item.issueTime) }}</text>
                  </view>
                </view>
              </view>
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
      serverUrl: 'http://192.168.1.4:3000',
      keyword: '',
      issuePersonName: '',
      feedbackPersonName: '', // 新增：任务下达人员
      startTime: '', // 新增：开始时间
      endTime: '', // 新增：结束时间
      startTimeIndex: [0, 0, 0, 0, 0], // 新增：开始时间选择器索引
      endTimeIndex: [0, 0, 0, 0, 0], // 新增：结束时间选择器索引
      startTimeRange: [[], [], [], [], []], // 新增：开始时间选择器数据
      endTimeRange: [[], [], [], [], []], // 新增：结束时间选择器数据
      debounceTimer: null,
      filtersExpanded: false, // 新增：筛选条件展开状态
      unitOptions: [],
      statusOptions: [],
      fireCarOptions: [],
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
      refresherTriggered: false
    }
  },
  async onLoad() {
    await this.loadStatic()
    this.initDateTimePickers()
    this.fetch(true)
  },
  onReachBottom() { this.loadMore() },
  onShow() {
    // 页面显示时重新加载数据（避免与onLoad重复调用）
    if (this.list.length > 0) {
      this.fetch(true)
    }
  },
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
    goDetail(item) {
      uni.navigateTo({ url: `/pages/data/fireDetail/index?situationId=${encodeURIComponent(item.situationId)}` })
    },
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
      const cachedStatuses = uni.getStorageSync('static_taskStatuses')
      const cachedCars = uni.getStorageSync('static_fireCars')
      
      // 如果本地有数据，直接使用
      if (cachedUnits && cachedStatuses && cachedCars) {
        this.unitOptions = [
          { label: '请选择救援单位', value: '', index: 0 },
          ...cachedUnits
        ]
        this.statusOptions = [
          { label: '请选择任务状态', value: '', index: 0 },
          ...cachedStatuses
        ]
        this.fireCarOptions = [
          { label: '请选择消防车辆', value: '', index: 0 },
          ...cachedCars
        ]
        return
      }
      
      // 如果本地没有数据，从接口获取
      const req = (key) => new Promise((resolve, reject) => {
        uni.request({ url: this.serverUrl + '/static/data', method: 'GET', data: { type: 'fireUnits', key }, success: resolve, fail: reject })
      })
      try {
        const [units, statuses, cars] = await Promise.all([
          req('unitList'), 
          req('statusList'),
          req('carList')
        ])
        
        // 处理数据并缓存到本地存储
        const unitList = ((units && units.data && units.data.data) ? units.data.data : []).map((it, i) => ({ label: it.data1, value: String(it.data2), index: i + 1 }))
        const statusList = ((statuses && statuses.data && statuses.data.data) ? statuses.data.data : []).map((it, i) => ({ label: it.data1, value: String(it.data2), index: i + 1 }))
        const carList = ((cars && cars.data && cars.data.data) ? cars.data.data : []).map((it, i) => ({ label: it.data1, value: String(it.data2), index: i + 1 }))
        
        // 缓存到本地存储
        uni.setStorageSync('static_fireUnits', unitList)
        uni.setStorageSync('static_taskStatuses', statusList)
        uni.setStorageSync('static_fireCars', carList)
        
        this.unitOptions = [
          { label: '请选择救援单位', value: '', index: 0 },
          ...unitList
        ]
        this.statusOptions = [
          { label: '请选择任务状态', value: '', index: 0 },
          ...statusList
        ]
        this.fireCarOptions = [
          { label: '请选择消防车辆', value: '', index: 0 },
          ...carList
        ]
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
        taskStatus: (this.statusOptions[this.statusIndex] && this.statusOptions[this.statusIndex].value) || '',
        feedbackPersonName: (this.feedbackPersonName || '').trim(),
        startTime: this.startTime || '',
        endTime: this.endTime || '',
        issuePersonName: (this.issuePersonName || '').trim(),
        keyword: (this.keyword || '').trim()
      }
      this.isLoading = true
      uni.request({
        url: this.serverUrl + '/fire/list',
        method: 'GET',
        data: params,
        success: (res) => {
          if (res?.data?.code === 200) {
            const { data: list, pagination } = res.data
            const processedList = list.map(item => ({ ...item }))
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
      this.feedbackPersonName = ''
      this.startTime = ''
      this.endTime = ''
      this.startTimeIndex = [0, 0, 0, 0, 0]
      this.endTimeIndex = [0, 0, 0, 0, 0]
      this.issuePersonName = ''
      this.keyword = ''
      this.fetch(true)
    },
    // 新增：切换筛选条件展开状态
    toggleFilters() {
      this.filtersExpanded = !this.filtersExpanded
    },
    // 获取任务类型名称
    getTaskTypeName(typeValue) {
      const type = this.taskTypeOptions.find(item => item.value === String(typeValue))
      return type ? type.label : `类型${typeValue}`
    },
    // 获取任务状态名称
    getTaskStatusName(statusValue) {
      const status = this.statusOptions.find(item => item.value === String(statusValue))
      return status ? status.label : `状态${statusValue}`
    },
    // 获取位置类型名称
    getLocationTypeName(locationValue) {
      const location = this.locationTypeOptions.find(item => item.value === Number(locationValue))
      return location ? location.label : `位置${locationValue}`
    },
    // 获取方向名称
    getDirectionName(directionValue) {
      const direction = this.directionOptions.find(item => item.value === Number(directionValue))
      return direction ? direction.label : `方向${directionValue}`
    },
    // 卡片样式（需要救援/救援中/已完成）
    getCardClass(item) {
      if (item.taskStatus == 3) return 'rescue-card'
      return ''
    },
    // 格式化时间
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
    // 获取任务额外值的显示文本
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
    },
    // 获取进度条样式类
    getProgressClass(taskStatus, segment) {
      if (taskStatus == 1) return 'success'  // 已完成 - 绿色
      if (taskStatus == 3) return 'warn'     // 需要支援 - 红色
      if (taskStatus == 4) return 'supporting' // 正在支援 - 橙色
      if (taskStatus == 2) return 'progress' // 救援中 - 蓝色
      return ''
    },
    // 获取进度条宽度
    getProgressWidth(taskStatus, segment) {
      if (taskStatus == 1) {
        // 已完成 - 所有段都填满
        return '100%'
      }
      if (taskStatus == 4) {
        // 正在支援 - 前两段填满，第三段填满
        return '100%'
      }
      if (taskStatus == 3) {
        // 需要支援 - 第一段填满，第二段填满
        return '100%'
      }
      if (taskStatus == 2) {
        // 救援中 - 第一段填满，第二段不填
        return segment === 1 ? '100%' : '0%'
      }
      return '0%'
    },
    // 获取救灾单位名称（所有单位）
    getRescueUnits(item) {
      if (!item.assignedUnits || item.assignedUnits.length === 0) return '—'
      return item.assignedUnits.map(unit => unit.unitName).join('、')
    },
    // 根据任务状态获取滑动操作选项
    getSwipeOptions(item) {
      const taskStatus = item.taskStatus
      
      if (taskStatus == 1) {
        // 已完成 - 查看详情、删除
        return [
          { text: '查看详情', style: { backgroundColor: '#2db7f5', color: '#fff' }, key: 'detail' },
          { text: '删除', style: { backgroundColor: '#ff4d4f', color: '#fff' }, key: 'delete' }
        ]
      } else if (taskStatus == 2) {
        // 救援中 - 查看详情、完成救援、需要支援
        return [
          { text: '查看详情', style: { backgroundColor: '#2db7f5', color: '#fff' }, key: 'detail' },
          { text: '完成救援', style: { backgroundColor: '#52c41a', color: '#fff' }, key: 'finish' },
          { text: '需要支援', style: { backgroundColor: '#ff4d4f', color: '#fff' }, key: 'support' }
        ]
      } else if (taskStatus == 3) {
        // 需要支援 - 查看详情、任务下达
        return [
          { text: '查看详情', style: { backgroundColor: '#2db7f5', color: '#fff' }, key: 'detail' },
          { text: '任务下达', style: { backgroundColor: '#fa8c16', color: '#fff' }, key: 'deliver' }
        ]
      } else if (taskStatus == 4) {
        // 正在支援 - 查看详情、完成救援
        return [
          { text: '查看详情', style: { backgroundColor: '#2db7f5', color: '#fff' }, key: 'detail' },
          { text: '完成救援', style: { backgroundColor: '#52c41a', color: '#fff' }, key: 'finish' },
          { text: '任务下达', style: { backgroundColor: '#fa8c16', color: '#fff' }, key: 'deliver' }
        ]
      } else {
        // 其他状态 - 默认选项
        return [
          { text: '查看详情', style: { backgroundColor: '#2db7f5', color: '#fff' }, key: 'detail' }
        ]
      }
    },
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
        
        if (key === 'detail') {
          uni.navigateTo({ url: `/pages/data/fireDetail/index?situationId=${encodeURIComponent(item.situationId)}` })
        } else if (key === 'finish') {
          this.finishRescue(item)
        } else if (key === 'deliver') {
          uni.navigateTo({ url: `/pages/data/fireUpload/index?situationId=${encodeURIComponent(item.situationId)}` })
        } else if (key === 'support') {
          this.requestSupport(item)
        } else if (key === 'delete') {
          this.deleteFireSituation(item)
        }
      } catch (error) {
        console.error('onSwipeClick error:', error)
      }
    },
    async finishRescue(item) {
      try {
        await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/fire/situations/${item.situationId}`,
            method: 'PUT',
            data: { taskStatus: 1 },
            success: resolve,
            fail: reject
          })
        })
        uni.showToast({ title: '已完成', icon: 'success' })
        this.fetch(true)
      } catch(e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    async requestSupport(item) {
      try {
        await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/fire/situations/${item.situationId}`,
            method: 'PUT',
            data: { taskStatus: 3 },
            success: resolve,
            fail: reject
          })
        })
        uni.showToast({ title: '已申请支援', icon: 'success' })
        this.fetch(true)
      } catch(e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    // 删除火灾情况
    async deleteFireSituation(item) {
      try {
        const confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认删除',
            content: '确定要删除这个火灾情况吗？删除后无法恢复。',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
          })
        })
        
        if (!confirmResult) return
        
        await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/fire/situations/${item.situationId}`,
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
.fire-query-page {
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

/* 人员信息行 */
.personnel-row {
  display: flex;
  gap: 20rpx;
  grid-column: 1 / -1;
  margin-bottom: 20rpx;
}

.personnel-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.personnel-label {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

.personnel-input {
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

.personnel-input:focus {
  border-color: #1890ff;
  background: #fff;
  box-shadow: 0 4rpx 8rpx rgba(24, 144, 255, 0.15);
  transform: translateY(-1rpx);
}

/* 按钮行 */
.button-row {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  grid-column: 1 / -1;
  margin-top: 8rpx;
}

.filter-label {
  font-size: 24rpx;
  color: #333;
  font-weight: 400;
}

.filter-picker {
  width: 100%;
}

.picker-box {
  height: 48rpx;
  line-height: 48rpx;
  border-radius: 6rpx;
  border: 1rpx solid #e0e0e0;
  background: #fafafa;
  padding: 0 12rpx;
  font-size: 24rpx;
  color: #333;
  transition: all 0.2s ease;
}

.picker-box.placeholder {
  color: #999;
}

.picker-box:active {
  border-color: #1677ff;
  background: #fff;
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
  margin: 0 12rpx 12rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.06);
}

.swipe-item{position:relative;overflow:hidden}
.swipe-actions{position:absolute;right:0;top:0;bottom:0;display:flex;align-items:stretch;gap:0}
.action-btn{height:100%;border:none;border-radius:0;color:#fff;font-size:22rpx;padding:0 20rpx}
.action-btn.detail{background:#2db7f5}
.action-btn.finish{background:#52c41a}
.action-btn.deliver{background:#fa8c16}
.swipe-content{background:#fff;will-change:transform;transition:transform .2s ease}

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

.ripple{position:absolute;left:-8rpx;top:-8rpx;width:28rpx;height:28rpx;border-radius:50%;border:2rpx solid rgba(24,144,255,.5);animation:rippleAnim 1.8s infinite}
@keyframes rippleAnim{0%{transform:scale(.8);opacity:.8}70%{transform:scale(1.8);opacity:.2}100%{transform:scale(2.2);opacity:0}}

/* 状态路线样式 */
.status-route {
  padding: 16rpx 0;
}

.route-container {
  display: flex;
  align-items: center;
  position: relative;
  padding: 0 20rpx;
}

.status-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  position: relative;
  z-index: 2;
}

/* 波纹特效 */
.ripple {
  position: absolute;
  left: 50%;
  top: 0;
  width: 32rpx;
  height: 32rpx;
  margin-left: -16rpx;
  margin-top: -8rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(24, 144, 255, 0.6);
  animation: rippleAnim 1.8s infinite;
}

.status-tag.support-tag .ripple {
  border-color: rgba(255, 77, 79, 0.6);
}

.status-tag.supporting-tag .ripple {
  border-color: rgba(250, 140, 22, 0.6);
}

@keyframes rippleAnim {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  70% {
    transform: scale(1.8);
    opacity: 0.2;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

.tag-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #d9d9d9;
  border: 3rpx solid #fff;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.tag-label {
  font-size: 20rpx;
  color: #999;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.status-tag.active .tag-dot {
  background: #1890ff;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
}

.status-tag.active .tag-label {
  color: #1890ff;
  font-weight: 600;
}

/* 需要支援状态样式 */
.status-tag.support-tag.active .tag-dot {
  background: #ff4d4f;
  box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.3);
}

.status-tag.support-tag.active .tag-label {
  color: #ff4d4f;
  font-weight: 600;
}

/* 正在支援状态样式 */
.status-tag.supporting-tag.active .tag-dot {
  background: #fa8c16;
  box-shadow: 0 2rpx 8rpx rgba(250, 140, 22, 0.3);
}

.status-tag.supporting-tag.active .tag-label {
  color: #fa8c16;
  font-weight: 600;
}

/* 已完成状态样式 */
.status-tag.complete-tag.active .tag-dot {
  background: #52c41a;
  box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.3);
}

.status-tag.complete-tag.active .tag-label {
  color: #52c41a;
  font-weight: 600;
}

.route-line {
  flex: 1;
  height: 6rpx;
  position: relative;
  margin: 0 20rpx;
}

.line-base {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 6rpx;
  background: #e6e6e6;
  border-radius: 3rpx;
}

.line-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 6rpx;
  border-radius: 3rpx;
  background: #1890ff;
  transition: all 0.5s ease;
}

.line-progress.progress {
  background: #1890ff;  /* 救援中 - 蓝色 */
}

.line-progress.warn {
  background: #ff4d4f;  /* 需要支援 - 红色 */
}

.line-progress.supporting {
  background: #fa8c16;  /* 正在支援 - 橙色 */
}

.line-progress.success {
  background: #52c41a;  /* 已完成 - 绿色 */
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

.task-status.status-unknown {
  background: linear-gradient(135deg, #8c8c8c, #a6a6a6);
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

.load-more {
  text-align: center;
  color: #999;
  font-size: 24rpx;
  margin: 20rpx 0;
  padding: 8rpx;
}

/* 需要救援的卡片样式 */
.rescue-card {
  border: 2rpx solid #ff4d4f !important;
  background: linear-gradient(135deg, #fff5f5, #ffe6e6) !important;
  box-shadow: 0 4rpx 16rpx rgba(255, 77, 79, 0.2) !important;
  animation: rescuePulse 3s infinite;
}

/* 正在支援的卡片样式 */
.supporting-card {
  border: 2rpx solid #fa8c16 !important;
  background: linear-gradient(135deg, #fff7e6, #ffecc7) !important;
  box-shadow: 0 4rpx 16rpx rgba(250, 140, 22, 0.2) !important;
  animation: supportingCardPulse 3s infinite;
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

@keyframes supportingCardPulse {
  0% {
    box-shadow: 0 4rpx 16rpx rgba(250, 140, 22, 0.2);
  }
  50% {
    box-shadow: 0 6rpx 20rpx rgba(250, 140, 22, 0.4);
  }
  100% {
    box-shadow: 0 4rpx 16rpx rgba(250, 140, 22, 0.2);
  }
}

</style>