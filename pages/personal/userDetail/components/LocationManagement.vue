<template>
  <view class="location-management">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view class="filter-tabs">
        <view 
          class="filter-tab" 
          :class="{ active: currentFilter === 0 }"
          @tap="setFilter(0)"
        >
          <text class="filter-text">全部</text>
        </view>
                 <view 
           class="filter-tab" 
           v-for="item in locationTabList" 
           :key="item.type"
           :class="{ active: currentFilter === item.type }"
           @tap="setFilter(item.type)"
         >
           <text class="filter-text">{{ item.name }}</text>
         </view>
      </view>
    </view>
    
    <!-- 数据列表 -->
    <scroll-view class="data-list" scroll-y="true" @scrolltolower="loadMore">
      <view v-if="loading" class="loading-container">
        <image :src="serverUrl + '/static/icons/common/loading.png'" class="loading-icon" />
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else-if="filteredList.length === 0" class="empty-container">
        <image :src="serverUrl + '/static/icons/common/no-data.png'" class="empty-icon" />
        <text class="empty-text">暂无数据</text>
      </view>
      
      <view v-else class="list-content">
        <view class="data-item" v-for="item in filteredList" :key="item.addressId">
          <view class="item-header">
            <view class="item-title">
              <image :src="getLocationTypeIcon(item.type)" class="type-icon" />
              <text class="title-text">{{ item.addressName }}</text>
            </view>
            <view class="item-actions">
              <image :src="serverUrl + '/static/icons/common/edit-white.png'" class="action-icon" @tap="editItem(item)" />
              <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="action-icon delete-icon" @tap="deleteItem(item)" />
            </view>
          </view>
          <view class="item-content">
            <view class="content-row">
              <text class="label">地址：</text>
              <text class="value">{{ item.addressExt }}</text>
            </view>
            <view class="content-row">
              <text class="label">类型：</text>
              <text class="value">{{ getLocationTypeName(item.type) }}</text>
            </view>
            <view class="content-row">
              <text class="label">安全等级：</text>
              <text class="value">{{ item.safeLevelName || '未设置' }}</text>
            </view>
            <view class="content-row">
              <text class="label">安全评分：</text>
              <text class="value">{{ item.safeLevelScore || 0 }}分</text>
            </view>
            <view class="content-row">
              <text class="label">描述：</text>
              <text class="value">{{ item.description || '暂无描述' }}</text>
            </view>
            
            
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { locationTabList } from '@/commons/mock/index.js'

