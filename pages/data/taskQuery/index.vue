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
            placeholder="输入救援地址或编号"
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

          <!-- 任务类型和参战人员行 -->
          <view class="task-type-personnel-row">
            <view class="filter-item">
              <text class="filter-label">任务类型</text>
              <picker :value="taskTypeIndex" :range="taskTypeOptions" range-key="label" @change="onTaskTypeChange" @bindchange="onTaskTypeChange" class="filter-picker">
                <view class="picker-box" :class="{ 'placeholder': taskTypeIndex === 0 }">
                  {{ (taskTypeOptions[taskTypeIndex] && taskTypeOptions[taskTypeIndex].label) || '请选择任务类型' }}
                </view>
              </picker>
            </view>
            <view class="personnel-item">
              <text class="personnel-label">参战人员</text>
              <input 
                class="personnel-input"
                v-model="recordPerson"
                placeholder="请输入参战人员"
                @input="onInput"
              />
            </view>
          </view>

          <!-- 操作按钮行 -->
          <view class="button-row">
            <button class="search-btn" @tap="onSearch">查询</button>
            <button class="reset-btn" @tap="resetFilters">重置</button>
          </view>
        </view>
      </view>
    </view>
  
    <!-- 列表 -->
    <scroll-view class="list" :style="{ height: listHeight }" scroll-y :lower-threshold="100" @scrolltolower="loadMore" refresher-enabled :refresher-triggered="refresherTriggered" @refresherrefresh="onRefresh">
      <uni-swipe-action>
        <uni-swipe-action-item v-for="(item, idx) in list" :key="idx" :right-options="getSwipeOptions(item)" @click="onSwipeClick($event, item)">
          <view class="card" :class="item.cardClass" @tap="goDetail(item)">
            <view class="card-header">
              <view class="address-info">
                <text class="address-name">{{ item.fireSituation && item.fireSituation.addressName }}</text>
              </view>
              <view class="header-meta">
                <text class="meta-text" v-if="item.fireSituation && item.fireSituation.issuePersonName">{{ item.fireSituation.issuePersonName }}</text>
                <text class="meta-divider" v-if="item.fireSituation && item.fireSituation.issuePersonName && item.fireSituation.issueTime">|</text>
                <text class="meta-text" v-if="item.fireSituation && item.fireSituation.issueTime">{{ formatTime(item.fireSituation.issueTime) }}</text>
              </view>
            </view>
            
            <view class="card-content">
              <view class="info-grid">
                <view v-for="(unit, unitIdx) in ((item.fireSituation && item.fireSituation.assignedUnits) || [])" :key="unitIdx" class="unit-info-block">
                  <!-- 救援单位/支援单位 -->
                  <view class="info-item full-width">
                    <image :src="serverUrl + '/static/icons/location/factory.png'" class="info-icon" />
                    <text class="info-text">{{ unit.unitName || '—' }}</text>
                    <view class="unit-status-badge" :class="unit.unitStatus === 'rescue' ? 'rescue-badge' : 'support-badge'">
                      <view class="status-dot"></view>
                      <text class="status-text">{{ unit.unitStatus === 'rescue' ? '救援单位' : '支援单位' }}</text>
                    </view>
                  </view>
                  <!-- 作战力量、方位、楼层 -->
                  <view v-if="unit.taskGroups && unit.taskGroups.length > 0" class="task-groups-info">
                    <view v-for="(taskGroup, tgIdx) in unit.taskGroups" :key="tgIdx" class="task-group-info">
                      <view class="task-group-content">
                        <!-- 任务类型名称（多个任务类型时显示，左上角） -->
                        <view class="task-type-badge" v-if="hasMultipleTaskTypes(item.fireSituation)">
                          <text class="task-type-text">{{ getTaskTypeName(taskGroup.taskType) }}</text>
                        </view>
                        
                        <!-- 第一行：左侧（方位、楼层），右侧（参战车辆） -->
                        <view class="task-group-first-row">
                          <view class="task-location-info">
                            <text class="task-detail-text" v-if="taskGroup.direction">方位：{{ getDirectionName(taskGroup.direction) }}</text>
                            <text class="task-detail-text" v-if="taskGroup.floor">楼层：{{ taskGroup.floor }}层</text>
                          </view>
                          <text class="task-cars-text" v-if="getTaskGroupCars(taskGroup)">参战车辆：{{ getTaskGroupCars(taskGroup) }}</text>
                        </view>
                        
                        <!-- 第二行：任务类型特殊属性 -->
                        <view class="task-group-second-row">
                          <!-- 搜救任务：显示搜救力量和搜救结果 -->
                          <template v-if="isSearchTask(taskGroup)">
                            <view class="task-attr-item" v-if="getSearchPower(taskGroup)">
                              <text class="task-attr-label">搜救力量：</text>
                              <text class="task-attr-value">{{ getSearchPower(taskGroup) }}</text>
                            </view>
                            <view class="task-attr-item" v-if="getSearchResult(taskGroup)">
                              <text class="task-attr-label">搜救结果：</text>
                              <text class="task-attr-value">{{ getSearchResult(taskGroup) }}</text>
                            </view>
                          </template>
                          
                          <!-- 排烟任务：显示排烟力量 -->
                          <template v-else-if="isSmokeTask(taskGroup)">
                            <view class="task-attr-item">
                              <text class="task-attr-label">排烟力量：</text>
                              <text class="task-attr-value">{{ getSmokePower(taskGroup) || '—' }}</text>
                            </view>
                          </template>
                          
                          <!-- 供水任务：显示目标中队和目标车辆 -->
                          <template v-else-if="isWaterTask(taskGroup)">
                            <view class="task-attr-item" v-if="getTargetUnit(taskGroup)">
                              <text class="task-attr-label">目标中队：</text>
                              <text class="task-attr-value">{{ getTargetUnit(taskGroup) }}</text>
                            </view>
                            <view class="task-attr-item" v-if="getTargetCars(taskGroup)">
                              <text class="task-attr-label">目标车辆：</text>
                              <text class="task-attr-value">{{ getTargetCars(taskGroup) }}</text>
                            </view>
                          </template>
                          
                          <!-- 其他任务类型：显示作战力量 -->
                          <template v-else>
                            <view class="task-attr-item" v-if="getTaskPower(taskGroup)">
                              <text class="task-attr-label">{{ getTaskPowerLabel(taskGroup) }}：</text>
                              <text class="task-attr-value">{{ getTaskPower(taskGroup) }}</text>
                            </view>
                          </template>
                        </view>
                        
                        <!-- 任务组描述/备注 -->
                        <view class="task-group-description" v-if="taskGroup.description">
                          <text class="description-label">描述：</text>
                          <text class="description-text">{{ taskGroup.description }}</text>
                        </view>
                      </view>
                    </view>
                  </view>
                  
                  <!-- 单位备注 -->
                  <view class="unit-remark" v-if="unit.remark">
                    <text class="unit-remark-label">备注：</text>
                    <text class="unit-remark-text">{{ unit.remark }}</text>
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
      debounceTimer: null,
      filtersExpanded: false,
      unitOptions: [],
      statusOptions: [],
      taskTypeOptions: [], // 任务类型选项
      locationTypeOptions: locationTypeOptions,
      directionOptions: directionOptions,
      unitIndex: 0, 
      statusIndex: 0,
      taskTypeIndex: 0,
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
      const cachedTaskTypes = uni.getStorageSync('static_taskTypes')
      
      // 如果本地有数据，直接使用
      if (cachedUnits) {
        this.unitOptions = [
          { label: '请选择救援单位', value: '', index: 0 },
          ...cachedUnits
        ]
        this.statusOptions = this.taskFeedbackOptions
        // 加载任务类型
        if (cachedTaskTypes && cachedTaskTypes.length > 0) {
          this.taskTypeOptions = [
            { label: '请选择任务类型', value: '', index: 0 },
            ...cachedTaskTypes
          ]
        } else {
          // 如果没有缓存，尝试从接口获取
          await this.loadTaskTypes()
        }
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
        
        // 加载任务类型
        await this.loadTaskTypes()
      } catch(e) {
        console.error('加载静态数据失败:', e)
      }
    },
    async loadTaskTypes() {
      try {
        // 尝试从接口获取任务类型
        const res = await new Promise((resolve, reject) => {
          uni.request({ 
            url: this.serverUrl + '/static/data', 
            method: 'GET', 
            data: { type: 'fireUnits', key: 'taskTypeList' }, 
            success: resolve, 
            fail: reject 
          })
        })
        
        if (res?.data?.code === 200 && res.data.data) {
          const taskTypeList = res.data.data.map((it, i) => ({ 
            label: it.data1, 
            value: String(it.data2), 
            index: i + 1 
          }))
          uni.setStorageSync('static_taskTypes', taskTypeList)
          this.taskTypeOptions = [
            { label: '请选择任务类型', value: '', index: 0 },
            ...taskTypeList
          ]
        } else {
          // 如果接口没有数据，使用默认任务类型
          const defaultTaskTypes = [
            { label: '灭火', value: '1', index: 1 },
            { label: '堵截', value: '2', index: 2 },
            { label: '搜救', value: '3', index: 3 },
            { label: '排烟', value: '4', index: 4 },
            { label: '供水', value: '5', index: 5 }
          ]
          this.taskTypeOptions = [
            { label: '请选择任务类型', value: '', index: 0 },
            ...defaultTaskTypes
          ]
        }
      } catch(e) {
        console.error('加载任务类型失败:', e)
        // 使用默认任务类型
        const defaultTaskTypes = [
          { label: '灭火', value: '1', index: 1 },
          { label: '堵截', value: '2', index: 2 },
          { label: '搜救', value: '3', index: 3 },
          { label: '排烟', value: '4', index: 4 },
          { label: '供水', value: '5', index: 5 }
        ]
        this.taskTypeOptions = [
          { label: '请选择任务类型', value: '', index: 0 },
          ...defaultTaskTypes
        ]
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
        taskType: (this.taskTypeOptions[this.taskTypeIndex] && this.taskTypeOptions[this.taskTypeIndex].value) || '',
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
    onTaskTypeChange(e) { 
      try {
        const value = e.detail ? e.detail.value : e.value
        this.taskTypeIndex = Number(value)
        this.fetch(true)
      } catch (error) {
        console.error('onTaskTypeChange error:', error)
      }
    },
    resetFilters() {
      this.unitIndex = 0
      this.statusIndex = 0
      this.taskTypeIndex = 0
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
        2: '已接收',
        3: '已执行'
      }
      return statusMap[statusValue] || `状态${statusValue}`
    },
    getTaskStatusClass(statusValue) {
      // 根据taskStatus返回样式类
      const classMap = {
        1: 'status-unreceived',
        2: 'status-received',
        3: 'status-finished'
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
      const type = this.taskTypeOptions.find(item => item.value === String(taskType))
      return type ? type.label : `类型${taskType}`
    },
    // 获取方向名称
    getDirectionName(directionValue) {
      const direction = this.directionOptions.find(item => item.value === Number(directionValue))
      return direction ? direction.label : `方向${directionValue}`
    },
    // 获取任务组的参战车辆
    getTaskGroupCars(taskGroup) {
      if (!taskGroup) return ''
      
      // 优先使用 carNames 数组
      if (taskGroup.carNames && Array.isArray(taskGroup.carNames) && taskGroup.carNames.length > 0) {
        return taskGroup.carNames.join('、')
      }
      
      // 如果没有 carNames，尝试从 carInfo 获取
      if (taskGroup.carInfo && Array.isArray(taskGroup.carInfo) && taskGroup.carInfo.length > 0) {
        return taskGroup.carInfo.map(car => car.carName || car.label || car.name).filter(Boolean).join('、')
      }
      
      return ''
    },
    // 获取任务组的作战力量
    getTaskPower(taskGroup) {
      if (!taskGroup || !taskGroup.taskExtra) return ''
      
      const taskExtra = taskGroup.taskExtra || {}
      const taskType = String(taskGroup.taskType || '')
      
      // 根据任务类型获取作战力量
      if (taskType === '1' && taskExtra.firePower) {
        return taskExtra.firePower // 灭火力量
      }
      if (taskType === '2' && taskExtra.blockPower) {
        return taskExtra.blockPower // 堵截力量
      }
      
      return ''
    },
    // 获取任务组的作战力量标签（根据任务类型）
    getTaskPowerLabel(taskGroup) {
      if (!taskGroup) return '作战力量'
      
      const taskType = String(taskGroup.taskType || '')
      
      if (taskType === '1') return '灭火力量'
      if (taskType === '2') return '堵截力量'
      if (taskType === '3') return '搜救力量'
      if (taskType === '4') return '排烟力量'
      if (taskType === '5') return '目标中队'
      
      return '作战力量'
    },
    // 判断是否是搜救任务
    isSearchTask(taskGroup) {
      if (!taskGroup) return false
      const taskType = String(taskGroup.taskType || '')
      return taskType === '3'
    },
    // 判断是否是排烟任务
    isSmokeTask(taskGroup) {
      if (!taskGroup) return false
      const taskType = String(taskGroup.taskType || '')
      return taskType === '4'
    },
    // 判断是否是供水任务
    isWaterTask(taskGroup) {
      if (!taskGroup) return false
      const taskType = String(taskGroup.taskType || '')
      return taskType === '5'
    },
    // 获取搜救力量
    getSearchPower(taskGroup) {
      if (!taskGroup) return ''
      // 优先从 taskGroup 顶层获取
      if (taskGroup.searchPower) return taskGroup.searchPower
      // 其次从 taskExtra 获取
      if (taskGroup.taskExtra && taskGroup.taskExtra.searchPower) {
        return taskGroup.taskExtra.searchPower
      }
      return ''
    },
    // 获取搜救结果
    getSearchResult(taskGroup) {
      if (!taskGroup) return ''
      // 优先从 taskGroup 顶层获取
      if (taskGroup.searchResult) return taskGroup.searchResult
      // 其次从 taskExtra 获取
      if (taskGroup.taskExtra && taskGroup.taskExtra.searchResult) {
        return taskGroup.taskExtra.searchResult
      }
      return ''
    },
    // 获取排烟力量
    getSmokePower(taskGroup) {
      if (!taskGroup) return ''
      // 优先从 taskGroup 顶层获取
      if (taskGroup.smokePower) return taskGroup.smokePower
      // 其次从 taskExtra 获取
      if (taskGroup.taskExtra && taskGroup.taskExtra.smokePower) {
        return taskGroup.taskExtra.smokePower
      }
      return ''
    },
    // 获取目标中队（供水任务）
    getTargetUnit(taskGroup) {
      if (!taskGroup || !taskGroup.taskExtra) return ''
      const taskExtra = taskGroup.taskExtra || {}
      // 优先从 targetUnit 获取
      if (taskExtra.targetUnit) {
        const targetUnit = this.unitOptions.find(u => u.value === taskExtra.targetUnit)
        return targetUnit ? targetUnit.label : taskExtra.targetUnit
      }
      // 其次从 supplyTarget 获取
      if (taskExtra.supplyTarget) {
        const targetUnit = this.unitOptions.find(u => u.value === taskExtra.supplyTarget)
        return targetUnit ? targetUnit.label : taskExtra.supplyTarget
      }
      return ''
    },
    // 获取目标车辆（供水任务）
    getTargetCars(taskGroup) {
      if (!taskGroup) return ''
      // 从 targetCars 数组获取
      if (taskGroup.targetCars && Array.isArray(taskGroup.targetCars) && taskGroup.targetCars.length > 0) {
        return taskGroup.targetCars.map(car => car.carName || car.name || car.label || '').filter(Boolean).join('、')
      }
      return ''
    },
    // 判断是否有多个任务类型
    hasMultipleTaskTypes(fireSituation) {
      if (!fireSituation || !fireSituation.assignedUnits) return false
      
      // 收集所有救援单位的任务类型
      const taskTypes = new Set()
      const rescueUnits = (fireSituation.assignedUnits || []).filter(unit => unit.unitStatus === 'rescue')
      
      rescueUnits.forEach(unit => {
        if (unit.taskGroups && unit.taskGroups.length > 0) {
          unit.taskGroups.forEach(taskGroup => {
            if (taskGroup.taskType) {
              taskTypes.add(String(taskGroup.taskType))
            }
          })
        }
        // 如果没有任务组，尝试从旧的任务类型字段获取
        if (unit.taskType) {
          taskTypes.add(String(unit.taskType))
        }
      })
      
      // 如果有多个任务类型，返回true
      return taskTypes.size > 1
    },
    // 跳转到任务详情
    goDetail(item) {
      uni.navigateTo({ url: `/pages/data/taskDetail/index?taskId=${encodeURIComponent(item.taskId)}` })
    },
    // 根据任务状态获取滑动操作选项
    getSwipeOptions(item) {
      const status = item.status
      
      if (status === 1) {
        // 未接收 - 显示接收任务
        return [
          { text: '接收任务', style: { backgroundColor: '#52c41a', color: '#fff' }, key: 'receive' }
        ]
      } else if (status === 2) {
        // 已接收 - 显示执行完毕和拒绝任务
        return [
          { text: '执行完毕', style: { backgroundColor: '#52c41a', color: '#fff' }, key: 'finish' },
          { text: '拒绝任务', style: { backgroundColor: '#fa8c16', color: '#fff' }, key: 'reject' }
        ]
      } else if (status === 3) {
        // 已执行 - 显示删除
        return [
          { text: '删除', style: { backgroundColor: '#ff4d4f', color: '#fff' }, key: 'delete' }
        ]
      }
      return []
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
        } else if (key === 'finish') {
          this.finishTask(item)
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
        const confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认接收',
            content: '确定要接收这个任务吗？',
            confirmText: '确认接收',
            cancelText: '取消',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
          })
        })
        
        if (!confirmResult) return
        
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/task/feedback/${item.taskId}`,
            method: 'PUT',
            data: {
              status: 1,
              commitType: 'receive'
            },
            success: resolve,
            fail: reject
          })
        })
        
        if (res?.data?.code === 200) {
          uni.showToast({ title: '任务已接收', icon: 'success' })
          this.fetch(true)
        } else {
          const errorMsg = res?.data?.msg || '接收任务失败'
          uni.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
        }
      } catch(e) {
        const errorMsg = e?.message || e?.data?.msg || '操作失败'
        uni.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
      }
    },
    // 拒绝任务
    async rejectTask(item) {
      try {
        const addressName = (item.fireSituation && item.fireSituation.addressName) || '该任务'
        const confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认拒绝',
            content: `确定要拒绝"${addressName}"的任务吗？`,
            confirmText: '确认拒绝',
            cancelText: '取消',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
          })
        })
        
        if (!confirmResult) return
        
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/task/delete/${item.taskId}?status=${item.status}`,
            method: 'DELETE',
            success: resolve,
            fail: reject
          })
        })
        
        if (res?.data?.code === 200) {
          uni.showToast({ title: '已拒绝任务', icon: 'success' })
          this.fetch(true)
        } else {
          const errorMsg = res?.data?.msg || '拒绝任务失败'
          uni.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
        }
      } catch(e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    // 执行完毕
    async finishTask(item) {
      try {
        const addressName = (item.fireSituation && item.fireSituation.addressName) || '该任务'
        const confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认执行完毕',
            content: `确定要完成"${addressName}"的任务吗？`,
            confirmText: '确认完成',
            cancelText: '取消',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
          })
        })
        
        if (!confirmResult) return
        
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/task/feedback/${item.taskId}`,
            method: 'PUT',
            data: {
              status: 2,
              commitType: 'finish'
            },
            success: resolve,
            fail: reject
          })
        })
        
        if (res?.data?.code === 200) {
          uni.showToast({ title: '任务已完成', icon: 'success' })
          this.fetch(true)
        } else {
          const errorMsg = res?.data?.msg || '完成任务失败'
          uni.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
        }
      } catch(e) {
        const errorMsg = e?.message || e?.data?.msg || '操作失败'
        uni.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
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
        
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/task/delete/${item.taskId}?status=${item.status}`,
            method: 'DELETE',
            success: resolve,
            fail: reject
          })
        })
        
        if (res?.data?.code === 200) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          this.fetch(true)
        } else {
          const errorMsg = res?.data?.msg || '删除任务失败'
          uni.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
        }
      } catch(e) {
        const errorMsg = e?.message || e?.data?.msg || '删除失败'
        uni.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
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

/* 任务类型和参战人员行 */
.task-type-personnel-row {
  display: flex;
  gap: 20rpx;
  grid-column: 1 / -1;
  margin-bottom: 20rpx;
}

.task-type-personnel-row .filter-item {
  flex: 1;
}

.task-type-personnel-row .personnel-item {
  flex: 1;
}

/* 人员信息行 */
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
  border: 1rpx solid #e6f4ff;
  border-radius: 8rpx;
  background: #ffffff;
  font-size: 24rpx;
  color: #333;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.personnel-input:focus {
  border-color: #1890ff;
  background: #f0f8ff;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.1);
}

