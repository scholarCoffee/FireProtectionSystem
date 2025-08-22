<template>
  <view class="command-form">
    <!-- 数据指挥基本信息 -->
    <view class="config-section">
      <view class="section-header">
        <text class="section-title">数据指挥信息</text>
      </view>
      
      <view class="form-item">
        <text class="form-label">功能名称 <text class="required">*</text></text>
        <input 
          v-model="localForm.commandTitle" 
          class="form-input" 
          placeholder="请输入功能名称"
          maxlength="50"
          @input="onCommandTitleInput"
        />
      </view>
        
      <view class="form-item description-item">
        <text class="form-label">功能描述</text>
        <textarea 
          v-model="localForm.commandDesc" 
          class="form-textarea" 
          placeholder="请输入功能描述"
          maxlength="200"
          auto-height
          show-confirm-bar="false"
        />
      </view>
          
      <view class="form-item">
        <text class="form-label">访问地址 <text class="required">*</text></text>
        <input 
          v-model="localForm.commandUrl" 
          class="form-input" 
          placeholder="请输入访问地址"
          maxlength="500"
          @input="onCommandUrlInput"
        />
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CommandForm',
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
        commandTitle: '',
        commandDesc: '',
        commandUrl: ''
      }
    }
  },
  created() {
    this.setFormData(this.initialData)
  },
  methods: {
    // 暴露给父组件使用
    getFormData() {
      return { ...this.localForm }
    },
    setFormData(data = {}) {
      this.localForm = {
        commandTitle: data.commandTitle || '',
        commandDesc: data.commandDesc || '',
        commandUrl: data.commandUrl || ''
      }
    },
    validate() {
      if (!this.localForm.commandTitle || !String(this.localForm.commandTitle).trim()) {
        uni.showToast({ title: '请输入功能名称', icon: 'none' })
        return false
      }
      if (!this.localForm.commandUrl || !String(this.localForm.commandUrl).trim()) {
        uni.showToast({ title: '请输入访问地址', icon: 'none' })
        return false
      }
      try {
        const u = new URL(this.localForm.commandUrl)
        if (!(u.protocol === 'http:' || u.protocol === 'https:')) throw new Error('bad')
      } catch (e) {
        uni.showToast({ title: '请输入有效的URL地址', icon: 'none' })
        return false
      }
      return true
    },
    // 数据指挥表单输入验证
    onCommandTitleInput(e) {
      this.localForm.commandTitle = e.detail.value
    },
    
    onCommandUrlInput(e) {
      this.localForm.commandUrl = e.detail.value
    },

    // ===== 本地存储工具（与管理页/入口页统一） =====
    getCommandStorageKey() {
      return 'COMMAND_CONFIG_V1'
    },
    loadLocalCommands() {
      try {
        const key = this.getCommandStorageKey()
        const local = uni.getStorageSync(key)
        if (local && typeof local === 'object') return local
      } catch (e) {}
      return {}
    },
    saveLocalCommands(configObj) {
      const key = this.getCommandStorageKey()
      uni.setStorageSync(key, configObj || {})
    },
    // 保存当前表单到本地（新增/编辑皆可）
    saveCurrentToLocal(editKey) {
      const commands = this.loadLocalCommands()
      const payload = {
        title: this.localForm.commandTitle || '',
        desc: this.localForm.commandDesc || '',
        url: this.localForm.commandUrl || '',
        icon: this.localForm.icon || 'manage'
      }
      const next = { ...commands }
      if (editKey) {
        next[editKey] = payload
      } else {
        const key = `${Date.now()}`
        next[key] = payload
      }
      this.saveLocalCommands(next)
      return true
    },
    // 从本地删除某条配置
    removeLocalCommand(removeKey) {
      if (!removeKey) return false
      const commands = this.loadLocalCommands()
      if (!commands[removeKey]) return false
      const next = { ...commands }
      delete next[removeKey]
      this.saveLocalCommands(next)
      return true
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
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  border-radius: 20rpx;
  border: 1rpx solid rgba(24, 144, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 8rpx 24rpx rgba(24, 144, 255, 0.15);
  }

  .section-header {
    padding: 20rpx 24rpx;
    border-bottom: 1rpx solid #e8f4ff;
    background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .section-title {
      font-size: 32rpx;
      font-weight: 700;
      color: #1890ff;
      letter-spacing: 0.5rpx;
      text-shadow: 0 2rpx 4rpx rgba(24, 144, 255, 0.1);
    }
  }
}

/* 表单项样式 */
.form-item {
  margin: 0;
  padding: 0rpx 24rpx;
  display: flex;
  align-items: center;
  min-height: 88rpx;
  background: #ffffff;
  transition: all 0.3s ease;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%);
    transform: translateX(4rpx);
  }

  &:focus-within {
    background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
    border-left: 4rpx solid #1890ff;
    padding-left: 20rpx;
  }
}

