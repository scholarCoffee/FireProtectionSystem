<template>
  <view class="task-query-page map-combat-page">
    <!-- 搜索和筛选区 -->
    <view class="search-filters-container">
      <!-- 位置搜索和筛选按钮 -->
      <view class="search-filter-row">
        <view class="search-input-container">
          <image :src="serverUrl + '/static/icons/location/search.png'" class="search-icon" />
          <input 
            class="search-input"
            v-model="keyword"
            placeholder="输入位置名称或编号"
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
          <!-- 消防单位 -->
          <view class="filter-item">
            <text class="filter-label">消防单位</text>
            <picker :value="unitIndex" :range="unitOptions" range-key="label" @change="onUnitChange" @bindchange="onUnitChange" class="filter-picker">
              <view class="picker-box" :class="{ 'placeholder': unitIndex === 0 }">
                {{ (unitOptions[unitIndex] && unitOptions[unitIndex].label) || '请选择消防单位' }}
              </view>
            </picker>
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
      <view v-for="(item, idx) in list" :key="idx" class="card" :class="{ 'current-address-card': isCurrentAddress(item) }" @tap="goDetail(item)">
        <view class="card-header">
          <view class="address-info">
            <text class="address-name">{{ item.addressName || '—' }}</text>
          </view>
          <view class="header-meta">
            <text class="meta-text" v-if="getLatestIssueTime(item)">{{ formatTime(getLatestIssueTime(item)) }}</text>
          </view>
        </view>
        
        <view class="card-content">
          <view
            class="situation-block"
            v-for="(situation, sIdx) in getFireSituations(item)"
            :key="situation.situationId || sIdx"
          >
            <view class="info-grid">
              <view class="info-item full-width">
                <text class="info-label">作战单位：</text>
                <text class="info-text">{{ getCombatUnits(situation) || '—' }}</text>
              </view>
              <view class="info-item full-width">
                <text class="info-label">任务类型：</text>
                <text class="info-text">{{ getTaskTypes(situation) || '—' }}</text>
              </view>
              <view class="info-item full-width">
                <text class="info-label">位置：</text>
                <text class="info-text">{{ getLocationInfo(situation, sIdx, item) || '—' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="load-more">
        <view class="load-more-btn" :disabled="finished || isLoading" @tap="manualLoadMore">
          {{ isLoading ? '加载中...' : (finished ? '没有更多了' : '点击加载更多') }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space',
      keyword: '',
      debounceTimer: null,
      filtersExpanded: false,
      unitOptions: [],
      taskTypeOptions: [],
      currentAddressId: '',
      unitIndex: 0,
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
  async onLoad(query) {
    this.currentAddressId = (query && (query.addressId || query.currentAddressId)) || ''
    await this.loadStatic()
    this.fetch(true)
  },
  onReachBottom() { this.loadMore() },
  onShow() {
    // 页面显示时重新加载数据
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
      const situationId = this.getPrimarySituationId(item)
      if (situationId) {
        uni.navigateTo({ url: `/pages/data/mapCombatMap/index?situationId=${encodeURIComponent(situationId)}` })
      }
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
      const cachedTaskTypes = uni.getStorageSync('static_taskTypes')
      
      // 如果本地有数据，直接使用
      if (cachedUnits) {
        this.unitOptions = [
          { label: '请选择消防单位', value: '', index: 0 },
          ...cachedUnits
        ]
      } else {
        // 如果本地没有数据，从接口获取
        try {
          const res = await new Promise((resolve, reject) => {
            uni.request({ 
              url: this.serverUrl + '/static/data', 
              method: 'GET', 
              data: { type: 'fireUnits', key: 'unitList' }, 
              success: resolve, 
              fail: reject 
            })
          })
          
          if (res?.data?.code === 200 && res.data.data) {
            const unitList = res.data.data.map((it, i) => ({ 
              label: it.data1, 
              value: String(it.data2), 
              index: i + 1 
            }))
            
            // 缓存到本地存储
            uni.setStorageSync('static_fireUnits', unitList)
            
            this.unitOptions = [
              { label: '请选择消防单位', value: '', index: 0 },
              ...unitList
            ]
          }
        } catch(e) {
          console.error('加载消防单位数据失败:', e)
        }
      }
      
      // 加载任务类型
      if (cachedTaskTypes && cachedTaskTypes.length > 0) {
        this.taskTypeOptions = cachedTaskTypes
      } else {
        try {
          const res = await new Promise((resolve, reject) => {
            uni.request({ 
              url: this.serverUrl + '/static/data', 
              method: 'GET', 
              data: { type: 'fireUnits', key: 'taskList' }, 
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
            this.taskTypeOptions = taskTypeList
          } else {
            // 如果接口没有数据，使用默认任务类型
            const defaultTaskTypes = [
              { label: '灭火', value: '1', index: 1 },
              { label: '堵截', value: '2', index: 2 },
              { label: '搜救', value: '3', index: 3 },
              { label: '排烟', value: '4', index: 4 },
              { label: '供水', value: '5', index: 5 }
            ]
            this.taskTypeOptions = defaultTaskTypes
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
          this.taskTypeOptions = defaultTaskTypes
        }
      }
    },
    fetch(reset = false, cb) {
      if (reset) { this.page = 1; this.list = []; this.finished = false }
      if (this.finished && !reset) { cb && cb(); return }
      const params = {
        page: this.page, 
        pageSize: this.pageSize,
        unit: (this.unitOptions[this.unitIndex] && this.unitOptions[this.unitIndex].value) || '',
        keyword: (this.keyword || '').trim()
      }
      this.isLoading = true
      uni.request({
        url: this.serverUrl + '/mapCombat/list',
        method: 'GET',
        data: params,
        success: (res) => {
          if (res?.data?.code === 200) {
            const { data: list, pagination } = res.data
            const mergedList = this.page === 1 ? list : this.list.concat(list)
            this.list = this.sortListByCurrentAddress(mergedList)
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
    resetFilters() {
      this.unitIndex = 0
      this.keyword = ''
      this.fetch(true)
    },
    toggleFilters() {
      this.filtersExpanded = !this.filtersExpanded
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
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    getFireSituations(item) {
      if (item && Array.isArray(item.fireSituations) && item.fireSituations.length > 0) {
        return item.fireSituations
      }
      if (item && item.situationId) return [item]
      return []
    },
    getPrimarySituationId(item) {
      const list = this.getFireSituations(item)
      if (!list.length) return ''
      const withTime = list
        .map(it => ({ ...it, _time: new Date(it.updateTime || it.issueTime || 0).getTime() || 0 }))
        .sort((a, b) => b._time - a._time)
      return withTime[0].situationId || ''
    },
    getLatestIssueTime(item) {
      const list = this.getFireSituations(item)
      if (!list.length) return ''
      const latest = list
        .map(it => it.updateTime || it.issueTime || '')
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      return latest[0] || ''
    },
    getAllAssignedUnits(item) {
      const list = this.getFireSituations(item)
      const units = []
      list.forEach(situation => {
        ;(situation.assignedUnits || []).forEach(unit => units.push(unit))
      })
      return units
    },
    getOverviewText(item) {
      const situations = this.getFireSituations(item)
      const unitNames = new Set(this.getAllAssignedUnits(item).map(unit => unit.unitName).filter(Boolean))
      const locationCount = Array.isArray(item.taskLocations) ? item.taskLocations.length : 0
      return `任务${situations.length}条，单位${unitNames.size}个，救援位置${locationCount}个`
    },
    getTaskStatusText(status) {
      if (Number(status) === 1) return '已完成'
      if (Number(status) === 2) return '救援中'
      if (Number(status) === 3) return '需支援'
      if (Number(status) === 4) return '支援中'
      return '未知'
    },
    // 获取作战单位
    getCombatUnits(item) {
      const units = this.getAllAssignedUnits(item)
      if (!units.length) return '—'
      const names = Array.from(new Set(units.map(unit => unit.unitName).filter(Boolean)))
      if (!names.length) return '—'
      if (names.length <= 2) return names.join('、')
      return `${names.slice(0, 2).join('、')} 等${names.length}个单位`
    },
    // 获取位置信息
    // situation: 当前火场记录
    // index: 在列表中的索引（用于与父级 taskLocations 对应）
    // parentItem: 外层地址项，可能包含 taskLocations 数组
    getLocationInfo(situation, index, parentItem) {
      const parts = []

      // 1. 优先使用父级的 taskLocations 中与当前索引对应的地址信息
      if (parentItem && Array.isArray(parentItem.taskLocations) && parentItem.taskLocations.length > 0) {
        const locWrapper = parentItem.taskLocations[index] || parentItem.taskLocations[0]
        const loc = locWrapper && locWrapper.taskLocation
        if (loc) {
          if (loc.addressName) parts.push(loc.addressName)
          if (loc.address) parts.push(loc.address)
        }
      }

      // 2. 如果父级没有或未取到，则使用当前 situation 自身的地址信息
      if (parts.length === 0) {
        if (situation.addressName) parts.push(situation.addressName)
        if (situation.addressExt) parts.push(situation.addressExt)
      }

      // 3. 如果 situation 自身也没有，但它自己带有 taskLocations，则从中汇总前两个
      if (parts.length === 0 && Array.isArray(situation.taskLocations) && situation.taskLocations.length > 0) {
        const locationNames = situation.taskLocations
          .map(it => it?.taskLocation?.addressName || it?.taskLocation?.address || '')
          .filter(Boolean)
        if (locationNames.length > 0) {
          return locationNames.join('、')
        }
      }

      return parts.length > 0 ? parts.join(' ') : '—'
    },
    // 获取任务类型
    getTaskTypes(item) {
      const units = this.getAllAssignedUnits(item)
      if (!units.length) return ''
      
      const taskTypes = new Set()
      units.forEach(unit => {
        if (unit.taskGroups && unit.taskGroups.length > 0) {
          unit.taskGroups.forEach(taskGroup => {
            if (taskGroup.taskType) {
              taskTypes.add(String(taskGroup.taskType))
            }
          })
        }
        if (unit.taskType) {
          taskTypes.add(String(unit.taskType))
        }
      })
      
      if (taskTypes.size === 0) return ''
      
      // 从任务类型选项中获取名称
      const taskTypeNames = Array.from(taskTypes).map(type => {
        const taskType = this.taskTypeOptions.find(item => item.value === String(type))
        return taskType ? taskType.label : `类型${type}`
      })
      
      return taskTypeNames.join('、')
    },
    isCurrentAddress(item) {
      if (!this.currentAddressId) return false
      return String(item?.addressId || '') === String(this.currentAddressId)
    },
    sortListByCurrentAddress(list) {
      if (!this.currentAddressId || !Array.isArray(list) || list.length <= 1) return list || []
      const current = []
      const others = []
      list.forEach(item => {
        if (this.isCurrentAddress(item)) current.push(item)
        else others.push(item)
      })
      return current.concat(others)
    }
  }
}
</script>

<style scoped>
.task-query-page,
.map-combat-page {
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

/* 按钮行 */
.button-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 8rpx;
  position: relative;
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

.current-address-card {
  border: 2rpx solid #ff4d4f;
  box-shadow: 0 4rpx 14rpx rgba(255, 77, 79, 0.2);
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

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.situation-block {
  padding: 14rpx 16rpx;
  border-radius: 10rpx;
  border: 1rpx solid #f0f0f0;
  background: #fafcff;
}

.situation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.situation-title {
  font-size: 22rpx;
  color: #333;
  font-weight: 600;
}

.situation-status {
  font-size: 20rpx;
  color: #1890ff;
  background: #e6f7ff;
  border: 1rpx solid #91d5ff;
  border-radius: 20rpx;
  padding: 2rpx 10rpx;
}

.info-grid {
  display: flex;
  flex-direction: column;
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

.info-label {
  font-size: 22rpx;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

.info-text {
  font-size: 22rpx;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.load-more {
  text-align: center;
  color: #999;
  font-size: 13px;
  margin: 20px 0 12px 0;
  padding: 8px;
  border-radius: 6px;
}
</style>

