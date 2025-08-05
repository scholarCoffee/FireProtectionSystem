<template>
    <view class="location-management">
      <!-- 筛选条件 -->
      <view class="filter-bar">
        <!-- 搜索框 -->
        <view class="search-container">
          <view class="search-input-wrapper">
            <image :src="this.serverUrl + '/static/icons/common/search.png'" class="search-icon" />
            <input 
              v-model="searchKeyword" 
              class="search-input" 
              placeholder="搜索地址ID或地址名称"
              @input="onSearchInput"
              @confirm="onSearchConfirm"
            />
            <view v-if="searchKeyword" class="clear-btn" @tap="clearSearch">
              <image :src="this.serverUrl + '/static/icons/common/clear.png'" class="clear-icon" />
            </view>
          </view>
        </view>
        
        <!-- 类型筛选 -->
        <view class="filter-container">
          <view class="filter-label">类型筛选：</view>
          <view class="filter-options">
            <view 
              class="filter-option" 
              :class="{ active: selectedTypes.length === 0 }"
              @tap="selectAllTypes"
            >
              <text>全部</text>
            </view>
            <view 
              v-for="type in locationTypeOptions" 
              :key="type.value"
              class="filter-option" 
              :class="{ active: isTypeSelected(type.value) }"
              @tap="toggleType(type.value)"
            >
              <text>{{ type.label }}</text>
            </view>
          </view>
        </view>
      </view>
  
      <!-- 数据列表 -->
      <scroll-view class="data-list" scroll-y="true" @scrolltolower="loadMore">
        <view v-if="loading" class="loading-container">
          <image :src="this.serverUrl + '/static/icons/common/loading.png'" class="loading-icon" />
          <text class="loading-text">加载中...</text>
        </view>
        
        <view v-else-if="filteredDataList.length === 0" class="empty-container">
          <image :src="this.serverUrl + '/static/icons/common/no-data.png'" class="empty-icon" />
          <text class="empty-text">暂无数据</text>
        </view>
        
        <view v-else class="list-content">
          <!-- Location数据项 -->
          <view class="data-item" v-for="item in filteredDataList" :key="item.id">
            <view class="item-header">
              <view class="item-title">
                <image :src="getLocationTypeIcon(item.type)" class="type-icon" />
                <text class="title-text">{{ item.addressName }}</text>
              </view>
              <view class="item-actions">
                <view class="action-icon-btn edit-btn" @tap="editItem(item)">
                  <image :src="this.serverUrl + '/static/icons/common/edit-white.png'" class="action-icon" />
                </view>
                <view class="action-icon-btn delete-btn" @tap="deleteItem(item)">
                  <image :src="this.serverUrl + '/static/icons/common/delete-white.png'" class="action-icon" />
                </view>
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
  export default {
    name: 'LocationManagement',
    props: {
      serverUrl: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        loading: false,
        locationList: [],
        // 筛选相关数据
        searchKeyword: '',
        selectedTypes: [],
        // 选项数据
        locationTypeOptions: [
          { value: 1, label: '高层小区' },
          { value: 2, label: '重点单位' },
          { value: 3, label: '沿街商铺' }
        ]
      }
    },
    computed: {
      filteredDataList() {
        let filtered = this.locationList || [];
        
        // 确保filtered是数组
        if (!Array.isArray(filtered)) {
          console.warn('locationList不是数组:', filtered);
          filtered = [];
        }
        
        // 搜索筛选
        if (this.searchKeyword && this.searchKeyword.trim()) {
          const keyword = this.searchKeyword.toLowerCase().trim();
          filtered = filtered.filter(item => {
            if (!item) return false;
            return (item.addressId && item.addressId.toString().includes(keyword)) ||
                   (item.addressName && item.addressName.toLowerCase().includes(keyword));
          });
        }
        
        // 类型筛选
        if (this.selectedTypes && this.selectedTypes.length > 0) {
          filtered = filtered.filter(item => {
            if (!item) return false;
            return this.selectedTypes.includes(item.type);
          });
        }
        
        return filtered;
      }
    },
    mounted() {
      this.loadData();
    },
    methods: {
      async loadData() {
        this.loading = true;
        try {
          await this.loadLocationData();
        } catch (error) {
          console.error('加载数据失败:', error);
          uni.showToast({
            title: '加载数据失败',
            icon: 'none',
            duration: 2000
          });
        } finally {
          this.loading = false;
        }
      },
      
      async loadLocationData() {
        return new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/location/list',
            method: 'GET',
            success: (res) => {
              if (res.data && res.data.code === 200) {
                this.locationList = Array.isArray(res.data.data) ? res.data.data : [];
              } else {
                // 添加测试数据
                this.locationList = [
                  {
                    id: '1',
                    addressName: '测试位置1',
                    addressExt: '江苏省苏州市工业园区测试地址1',
                    type: 1,
                    safeLevelName: '优秀',
                    description: '这是一个测试位置'
                  },
                  {
                    id: '2',
                    addressName: '测试位置2',
                    addressExt: '江苏省苏州市工业园区测试地址2',
                    type: 2,
                    safeLevelName: '良好',
                    description: '这是另一个测试位置'
                  }
                ];
              }
              resolve();
            },
            fail: (err) => {
              console.error('加载位置数据失败:', err);
              // 添加测试数据
              this.locationList = [
                {
                  id: '1',
                  addressName: '测试位置1',
                  addressExt: '江苏省苏州市工业园区测试地址1',
                  type: 1,
                  safeLevelName: '优秀',
                  description: '这是一个测试位置'
                },
                {
                  id: '2',
                  addressName: '测试位置2',
                  addressExt: '江苏省苏州市工业园区测试地址2',
                  type: 2,
                  safeLevelName: '良好',
                  description: '这是另一个测试位置'
                }
              ];
              resolve();
            }
          });
        });
      },
      
      // 筛选相关方法
      onSearchInput(e) {
        this.searchKeyword = e.detail.value;
      },
      
      onSearchConfirm() {
        // 搜索确认时的处理
      },
      
      clearSearch() {
        this.searchKeyword = '';
      },
      
      selectAllTypes() {
        this.selectedTypes = [];
      },
      
      toggleType(typeValue) {
        const index = this.selectedTypes.indexOf(typeValue);
        if (index > -1) {
          this.selectedTypes.splice(index, 1);
        } else {
          this.selectedTypes.push(typeValue);
        }
      },
      
      isTypeSelected(typeValue) {
        return this.selectedTypes.includes(typeValue);
      },
      
      loadMore() {
        // 可以在这里实现分页加载
      },
      
      editItem(item) {
        console.log('编辑按钮被点击:', item);
        // 跳转到编辑页面
        uni.navigateTo({
          url: `/pages/personal/userDetail/DataEdit?type=location&mode=edit&id=${item.id}`
        });
      },
      
      deleteItem(item) {
        console.log('删除按钮被点击:', item);
        uni.showModal({
          title: '确认删除',
          content: '确定要删除这个位置信息吗？',
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
              data: { id: item.id },
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
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  /* 筛选条件样式 */
  .filter-bar {
    background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
    border-bottom: 1rpx solid rgba(24, 144, 255, 0.1);
    padding: 20rpx 32rpx;
    box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.05);
  }
  
  /* 搜索框样式 */
  .search-container {
    margin-bottom: 20rpx;
  }
  
  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: #ffffff;
    border-radius: 12rpx;
    border: 1rpx solid rgba(24, 144, 255, 0.2);
    padding: 0 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.1);
    transition: all 0.3s ease;
    
    &:focus-within {
      border-color: #1890ff;
      box-shadow: 0 2rpx 12rpx rgba(24, 144, 255, 0.2);
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
    height: 72rpx;
    border: none;
    background: transparent;
    font-size: 28rpx;
    color: #333333;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    
    &::placeholder {
      color: #bfbfbf;
      font-size: 28rpx;
    }
  }
  
  .clear-btn {
    padding: 8rpx;
    margin-left: 8rpx;
  }
  
  .clear-icon {
    width: 24rpx;
    height: 24rpx;
    opacity: 0.6;
  }
  
  /* 筛选条件样式 */
  .filter-container {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16rpx;
  }
  
  .filter-label {
    font-size: 28rpx;
    color: #1890ff;
    font-weight: 600;
    margin-right: 8rpx;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }
  
  .filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
  }
  
  .filter-option {
    padding: 12rpx 20rpx;
    border-radius: 20rpx;
    background: #ffffff;
    border: 1rpx solid rgba(24, 144, 255, 0.2);
    font-size: 26rpx;
    color: #666666;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    
    &:active {
      transform: translateY(1rpx);
    }
    
    &.active {
      background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
      color: #ffffff;
      border-color: #1890ff;
      box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
    }
  }
  
  /* 数据列表样式 */
  .data-list {
    flex: 1;
    padding: 20rpx 32rpx;
    background: transparent;
  }
  
  .loading-container, .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx 0;
  }
  
  .loading-icon, .empty-icon {
    width: 80rpx;
    height: 80rpx;
    margin-bottom: 20rpx;
    opacity: 0.6;
  }
  
  .loading-text, .empty-text {
    font-size: 28rpx;
    color: #8c8c8c;
    font-weight: 500;
  }
  
  .list-content {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }
  
  .data-item {
    background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
    border-radius: 16rpx;
    padding: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.08);
    border: 1rpx solid rgba(24, 144, 255, 0.1);
    margin-bottom: 20rpx;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2rpx);
      box-shadow: 0 8rpx 24rpx rgba(24, 144, 255, 0.12);
    }
  }
  
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid rgba(24, 144, 255, 0.1);
  }
  
  .item-title {
    display: flex;
    align-items: center;
    flex: 1;
  }
  
  .type-icon {
    width: 36rpx;
    height: 36rpx;
    margin-right: 16rpx;
    border-radius: 8rpx;
    padding: 6rpx;
  }
  
  .title-text {
    font-size: 30rpx;
    font-weight: 600;
    color: #1890ff;
    line-height: 1.4;
  }
  
  .item-actions {
    display: flex;
    gap: 12rpx;
    position: relative;
    z-index: 20;
  }
  
  .action-icon-btn {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    background: transparent;
    position: relative;
    z-index: 10;
    min-width: 64rpx;
    min-height: 64rpx;
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  .action-icon-btn.edit-btn {
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
    box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
    
    &:active {
      background: linear-gradient(135deg, #096dd9 0%, #1890ff 100%);
      box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
    }
  }
  
  .action-icon-btn.delete-btn {
    background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
    box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.3);
    
    &:active {
      background: linear-gradient(135deg, #cf1322 0%, #ff4d4f 100%);
      box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.3);
    }
  }
  
  .action-icon {
    width: 32rpx;
    height: 32rpx;
    pointer-events: none;
    filter: brightness(0) invert(1);
  }
  
  .item-content {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }
  
  .content-row {
    display: flex;
    align-items: flex-start;
    padding: 8rpx 0;
  }
  
  .label {
    font-size: 26rpx;
    color: #8c8c8c;
    min-width: 140rpx;
    margin-right: 20rpx;
    font-weight: 500;
  }
  
  .value {
    font-size: 26rpx;
    color: #262626;
    flex: 1;
    line-height: 1.5;
  }
  
  /* 移动端优化 */
  @media (max-width: 750rpx) {
    .filter-bar {
      padding: 16rpx 24rpx;
    }
    
    .search-input-wrapper {
      padding: 0 16rpx;
    }
    
    .search-input {
      height: 68rpx;
      font-size: 26rpx;
      
      &::placeholder {
        font-size: 26rpx;
      }
    }
    
    .filter-label {
      font-size: 26rpx;
    }
    
    .filter-option {
      padding: 10rpx 16rpx;
      font-size: 24rpx;
    }
    
    .data-list {
      padding: 16rpx 24rpx;
    }
  }
  
  /* 超小屏幕优化 */
  @media (max-width: 600rpx) {
    .filter-bar {
      padding: 12rpx 20rpx;
    }
    
    .search-input-wrapper {
      padding: 0 12rpx;
    }
    
    .search-input {
      height: 64rpx;
      font-size: 24rpx;
      
      &::placeholder {
        font-size: 24rpx;
      }
    }
    
    .filter-label {
      font-size: 24rpx;
    }
    
    .filter-option {
      padding: 8rpx 12rpx;
      font-size: 22rpx;
    }
    
    .data-list {
      padding: 12rpx 20rpx;
    }
  }
</style>