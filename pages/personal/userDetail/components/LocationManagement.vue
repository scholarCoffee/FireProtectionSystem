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
    <scroll-view 
      class="data-list" 
      scroll-y="true" 
      @scrolltolower="loadMore"
    >
      <view v-if="loading && page === 1" class="loading-container">
        <image :src="serverUrl + '/static/icons/common/loading.png'" class="loading-icon" />
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else-if="filteredList.length === 0 && !hasMore" class="empty-container">
        <image :src="serverUrl + '/static/icons/common/no-data.png'" class="empty-icon" />
        <text class="empty-text">暂无数据</text>
      </view>
      
      <view v-else class="list-content">
        <view class="data-item" v-for="item in filteredList" :key="item.addressId" :data-index="item.addressId">
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
              <text class="value">{{ item.fireSafetyScore ? item.fireSafetyScore.safeLevelName : '未设置' }}</text>
            </view>
            <view class="content-row">
              <text class="label">安全评分：</text>
              <text class="value">{{ item.fireSafetyScore ? item.fireSafetyScore.totalScore + '分' : '未设置' }}</text>
            </view>
            <view class="content-row">
              <text class="label">描述：</text>
              <text class="value">{{ item.description || '暂无描述' }}</text>
            </view>
          </view>
        </view>
        
        <!-- 加载更多提示 -->
        <view v-if="loadingMore" class="loading-more">
          <image :src="serverUrl + '/static/icons/common/loading.png'" class="loading-more-icon" />
          <text class="loading-more-text">加载更多...</text>
        </view>
        
        <!-- 没有更多数据提示 -->
        <view v-if="!hasMore && filteredList.length > 0" class="no-more">
          <text class="no-more-text">没有更多数据了</text>
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
      loadingMore: false,
      locationList: [],
      filteredList: [],
      currentFilter: 0, // 当前筛选类型，0表示全部
      locationTabList: locationTabList,
      // 分页相关参数
      page: 1,
      pageSize: 20,
      hasMore: true,
      total: 0,
    }
  },
  watch: {
    searchKeyword: {
      handler(newVal) {
        // 只有在有搜索关键词时才重置分页并重新加载
        if (newVal !== undefined) {
          this.resetPagination();
          this.filterData();
        }
      }
    }
  },
  mounted() {
    this.loadData();
  },
  methods: {
    // 重置分页参数
    resetPagination() {
      this.page = 1;
      this.hasMore = true;
      this.filteredList = [];
    },
    
    async loadData(isLoadMore = false) {
      if (isLoadMore) {
        this.loadingMore = true;
      } else {
        this.loading = true;
      }
      
      try {
        // 构建请求参数
        const params = {
          page: this.page,
          pageSize: this.pageSize
        };
        
        // 添加筛选条件
        if (this.currentFilter !== 0) {
          params.type = this.currentFilter;
        }
        
        if (this.searchKeyword.trim()) {
          params.keyword = this.searchKeyword.trim();
        }
        
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/location/list',
            method: 'GET',
            data: params,
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          const responseData = result.data.data;
          const locationData = responseData && responseData.list;
          const newData = Array.isArray(locationData) ? locationData : [];
          
          if (isLoadMore) {
            // 加载更多时，追加数据
            this.filteredList = [...this.filteredList, ...newData];
          } else {
            // 首次加载或筛选时，替换数据
            this.filteredList = newData;
          }
          
          // 更新分页信息
          this.total = responseData.total || 0;
          this.hasMore = newData.length === this.pageSize;
          
          // 如果没有更多数据，显示提示
          if (!this.hasMore && this.filteredList.length > 0) {
            console.log('已加载所有数据');
          }
        } else {
          if (!isLoadMore) {
            this.filteredList = [];
          }
          this.hasMore = false;
        }
      } catch (error) {
        console.error('加载位置数据失败:', error);
        if (!isLoadMore) {
          this.filteredList = [];
        }
        this.hasMore = false;
      } finally {
        this.loading = false;
        this.loadingMore = false;
      }
    },
    
    filterData() {
      // 重置分页并重新加载数据
      this.resetPagination();
      this.loadData();
    },
    
    setFilter(type) {
      this.currentFilter = type;
      this.filterData();
    },
    
    search(keyword) {
      this.searchKeyword = keyword;
    },
    
    // 滚动到底部加载更多
    async loadMore() {
      if (this.loadingMore || !this.hasMore) {
        return;
      }
      
      this.page += 1;
      await this.loadData(true);
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
            data: { addressId: item.addressId },
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
          // 删除成功后重新加载数据
          this.resetPagination();
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
      const iconMap = this.locationTabList.find(item => item.type === type)?.icon || this.locationTabList[0].icon;
      return this.serverUrl + (iconMap || this.locationTabList[0].icon);
    },
    
    getLocationTypeName(type) {
      const nameMap = this.locationTabList.find(item => item.type === type)?.name || '未知类型';
      return nameMap || '未知类型';
    }
  }
}
</script>

<style lang="scss" scoped>
.location-management {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh; /* 确保容器有明确的高度（安卓小程序需要固定视口高度） */
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
  padding: 0;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  /* 明确的高度以启用安卓小程序 scroll-view 滚动 */
  height: calc(100vh - 120rpx);
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
  transition: all 0.2s ease;
}

.data-item:active {
  transform: scale(0.98);
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.1);
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
  margin-right: 12rpx;
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

/* 加载更多提示 */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16rpx;
  margin: 30rpx 20rpx 20rpx 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 20rpx;
    right: 20rpx;
    height: 1rpx;
    background: linear-gradient(90deg, transparent 0%, #dee2e6 50%, transparent 100%);
  }
}

.loading-more-icon {
  width: 36rpx;
  height: 36rpx;
  margin-right: 16rpx;
  animation: rotate 1.2s linear infinite;
  opacity: 0.8;
}

.loading-more-text {
  font-size: 28rpx;
  color: #6c757d;
  font-weight: 500;
  letter-spacing: 1rpx;
}

/* 没有更多数据提示 */
.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx 0;
  background: linear-gradient(135deg, #fff 0%, #ffffff 100%);
  border-radius: 16rpx;
  margin: 30rpx 20rpx 20rpx 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 20rpx;
    right: 20rpx;
    height: 1rpx;
    background: linear-gradient(90deg, transparent 0%, #dee2e6 50%, transparent 100%);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20rpx;
    right: 20rpx;
    height: 1rpx;
    background: linear-gradient(90deg, transparent 0%, #dee2e6 50%, transparent 100%);
  }
}

.no-more-text {
  font-size: 28rpx;
  color: #6c757d;
  font-weight: 500;
  letter-spacing: 1rpx;
  position: relative;
  padding: 0 20rpx;
  
  &::before {
    content: '—';
    position: absolute;
    left: -10rpx;
    color: #adb5bd;
  }
  
  &::after {
    content: '—';
    position: absolute;
    right: -10rpx;
    color: #adb5bd;
  }
}

/* 旋转动画 */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 添加淡入淡出效果 */
.loading-more, .no-more {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>