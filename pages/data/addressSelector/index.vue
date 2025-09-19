<template>
    <view class="address-selector-page">  
      <view class="search-bar">
        <view class="search-input-container">
            <image :src="serverUrl + '/static/icons/location/search.png'" class="search-icon" />
            <input 
              type="text" 
              placeholder="输入地址名称查询" 
              class="search-input" 
              @input="search" 
              v-model="keyword"
            />
          </view>
      </view>
  
      <scroll-view class="list" scroll-y :lower-threshold="40" @scrolltolower="loadMore" refresher-enabled :refresher-triggered="refresherTriggered" @refresherrefresh="onRefresh">
        <view v-for="(item, index) in list" :key="index" class="item" @tap="select(item)">
          <view class="left">
            <text class="name">{{ item.addressName }}</text>
            <text class="ext">{{ item.addressExt }}</text>
          </view>
          <image :src="serverUrl + '/static/icons/common/right.png'" class="right-icon" />
        </view>
        <view class="load-more">{{ loadingText }}</view>
      </scroll-view>
    </view>
  </template>
  
  <script>
  export default {
    data() {
      return {
        serverUrl: 'https://www.xiaobei.space',
        keyword: '',
        list: [],
        page: 1,
        pageSize: 10,
        finished: false,
        loadingText: '向下拉取更多',
        refresherTriggered: false
      }
    },
    onLoad() {
      this.fetch()
    },
    methods: {
      fetch(isReset = false, cb) {
        if (isReset) { this.page = 1; this.list = []; this.finished = false }
        if (this.finished && !isReset) { cb && cb(); return }
        uni.request({
          url: this.serverUrl + '/location/list',
          method: 'GET',
          data: { page: this.page, pageSize: this.pageSize, keyword: this.keyword.trim() },
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
        })
      },
      search() { this.fetch(true) },
      loadMore() { if (!this.finished) { this.page += 1; this.fetch() } },
      onRefresh() {
        this.refresherTriggered = true
        this.fetch(true, () => { this.refresherTriggered = false })
      },
      select(item) {
        const ec = this.getOpenerEventChannel && this.getOpenerEventChannel()
        ec && ec.emit('addressSelected', { addressId: item.addressId, addressName: item.addressName })
        uni.navigateBack()
      }
    }
  }
  </script>
  
  <style scoped>
  .address-selector-page{min-height:100vh;background:#f5f9ff;padding-bottom:80rpx}
  .search-input-container {
  display: flex;
  align-items: center;
  width: 90%;
  height: 36px;
  padding: 0 15px;
  border: 1px solid #E0E0E0;
  border-radius: 18px;
  background-color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}
.search-icon {
  width: 16px;
  height: 16px;
  margin-right: 10px;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  height: 100%;
  padding: 0;
  border: none;
  background: none;
  font-size: 14px;
  color: #707070;
  outline: none;
  box-shadow: none;
}
.search-input-container:focus-within {
  border-color: #1296db;
  box-shadow: 0 2px 12px rgba(18, 150, 219, 0.15);
}
.search-bar{display:flex;align-items:center;justify-content:center;padding:16rpx 24rpx;gap:12rpx;background:#fff}
.list{height:calc(100vh - 220rpx);background:#fff}
.item{display:flex;align-items:center;justify-content:space-between;padding:28rpx;border-bottom:1rpx solid #f0f0f0}
.left{display:flex;flex-direction:column}
.name{font-size:28rpx;color:#333;font-weight:600}
.ext{font-size:22rpx;color:#999;margin-top:6rpx}
.right-icon{width:28rpx;height:28rpx;opacity:.6}
.load-more{text-align:center;color:#999;padding:16rpx 0}
  </style>