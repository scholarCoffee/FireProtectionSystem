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
          :class="{ active: currentTab === 'safety' }"
          @tap="switchTab('safety')"
        >
          <image :src="currentTab === 'safety' ? serverUrl + '/static/icons/data/safe-active.png' : serverUrl + '/static/icons/data/safe.png'" class="tab-icon" />
          <text class="tab-text">安全信息</text>
        </view>
      </view>
    </view>

    <!-- 操作栏 -->
    <view class="action-bar">
      <view class="action-left">
        <button class="action-btn add-btn" @tap="showAddModal">
          <image :src="serverUrl + '/static/icons/common/add-white.png'" class="btn-icon" />
          <text>新增</text>
        </button>
        <button class="action-btn refresh-btn" @tap="refreshData">
          <image :src="serverUrl + '/static/icons/common/refresh-white.png'" class="btn-icon" />
          <text>刷新</text>
        </button>
      </view>
      <view class="action-right">
        <text class="data-count">共 {{ currentDataList.length }} 条</text>
      </view>
    </view>

    <!-- 数据列表 -->
    <scroll-view class="data-list" scroll-y="true" @scrolltolower="loadMore">
      <view v-if="loading" class="loading-container">
        <image :src="serverUrl + '/static/icons/common/loading.png'" class="loading-icon" />
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else-if="currentDataList.length === 0" class="empty-container">
        <image :src="serverUrl + '/static/icons/common/no-data.png'" class="empty-icon" />
        <text class="empty-text">暂无数据</text>
      </view>
      
      <view v-else class="list-content">
        <!-- Location数据项 -->
        <view v-if="currentTab === 'location'" class="data-item" v-for="item in currentDataList" :key="item.id">
          <view class="item-header">
            <view class="item-title">
              <image :src="getLocationTypeIcon(item.type)" class="type-icon" />
              <text class="title-text">{{ item.addressName }}</text>
            </view>
            <view class="item-actions">
              <view class="action-icon-btn edit-btn" @tap="editItem(item)">
                <image :src="serverUrl + '/static/icons/common/edit-white.png'" class="action-icon" />
              </view>
              <view class="action-icon-btn delete-btn" @tap="deleteItem(item)">
                <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="action-icon" />
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

        <!-- Safety数据项 -->
        <view v-if="currentTab === 'safety'" class="data-item" v-for="item in currentDataList" :key="item.id">
          <view class="item-header">
            <view class="item-title">
              <image :src="serverUrl + '/static/icons/data/alarm.png'" class="type-icon" />
              <text class="title-text">{{ item.name }}</text>
            </view>
            <view class="item-actions">
              <image :src="serverUrl + '/static/icons/common/edit-white.png'" class="action-icon" @tap="editItem(item)" />
              <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="action-icon" @tap="deleteItem(item)" />
            </view>
          </view>
          <view class="item-content">
            <view class="content-row">
              <text class="label">描述：</text>
              <text class="value">{{ item.description || '暂无描述' }}</text>
            </view>
            <view class="content-row">
              <text class="label">权重：</text>
              <text class="value">{{ item.weight || 0 }}</text>
            </view>
              <view class="content-row">
               <text class="label">状态：</text>
              <text class="value" :class="item.status === 1 ? 'status-active' : 'status-inactive'">{{ getStatusText(item.status) }}</text>
             </view>
          </view>
        </view>
      </view>
    </scroll-view>

  </view>
</template>

