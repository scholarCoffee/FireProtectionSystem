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
                {{ (statusOptions[statusIndex] && statusOptions[statusIndex].label) || '请选择任务状态' }}
              </view>
            </picker>
          </view>

          <!-- 任务类型和记录人员行 -->
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
              <text class="personnel-label">下达人员</text>
              <input 
                class="personnel-input"
                v-model="issuePersonName"
                placeholder="请输入下达人员"
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
        <uni-swipe-action-item v-for="(item, idx) in list" :key="idx" :right-options="item.swipeOptions || []" @click="onSwipeClick($event, item)">
          <view class="card" :class="(item.taskStatus == 3 ? 'rescue-card' : '') || (item.taskStatus == 4 ? 'supporting-card' : '')" @tap="goDetail(item)">
            <view class="card-header">
              <view class="address-info">
                <text class="address-name">{{ item.addressName }}</text>
              </view>
              <view class="header-meta">
                <text class="meta-text" v-if="item.issuePersonName">{{ item.issuePersonName }}</text>
                <text class="meta-divider" v-if="item.issuePersonName && item.issueTime">|</text>
                <text class="meta-text" v-if="item.issueTime">{{ formatTime(item.issueTime) }}</text>
              </view>
            </view>
            <!-- 状态进度条 -->
            <view class="status-route">
              <view class="route-container">
                <!-- 救援中标签 -->
                <view class="status-tag rescue-tag" :class="{ 'active': item.taskStatus == 2 }">
                  <view class="tag-dot"></view>
                  <text class="tag-label">{{ getRescueStatusText(item) }}</text>
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
                <view v-for="(unit, unitIdx) in (item.assignedUnits || [])" :key="unitIdx" class="unit-info-block">
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
                        <view class="task-type-badge" v-if="hasMultipleTaskTypes(item)">
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
                      </view>
                    </view>
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

    <!-- 需要支援弹框 -->
    <view class="support-modal-mask" v-if="showSupportModal" @tap="closeSupportModal">
      <view class="support-modal" @tap.stop>
        <view class="support-modal-header">
          <text class="support-modal-title">申请支援</text>
          <view class="support-modal-close" @tap="closeSupportModal">
            <image :src="serverUrl + '/static/icons/common/close.png'" class="close-icon" />
          </view>
        </view>
        <view class="support-modal-body">
          <text class="support-modal-label">支援内容 <text class="required">*</text></text>
          <view class="support-textarea-container">
            <textarea 
              v-model="supportContent" 
              class="support-textarea" 
              maxlength="500" 
              auto-height 
              show-confirm-bar="false" 
              placeholder="请输入支援内容（500字以内）" 
              @input="onSupportContentInput"
            />
            <text class="support-char-count">{{ supportContent.length }}/500</text>
          </view>
        </view>
        <view class="support-modal-footer">
          <button class="support-modal-btn cancel-btn" @tap="closeSupportModal">取消</button>
          <button class="support-modal-btn confirm-btn" @tap="confirmSupport" :disabled="!supportContent.trim()">确认</button>
        </view>
      </view>
    </view>
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
      issuePersonName: '',
      debounceTimer: null,
      filtersExpanded: false, // 新增：筛选条件展开状态
      unitOptions: [],
      statusOptions: [],
      fireCarOptions: [],
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
      showSupportModal: false, // 支援弹框显示状态
      supportContent: '', // 支援内容
      currentSupportItem: null, // 当前申请支援的火灾情况
      swipeClickTimer: null // 滑动点击防抖定时器
    }
  },
  async onLoad() {
    await this.loadStatic()
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
      const cachedTaskTypes = uni.getStorageSync('static_taskTypes')
      
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
        taskStatus: (this.statusOptions[this.statusIndex] && this.statusOptions[this.statusIndex].value) || '',
        taskType: (this.taskTypeOptions[this.taskTypeIndex] && this.taskTypeOptions[this.taskTypeIndex].value) || '',
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
            // 为每个列表项预先计算滑动操作选项，避免在模板中调用方法
            const processedList = list.map(item => ({ 
              ...item,
              swipeOptions: this.getSwipeOptions(item)
            }))
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
    // 获取单位类型名称
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
    // 格式化时间（年月日时分秒）
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
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
    // 获取救援单位名称（所有单位）
    getRescueUnits(item) {
      if (!item.assignedUnits || item.assignedUnits.length === 0) return '—'
      return item.assignedUnits.map(unit => unit.unitName).join('、')
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
    // 获取救援状态文本（根据任务类型）
    getRescueStatusText(item) {
      // 如果状态不是救援中，返回默认状态文本
      if (item.taskStatus != 2) {
        if (item.taskStatus == 1) return '已完成'
        if (item.taskStatus == 3) return '需要支援'
        if (item.taskStatus == 4) return '正在支援'
        return '救援中'
      }
      
      // 获取所有救援单位的任务类型
      const rescueUnits = (item.assignedUnits || []).filter(unit => unit.unitStatus === 'rescue')
      if (rescueUnits.length === 0) return '救援中'
      
      // 收集所有任务组的任务类型
      const taskTypes = new Set()
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
      
      // 如果只有一个任务类型，显示对应的状态文本
      if (taskTypes.size === 1) {
        const taskType = Array.from(taskTypes)[0]
        return this.getTaskTypeStatusText(taskType)
      }
      
      // 如果有多个任务类型，显示"救援中"
      return '救援中'
    },
    // 根据任务类型获取状态文本
    getTaskTypeStatusText(taskType) {
      const taskTypeStr = String(taskType)
      if (taskTypeStr === '1') return '灭火中'
      if (taskTypeStr === '2') return '堵截中'
      if (taskTypeStr === '3') return '搜救中'
      if (taskTypeStr === '4') return '排烟中'
      if (taskTypeStr === '5') return '供水中'
      return '救援中'
    },
    // 判断是否有多个任务类型
    hasMultipleTaskTypes(item) {
      if (!item || !item.assignedUnits) return false
      
      // 收集所有救援单位的任务类型
      const taskTypes = new Set()
      const rescueUnits = (item.assignedUnits || []).filter(unit => unit.unitStatus === 'rescue')
      
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
    // 根据任务状态获取滑动操作选项
    getSwipeOptions(item) {
      const taskStatus = item.taskStatus
      
      if (taskStatus == 1) {
        // 已完成 - 查看任务、删除
        return [
          { text: '删除', style: { backgroundColor: '#ff4d4f', color: '#fff' }, key: 'delete' }
        ]
      } else if (taskStatus == 2) {
        // 救援中 - 查看任务、完成任务、需要支援、变更任务
        return [
          { text: '变更任务', style: { backgroundColor: '#722ed1', color: '#fff' }, key: 'change' },
          { text: '完成任务', style: { backgroundColor: '#52c41a', color: '#fff' }, key: 'finish' },
          { text: '需要支援', style: { backgroundColor: '#ff4d4f', color: '#fff' }, key: 'support' },

        ]
      } else if (taskStatus == 3) {
        // 需要支援 - 查看任务、任务下达、变更任务、撤回支援
        return [
          { text: '变更任务', style: { backgroundColor: '#722ed1', color: '#fff' }, key: 'change' },
          { text: '任务下达', style: { backgroundColor: '#fa8c16', color: '#fff' }, key: 'deliver' },
          { text: '撤回支援', style: { backgroundColor: '#ff4d4f', color: '#fff' }, key: 'cancelSupport' }
        ]
      } else if (taskStatus == 4) {
        // 正在支援 - 查看任务、完成任务、任务下达、变更任务
        return [
          { text: '变更任务', style: { backgroundColor: '#722ed1', color: '#fff' }, key: 'change' },
          { text: '完成任务', style: { backgroundColor: '#52c41a', color: '#fff' }, key: 'finish' },
          { text: '任务下达', style: { backgroundColor: '#fa8c16', color: '#fff' }, key: 'deliver' }
          
        ]
      }
    },
    onSwipeClick(e, item) {
      try {
        // 防止重复触发 - 使用防抖机制
        if (this.swipeClickTimer) {
          clearTimeout(this.swipeClickTimer)
        }
        
        // 防止重复触发
        if (!e || !item) return
        
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
        
        // 如果没有获取到 key，直接返回
        if (!key) {
          console.warn('onSwipeClick: 无法获取操作类型', e)
          return
        }
        
        // 防抖处理：延迟执行，避免重复触发
        this.swipeClickTimer = setTimeout(() => {
          this.swipeClickTimer = null
          // 根据 key 执行相应操作
        if (key === 'detail') {
          uni.navigateTo({ url: `/pages/data/fireDetail/index?situationId=${encodeURIComponent(item.situationId)}` })
        } else if (key === 'finish') {
          this.finishRescue(item)
        } else if (key === 'deliver') {
          uni.navigateTo({ url: `/pages/data/fireUpload/index?situationId=${encodeURIComponent(item.situationId)}&taskType=commit` })
        } else if (key === 'support') {
          this.requestSupport(item)
        } else if (key === 'delete') {
          this.deleteFireSituation(item)
        } else if (key === 'change') {
          this.changeTask(item)
          } else if (key === 'cancelSupport') {
            this.cancelSupport(item)
        }
        }, 100) // 100ms 防抖延迟
      } catch (error) {
        console.error('onSwipeClick error:', error)
        if (this.swipeClickTimer) {
          clearTimeout(this.swipeClickTimer)
          this.swipeClickTimer = null
        }
      }
    },
    async finishRescue(item) {
      try {
        const addressName = item.addressName || '该火灾情况'
        const confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认完成任务',
            content: `确定要完成"${addressName}"的救援任务吗？`,
            confirmText: '确认完成',
            cancelText: '取消',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
          })
        })
        
        if (!confirmResult) return
        
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
      // 显示支援内容输入弹框
      this.currentSupportItem = item
      this.supportContent = ''
      this.showSupportModal = true
    },
    // 关闭支援弹框
    closeSupportModal() {
      this.showSupportModal = false
      this.supportContent = ''
      this.currentSupportItem = null
    },
    // 支援内容输入处理
    onSupportContentInput() {
      // 限制字数在500字以内
      if (this.supportContent.length > 500) {
        this.supportContent = this.supportContent.substring(0, 500)
      }
    },
    // 确认申请支援
    async confirmSupport() {
      if (!this.supportContent.trim()) {
        uni.showToast({ title: '请输入支援内容', icon: 'none' })
        return
      }
      
      if (!this.currentSupportItem) {
        uni.showToast({ title: '数据错误', icon: 'none' })
        return
      }
      
      try {
        uni.showLoading({ title: '提交中...' })
        await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/fire/situations/${this.currentSupportItem.situationId}`,
            method: 'PUT',
            data: { 
              taskStatus: 3,
              supportContent: this.supportContent.trim()
            },
            success: resolve,
            fail: reject
          })
        })
        uni.hideLoading()
        uni.showToast({ title: '已申请支援', icon: 'success' })
        this.closeSupportModal()
        this.fetch(true)
      } catch(e) {
        uni.hideLoading()
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    // 撤回支援
    async cancelSupport(item) {
      try {
        const addressName = item.addressName || '该火灾情况'
        const confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认撤回支援',
            content: `确定要撤回"${addressName}"的支援申请吗？`,
            confirmText: '确认撤回',
            cancelText: '取消',
            confirmColor: '#ff4d4f',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
          })
        })
        
        if (!confirmResult) return
        
        uni.showLoading({ title: '处理中...' })
        await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/fire/updateTaskStatus',
            method: 'PUT',
            data: {
              situationId: item.situationId,
              taskStatus: 2 // 撤回支援后回到救援中状态
            },
            success: resolve,
            fail: reject
          })
        })
        uni.hideLoading()
        uni.showToast({ title: '已撤回支援', icon: 'success' })
        this.fetch(true)
      } catch(e) {
        uni.hideLoading()
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    // 删除火灾情况
    async deleteFireSituation(item) {
      try {
        // 构建提示内容，显示地址名称
        const addressName = item.addressName || '该火灾情况'
        const confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认删除',
            content: `确定要删除"${addressName}"的火灾情况吗？\n删除后无法恢复，请谨慎操作。`,
            confirmText: '确认删除',
            cancelText: '取消',
            confirmColor: '#ff4d4f',
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
    },
    // 变更任务
    async changeTask(item) {
      try {
        // 获取救援单位名称（用于提示）
        const rescueUnits = (item.assignedUnits || []).filter(unit => unit.unitStatus === 'rescue')
        const unitNames = rescueUnits.map(unit => unit.unitName).join('、') || '该'
        
        const confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认变更任务',
            content: `当前操作${unitNames}单位的变更任务，是否确认？`,
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
          })
        })
        
        if (!confirmResult) return
        
        // 跳转到任务上传页面，携带situationId和taskType=change用于变更任务
        uni.navigateTo({ 
          url: `/pages/data/fireUpload/index?situationId=${encodeURIComponent(item.situationId)}&taskType=change` 
        })
      } catch(e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.fire-query-page {
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
  background: linear-gradient(135deg, #ffffff, #f8faff);
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


/* 任务类型和记录人员行 */
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

.swipe-item{position:relative;overflow:hidden}
.swipe-actions{position:absolute;right:0;top:0;bottom:0;display:flex;align-items:stretch;gap:0}
.action-btn{height:100%;border:none;border-radius:0;color:#fff;font-size:22rpx;padding:0 20rpx}
.action-btn.detail{background:#2db7f5}
.action-btn.finish{background:#52c41a}
.action-btn.deliver{background:#fa8c16}
.swipe-content{background:#fff;will-change:transform;transition:transform .2s ease}

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

.task-power-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  line-height: 1.5;
}

.task-power-left {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.task-power-label {
  font-size: 23rpx;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

.task-power-value {
  font-size: 23rpx;
  color: #333;
  font-weight: 500;
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

.task-details-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  align-items: center;
  padding-top: 10rpx;
  margin-top: 2rpx;
}

.task-detail-text {
  font-size: 21rpx;
  color: #666;
  white-space: nowrap;
  line-height: 1.5;
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

/* 支援弹框样式 */
.support-modal-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.support-modal {
  width: 680rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.15);
}

.support-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1rpx solid #e6f4ff;
  background: linear-gradient(135deg, #fff1f0 0%, #fff 100%);
}

.support-modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #ff4d4f;
}

.support-modal-close {
  padding: 8rpx;
}

.support-modal-close .close-icon {
  width: 32rpx;
  height: 32rpx;
  opacity: 0.6;
}

.support-modal-body {
  padding: 32rpx;
}

.support-modal-label {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 16rpx;
  display: block;
}

.support-modal-label .required {
  color: #ff4d4f;
  margin-left: 4rpx;
}

.support-textarea-container {
  position: relative;
  margin-top: 12rpx;
}

.support-textarea {
  width: 100%;
  min-height: 240rpx;
  padding: 16rpx;
  background: #f8faff;
  border: 1rpx solid #e6f4ff;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #333;
  box-sizing: border-box;
  line-height: 1.6;
  transition: all 0.2s;
}

.support-textarea:focus {
  background: #fff;
  border-color: #ff4d4f;
}

.support-char-count {
  position: absolute;
  bottom: 12rpx;
  right: 16rpx;
  font-size: 22rpx;
  color: #999;
  background: rgba(255, 255, 255, 0.9);
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
}

.support-modal-footer {
  display: flex;
  border-top: 1rpx solid #e6f4ff;
}

.support-modal-btn {
  flex: 1;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  border-radius: 0;
  transition: all 0.2s;
}

.support-modal-btn.cancel-btn {
  color: #666;
  background: #fff;
  border-right: 1rpx solid #e6f4ff;
}

.support-modal-btn.cancel-btn:active {
  background: #fafafa;
}

.support-modal-btn.confirm-btn {
  color: #fff;
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  font-weight: 600;
}

.support-modal-btn.confirm-btn:active {
  background: linear-gradient(135deg, #ff7875, #ff4d4f);
}

.support-modal-btn.confirm-btn:disabled {
  background: #d9d9d9;
  color: #999;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

</style>