.form-label {
  flex-shrink: 0;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: 600;
  margin-right: 24rpx;
  min-width: 160rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: 0.5rpx;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -4rpx;
    left: 0;
    width: 0;
    height: 2rpx;
    background: linear-gradient(90deg, #1890ff, #40a9ff);
    transition: width 0.3s ease;
  }
}

.form-item:focus-within .form-label::after {
  width: 100%;
}

.required {
  color: #ff4d4f;
  font-weight: 700;
  margin-left: 6rpx;
  font-size: 28rpx;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.form-input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  border: 2rpx solid #e8f4ff;
  border-radius: 16rpx;
  font-size: 26rpx;
  color: #2c3e50;
  box-sizing: border-box;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: 0.3rpx;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  
  &:focus {
    background: #ffffff;
    border-color: #1890ff;
    box-shadow: 0 0 0 6rpx rgba(24, 144, 255, 0.1);
    outline: none;
    transform: scale(1.02);
  }
  
  &::placeholder {
    color: #95a5a6;
    font-size: 26rpx;
    font-weight: 400;
    opacity: 0.8;
  }
}

.form-textarea {
  flex: 1;
  min-height: 72rpx;
  padding: 16rpx 20rpx;
  border: 2rpx solid #e8f4ff;
  border-radius: 16rpx;
  font-size: 26rpx;
  color: #2c3e50;
  box-sizing: border-box;
  text-align: left;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  line-height: 1.6;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  
  &:focus {
    background: #ffffff;
    border-color: #1890ff;
    box-shadow: 0 0 0 6rpx rgba(24, 144, 255, 0.1);
    outline: none;
    transform: scale(1.01);
  }
  
  &::placeholder {
    color: #95a5a6;
    font-size: 26rpx;
    font-weight: 400;
    opacity: 0.8;
  }
}

/* 描述字段特殊样式 */
.description-item {
  align-items: flex-start;
  margin-bottom: 24rpx;
  min-height: 120rpx;
  
  .form-label {
    display: flex;
    align-items: center;
    margin-top: 12rpx;
  }
  
  .form-textarea {
    min-height: 120rpx;
    max-height: 300rpx;
    overflow-y: auto;
    padding: 20rpx;
    
    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 8rpx;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4rpx;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4rpx;
      
      &:hover {
        background: #a8a8a8;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 750rpx) {
  .config-section {
    margin-top: 16rpx;
    border-radius: 16rpx;
    
    .section-header {
      padding: 16rpx 20rpx;
      
      .section-title {
        font-size: 28rpx;
      }
    }
  }
  
  .form-item {
    padding: 0rpx 20rpx;
    min-height: 80rpx;
    
    &:focus-within {
      padding-left: 16rpx;
    }
  }
  
  .form-label {
    font-size: 26rpx;
    min-width: 140rpx;
    margin-right: 20rpx;
  }
  
  .form-input,
  .form-textarea {
    font-size: 24rpx;
    height: 68rpx;
    padding: 0 16rpx;
  }
  
  .form-textarea {
    min-height: 100rpx;
    padding: 12rpx 16rpx;
  }
  
  .description-item {
    min-height: 100rpx;
    
    .form-textarea {
      min-height: 100rpx;
    }
  }
}

/* 超小屏幕优化 */
@media (max-width: 600rpx) {
  .config-section {
    margin-top: 12rpx;
    border-radius: 12rpx;
    
    .section-header {
      padding: 12rpx 16rpx;
      
      .section-title {
        font-size: 26rpx;
      }
    }
  }
  
  .form-item {
    padding: 0rpx 16rpx;
    min-height: 72rpx;
    
    &:focus-within {
      padding-left: 12rpx;
    }
  }
  
  .form-label {
    font-size: 24rpx;
    min-width: 120rpx;
    margin-right: 16rpx;
  }
  
  .form-input,
  .form-textarea {
    font-size: 22rpx;
    height: 64rpx;
    padding: 0 12rpx;
  }
  
  .form-textarea {
    min-height: 80rpx;
    padding: 8rpx 12rpx;
  }
  
  .description-item {
    min-height: 80rpx;
    
    .form-textarea {
      min-height: 80rpx;
    }
  }
}

/* 动画效果 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.config-section {
  animation: slideInUp 0.6s ease-out;
}

.form-item {
  animation: slideInUp 0.6s ease-out;
  
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
}
</style>
