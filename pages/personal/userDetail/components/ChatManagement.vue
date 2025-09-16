<template>
  <view class="chat-management">
    <!-- 数据列表 -->
    <scroll-view class="data-list" scroll-y="true" @scrolltolower="loadMore">
      <view v-if="loading" class="loading-container">
        <image :src="serverUrl + '/static/icons/common/loading.png'" class="loading-icon" />
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else-if="filteredList.length === 0" class="empty-container">
        <image :src="serverUrl + '/static/icons/common/no-data.png'" class="empty-icon" />
        <text class="empty-text">暂无群组</text>
      </view>
      
      <view v-else class="list-content">
        <view class="data-item" v-for="item in filteredList" :key="item.groupId">
          <view class="item-header">
            <view class="item-title">
              <image :src="serverUrl + (item.groupAvatar || '/static/group/group.png')" class="group-avatar" />
              <view class="title-info">
                <text class="title-text">{{ item.groupName }}</text>
                <text class="member-count">{{ item.memberCount || 0 }}人</text>
              </view>
            </view>
            <view class="item-actions">
              <button class="action-icon-btn" @tap="editGroup(item)">
                <image :src="serverUrl + '/static/icons/common/edit-white.png'" class="action-icon" mode="aspectFit" />
              </button>
              <!-- <button class="action-icon-btn member-btn" @tap="manageMembers(item)">
                <image :src="serverUrl + '/static/icons/common/add-white.png'" class="action-icon" mode="aspectFit" />
              </button>
              <button class="action-icon-btn delete-btn" @tap="deleteGroup(item)">
                <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="action-icon" mode="aspectFit" />
              </button> -->
            </view>
          </view>
          <view class="item-content">
            <view class="content-row">
              <text class="label">群组ID：</text>
              <text class="value">{{ item.groupId }}</text>
            </view>
            <view class="content-row">
              <text class="label">创建时间：</text>
              <text class="value">{{ formatTime(item.createTime) }}</text>
            </view>
            <view class="content-row">
              <text class="label">群描述：</text>
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
  name: 'ChatManagement',
  props: {
    serverUrl: {
      type: String,
      default: 'https://www.xiaobei.space',
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
      groupList: [],
      filteredList: [],
      // 用户信息（用于拉取群列表）
      userInfo: {
        userId: '',
        permissionStatus: 2
      },
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
    this.getStorages();
    this.loadData();
  },
  
  methods: {
    // 读取本地用户，用于接口参数
    getStorages() {
      const userInfo = uni.getStorageSync('userInfo') || {}
      this.userInfo = userInfo;
    },

    async loadData() {
      this.loading = true;
      try {
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/group/getGroupList',
            method: 'POST',
            data: { isAll: true, userId: this.userInfo.userId },
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200 && Array.isArray(result.data.data)) {
          // 规范化字段与头像
          this.groupList = result.data.data;
          this.filterData();
        } else {
          this.groupList = [];
          this.filterData();
        }
      } catch (error) {
        console.error('加载群组数据失败:', error);
        this.groupList = [];
        this.filterData();
      } finally {
        this.loading = false;
      }
    },
    
    filterData() {
      if (!this.searchKeyword.trim()) {
        this.filteredList = [...this.groupList];
      } else {
        const keyword = this.searchKeyword.toLowerCase();
        this.filteredList = this.groupList.filter(item => 
          item.groupName.toLowerCase().includes(keyword) ||
          item.description.toLowerCase().includes(keyword)
        );
      }
    },
    
    search(keyword) {
      this.searchKeyword = keyword;
    },
    
    editGroup(item) {
      uni.navigateTo({
        url: `/pages/personal/userDetail/DataEdit?type=chat&mode=edit&id=${item.groupId}`
      });
    },
    
    
    deleteGroup(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除群组 "${item.groupName}" 吗？`,
        success: (res) => {
          if (res.confirm) {
            this.performDeleteGroup(item);
          }
        }
      });
    },
    
    
    async performDeleteGroup(item) {
      uni.showLoading({ title: '删除中...' });
      try {
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/chat/deleteGroup',
            method: 'POST',
            data: { groupId: item.groupId },
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
    
    formatTime(timestamp) {
      if (!timestamp) return '未知时间';
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-management {
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

.group-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.title-info {
  display: flex;
  flex-direction: column;
}

.title-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 4rpx;
}

.member-count {
  font-size: 22rpx;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 12rpx;
  margin-right: 12rpx;
}

.action-icon-btn {
  padding: 8rpx;
  border-radius: 8rpx;
  background: #1890ff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  overflow: hidden;
}

.action-icon-btn.member-btn {
  background: #1890ff;
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

</style> 