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
            :src="serverUrl + localForm.groupAvatar || '/group/group.png'" 
            mode="aspectFill" 
            class="avatar-img"
          />
          <view class="avatar-overlay" @tap="chooseAvatar">
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

    
  </view>
</template>
<script>
import { withDatedPath } from '@/commons/js/utils.js'
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
      }
    }
  },
  async created() {
    this.setFormData(this.initialData)
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
              url: withDatedPath('/uploadImg/groupImg'),
              name: 'groupImg_' + this.localForm.groupId + Math.ceil(Math.random()*10),
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
  height: 100vh;
  padding-bottom: 0;
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
</style>
