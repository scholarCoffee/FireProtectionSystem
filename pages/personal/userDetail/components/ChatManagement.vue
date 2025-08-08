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
              <image :src="item.groupAvatar || serverUrl + '/static/icons/chat/defautl-group.png'" class="group-avatar" />
              <view class="title-info">
                <text class="title-text">{{ item.groupName }}</text>
                <text class="member-count">{{ item.memberCount || 0 }}人</text>
              </view>
            </view>
            <view class="item-actions">
              <button class="action-icon-btn" @tap="editGroup(item)">
                <image :src="serverUrl + '/static/icons/chat/edit.png'" class="action-icon" />
              </button>
              <button class="action-icon-btn member-btn" @tap="manageMembers(item)">
                <image :src="serverUrl + '/static/icons/chat/person-avatar.png'" class="action-icon" />
              </button>
              <button class="action-icon-btn delete-btn" @tap="deleteGroup(item)">
                <image :src="serverUrl + '/static/icons/chat/delete.png'" class="action-icon" />
              </button>
            </view>
          </view>
          <view class="item-content">
            <view class="content-row">
              <text class="label">群组ID：</text>
              <text class="value">{{ item.groupId }}</text>
            </view>
            <view class="content-row">
              <text class="label">群主：</text>
              <text class="value">{{ item.ownerName || '未知' }}</text>
            </view>
            <view class="content-row">
              <text class="label">创建时间：</text>
              <text class="value">{{ formatTime(item.createTime) }}</text>
            </view>
            <view class="content-row">
              <text class="label">群描述：</text>
              <text class="value">{{ item.description || '暂无描述' }}</text>
            </view>
            
            <!-- 群成员列表 -->
            <view class="members-section" v-if="item.members && item.members.length > 0">
              <view class="members-header">
                <text class="members-title">群成员 ({{ item.members.length }})</text>
                <button class="add-member-btn" @tap="addMember(item)">
                  <image :src="serverUrl + '/static/icons/chat/add.png'" class="add-icon" />
                  <text>添加成员</text>
                </button>
              </view>
              <view class="members-list">
                <view class="member-item" v-for="member in item.members.slice(0, 5)" :key="member.userId">
                  <image :src="member.avatarUrl || serverUrl + '/static/icons/chat/person-avatar.png'" class="member-avatar" />
                  <view class="member-info">
                    <text class="member-name">{{ member.nickName }}</text>
                    <text class="member-role">{{ member.role === 1 ? '群主' : member.role === 2 ? '管理员' : '成员' }}</text>
                  </view>
                  <button class="remove-member-btn" @tap="removeMember(item, member)" v-if="member.role !== 1">
                    <image :src="serverUrl + '/static/icons/chat/delete.png'" class="remove-icon" />
                  </button>
                </view>
                <view class="more-members" v-if="item.members.length > 5">
                  <text class="more-text">还有 {{ item.members.length - 5 }} 人...</text>
                </view>
              </view>
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
      filteredList: []
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
            url: this.serverUrl + '/chat/groups',
            method: 'GET',
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          this.groupList = result.data.data || [];
          // 为每个群组加载成员信息
          await this.loadMembersForGroups();
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
    
    async loadMembersForGroups() {
      // 为每个群组加载成员信息
      for (let group of this.groupList) {
        try {
          const membersResult = await new Promise((resolve, reject) => {
            uni.request({
              url: this.serverUrl + '/chat/members',
              method: 'GET',
              data: { groupId: group.groupId },
              success: resolve,
              fail: reject
            });
          });
          
          if (membersResult.data && membersResult.data.code === 200) {
            group.members = membersResult.data.data || [];
            group.memberCount = group.members.length;
          } else {
            group.members = [];
            group.memberCount = 0;
          }
        } catch (error) {
          console.error('加载群成员失败:', error);
          group.members = [];
          group.memberCount = 0;
        }
      }
    },
    
    filterData() {
      if (!this.searchKeyword.trim()) {
        this.filteredList = [...this.groupList];
      } else {
        const keyword = this.searchKeyword.toLowerCase();
        this.filteredList = this.groupList.filter(item => 
          item.groupName.toLowerCase().includes(keyword) ||
          item.description.toLowerCase().includes(keyword) ||
          (item.members && item.members.some(member => 
            member.nickName.toLowerCase().includes(keyword)
          ))
        );
      }
    },
    
    search(keyword) {
      this.searchKeyword = keyword;
    },
    
    loadMore() {
      // 可以在这里实现分页加载
    },
    
    editGroup(item) {
      uni.navigateTo({
        url: `/pages/personal/userDetail/DataEdit?type=chat&mode=edit&groupId=${item.groupId}`
      });
    },
    
    manageMembers(item) {
      uni.navigateTo({
        url: `/pages/personal/userDetail/MemberManagement?groupId=${item.groupId}&groupName=${encodeURIComponent(item.groupName)}`
      });
    },
    
    addMember(item) {
      uni.navigateTo({
        url: `/pages/personal/userDetail/DataEdit?type=chat&mode=addMember&groupId=${item.groupId}`
      });
    },
    
    removeMember(group, member) {
      uni.showModal({
        title: '确认移除',
        content: `确定要将 ${member.nickName} 从群组中移除吗？`,
        success: (res) => {
          if (res.confirm) {
            this.performRemoveMember(group, member);
          }
        }
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
    
    async performRemoveMember(group, member) {
      uni.showLoading({ title: '移除中...' });
      try {
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/chat/removeMember',
            method: 'POST',
            data: { 
              groupId: group.groupId,
              userId: member.userId 
            },
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          uni.showToast({
            title: '移除成功',
            icon: 'success',
            duration: 1500
          });
          this.loadData();
        } else {
          throw new Error(result.data?.msg || '移除失败');
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '移除失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.hideLoading();
      }
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

/* 群成员区域 */
.members-section {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.members-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #1890ff;
}

.add-member-btn {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: #fff;
  border: none;
  border-radius: 8rpx;
  padding: 8rpx 16rpx;
  font-size: 22rpx;
}

.add-icon {
  width: 20rpx;
  height: 20rpx;
  margin-right: 6rpx;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.member-item {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 12rpx;
}

.member-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 24rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 2rpx;
}

.member-role {
  font-size: 20rpx;
  color: #666;
}

.remove-member-btn {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #ff4d4f;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-icon {
  width: 20rpx;
  height: 20rpx;
}

.more-members {
  text-align: center;
  padding: 12rpx;
}

.more-text {
  font-size: 22rpx;
  color: #666;
}
</style> 