<template>
    <view class="member-management">
      <!-- 头部信息 -->
      <view class="header-section">
        <view class="group-info">
          <image 
            :src="groupAvatar || serverUrl + '/static/icons/group/default-group.png'" 
            mode="aspectFill" 
            class="group-avatar"
          />
          <view class="group-details">
            <text class="group-name">{{ groupName }}</text>
            <text class="member-count">群成员 {{ memberList.length }} 人</text>
          </view>
        </view>
        <view class="add-member-btn" @tap="showAddMemberModal">
          <image :src="serverUrl + '/static/icons/common/add.png'" class="add-icon" />
          <text class="add-text">添加成员</text>
        </view>
      </view>
  
      <!-- 成员列表 -->
      <view class="member-list-section">
        <view class="section-header">
          <text class="section-title">群成员列表</text>
          <text class="section-subtitle">共 {{ memberList.length }} 人</text>
        </view>
        
        <view class="member-list">
          <view 
            class="member-item" 
            v-for="(member, index) in memberList" 
            :key="member.id"
          >
            <view class="member-info">
              <image 
                :src="serverUrl + (member.avatarUrl || '/static/icons/person/default-avatar.png')" 
                mode="aspectFill" 
                class="member-avatar"
              />
              <view class="member-details">
                <text class="member-name">{{ member.nickName }}</text>
                <text class="member-role">{{ getMemberRoleText(member.role) }}</text>
              </view>
            </view>
            
            <view class="member-actions">
              <view 
                class="remove-btn" 
                @tap="removeMember(member)"
                v-if="canRemoveMember(member)"
              >
                <image :src="serverUrl + '/static/icons/common/delete.png'" class="remove-icon" />
                <text class="remove-text">移除</text>
              </view>
            </view>
          </view>
        </view>
      </view>
  
      <!-- 添加成员弹窗 -->
      <view class="modal-overlay" v-if="showAddModal" @tap="hideAddMemberModal">
        <view class="add-member-modal" @tap.stop>
          <view class="modal-header">
            <text class="modal-title">添加群成员</text>
            <view class="close-btn" @tap="hideAddMemberModal">
              <image :src="serverUrl + '/static/icons/common/close.png'" class="close-icon" />
            </view>
          </view>
          
          <view class="modal-content">
            <view class="search-section">
              <input 
                class="search-input" 
                placeholder="搜索用户昵称或手机号" 
                v-model="searchKeyword"
                @input="onSearchInput"
              />
            </view>
            
            <view class="user-list">
              <view 
                class="user-item" 
                v-for="(user, index) in filteredUserList" 
                :key="user.id"
                @tap="toggleUserSelection(user)"
                :class="{ 'selected': selectedUsers.includes(user.id) }"
              >
                <view class="user-info">
                  <image 
                    :src="serverUrl + (user.avatarUrl || '/static/icons/person/default-avatar.png')" 
                    mode="aspectFill" 
                    class="user-avatar"
                  />
                  <view class="user-details">
                    <text class="user-name">{{ user.nickName }}</text>
                    <text class="user-phone">{{ user.phone || '未设置手机号' }}</text>
                  </view>
                </view>
                
                <view class="selection-indicator">
                  <view class="checkbox" :class="{ 'checked': selectedUsers.includes(user.id) }">
                    <image 
                      v-if="selectedUsers.includes(user.id)"
                      :src="serverUrl + '/static/icons/common/check.png'" 
                      class="check-icon"
                    />
                  </view>
                </view>
              </view>
            </view>
          </view>
          
          <view class="modal-footer">
            <button class="cancel-btn" @tap="hideAddMemberModal">取消</button>
            <button 
              class="confirm-btn" 
              @tap="addSelectedMembers"
              :disabled="selectedUsers.length === 0"
            >
              添加 {{ selectedUsers.length }} 人
            </button>
          </view>
        </view>
      </view>
    </view>
  </template>
  
  <script>
  export default {
    name: 'GroupMemberManagement',
    data() {
      return {
        serverUrl: 'http://192.168.2.244:3000',
        groupId: '',
        groupName: '',
        groupAvatar: '',
        memberList: [],
        userList: [],
        filteredUserList: [],
        searchKeyword: '',
        selectedUsers: [],
        showAddModal: false
      }
    },
    
    onLoad(options) {
      if (options.groupId) {
        this.groupId = options.groupId;
      }
      if (options.groupName) {
        this.groupName = options.groupName;
      }
      
      this.loadGroupInfo();
      this.loadMemberList();
      this.loadUserList();
    },
    
    methods: {
      // 加载群信息
      async loadGroupInfo() {
        try {
          const res = await new Promise((resolve, reject) => {
            uni.request({
              url: this.serverUrl + '/group/getById',
              method: 'POST',
              data: { groupId: this.groupId },
              success: resolve,
              fail: reject
            });
          });
          
          if (res.data?.code === 200 && res.data.data) {
            const groupInfo = res.data.data;
            this.groupAvatar = groupInfo.groupAvatar;
          }
        } catch (err) {
          console.error('加载群信息失败:', err);
        }
      },
      
      // 加载群成员列表
      async loadMemberList() {
        try {
          uni.showLoading({ title: '加载中...' });
          
          const res = await new Promise((resolve, reject) => {
            uni.request({
              url: this.serverUrl + '/group/getMembers',
              method: 'POST',
              data: { groupId: this.groupId },
              success: resolve,
              fail: reject
            });
          });
          
          if (res.data?.code === 200 && res.data.data) {
            this.memberList = res.data.data;
          } else {
            throw new Error('获取群成员失败');
          }
        } catch (err) {
          console.error('加载群成员失败:', err);
          uni.showToast({
            title: '加载群成员失败',
            icon: 'none',
            duration: 2000
          });
        } finally {
          uni.hideLoading();
        }
      },
      
      // 加载用户列表
      async loadUserList() {
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
            // 过滤掉已经是群成员的用户
            this.userList = res.data.data.filter(user => 
              !this.memberList.some(member => member.id === user.id)
            );
            this.filteredUserList = [...this.userList];
          }
        } catch (err) {
          console.error('加载用户列表失败:', err);
        }
      },
      
      // 获取成员角色文本
      getMemberRoleText(role) {
        const roleMap = {
          'owner': '群主',
          'admin': '管理员',
          'member': '成员'
        };
        return roleMap[role] || '成员';
      },
      
      // 检查是否可以移除成员
      canRemoveMember(member) {
        // 这里可以根据实际权限逻辑判断
        return true;
      },
      
      // 移除群成员
      async removeMember(member) {
        uni.showModal({
          title: '确认移除',
          content: `确定要将 ${member.nickName} 移出群聊吗？`,
          success: async (res) => {
            if (res.confirm) {
              try {
                uni.showLoading({ title: '移除中...' });
                
                const response = await new Promise((resolve, reject) => {
                  uni.request({
                    url: this.serverUrl + '/group/removeMember',
                    method: 'POST',
                    data: {
                      groupId: this.groupId,
                      userId: member.id
                    },
                    success: resolve,
                    fail: reject
                  });
                });
                
                if (response.data?.code === 200) {
                  // 从本地列表中移除
                  this.memberList = this.memberList.filter(m => m.id !== member.id);
                  
                  // 重新加载用户列表
                  this.loadUserList();
                  
                  uni.showToast({
                    title: '移除成功',
                    icon: 'success',
                    duration: 1500
                  });
                } else {
                  throw new Error(response.data?.msg || '移除失败');
                }
              } catch (err) {
                console.error('移除成员失败:', err);
                uni.showToast({
                  title: err.message || '移除失败，请重试',
                  icon: 'none',
                  duration: 2000
                });
              } finally {
                uni.hideLoading();
              }
            }
          }
        });
      },
      
      // 显示添加成员弹窗
      showAddMemberModal() {
        this.showAddModal = true;
        this.selectedUsers = [];
        this.searchKeyword = '';
        this.filteredUserList = [...this.userList];
      },
      
      // 隐藏添加成员弹窗
      hideAddMemberModal() {
        this.showAddModal = false;
      },
      
      // 搜索输入
      onSearchInput() {
        this.filterUserList();
      },
      
      // 过滤用户列表
      filterUserList() {
        if (!this.searchKeyword.trim()) {
          this.filteredUserList = [...this.userList];
          return;
        }
        
        const keyword = this.searchKeyword.toLowerCase().trim();
        this.filteredUserList = this.userList.filter(user => {
          const name = (user.nickName || '').toLowerCase();
          const phone = (user.phone || '').toLowerCase();
          return name.includes(keyword) || phone.includes(keyword);
        });
      },
      
      // 切换用户选择状态
      toggleUserSelection(user) {
        const index = this.selectedUsers.indexOf(user.id);
        if (index > -1) {
          this.selectedUsers.splice(index, 1);
        } else {
          this.selectedUsers.push(user.id);
        }
      },
      
      // 添加选中的成员
      async addSelectedMembers() {
        if (this.selectedUsers.length === 0) {
          uni.showToast({
            title: '请选择要添加的成员',
            icon: 'none'
          });
          return;
        }
        
        try {
          uni.showLoading({ title: '添加中...' });
          
          const res = await new Promise((resolve, reject) => {
            uni.request({
              url: this.serverUrl + '/group/addMembers',
              method: 'POST',
              data: {
                groupId: this.groupId,
                userIds: this.selectedUsers
              },
              success: resolve,
              fail: reject
            });
          });
          
          if (res.data?.code === 200) {
            // 重新加载成员列表
            await this.loadMemberList();
            
            // 重新加载用户列表
            await this.loadUserList();
            
            uni.showToast({
              title: '添加成功',
              icon: 'success',
              duration: 1500
            });
            
            this.hideAddMemberModal();
          } else {
            throw new Error(res.data?.msg || '添加失败');
          }
        } catch (err) {
          console.error('添加成员失败:', err);
          uni.showToast({
            title: err.message || '添加失败，请重试',
            icon: 'none',
            duration: 2000
          });
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
    background: #f5f5f5;
    padding-bottom: 40rpx;
  }
  
  /* 头部信息 */
  .header-section {
    background: #ffffff;
    padding: 30rpx 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1rpx solid #f0f0f0;
  }
  
  .group-info {
    display: flex;
    align-items: center;
  }
  
  .group-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    margin-right: 20rpx;
    background: #f0f0f0;
  }
  
  .group-details {
    display: flex;
    flex-direction: column;
  }
  
  .group-name {
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
    margin-bottom: 8rpx;
  }
  
  .member-count {
    font-size: 24rpx;
    color: #666666;
    font-weight: 400;
  }
  
  .add-member-btn {
    display: flex;
    align-items: center;
    background: #1890ff;
    color: #ffffff;
    padding: 16rpx 24rpx;
    border-radius: 24rpx;
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.95);
      background: #096dd9;
    }
  }
  
  .add-icon {
    width: 24rpx;
    height: 24rpx;
    margin-right: 8rpx;
  }
  
  .add-text {
    font-size: 24rpx;
    font-weight: 500;
  }
  
  /* 成员列表 */
  .member-list-section {
    background: #ffffff;
    margin: 20rpx 0;
  }
  
  .section-header {
    padding: 20rpx 24rpx;
    border-bottom: 1rpx solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
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
  }
  
  .member-list {
    padding: 0;
  }
  
  .member-item {
    padding: 20rpx 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .member-info {
    display: flex;
    align-items: center;
  }
  
  .member-avatar {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    margin-right: 20rpx;
    background: #f0f0f0;
  }
  
  .member-details {
    display: flex;
    flex-direction: column;
  }
  
  .member-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #333333;
    margin-bottom: 8rpx;
  }
  
  .member-role {
    font-size: 22rpx;
    color: #1890ff;
    background: #e6f7ff;
    padding: 4rpx 12rpx;
    border-radius: 10rpx;
    width: fit-content;
  }
  
  .member-actions {
    display: flex;
    align-items: center;
  }
  
  .remove-btn {
    display: flex;
    align-items: center;
    padding: 8rpx 16rpx;
    border-radius: 16rpx;
    background: #fff2f0;
    border: 1rpx solid #ffccc7;
    transition: all 0.3s ease;
    
    &:active {
      background: #ffebe8;
    }
  }
  
  .remove-icon {
    width: 20rpx;
    height: 20rpx;
    margin-right: 8rpx;
  }
  
  .remove-text {
    font-size: 22rpx;
    color: #ff4d4f;
    font-weight: 500;
  }
  
  /* 添加成员弹窗 */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .add-member-modal {
    width: 90%;
    max-height: 80vh;
    background: #ffffff;
    border-radius: 20rpx;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .modal-header {
    padding: 30rpx 24rpx;
    border-bottom: 1rpx solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .modal-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
  }
  
  .close-btn {
    padding: 8rpx;
  }
  
  .close-icon {
    width: 32rpx;
    height: 32rpx;
    opacity: 0.6;
  }
  
  .modal-content {
    flex: 1;
    overflow-y: auto;
  }
  
  .search-section {
    padding: 20rpx 24rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }
  
  .search-input {
    width: 100%;
    height: 64rpx;
    background: #f8f9fa;
    border: 1rpx solid #e0e0e0;
    border-radius: 32rpx;
    padding: 0 24rpx;
    font-size: 26rpx;
    color: #333333;
    box-sizing: border-box;
  }
  
  .user-list {
    padding: 0;
  }
  
  .user-item {
    padding: 20rpx 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1rpx solid #f5f5f5;
    transition: background-color 0.3s ease;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:active {
      background: #f8f9fa;
    }
    
    &.selected {
      background: #e6f7ff;
    }
  }
  
  .user-info {
    display: flex;
    align-items: center;
  }
  
  .user-avatar {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    margin-right: 16rpx;
    background: #f0f0f0;
  }
  
  .user-details {
    display: flex;
    flex-direction: column;
  }
  
  .user-name {
    font-size: 26rpx;
    font-weight: 600;
    color: #333333;
    margin-bottom: 6rpx;
  }
  
  .user-phone {
    font-size: 22rpx;
    color: #666666;
    font-weight: 400;
  }
  
  .selection-indicator {
    display: flex;
    align-items: center;
  }
  
  .checkbox {
    width: 32rpx;
    height: 32rpx;
    border: 2rpx solid #d9d9d9;
    border-radius: 6rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    &.checked {
      background: #1890ff;
      border-color: #1890ff;
    }
  }
  
  .check-icon {
    width: 20rpx;
    height: 20rpx;
  }
  
  /* 弹窗底部 */
  .modal-footer {
    padding: 20rpx 24rpx;
    border-top: 1rpx solid #f0f0f0;
    display: flex;
    gap: 20rpx;
  }
  
  .cancel-btn {
    flex: 1;
    height: 72rpx;
    background: #f5f5f5;
    color: #666666;
    border: none;
    border-radius: 36rpx;
    font-size: 28rpx;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:active {
      background: #e8e8e8;
    }
  }
  
  .confirm-btn {
    flex: 1;
    height: 72rpx;
    background: #1890ff;
    color: #ffffff;
    border: none;
    border-radius: 36rpx;
    font-size: 28rpx;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:active {
      background: #096dd9;
    }
    
    &:disabled {
      background: #d9d9d9;
      color: #999999;
    }
  }
</style>