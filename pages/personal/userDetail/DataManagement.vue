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
          <image :src="currentTab === 'location' ? serverUrl + '/static/icons/location/location-active.png' : serverUrl + '/static/icons/location/location.png'" class="tab-icon" />
          <text class="tab-text">位置信息</text>
        </view>

        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'chat' }"
          @tap="switchTab('chat')"
        >
          <image :src="currentTab === 'chat' ? serverUrl + '/static/icons/chat/chat-active.png' : serverUrl + '/static/icons/chat/chat.png'" class="tab-icon" />
          <text class="tab-text">聊天管理</text>
        </view>
        
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'command' }"
          @tap="switchTab('command')"
        >
          <image :src="currentTab === 'command' ? serverUrl + '/static/icons/data/manage-active.png' : serverUrl + '/static/icons/data/manage.png'" class="tab-icon" />
          <text class="tab-text">数据指挥</text>
        </view>
      </view>
    </view>

    <!-- 搜索和操作栏 -->
    <view class="action-bar" v-if="currentTab !== 'command'">
      <view class="search-container">
        <image :src="serverUrl + '/static/icons/location/search.png'" class="search-icon" />
        <input 
          v-model="searchKeyword" 
          class="search-input" 
          :placeholder="getSearchPlaceholder()"
          @input="onSearchInput"
        />
      </view>
      <view class="action-buttons">
        <button class="action-btn add-btn" @tap="showAddModal">
          <image :src="serverUrl + '/static/icons/common/add-white.png'" class="btn-icon" />
          <text>新增</text>
        </button>
        <button class="action-btn refresh-btn" @tap="refreshData">
          <image :src="serverUrl + '/static/icons/common/refresh-white.png'" class="btn-icon" />
          <text>刷新</text>
        </button>
      </view>
    </view>

    <!-- 位置信息内容 -->
    <view v-if="currentTab === 'location'" class="location-content">
      <LocationManagement 
        :serverUrl="serverUrl"
        :searchKeyword="searchKeyword"
        ref="locationManagement"
      />
    </view>
    <!-- 聊天管理内容 -->
    <view v-if="currentTab === 'chat'" class="chat-content">
      <ChatManagement 
        :serverUrl="serverUrl"
        :searchKeyword="searchKeyword"
        ref="chatManagement"
      />
    </view>
    
    <!-- 数据指挥内容 -->
    <view v-if="currentTab === 'command'" class="command-content">
      <view class="command-list">
        <view 
          class="command-item" 
          v-for="(config, key) in commandConfig" 
          :key="key"
          @tap="editCommand(key, config)"
        >
          <view class="item-header">
            <view class="item-title">
              <image :src="serverUrl + '/static/icons/data/' + config.icon + '.png'" class="command-avatar" />
              <view class="title-info">
                <text class="title-text">{{ config.title }}</text>
                <text class="command-type">数据指挥</text>
              </view>
            </view>
            <view class="item-actions">
              <button class="action-icon-btn" @tap.stop="editCommand(key, config)">
                <image :src="serverUrl + '/static/icons/chat/edit.png'" class="action-icon" />
              </button>
            </view>
          </view>
          <view class="item-content">
            <view class="content-row">
              <text class="label">功能描述：</text>
              <text class="value">{{ config.desc }}</text>
            </view>
            <view class="content-row">
              <text class="label">访问地址：</text>
              <text class="value">{{ config.url }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import LocationManagement from './components/LocationManagement.vue'
import ChatManagement from './components/ChatManagement.vue'
import { commandConfig } from '@/commons/js/commandConfig.js'

export default {
  name: 'DataManagement',
  components: {
    LocationManagement,
    ChatManagement
  },
  data() {
    return {
      currentTab: 'location', // 当前标签页
      searchKeyword: '', // 搜索关键词
      searchTimer: null, // 搜索防抖定时器
      serverUrl: 'https://www.xiaobei.space',
      // 数据指挥配置
      commandConfig: commandConfig
    }
  },

  // 添加 onShow 生命周期钩子，用于在从子页面返回时刷新数据
  onShow() {
    // 如果当前是位置信息标签页，刷新位置管理组件的数据
    if (this.currentTab === 'location' && this.$refs.locationManagement) {
      this.$refs.locationManagement.loadData();
    }
  },

  methods: {
    switchTab(tab) {
      this.currentTab = tab;
      this.searchKeyword = ''; // 切换标签时清空搜索
    },
    
    getSearchPlaceholder() {
      switch(this.currentTab) {
        case 'location':
          return '根据关键字查询位置信息';
        case 'chat':
          return '根据关键字查询聊天信息';
        case 'command':
          return '搜索数据指挥功能';
        default:
          return '搜索...';
      }
    },
    
    onSearchInput() {
      // 防抖搜索
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      this.searchTimer = setTimeout(() => {
        this.performSearch();
      }, 500);
    },
    
    performSearch() {
      // 根据当前标签页执行搜索
      if (this.currentTab === 'location' && this.$refs.locationManagement) {
        this.$refs.locationManagement.search(this.searchKeyword);
      } else if (this.currentTab === 'chat' && this.$refs.chatManagement) {
        this.$refs.chatManagement.search(this.searchKeyword);
      }
    },
    
    refreshData() {
      // 刷新当前组件的数据
      if (this.currentTab === 'location' && this.$refs.locationManagement) {
        this.$refs.locationManagement.loadData();
      } else if (this.currentTab === 'chat' && this.$refs.chatManagement) {
        this.$refs.chatManagement.loadData();
      } else if (this.currentTab === 'command') {
        // 数据指挥页面不需要刷新，显示提示
        uni.showToast({
          title: '数据指挥功能已是最新',
          icon: 'success',
          duration: 1500
        });
      }
    },
    
    showAddModal() {
      // 根据当前标签页跳转到不同的新增页面
      let url = '';
      if (this.currentTab === 'location') {
        url = `/pages/personal/userDetail/DataEdit?type=location&mode=add`;
      } else if (this.currentTab === 'chat') {
        url = `/pages/personal/userDetail/DataEdit?type=chat&mode=add`;
      } else if (this.currentTab === 'command') {
        // 数据指挥页面显示提示
        uni.showToast({
          title: '数据指挥功能无需新增',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      if (url) {
        uni.navigateTo({
          url: url
        });
      }
    },
    
    // 编辑数据指挥配置
    editCommand(key, config) {
      uni.navigateTo({
        url: `/pages/personal/userDetail/DataEdit?type=command&mode=edit&key=${key}&title=${encodeURIComponent(config.title)}&desc=${encodeURIComponent(config.desc)}&url=${encodeURIComponent(config.url)}`
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
  padding: 0rpx 0 10rpx 0;
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
  width: 32rpx;
  height: 32rpx;
  margin-bottom: 4rpx;
}

.tab-text {
  font-size: 20rpx;
  color: #8c8c8c;
  font-weight: 500;
}

.tab-item.active .tab-text {
  color: #40a9ff;
  font-weight: 600;
}

/* 搜索和操作栏 */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 20rpx 0rpx 20rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.05);
  gap: 20rpx;
}

.search-container {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 24rpx;
  padding: 0 20rpx;
  height: 64rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
  
  &:focus-within {
    border-color: #1890ff;
    background: #fff;
    box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
  }
}

.search-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 16rpx;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  font-size: 28rpx;
  color: #333;
  outline: none;
  
  &::placeholder {
    color: #999;
  }
}

.action-buttons {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 500;
  border: none;
  transition: all 0.2s ease;
  min-width: 100rpx;
  height: 64rpx;
  padding: 0 20rpx;
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
  width: 32rpx;
  height: 32rpx;
  margin-right: 8rpx;
}

/* 内容区域 */
.location-content,
.chat-content,
.command-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许flex子项收缩 */
}

/* 数据指挥样式 */
.command-content {
  padding: 20rpx;
}

.command-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.command-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:active {
    background-color: #f5f5f5;
  }
}

.command-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.command-type {
  font-size: 22rpx;
  color: #666;
}
</style> 