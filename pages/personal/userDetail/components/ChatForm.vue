<template>
  <view class="chat-form">
    <!-- 聊天基本信息 -->
    <view class="config-section">
      <view class="section-header">
        <text class="section-title">聊天信息</text>
      </view>
      
      <view class="form-item">
        <text class="form-label">聊天名称 <text class="required">*</text></text>
        <input 
          v-model="formData.chatName" 
          class="form-input" 
          placeholder="请输入聊天名称"
          maxlength="50"
          @input="onChatNameInput"
        />
      </view>
        
      <view class="form-item">
        <text class="form-label">聊天类型</text>
        <picker 
          :value="formData.chatType - 1" 
          :range="chatTypeOptions" 
          range-key="label"
          @change="onChatTypeChange"
          class="form-picker"
        >
          <view class="picker-display">
            <text class="picker-text">{{ getChatTypeText(formData.chatType) }}</text>
            <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
          </view>
        </picker>
      </view>
        
      <view class="form-item description-item">
        <text class="form-label">聊天描述</text>
        <textarea 
          v-model="formData.chatDescription" 
          class="form-textarea" 
          placeholder="请输入聊天描述"
          maxlength="500"
          auto-height
          show-confirm-bar="false"
        />
      </view>
          
      <view class="form-item">
        <text class="form-label">状态</text>
        <picker 
          :value="formData.chatStatus - 1" 
          :range="chatStatusOptions" 
          range-key="label"
          @change="onChatStatusChange"
          class="form-picker"
        >
          <view class="picker-display">
            <text class="picker-text">{{ getChatStatusText(formData.chatStatus) }}</text>
            <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
          </view>
        </picker>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ChatForm',
  props: {
    formData: {
      type: Object,
      required: true
    },
    errors: {
      type: Object,
      required: true
    },
    serverUrl: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      chatTypeOptions: [
        { value: 1, label: '群聊' },
        { value: 2, label: '私聊' },
        { value: 3, label: '系统通知' }
      ],
      chatStatusOptions: [
        { value: 1, label: '活跃' },
        { value: 0, label: '静默' }
      ]
    }
  },
  methods: {
    // 聊天相关方法
    onChatTypeChange(e) {
      this.formData.chatType = this.chatTypeOptions[e.detail.value].value;
    },
    
    onChatStatusChange(e) {
      this.formData.chatStatus = this.chatStatusOptions[e.detail.value].value;
    },
    
    onChatNameInput(e) {
      this.$emit('validate-field', 'chatName', e.detail.value);
    },
    
    getChatTypeText(type) {
      const option = this.chatTypeOptions.find(item => item.value === type);
      return option ? option.label : '请选择类型';
    },
    
    getChatStatusText(status) {
      const option = this.chatStatusOptions.find(item => item.value === status);
      return option ? option.label : '请选择状态';
    }
  }
}
</script>

<style lang="scss" scoped>
/* 配置区域 */
.config-section {
  background: #ffffff;
  margin-top: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  border-radius: 16rpx;

  .section-header {
    padding: 12rpx 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
    background: #f8f9fa;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .section-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #333333;
    }
  }
}

/* 表单项样式 */
.form-item {
  margin: 0;
  padding: 0rpx 20rpx;
  display: flex;
  align-items: center;
  min-height: 72rpx;
  background: #ffffff;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #fafbfc;
  }
}

.form-label {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #333333;
  font-weight: 600;
  margin-right: 24rpx;
  min-width: 160rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: 0.5rpx;
}

.required {
  color: #ff4d4f;
  font-weight: 600;
  margin-left: 4rpx;
}

.form-input {
  flex: 1;
  height: 64rpx;
  padding: 0 16rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #333333;
  box-sizing: border-box;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: 0.3rpx;
  transition: all 0.3s ease;
  
  &:focus {
    background: #ffffff;
    box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
    outline: none;
  }
  
  &::placeholder {
    color: #95a5a6;
    font-size: 24rpx;
    font-weight: 400;
  }
}

.form-textarea {
  flex: 1;
  min-height: 64rpx;
  padding: 0 16rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #333333;
  box-sizing: border-box;
  text-align: left;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  line-height: 1.5;
  transition: all 0.3s ease;
  
  &:focus {
    background: #ffffff;
    box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
    outline: none;
  }
  
  &::placeholder {
    color: #999999;
    font-size: 32rpx;
    font-weight: 300;
  }
}

/* 描述字段特殊样式 */
.description-item {
  align-items: flex-start;
  margin-bottom: 20rpx;
  min-height: 80rpx;
  
  .form-label {
    display: flex;
    align-items: center;
    margin-top: 8rpx;
  }
  
  .form-textarea {
    min-height: 80rpx;
    max-height: 240rpx;
    overflow-y: auto;
  }
}

/* 选择器样式 */
.form-picker {
  flex: 1;
}

.picker-display {
  width: 100%;
  height: 64rpx;
  padding: 0 16rpx;
  border: none;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 24rpx;
  color: #333333;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  transition: all 0.3s ease;
  
  .picker-text {
    margin-right: 16rpx;
  }
}

.picker-arrow {
  width: 32rpx;
  height: 32rpx;
  opacity: 0.6;
}
</style>
