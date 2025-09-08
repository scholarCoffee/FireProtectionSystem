<template>
  <view class="member-management">
    <!-- 头部信息 -->
    <view class="header-section">
      <view class="group-info">
        <image 
          :src="serverUrl + (groupAvatar || '/group/group.png')" 
          mode="aspectFill" 
          class="group-avatar"
        />
        <view class="group-details">
          <text class="group-name">{{ groupName }}</text>
          <text class="member-count">群成员管理 ({{ groupMembers.length }}/{{ allUsers.length }})</text>
        </view>
      </view>
    </view>

    <!-- 搜索区域 -->
    <view class="search-section">
      <view class="search-container">
        <input 
          class="search-input" 
          placeholder="搜索用户昵称或手机号" 
          v-model="searchKeyword"
          @input="onSearchInput"
        />
      </view>
    </view>

    <!-- 用户列表 -->
    <view class="user-list-section">
      <view class="section-header">
        <text class="section-title">用户列表</text>
        <text class="section-subtitle">共 {{ filteredUsers.length }} 个用户</text>
      </view>
      
      <scroll-view 
        class="user-list-scroll" 
        scroll-y 
        enhanced
        :show-scrollbar="false"
        :bounces="true"
        :style="{height: '1000rpx'}"
      >
        <view class="user-list">
          <view 
            class="user-item" 
            v-for="(user, index) in filteredUsers" 
            :key="user.id"
          >
            <view class="user-info">
              <image 
                :src="serverUrl + (user.avatarUrl || '/user/person-avatar.png')" 
                mode="aspectFill" 
                class="user-avatar"
              />
              <view class="user-details">
                <text class="user-name">{{ user.nickName }}</text>
                <text class="user-phone">{{ user.phone || '未设置手机号' }}</text>
                <text class="user-status" :class="{ 'in-group': isGroupMember(user.userId) }">
                  {{ isGroupMember(user.userId) ?  isCurrentUser(user.userId) ? '本人' : '群成员' : '非群成员' }}
                </text>
              </view>
            </view>
            
            <view class="user-actions">
              <button 
                v-if="!isCurrentUser(user.userId)"
                class="member-btn"
                :class="{ 'member-btn-active': isGroupMember(user.userId) }"
                @tap="onMemberAction(user)"
              >
                {{ isGroupMember(user.userId) ? '移出群组' : '加入群组' }}
              </button>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 空状态 -->
    <view v-if="searchKeyword && filteredUsers.length === 0" class="empty-state">
      <image :src="serverUrl + '/static/icons/common/no-data.png'" class="empty-icon" />
      <text class="empty-text">未找到相关用户</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'GroupMemberManagement',
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space',
      groupId: '',
      groupName: '',
      groupAvatar: '',
      searchKeyword: '',
      allUsers: [], // 所有用户
      groupMembers: [], // 群成员
      filteredUsers: [], // 过滤后的用户
      currentUserId: '' // 当前用户ID
    }
  },
  
  onLoad(options) {
    if (options.groupId) {
      this.groupId = options.groupId;
    }
    if (options.groupName) {
      this.groupName = options.groupName;
    }
    
    // 获取当前用户信息
    this.getCurrentUser();
    
    this.loadGroupInfo();
    this.loadData();
  },
  
  methods: {
    // 获取当前用户信息
    getCurrentUser() {
      try {
        // 从本地存储获取用户信息
        const userInfo = uni.getStorageSync('userInfo');
        if (userInfo && userInfo.userId) {
          this.currentUserId = userInfo.userId;
        }
      } catch (err) {
        console.error('获取当前用户信息失败:', err);
      }
    },
    
    // 判断是否为当前用户
    isCurrentUser(userId) {
      return this.currentUserId && this.currentUserId === userId;
    },
    
    // 加载群信息
    async loadGroupInfo() {
      try {
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/group/detail',
            method: 'GET',
            data: { groupId: this.groupId },
            success: resolve,
            fail: reject
          });
        });
        
        if (res.data?.code === 200 && res.data.data) {
          const groupInfo = res.data.data;
          this.groupAvatar = groupInfo.groupAvatar;
          this.groupMembers = groupInfo.members || [];
        }
      } catch (err) {
        console.error('加载群信息失败:', err);
      }
    },
    
    // 加载数据
    async loadData() {
      try {
        uni.showLoading({ title: '加载中...' });
        
        // 并行加载群成员和所有用户
        const allUsersRes = await this.loadAllUsers()
        this.allUsers = allUsersRes || [];
        
        // 初始过滤
        this.filterUsers();
        
      } catch (err) {
        console.error('加载数据失败:', err);
        uni.showToast({
          title: '加载数据失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 加载所有用户
    async loadAllUsers() {
      try {
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/user/list',
            method: 'GET',
            data: {},
            success: resolve,
            fail: reject
          });
        });
        
        if (res.data?.code === 200 && res.data.data) {
          return res.data.data.map(user => {
            if (user.avatarUrl) {
              user.avatarUrl = user.avatarUrl.includes('https') ? '/user/person-avatar.png' : user.avatarUrl
            }
            return user;
          });
        } else {
          throw new Error('获取用户列表失败');
        }
      } catch (err) {
        console.error('加载用户列表失败:', err);
        return [];
      }
    },
    
    // 搜索输入
    onSearchInput() {
      this.filterUsers();
    },
    
    // 过滤用户
    filterUsers() {
      if (!this.searchKeyword.trim()) {
        this.filteredUsers = [...this.allUsers];
        return;
      }
      
      const keyword = this.searchKeyword.toLowerCase().trim();
      this.filteredUsers = this.allUsers.filter(user => {
        const name = (user.nickName || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        return name.includes(keyword) || phone.includes(keyword);
      });
    },
    
    // 判断是否为群成员
    isGroupMember(userId) {
      return this.groupMembers.some(member => member.userId === userId);
    },
    
    // 成员操作
    async onMemberAction(user) {
      // 再次确认不是当前用户
      if (this.isCurrentUser(user.userId)) {
        uni.showToast({
          title: '不能对自己进行操作',
          icon: 'none'
        });
        return;
      }
      
      const isMember = this.isGroupMember(user.userId);
      const action = isMember ? '移出' : '加入';
      
      // 显示确认对话框
      const confirmResult = await this.showConfirmDialog(
        '确认操作',
        `确定要将 ${user.nickName} ${action}群组吗？`
      );
      
      if (!confirmResult) {
        return;
      }
      
      try {
        if (isMember) {
          // 移出群组
          await this.removeFromGroup(user);
        } else {
          // 加入群组
          await this.addToGroup(user);
        }
      } catch (err) {
        console.error('操作失败:', err);
      }
    },
    
    // 显示确认对话框
    showConfirmDialog(title, content) {
      return new Promise((resolve) => {
        uni.showModal({
          title: title,
          content: content,
          success: (res) => {
            resolve(res.confirm);
          },
          fail: () => {
            resolve(false);
          }
        });
      });
    },
    
    // 添加用户到群组
    async addToGroup(user) {
      try {
        uni.showLoading({ title: '添加中...' });
        
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/group/addMember',
            method: 'POST',
            data: {
              groupId: this.groupId,
              userInfo: [{
                ...user
              }]
            },
            success: resolve,
            fail: reject
          });
        });
        
        if (res.data?.code === 200) {
          // 添加到本地群成员列表
          this.groupMembers.push(user);
          
          uni.showToast({
            title: '添加成功',
            icon: 'success',
            duration: 1500
          });
        } else {
          throw new Error(res.data?.msg || '添加失败');
        }
      } catch (err) {
        console.error('添加用户失败:', err);
        uni.showToast({
          title: err.message || '添加失败，请重试',
          icon: 'none',
          duration: 2000
        });
        throw err;
      } finally {
        uni.hideLoading();
      }
    },
    
    // 从群组移除用户
    async removeFromGroup(user) {
      try {
        uni.showLoading({ title: '移除中...' });
        
        const response = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/group/removeMember',
            method: 'POST',
            data: {
              groupId: this.groupId,
              userInfo: [{
                ...user
              }]
            },
            success: resolve,
            fail: reject
          });
        });
        
        if (response.data?.code === 200) {
          // 从本地群成员列表中移除
          this.groupMembers = this.groupMembers.filter(member => member.id !== user.id);
          
          uni.showToast({
            title: '移除成功',
            icon: 'success',
            duration: 1500
          });
          this.loadGroupInfo();
        } else {
          throw new Error(response.data?.msg || '移除失败');
        }
      } catch (err) {
        console.error('移除用户失败:', err);
        uni.showToast({
          title: err.message || '移除失败，请重试',
          icon: 'none',
          duration: 2000
        });
        throw err;
      } finally {
        uni.hideLoading();
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.member-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faff 0%, #e6f7ff 100%);
  padding-bottom: 40rpx;
}