<script>
export default {
  name: 'DataManagement',
  data() {
    return {
      currentTab: 'location', // 当前标签页
      loading: false,
      locationList: [],
      safetyList: [],
      // 选项数据
      locationTypeOptions: [
        { value: 1, label: '高层小区' },
        { value: 2, label: '重点单位' },
        { value: 3, label: '沿街商铺' }
      ],
      safetyLevelOptions: [
        { value: 1, label: '优秀' },
        { value: 2, label: '良好' },
        { value: 3, label: '一般' },
        { value: 4, label: '危险' }
      ],
      statusOptions: [
        { value: 1, label: '启用' },
        { value: 0, label: '禁用' }
      ]
    }
  },
  computed: {
    currentDataList() {
      return this.currentTab === 'location' ? this.locationList : this.safetyList;
    }
  },
  onLoad() {
    this.loadData();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    switchTab(tab) {
      this.currentTab = tab;
      this.loadData();
    },
    
    async loadData() {
      this.loading = true;
      try {
        if (this.currentTab === 'location') {
          await this.loadLocationData();
        } else {
          await this.loadSafetyData();
        }
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
              this.locationList = res.data.data || [];
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
    
    async loadSafetyData() {
      return new Promise((resolve, reject) => {
        uni.request({
          url: this.serverUrl + '/safety/list',
          method: 'GET',
          success: (res) => {
            if (res.data && res.data.code === 200) {
              this.safetyList = res.data.data || [];
            } else {
              // 添加测试数据
              this.safetyList = [
                {
                  id: '1',
                  name: '测试安全项1',
                  description: '这是一个测试安全项',
                  weight: 10,
                  status: 1
                },
                {
                  id: '2',
                  name: '测试安全项2',
                  description: '这是另一个测试安全项',
                  weight: 5,
                  status: 0
                }
              ];
            }
            resolve();
          },
          fail: (err) => {
            // 添加测试数据
            this.safetyList = [
              {
                id: '1',
                name: '测试安全项1',
                description: '这是一个测试安全项',
                weight: 10,
                status: 1
              },
              {
                id: '2',
                name: '测试安全项2',
                description: '这是另一个测试安全项',
                weight: 5,
                status: 0
              }
            ];
            resolve();
          }
        });
      });
    },
    
    refreshData() {
      this.loadData();
    },
    
    loadMore() {
      // 可以在这里实现分页加载
    },
    
    showAddModal() {
      // 跳转到新增页面
      uni.navigateTo({
        url: `/pages/personal/userDetail/DataEdit?type=${this.currentTab}&mode=add`
      });
    },
    
    editItem(item) {
      console.log('编辑按钮被点击:', item);
      // 跳转到编辑页面
      uni.navigateTo({
        url: `/pages/personal/userDetail/DataEdit?type=${this.currentTab}&mode=edit&id=${item.id}`
      });
    },
    
    deleteItem(item) {
      console.log('删除按钮被点击:', item);
      uni.showModal({
        title: '确认删除',
        content: `确定要删除这个${this.currentTab === 'location' ? '位置' : '安全'}信息吗？`,
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
        const url = this.currentTab === 'location' 
          ? this.serverUrl + '/location/delete'
          : this.serverUrl + '/safety/delete';
        
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url,
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
        1: 'https://www.xiaobei.space/static/icons/location/community.png',
        2: 'https://www.xiaobei.space/static/icons/location/factory.png',
        3: 'https://www.xiaobei.space/static/icons/location/shop.png'
      };
      return iconMap[type] || iconMap[1];
    },
    
    getLocationTypeName(type) {
      const nameMap = { 1: '高层小区', 2: '重点单位', 3: '沿街商铺' };
      return nameMap[type] || '未知类型';
    },
    
    getLocationTypeText(type) {
      const option = this.locationTypeOptions.find(item => item.value === type);
      return option ? option.label : '请选择类型';
    },
    
    getSafetyLevelText(levelId) {
      const option = this.safetyLevelOptions.find(item => item.value === levelId);
      return option ? option.label : '请选择等级';
    },
    
    getStatusText(status) {
      const option = this.statusOptions.find(item => item.value === status);
      return option ? option.label : '请选择状态';
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

/* 数据列表 */
.data-list {
  flex: 1;
  padding: 20rpx;
}

.loading-container, .empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-icon, .empty-icon {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 20rpx;
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

.status-active {
  color: #52c41a;
  font-weight: 600;
}

.status-inactive {
  color: #ff4d4f;
  font-weight: 600;
}
</style> 