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
            :src="localForm.groupAvatar || serverUrl + '/static/icons/group/default-group.png'" 
            mode="aspectFill" 
            class="avatar-img"
          />
          <view class="avatar-overlay" @tap="chooseAvatar">
            <image :src="serverUrl + '/static/icons/common/camera.png'" class="camera-icon" />
            <text class="change-text">更换头像</text>
          </view>
        </view>
        <text class="avatar-tip">点击更换群头像</text>
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
          v-model="localForm.groupDescription" 
          class="form-textarea" 
          placeholder="请输入群描述"
          maxlength="500"
          auto-height
          show-confirm-bar="false"
        />
      </view>
    </view>

    <!-- 群成员管理 -->
    <view class="config-section">
      <view class="section-header">
        <text class="section-title">群成员管理</text>
      </view>
      
      <view class="member-section" @tap="goToMemberManagement">
        <view class="member-info">
          <view class="member-count">
            <text class="count-number">{{ localForm.memberCount || 0 }}</text>
            <text class="count-label">人</text>
          </view>
          <text class="member-desc">当前群成员数量</text>
        </view>
        <view class="member-actions">
          <text class="action-text">管理成员</text>
          <image :src="serverUrl + '/static/icons/common/right.png'" class="action-arrow" />
        </view>
      </view>
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
        groupDescription: '',
        groupAvatar: '',
        memberCount: 0,
        groupId: ''
      }
    }
  },
  created() {
    this.setFormData(this.initialData)
  },
  methods: {
    getFormData() {
      return { ...this.localForm }
    },
    setFormData(data = {}) {
      this.localForm = {
        groupName: data.groupName || '',
        groupDescription: data.groupDescription || '',
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
              name: `groupImg_${Date.now()}`
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
        url: `/pages/personal/userDetail/components/GroupMemberManagement?groupId=${this.localForm.groupId}&groupName=${this.localForm.groupName}`
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.config-section {
  background: #ffffff;
  margin-top: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  border-radius: 16rpx;
}

.section-header {
  padding: 12rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.form-item {
  padding: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.form-item:last-child {
  border-bottom: none;
}

.form-item.description-item {
  padding-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #333333;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.required {
  color: #ff4d4f;
  margin-left: 4rpx;
}

.form-input {
  width: 100%;
  height: 64rpx;
  background: #f8f9fa;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  color: #333333;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  min-height: 120rpx;
  background: #f8f9fa;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 26rpx;
  color: #333333;
  box-sizing: border-box;
  line-height: 1.5;
}

.avatar-section {
  padding: 20rpx 20rpx 0;
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
  margin-bottom: 10rpx;
  border: 2rpx solid #e0e0e0;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.avatar-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 500;
  border-bottom-left-radius: 12rpx;
  border-bottom-right-radius: 12rpx;
}

.camera-icon {
  width: 32rpx;
  height: 32rpx;
  margin-bottom: 4rpx;
}

.avatar-tip {
  font-size: 24rpx;
  color: #95a5a6;
  text-align: center;
}

.member-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 20rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  margin-top: 20rpx;
}

.member-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.member-count {
  display: flex;
  align-items: baseline;
  font-size: 36rpx;
  font-weight: 700;
  color: #333333;
}

.count-number {
  font-size: 48rpx;
}

.count-label {
  font-size: 24rpx;
  color: #95a5a6;
}

.member-desc {
  font-size: 24rpx;
  color: #95a5a6;
  margin-top: 4rpx;
}

.member-actions {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #1890ff;
}

.action-text {
  margin-right: 8rpx;
}

.action-arrow {
  width: 32rpx;
  height: 32rpx;
  opacity: 0.6;
}
</style>
