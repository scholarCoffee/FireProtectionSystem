<template>
  <view class="data-management">
    <!-- 标签页切换 -->
    <view class="tab-container">
      <view class="tab-bar">
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'location' }"
          @tap="switchTab('location')"
        >
          <image :src="currentTab === 'location' ? this.serverUrl + '/static/icons/location/location-active.png' : this.serverUrl + '/static/icons/location/location.png'" class="tab-icon" />
          <text class="tab-text">位置信息</text>
        </view>
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'safety' }"
          @tap="switchTab('safety')"
        >
          <image :src="currentTab === 'safety' ? this.serverUrl + '/static/icons/data/safe-active.png' : this.serverUrl + '/static/icons/data/safe.png'" class="tab-icon" />
          <text class="tab-text">安全信息</text>
        </view>
      </view>
    </view>

    <!-- 操作栏 -->
    <view class="action-bar">
      <view class="action-left">
        <button class="action-btn add-btn" @tap="showAddModal">
          <image :src="this.serverUrl + '/static/icons/common/add-white.png'" class="btn-icon" />
          <text>新增</text>
        </button>
        <button class="action-btn refresh-btn" @tap="refreshData">
          <image :src="this.serverUrl + '/static/icons/common/refresh-white.png'" class="btn-icon" />
          <text>刷新</text>
        </button>
      </view>
      <view class="action-right">
        <text class="data-count">数据管理</text>
      </view>
    </view>

    <!-- 组件内容 -->
    <LocationManagement 
      v-if="currentTab === 'location'" 
      :serverUrl="serverUrl"
      ref="locationManagement"
    />
    <SafetyManagement 
      v-if="currentTab === 'safety'" 
      :serverUrl="serverUrl"
      ref="safetyManagement"
    />

  </view>
</template>

<script>
import LocationManagement from './components/LocationManagement.vue'
import SafetyManagement from './components/SafetyManagement.vue'

export default {
  name: 'DataManagement',
  components: {
    LocationManagement,
    SafetyManagement
  },
  data() {
    return {
      currentTab: 'location', // 当前标签页
    }
  },


  methods: {
    switchTab(tab) {
      this.currentTab = tab;
    },
    
    refreshData() {
      // 刷新当前组件的数据
      if (this.currentTab === 'location' && this.$refs.locationManagement) {
        this.$refs.locationManagement.loadData();
      } else if (this.currentTab === 'safety' && this.$refs.safetyManagement) {
        this.$refs.safetyManagement.loadData();
      }
    },
    
    showAddModal() {
      // 跳转到新增页面
      uni.navigateTo({
        url: `/pages/personal/userDetail/DataEdit?type=${this.currentTab}&mode=add`
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.data-management {
  height: 100vh;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.back-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 10rpx;
}

.back-text {
  font-size: 28rpx;
  color: #333;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.header-right {
  width: 80rpx;
}

/* 标签页 */
.tab-container {
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  border-bottom: 1rpx solid rgba(24, 144, 255, 0.1);
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.05);
}



.tab-bar {
  display: flex;
  padding: 0 30rpx;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx 0 24rpx 0;
  position: relative;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #1890ff;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  border-radius: 2rpx;
}

.tab-icon {
  width: 44rpx;
  height: 44rpx;
  margin-bottom: 8rpx;
}

.tab-text {
  font-size: 26rpx;
  color: #8c8c8c;
  font-weight: 500;
}

.tab-item.active .tab-text {
  color: #1890ff;
  font-weight: 600;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  border-bottom: 1rpx solid rgba(24, 144, 255, 0.1);
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.05);
}

.action-left {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 500;
  border: none;
  transition: all 0.2s ease;
  min-width: 120rpx;
}

.add-btn {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
  
  &:active {
    transform: translateY(2rpx);
    box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.3);
  }
}

.refresh-btn {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
  
  &:active {
    transform: translateY(2rpx);
    box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
  }
}

.btn-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 8rpx;
}

.data-count {
  font-size: 24rpx;
  color: #8c8c8c;
  font-weight: 500;
}




</style> 