/* 按钮行 */
.button-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 8rpx;
  position: relative;
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
  border-radius: 8rpx;
  border: 1rpx solid #e6f4ff;
  background: #ffffff;
  padding: 0 12rpx;
  font-size: 24rpx;
  color: #333;
  transition: all 0.2s ease;
}

.picker-box.placeholder {
  color: #999;
}

.picker-box:active {
  border-color: #1890ff;
  background: #f0f8ff;
}

.reset-btn {
  height: 56rpx;
  padding: 0 32rpx;
  border-radius: 28rpx;
  background: #f5f5f5;
  border: 1rpx solid #d9d9d9;
  color: #666;
  font-size: 26rpx;
  font-weight: 500;
  line-height: 56rpx;
  min-width: 100rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.reset-btn:active {
  background: #e8e8e8;
  transform: scale(0.98);
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.12);
}

.reset-btn::after {
  border: none;
}

.search-btn {
  height: 56rpx;
  padding: 0 32rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  border: none;
  color: #fff;
  font-size: 26rpx;
  font-weight: 500;
  line-height: 56rpx;
  min-width: 100rpx;
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
  transition: all 0.3s ease;
}

.search-btn:active {
  background: linear-gradient(135deg, #40a9ff, #69c0ff);
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.4);
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
  gap: 16rpx;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.header-meta .meta-text {
  font-size: 20rpx;
  color: #999;
  white-space: nowrap;
  line-height: 1.4;
}

.header-meta .meta-divider {
  font-size: 18rpx;
  color: #d9d9d9;
  margin: 0 4rpx;
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

.unit-status-badge {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 4rpx 12rpx;
  border-radius: 16rpx;
  font-size: 20rpx;
  font-weight: 500;
  flex-shrink: 0;
  margin-left: 8rpx;
}

.unit-status-badge.rescue-badge {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: #fff;
}

.unit-status-badge.support-badge {
  background: linear-gradient(135deg, #fa8c16, #ffa940);
  color: #fff;
}

.status-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
}

.status-text {
  font-size: 20rpx;
  font-weight: 500;
}

.unit-info-block {
  padding-bottom: 16rpx;
}

.unit-info-block:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.task-groups-info {
  margin-top: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.task-group-info {
  margin-bottom: 0;
}

.task-group-content {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 14rpx 16rpx;
  background: linear-gradient(135deg, #f8faff, #e6f7ff);
  border-radius: 10rpx;
  border-left: 4rpx solid #1890ff;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.08);
  position: relative;
}

.task-type-badge {
  position: absolute;
  top: 0;
  left: 0;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: #fff;
  font-size: 20rpx;
  font-weight: 600;
  padding: 4rpx 12rpx;
  border-radius: 12rpx 0 12rpx 0;
  z-index: 1;
  box-shadow: 0 2rpx 4rpx rgba(24, 144, 255, 0.3);
  line-height: 1.2;
}

.task-type-text {
  color: #fff;
  font-size: 20rpx;
  font-weight: 600;
  white-space: nowrap;
}

.task-group-first-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-top: 8rpx;
  padding-top: 8rpx;
  min-height: 40rpx;
}

.task-location-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
  min-width: 0;
}

.task-group-second-row {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 8rpx;
  padding-top: 8rpx;
}

.task-attr-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  line-height: 1.5;
}

.task-attr-label {
  font-size: 23rpx;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

.task-attr-value {
  font-size: 23rpx;
  color: #333;
  font-weight: 500;
  flex: 1;
  min-width: 0;
}

.task-cars-text {
  font-size: 21rpx;
  color: #666;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 500;
}

.task-detail-text {
  font-size: 21rpx;
  color: #666;
  white-space: nowrap;
  line-height: 1.5;
}

.task-group-description {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid rgba(24, 144, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.description-label {
  font-size: 22rpx;
  color: #666;
  font-weight: 500;
}

.description-text {
  font-size: 22rpx;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
}

.unit-remark {
  margin-top: 12rpx;
  padding: 12rpx;
  background: linear-gradient(135deg, #fff7e6, #ffecc7);
  border-radius: 8rpx;
  border: 1rpx solid #ffd591;
  box-shadow: 0 1rpx 4rpx rgba(250, 140, 22, 0.1);
}

.unit-remark-label {
  font-size: 22rpx;
  color: #d46b08;
  font-weight: 500;
  margin-bottom: 4rpx;
}

.unit-remark-text {
  font-size: 22rpx;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
}


/* 备注样式 - 卡片风格 */
.remark {
  margin-top: 16rpx;
  padding: 12rpx;
  background: #fff;
  border-radius: 8rpx;
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