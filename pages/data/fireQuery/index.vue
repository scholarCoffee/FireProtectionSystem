<template>
    <view class="fire-query-page">
      <view class="page-header"><text class="page-title">火灾情况查询</text></view>
     <!-- 搜索栏（采用 pages/location/currentLocaltion/index.vue 的样式） -->
     <view class="search-bar">
       <view class="search-input-container">
         <image :src="serverUrl + '/static/icons/location/search.png'" class="search-icon" />
         <input 
           class="search-input"
           v-model="keyword"
           placeholder="输入地址名称查询"
           @input="onInput"
           @confirm="onSearch"
         />
       </view>
     </view>

      <!-- 筛选区 -->
      <view class="filters">
        <picker :value="unitIndex" :range="unitOptions" range-key="label" @change="onUnitChange" class="picker">
          <view class="picker-box">{{ (unitOptions[unitIndex] && unitOptions[unitIndex].label) || '消防单位' }}</view>
        </picker>
        <picker :value="statusIndex" :range="statusOptions" range-key="label" @change="onStatusChange" class="picker">
          <view class="picker-box">{{ (statusOptions[statusIndex] && statusOptions[statusIndex].label) || '任务状态' }}</view>
        </picker>
        <picker :value="typeIndex" :range="taskTypeOptions" range-key="label" @change="onTypeChange" class="picker">
          <view class="picker-box">{{ (taskTypeOptions[typeIndex] && taskTypeOptions[typeIndex].label) || '任务类型' }}</view>
        </picker>
      </view>
  
      <!-- 列表 -->
      <scroll-view class="list" :style="{ height: listHeight }" scroll-y :lower-threshold="100" @scrolltolower="loadMore" refresher-enabled :refresher-triggered="refresherTriggered" @refresherrefresh="onRefresh">
        <view v-for="(item, idx) in list" :key="idx" class="card">
          <view class="row">
            <text class="label">地址</text>
            <text class="value">{{ item.addressName }}（{{ item.addressId }}）</text>
          </view>
          <view class="row">
            <text class="label">单位/车辆</text>
            <text class="value">{{ item.fireUnitName }} · {{ item.fireCarName }}</text>
          </view>
          <view class="row">
            <text class="label">类型/状态</text>
            <text class="value">{{ item.taskTypeName }} · {{ item.taskStatusName }}</text>
          </view>
          <view class="row">
            <text class="label">更新时间</text>
            <text class="value">{{ item.updateTime }}</text>
          </view>
          <view class="remark" v-if="item.remark">备注：{{ item.remark }}</view>
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
  export default {
    data() {
      return {
        serverUrl: 'https://www.xiaobei.space',
        keyword: '',
        debounceTimer: null,
        unitOptions: [],
        taskTypeOptions: [],
        statusOptions: [],
        unitIndex: 0, typeIndex: 0, statusIndex: 0,
        list: [],
        page: 1, pageSize: 10, finished: false, loadingText: '向下拉取更多',
        listHeight: '60vh',
        isLoading: false,
        refresherTriggered: false
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
          q.select('.filters').boundingClientRect()
          q.exec((res) => {
            const filtersRect = res && res[0]
            const topOffset = (filtersRect && (filtersRect.top + filtersRect.height)) || 0
            const padding = 24 // 顶部/间距预留
            const h = windowHeight - topOffset - padding
            const px = (h > 220 ? h : 220) + 'px'
            this.listHeight = px
          })
        } catch(e) {
          this.listHeight = '60vh'
        }
      },
      async loadStatic() {
        const req = (key) => new Promise((resolve, reject) => {
          uni.request({ url: this.serverUrl + '/static/data', method: 'GET', data: { type: 'fireUnits', key }, success: resolve, fail: reject })
        })
        try {
          const [units, types, statuses] = await Promise.all([req('unitList'), req('taskList'), req('statusList')])
          this.unitOptions = ((units && units.data && units.data.data) ? units.data.data : []).map((it, i) => ({ label: it.data1, value: String(it.data2), index: i }))
          this.taskTypeOptions = ((types && types.data && types.data.data) ? types.data.data : []).map((it, i) => ({ label: it.data1, value: String(it.data2), index: i }))
          this.statusOptions = ((statuses && statuses.data && statuses.data.data) ? statuses.data.data : []).map((it, i) => ({ label: it.data1, value: String(it.data2), index: i }))
        } catch(e) {}
      },
      fetch(reset = false, cb) {
        if (reset) { this.page = 1; this.list = []; this.finished = false }
        if (this.finished && !reset) { cb && cb(); return }
        const params = {
          page: this.page, pageSize: this.pageSize,
          unit: (this.unitOptions[this.unitIndex] && this.unitOptions[this.unitIndex].value) || '',
          taskType: (this.taskTypeOptions[this.typeIndex] && this.taskTypeOptions[this.typeIndex].value) || '',
          taskStatus: (this.statusOptions[this.statusIndex] && this.statusOptions[this.statusIndex].value) || '',
          keyword: (this.keyword || '').trim()
        }
        this.isLoading = true
        uni.request({
          url: this.serverUrl + '/fire/list',
          method: 'GET',
          data: params,
          success: (res) => {
            if (res?.data?.code === 200) {
              const { list, pagination } = res.data.data || { list: [], pagination: { current: 1, hasNext: false } }
              this.list = this.page === 1 ? list : this.list.concat(list)
              this.page = pagination.current || this.page
              this.finished = !pagination.hasNext
              this.loadingText = this.finished ? '没有更多了' : '向下拉取更多'
            } else {
              this.list = []; this.finished = true
            }
            cb && cb()
          },
          fail: () => { this.list = []; this.finished = true; cb && cb() }
          , complete: () => { this.isLoading = false } 
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
      onStatusChange(e) { this.statusIndex = Number(e.detail.value); this.fetch(true) }
    }
  }
  </script>
  
  <style scoped>
  .fire-query-page{min-height:100vh;background:#f5f9ff}
  .page-header{background:linear-gradient(135deg,#1890ff,#40a9ff);padding:36rpx 24rpx}
  .page-title{font-size:34rpx;color:#fff;font-weight:700}
  .search-bar{width:100%;display:flex;justify-content:center;align-items:center;background:#fff;padding:12rpx 0}
  .search-input-container{display:flex;align-items:center;width:90%;height:36px;padding:0 15px;border:1px solid #E0E0E0;border-radius:18px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.08);}
  .search-input-container:focus-within{border-color:#1296db;box-shadow:0 2px 12px rgba(18,150,219,0.15)}
  .search-icon{width:16px;height:16px;margin-right:10px;flex-shrink:0}
  .search-input{flex:1;height:100%;padding:0;border:none;background:none;font-size:14px;color:#707070;outline:none;box-shadow:none}
  .filters{display:flex;gap:12rpx;padding:16rpx;background:#fff}
  .picker{flex:1}
  .picker-box{height:64rpx;line-height:64rpx;border-radius:12rpx;border:2rpx solid #e6f4ff;background:#f8faff;padding:0 16rpx;font-size:26rpx;color:#333}
  .list{background:#fff}
  .card{margin:16rpx;border-radius:12rpx;border:1rpx solid #f0f0f0;padding:16rpx;box-shadow:0 2rpx 8rpx rgba(0,0,0,.05)}
  .row{display:flex;gap:12rpx;margin-bottom:8rpx}
  .label{color:#8a8f99;font-size:24rpx;min-width:140rpx}
  .value{color:#333;font-size:24rpx;flex:1}
  .remark{margin-top:8rpx;color:#666;font-size:24rpx;line-height:1.4}
  .load-more{text-align:center;color:#999;padding:16rpx 0}
  .load-more-btn{height:64rpx;line-height:64rpx;padding:0 24rpx;border-radius:12rpx;background:#fff;border:2rpx solid #e6f4ff;color:#333}
  .load-more-btn:disabled{color:#aaa;border-color:#f0f0f0}
  </style>