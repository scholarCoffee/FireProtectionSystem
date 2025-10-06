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
          <view class="address-header">
            <text class="name">{{ item.addressName }}</text>
            <view class="address-tags">
              <text class="address-id" v-if="item.addressId">编号：{{ item.addressId }}</text>
              <view class="location-type" v-if="item.type">
                <image :src="serverUrl + getLocationTypeIcon(item.type)" class="type-icon" />
                <text class="type-text">{{ getLocationTypeName(item.type) }}</text>
              </view>
            </view>
          </view>
          <view class="address-info">
            <text class="ext">{{ item.addressExt }}</text>
          </view>
        </view>
        <image :src="serverUrl + '/static/icons/common/right.png'" class="right-icon" />
      </view>
      <view class="load-more">{{ loadingText }}</view>
    </scroll-view>
  </view>
</template>

<script>
import { locationTabList } from '@/commons/mock/index.js'

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
      refresherTriggered: false,
      locationTypeOptions: locationTabList
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
    getLocationTypeName(locationType) {
      const type = this.locationTypeOptions.find(item => item.type === Number(locationType))
      return type ? type.name : `类型${locationType}`
    },
    getLocationTypeIcon(locationType) {
      const type = this.locationTypeOptions.find(item => item.type === Number(locationType))
      return type ? type.icon : '/static/icons/location/community.png'
    },
    select(item) {
      const ec = this.getOpenerEventChannel && this.getOpenerEventChannel()
      ec && ec.emit('addressSelected', { 
        addressId: item.addressId, 
        addressName: item.addressName,
        locationType: item.type,
        rescueFloor: item.rescueFloor
      })
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
.list{padding:16rpx 20rpx;box-sizing:border-box}
.item{display:flex;align-items:center;justify-content:space-between;padding:28rpx;border:1rpx solid #f0f0f0;border-radius:14rpx;background:#fff;box-shadow:0 4rpx 14rpx rgba(0,0,0,0.06);margin-bottom:16rpx}
.left{display:flex;flex-direction:column;flex:1}
.address-header{display:flex;flex-direction:column;margin-bottom:10rpx}
.name{font-size:30rpx;color:#1f2d3d;font-weight:700;margin-bottom:10rpx}
.address-tags{display:flex;align-items:center;gap:12rpx;flex-wrap:wrap}
.address-id{font-size:20rpx;color:#666;background:#f0f8ff;padding:6rpx 12rpx;border-radius:8rpx;border:1rpx solid #d6e4ff;box-shadow:0 2rpx 6rpx rgba(0,0,0,0.04)}
.location-type{display:flex;align-items:center;background:#fff;padding:6rpx 12rpx;border-radius:8rpx;border:1rpx solid #91d5ff;gap:6rpx;box-shadow:0 2rpx 6rpx rgba(0,0,0,0.04)}
.type-icon{width:24rpx;height:24rpx;opacity:0.8;background:#fff;border-radius:4rpx;padding:2rpx}
.type-text{font-size:20rpx;color:#1890ff;font-weight:600}
.address-info{display:flex;align-items:center}
.ext{font-size:24rpx;color:#666}
.right-icon{width:32rpx;height:32rpx;opacity:.5;margin-left:12rpx}
.load-more{text-align:center;color:#999;padding:16rpx 0}
</style>