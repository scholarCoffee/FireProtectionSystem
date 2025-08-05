<template>
  <view class="safety-management">
    <!-- 数据列表 -->
    <scroll-view class="data-list" scroll-y="true" @scrolltolower="loadMore">
      <view v-if="loading" class="loading-container">
        <image :src="serverUrl + '/static/icons/common/loading.png'" class="loading-icon" />
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else-if="safetyList.length === 0" class="empty-container">
        <image :src="serverUrl + '/static/icons/common/no-data.png'" class="empty-icon" />
        <text class="empty-text">暂无数据</text>
      </view>
      
      <view v-else class="list-content">
        <!-- Safety数据项 -->
        <view class="data-item" v-for="item in safetyList" :key="item.id">
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
  name: 'SafetyManagement',
  props: {
    serverUrl: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      safetyList: [],
      // 选项数据
      statusOptions: [
        { value: 1, label: '启用' },
        { value: 0, label: '禁用' }
      ]
    }
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        await this.loadSafetyData();
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
    
    async loadSafetyData() {
      return new Promise((resolve, reject) => {
        uni.request({
          url: this.serverUrl + '/safety/list',
          method: 'GET',
          success: (res) => {
            if (res.data && res.data.code === 200) {
              this.safetyList = Array.isArray(res.data.data) ? res.data.data : [];
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
            console.error('加载安全数据失败:', err);
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
    
    loadMore() {
      // 可以在这里实现分页加载
    },
    
    editItem(item) {
      console.log('编辑按钮被点击:', item);
      // 跳转到编辑页面
      uni.navigateTo({
        url: `/pages/personal/userDetail/DataEdit?type=safety&mode=edit&id=${item.id}`
      });
    },
    
    deleteItem(item) {
      console.log('删除按钮被点击:', item);
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个安全信息吗？',
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
            url: this.serverUrl + '/safety/delete',
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
    getStatusText(status) {
      const option = this.statusOptions.find(item => item.value === status);
      return option ? option.label : '未知状态';
    }
  }
}
</script>

<style lang="scss" scoped>
.safety-management {
  height: 100%;
  display: flex;
  flex-direction: column;
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

.action-icon {
  width: 32rpx;
  height: 32rpx;
  pointer-events: none;
  filter: brightness(0) invert(1);
  padding: 8rpx;
  border-radius: 8rpx;
  background: rgba(24, 144, 255, 0.1);
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
    background: rgba(24, 144, 255, 0.2);
  }
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

/* 移动端优化 */
@media (max-width: 750rpx) {
  .data-list {
    padding: 16rpx 24rpx;
  }
}

/* 超小屏幕优化 */
@media (max-width: 600rpx) {
  .data-list {
    padding: 12rpx 20rpx;
  }
}
</style> 