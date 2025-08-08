<template>
  <view class="command-management">
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
        <view class="data-item" v-for="item in filteredList" :key="item.id">
          <view class="item-header">
            <view class="item-title">
              <image :src="serverUrl + '/static/icons/data/manage.png'" class="type-icon" />
              <text class="title-text">{{ item.title }}</text>
            </view>
            <view class="item-actions">
              <button class="action-icon-btn" @tap="editItem(item)">
                <image :src="serverUrl + '/static/icons/chat/edit.png'" class="action-icon" />
              </button>
              <button class="action-icon-btn delete-btn" @tap="deleteItem(item)">
                <image :src="serverUrl + '/static/icons/chat/delete.png'" class="action-icon" />
              </button>
            </view>
          </view>
          <view class="item-content">
            <view class="content-row">
              <text class="label">类型：</text>
              <text class="value">{{ getCommandTypeName(item.type) }}</text>
            </view>
            <view class="content-row">
              <text class="label">优先级：</text>
              <text class="value">{{ getPriorityText(item.priority) }}</text>
            </view>
            <view class="content-row">
              <text class="label">状态：</text>
              <text class="value" :class="item.status === 1 ? 'status-active' : 'status-inactive'">{{ getStatusText(item.status) }}</text>
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
  name: 'CommandManagement',
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
      commandList: [],
      filteredList: [],
      commandTypeOptions: [
        { value: 1, label: '紧急指挥' },
        { value: 2, label: '常规指挥' },
        { value: 3, label: '演练指挥' }
      ],
      priorityOptions: [
        { value: 1, label: '高' },
        { value: 2, label: '中' },
        { value: 3, label: '低' }
      ],
      statusOptions: [
        { value: 1, label: '启用' },
        { value: 0, label: '禁用' }
      ]
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
            url: this.serverUrl + '/command/list',
            method: 'GET',
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          this.commandList = result.data.data || [];
          this.filterData();
        } else {
          this.commandList = [];
          this.filterData();
        }
      } catch (error) {
        console.error('加载指挥数据失败:', error);
        this.commandList = [];
        this.filterData();
      } finally {
        this.loading = false;
      }
    },
    
    filterData() {
      if (!this.searchKeyword.trim()) {
        this.filteredList = [...this.commandList];
      } else {
        const keyword = this.searchKeyword.toLowerCase();
        this.filteredList = this.commandList.filter(item => 
          item.title.toLowerCase().includes(keyword) ||
          (item.description && item.description.toLowerCase().includes(keyword)) ||
          this.getCommandTypeName(item.type).toLowerCase().includes(keyword)
        );
      }
    },
    
    search(keyword) {
      this.searchKeyword = keyword;
    },
    
    loadMore() {
      // 可以在这里实现分页加载
    },
    
    editItem(item) {
      uni.navigateTo({
        url: `/pages/personal/userDetail/DataEdit?type=command&mode=edit&id=${item.id}`
      });
    },
    
    deleteItem(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除这个指挥信息吗？`,
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
            url: this.serverUrl + '/command/delete',
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
    getCommandTypeName(type) {
      const option = this.commandTypeOptions.find(item => item.value === type);
      return option ? option.label : '未知类型';
    },
    
    getPriorityText(priority) {
      const option = this.priorityOptions.find(item => item.value === priority);
      return option ? option.label : '未知优先级';
    },
    
    getStatusText(status) {
      const option = this.statusOptions.find(item => item.value === status);
      return option ? option.label : '请选择状态';
    }
  }
}
</script>

<style lang="scss" scoped>
.command-management {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.data-list {
  flex: 1;
  padding: 20rpx;
}

.loading-container, .empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.loading-icon, .empty-icon {
  width: 80rpx;
  height: 80rpx;
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

.action-icon-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon-btn.delete-btn {
  background: #ff4d4f;
}

.action-icon {
  width: 32rpx;
  height: 32rpx;
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

.status-active {
  color: #07c160;
}

.status-inactive {
  color: #ff4d4f;
}
</style> 