/* 头部信息 */
.header-section {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  padding: 40rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 200rpx;
    height: 200rpx;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: float 6s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -10%;
    width: 150rpx;
    height: 150rpx;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 50%;
    animation: float 8s ease-in-out infinite reverse;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20rpx) rotate(180deg); }
}

.group-info {
  display: flex;
  align-items: center;
  z-index: 1;
}

.group-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background: #f0f0f0;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.group-details {
  display: flex;
  flex-direction: column;
}

.group-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.member-count {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* 搜索区域 */
.search-section {
  background: #ffffff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  padding: 24rpx;
}

.search-container {
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  height: 72rpx;
  background: #fafbfc;
  border: 2rpx solid #e6f7ff;
  border-radius: 36rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: #333333;
  box-sizing: border-box;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 6rpx rgba(24, 144, 255, 0.1);
    outline: none;
  }
  
  &::placeholder {
    color: #999999;
  }
}

/* 用户列表 */
.user-list-section {
  background: #ffffff;
  margin: 0 24rpx 24rpx 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.section-header {
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #fafbfc 0%, #f0f8ff 100%);
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.section-subtitle {
  font-size: 24rpx;
  color: #666666;
  font-weight: 400;
  background: rgba(24, 144, 255, 0.1);
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  color: #1890ff;
}

.user-list-scroll {
  min-height: 600rpx;
  max-height: 1000rpx;
  overflow-y: auto;
}

.user-list {
  padding: 0;
}

.user-item {
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #f5f5f5;
  transition: all 0.3s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #fafbfc;
    transform: translateX(4rpx);
  }
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.user-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background: #f0f0f0;
  border: 2rpx solid #e6f7ff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.user-details {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.user-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8rpx;
}

.user-phone {
  font-size: 22rpx;
  color: #666666;
  font-weight: 400;
  margin-bottom: 6rpx;
}

.user-status {
  font-size: 20rpx;
  color: #999999;
  font-weight: 400;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
  width: fit-content;
  
  &.in-group {
    color: #1890ff;
    background: rgba(24, 144, 255, 0.1);
  }
}

.user-actions {
  display: flex;
  align-items: center;
  margin-left: 20rpx;
}

.member-btn {
  padding: 16rpx 32rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 600;
  border: none;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
  color: #1890ff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.15);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.5s;
  }
  
  &.member-btn-active {
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
    color: #ffffff;
    box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.3);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: scale(0.95);
    box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.2);
  }
  
  &:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.25);
  }
}

/* 空状态 */
.empty-state {
  background: #ffffff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  padding: 80rpx 24rpx;
  text-align: center;
  color: #999999;
}

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
  font-weight: 400;
}

/* 响应式设计 */
@media (max-width: 750rpx) {
  .header-section {
    padding: 30rpx 20rpx;
  }
  
  .group-name {
    font-size: 32rpx;
  }
  
  .search-section, .user-list-section, .empty-state {
    margin: 16rpx 20rpx;
  }
  
  .user-item {
    padding: 20rpx;
  }
  
  .user-actions {
    margin-left: 16rpx;
  }
}
</style>
