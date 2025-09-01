<template>
  <view class="chat-form">
    <!-- 群基本信息 -->
    <view class="config-section">
      <view class="section-header">
        <text class="section-title">群基本信息</text>
      </view>
      
      <!-- 群头像 -->
      <view class="avatar-section">
        <view class="current-avatar">
          <image 
            :src="serverUrl + localForm.groupAvatar || '/static/icons/group/default-group.png'" 
            mode="aspectFill" 
            class="avatar-img"
          />
          <view class="avatar-overlay" @tap="chooseAvatar">
            <image :src="serverUrl + '/static/icons/common/camera.png'" class="camera-icon" />
            <text class="change-text">更换头像</text>
          </view>
        </view>
      </view>
      
      <view class="form-item">
        <text class="form-label">群名称 <text class="required">*</text></text>
        <input 
          v-model="localForm.groupName" 
          class="form-input" 
          placeholder="请输入群名称"
          maxlength="50"
          @input="onGroupNameInput"
        />
      </view>
        
      <view class="form-item description-item">
        <text class="form-label">群描述</text>
        <textarea 
          v-model="localForm.description" 
          class="form-textarea" 
          placeholder="请输入群描述"
          maxlength="500"
          auto-height
          show-confirm-bar="false"
        />
      </view>
    </view>

    <!-- 群成员一行 -->
    <view class="row-section member-row">
      <view class="row-left">
        <text class="row-title">群成员</text>
        <text class="member-count">共{{ localForm.memberCount || 0 }}人</text>
      </view>
      <view class="row-right">
        <button class="manage-btn" size="mini" @tap="goToMemberManagement">管理成员</button>
      </view>
    </view>

    <!-- 聊天记录一行 -->
    <view class="row-section chat-row">
      <view class="row-left">
        <text class="row-title">群聊天记录</text>
      </view>
      <view class="row-right">
        <button class="collapse-btn" size="mini" @tap="toggleChatCollapse">{{ chatCollapsed ? '展开' : '收起' }}</button>
      </view>
    </view>
    <view class="chat-records-section" v-show="!chatCollapsed">
      <view class="search-bar">
        <input class="search-input" v-model="searchKeyword" placeholder="搜索聊天记录" @confirm="onSearch" />
        <button class="search-btn" size="mini" @tap="onSearch">搜索</button>
      </view>
      <scroll-view 
        class="chat-records-scroll" 
        scroll-y 
        enhanced
        :show-scrollbar="false"
        :bounces="true"
        :style="{height: '600rpx'}"
        @scrolltolower="loadMoreChatRecords"
      >
        <view v-for="(record, index) in chatRecords" :key="record.id" class="chat-item">
          <view class="chat-avatar">
            <image 
              :src="serverUrl + (record.senderAvatar || '/static/icons/person/default-avatar.png')" 
              mode="aspectFill" 
              class="avatar-img"
            />
          </view>
          <view class="chat-content">
            <view class="chat-header">
              <text class="sender-name">{{ record.senderName }}</text>
              <text class="chat-time">{{ formatTime(record.createTime) }}</text>
            </view>
            <view class="chat-message">
              <text class="message-text">{{ record.content }}</text>
            </view>
          </view>
        </view>
        <view v-if="chatRecords.length === 0" class="empty-state">
          <image :src="serverUrl + '/static/icons/common/no-data.png'" class="empty-icon" />
        </view>
        <view v-if="loadingMore" class="loading-more">加载中...</view>
        <view v-if="noMore" class="no-more">没有更多了</view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ChatForm',
  props: {
    serverUrl: {
      type: String,
      required: true
    },
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      localForm: {
        groupName: '',
        description: '',
        groupAvatar: '',
        memberCount: 0,
        groupId: ''
      },
      chatRecords: [],
      page: 1,
      pageSize: 30,
      loadingMore: false,
      noMore: false,
      searchKeyword: '',
      chatCollapsed: false
    }
  },
  created() {
    this.setFormData(this.initialData)
    this.loadChatRecords(true)
  },
  methods: {
    getFormData() {
      return { ...this.localForm }
    },
    setFormData(data = {}) {
      this.localForm = {
        groupName: data.groupName || '',
        description: data.description || '',
        groupAvatar: data.groupAvatar || '',
        memberCount: data.memberCount || 0,
        groupId: data.groupId || ''
      }
    },
    validate() {
      if (!this.localForm.groupName || !String(this.localForm.groupName).trim()) {
        uni.showToast({ title: '请输入群名称', icon: 'none' })
        return false
      }
      return true
    },
    onGroupNameInput(e) {
      this.localForm.groupName = e.detail.value
    },
    // 加载聊天记录，支持分页和搜索
    async loadChatRecords(reset = false) {
      if (!this.localForm.groupId) {
        return;
      }
      if (reset) {
        this.page = 1;
        this.noMore = false;
        this.chatRecords = [];
      }
      if (this.loadingMore || this.noMore) return;
      this.loadingMore = true;
      try {
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/chat/getGroupMsg',
            method: 'POST',
            data: {
              groupId: this.localForm.groupId,
              limit: this.pageSize,
              page: this.page,
              keyword: this.searchKeyword
            },
            success: resolve,
            fail: reject
          });
        });
        if (res.data?.code === 200 && Array.isArray(res.data.data)) {
          const list = res.data.data;
          if (list.length < this.pageSize) this.noMore = true;
          this.chatRecords = this.page === 1 ? list : this.chatRecords.concat(list);
          this.page++;
        } else {
          if (this.page === 1) this.chatRecords = [];
          this.noMore = true;
        }
      } catch (err) {
        console.error('加载聊天记录失败:', err);
        if (this.page === 1) this.chatRecords = [];
        this.noMore = true;
      } finally {
        this.loadingMore = false;
      }
    },
    loadMoreChatRecords() {
      this.loadChatRecords();
    },
    onSearch() {
      this.loadChatRecords(true);
    },
    toggleChatCollapse() {
      this.chatCollapsed = !this.chatCollapsed;
      if (!this.chatCollapsed && this.chatRecords.length === 0) {
        this.loadChatRecords(true);
      }
    },
    formatTime(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      if (diff < 1000 * 60) {
        return '刚刚';
      } else if (diff < 1000 * 60 * 60) {
        return Math.floor(diff / (1000 * 60)) + '分钟前';
      } else if (diff < 1000 * 60 * 60 * 24) {
        return Math.floor(diff / (1000 * 60 * 60)) + '小时前';
      } else {
        const date = new Date(timestamp);
        return date.getMonth() + 1 + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();
      }
    },
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.uploadAvatar(tempFilePath);
        },
        fail: (err) => {
          console.error('选择图片失败:', err);
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      });
    },
    async uploadAvatar(tempFilePath) {
      try {
        uni.showLoading({ title: '上传中...' });
        const res = await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: this.serverUrl + '/files/upload',
            filePath: tempFilePath,
            name: 'file',
            formData: {
              id: this.localForm.groupId || 'temp',
              url: '/uploadImg/groupImg',
              name: groupImg_
            },
            success: resolve,
            fail: reject
          });
        });
        if (res.data) {
          const data = JSON.parse(res.data);
          if (data.code === 200) {
            this.localForm.groupAvatar = data.data;
            uni.showToast({
              title: '头像上传成功',
              icon: 'success'
            });
          } else {
            throw new Error(data.msg || '上传失败');
          }
        } else {
          throw new Error('上传失败');
        }
      } catch (err) {
        console.error('上传头像失败:', err);
        uni.showToast({
          title: err.message || '上传失败，请重试',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    goToMemberManagement() {
      if (!this.localForm.groupId) {
        uni.showToast({
          title: '请先保存群信息',
          icon: 'none'
        });
        return;
      }
      uni.navigateTo({
        url: '/pages/personal/userDetail/components/GroupMemberManagement?groupId=' + this.localForm.groupId + '&groupName=' + this.localForm.groupName
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-form {
  background: linear-gradient(135deg, #f8faff 0%, #e6f7ff 100%);
  min-height: 100vh;
  padding-bottom: 40rpx;
}

/* 群基本信息样式补充 */
.config-section {
  background: #ffffff;
  margin: 20rpx 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  border-radius: 16rpx;
}
.section-header {
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: linear-gradient(135deg, #fafbfc 0%, #f0f8ff 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}
.form-item {
  padding: 24rpx;
  transition: all 0.3s ease;
  &:last-child { border-bottom: none; }
  &:hover { background: #fafbfc; }
}
.form-item.description-item { padding-bottom: 30rpx; }
.form-label {
  display: block;
  font-size: 26rpx;
  color: #333333;
  margin-bottom: 12rpx;
  font-weight: 500;
}
.required { color: #ff4d4f; margin-left: 4rpx; }
.form-input {
  width: 100%;
  height: 72rpx;
  background: linear-gradient(135deg, #fafbff 0%, #ffffff 100%);
  border: 2rpx solid #e6f7ff;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  color: #333333;
  box-sizing: border-box;
  transition: all 0.3s ease;
  &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 6rpx rgba(24, 144, 255, 0.1);
    outline: none;
  }
}
.form-textarea {
  width: 100%;
  min-height: 120rpx;
  background: linear-gradient(135deg, #fafbff 0%, #ffffff 100%);
  border: 2rpx solid #e6f7ff;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 26rpx;
  color: #333333;
  box-sizing: border-box;
  line-height: 1.5;
  transition: all 0.3s ease;
  &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 6rpx rgba(24, 144, 255, 0.1);
    outline: none;
  }
}
.avatar-section {
  padding: 24rpx 24rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
}
.current-avatar {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
  border: 3rpx solid #e6f7ff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  &:hover { transform: scale(1.05); box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15); }
}
/* 避免与聊天头像冲突，限定当前头像下的图片尺寸 */
.current-avatar .avatar-img { width: 100%; height: 100%; }
.avatar-overlay {
  position: absolute;
  bottom: 0; left: 0; width: 100%; height: 40rpx;
  background: rgba(0, 0, 0, 0.6);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #ffffff; font-size: 20rpx; font-weight: 500;
  border-bottom-left-radius: 12rpx;
  border-bottom-right-radius: 12rpx;
  transition: all 0.3s ease;
  &:active { background: rgba(0, 0, 0, 0.8); }
}
.camera-icon { width: 32rpx; height: 32rpx; margin-bottom: 4rpx; }
.change-text { font-size: 20rpx; }
.avatar-tip { font-size: 22rpx; color: #999; }

.row-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  margin: 20rpx 24rpx 0 24rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}
.row-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-right: 16rpx;
}
.member-count {
  font-size: 26rpx;
  color: #1890ff;
  margin-left: 8rpx;
}
.manage-btn {
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
  color: #fff;
  display: flex;
  border: none;
  border-radius: 24rpx;
  font-size: 26rpx;
  padding: 0 32rpx;
  height: 48rpx;
  line-height: 48rpx;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.08);
}
.collapse-btn {
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
  color: #fff;
  border: none;
  border-radius: 24rpx;
  font-size: 26rpx;
  padding: 0 32rpx;
  height: 48rpx;
  line-height: 48rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}
.chat-records-section {
  background: #fff;
  margin: 0 24rpx 24rpx 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  padding-bottom: 24rpx;
}
.search-bar {
  display: flex;
  align-items: center;
  padding: 24rpx 24rpx 0 24rpx;
}
.search-input {
  flex: 1;
  height: 56rpx;
  border: 2rpx solid #e6f7ff;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  background: #fafbff;
  margin-right: 16rpx;
}
.search-btn {
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 26rpx;
  padding: 0 32rpx;
  height: 56rpx;
  line-height: 56rpx;
}
.chat-records-scroll {
  min-height: 300rpx;
  max-height: 600rpx;
  overflow-y: auto;
}
.chat-item {
  padding: 24rpx;
  display: flex;
  align-items: flex-start;
  border-bottom: 1rpx solid #f5f5f5;
  transition: all 0.3s ease;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: #fafbfc;
  }
}
.chat-avatar {
  margin-right: 16rpx;
  flex-shrink: 0;
}
/* 聊天记录头像使用更具体的选择器，避免影响群头像 */
.chat-avatar .avatar-img {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #f0f0f0;
  border: 2rpx solid #e6f7ff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}
.chat-content {
  flex: 1;
  min-width: 0;
}
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.sender-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
}
.chat-time {
  font-size: 22rpx;
  color: #999999;
  font-weight: 400;
}
.chat-message {
  background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #e6f7ff;
}
.message-text {
  font-size: 26rpx;
  color: #333333;
  line-height: 1.5;
  word-break: break-all;
}
.empty-state {
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
.loading-more, .no-more {
  text-align: center;
  color: #999;
  padding: 20rpx 0;
  font-size: 24rpx;
}
@media (max-width: 750rpx) {
  .row-section, .chat-records-section {
    margin: 16rpx 20rpx;
  }
  .chat-item {
    padding: 20rpx;
  }
}
</style>