export default {
  name: 'LocationManagement',
  props: {
    serverUrl: {
      type: String,
      required: true
    },
    searchKeyword: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      locationList: [],
      filteredList: [],
      currentFilter: 0, // 当前筛选类型，0表示全部
      locationTabList: locationTabList
    }
  },
  
  watch: {
    searchKeyword: {
      handler(newVal) {
        this.filterData();
      },
      immediate: true
    }
  },
  
  mounted() {
    this.loadData();
  },
  
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/location/list',
            method: 'GET',
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          // 根据服务器返回的数据格式，位置列表在 data.list 中
          const responseData = result.data.data;
          const locationData = responseData && responseData.list;
          this.locationList = Array.isArray(locationData) ? locationData : [];
          // 移除自动加载安全信息，改为点击管理时查询
          this.filterData();
        } else {
          this.locationList = [];
          this.filterData();
        }
      } catch (error) {
        console.error('加载位置数据失败:', error);
        this.locationList = [];
        this.filterData();
      } finally {
        this.loading = false;
      }
    },
    

    
    filterData() {
      // 确保 locationList 是数组
      if (!Array.isArray(this.locationList)) {
        this.filteredList = [];
        return;
      }
      
      let filtered = [...this.locationList];
      
      // 按类型筛选
      if (this.currentFilter !== 0) {
        filtered = filtered.filter(item => item.type === this.currentFilter);
      }
      
      // 按关键词搜索
      if (this.searchKeyword.trim()) {
        const keyword = this.searchKeyword.toLowerCase();
        filtered = filtered.filter(item => 
          item.addressName.toLowerCase().includes(keyword) ||
          item.addressExt.toLowerCase().includes(keyword) ||
          this.getLocationTypeName(item.type).toLowerCase().includes(keyword)
        );
      }
      
      this.filteredList = filtered;
    },
    
    setFilter(type) {
      this.currentFilter = type;
      this.filterData();
    },
    
    search(keyword) {
      this.searchKeyword = keyword;
    },
    
    loadMore() {
      // 可以在这里实现分页加载
    },
    
    editItem(item) {
      uni.navigateTo({
        url: `/pages/personal/userDetail/DataEdit?type=location&mode=edit&id=${item.addressId}`
      });
    },
    
    deleteItem(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除这个位置信息吗？`,
        success: (res) => {
          if (res.confirm) {
            this.performDelete(item);
          }
        }
      });
    },
  
    async performDelete(item) {
      uni.showLoading({ title: '删除中...' });
      try {
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/location/delete',
            method: 'POST',
            data: { id: item.addressId },
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          uni.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1500
          });
          this.loadData();
        } else {
          throw new Error(result.data?.msg || '删除失败');
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '删除失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 工具方法
    getLocationTypeIcon(type) {
      const iconMap = {
        1: this.serverUrl + '/static/icons/location/community.png',
        2: this.serverUrl + '/static/icons/location/factory.png',
        3: this.serverUrl + '/static/icons/location/shop.png'
      };
      return iconMap[type] || iconMap[1];
    },
    
    getLocationTypeName(type) {
      const nameMap = { 1: '高层小区', 2: '重点单位', 3: '沿街商铺' };
      return nameMap[type] || '未知类型';
    }
  }
}
</script>

<style lang="scss" scoped>
.location-management {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%; /* 确保容器有明确的高度 */
  overflow: hidden; /* 防止内容溢出 */
}

/* 筛选栏 */
.filter-bar {
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  padding: 16rpx 0;
}

.filter-tabs {
  display: flex;
  padding: 0 20rpx;
  gap: 16rpx;
  flex-wrap: wrap;
}

.filter-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx 20rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 80rpx;
  
  &:active {
    transform: scale(0.95);
  }
}

.filter-tab.active {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
}

.filter-text {
  font-size: 26rpx;
  color: #666;
  font-weight: 500;
}

.filter-tab.active .filter-text {
  color: #fff;
  font-weight: 600;
}

.data-list {
  flex: 1;
  height: 100%; /* 确保有明确的高度 */
  box-sizing: border-box; /* 确保padding包含在高度内 */
  overflow-y: auto; /* 确保可以垂直滚动 */
}

.loading-container, .empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.loading-icon, .empty-icon {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 20rpx;
}

.loading-text, .empty-text {
  font-size: 28rpx;
  color: #999;
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 20rpx;
  padding-bottom: 160rpx; /* 增加底部空白，确保可以滚动到底部 */
}

.data-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-title {
  display: flex;
  align-items: center;
  flex: 1;
}

.type-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 12rpx;
}

.title-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.item-actions {
  display: flex;
  gap: 12rpx;
}

.action-icon {
  width: 32rpx;
  height: 32rpx;
  padding: 8rpx;
  border-radius: 6rpx;
  background: #1890ff;
  transition: all 0.2s ease;
  
  &:active {
    background: #e6e6e6;
    transform: scale(0.95);
  }
}

.delete-icon {
  background: #ff4d4f;
  
  &:active {
    background: #ff7875;
  }
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.content-row {
  display: flex;
  align-items: flex-start;
}

.label {
  font-size: 24rpx;
  color: #999;
  min-width: 120rpx;
  margin-right: 16rpx;
}

.value {
  font-size: 24rpx;
  color: #333;
  flex: 1;
}


</style>