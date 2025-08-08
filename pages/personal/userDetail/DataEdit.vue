<template>
  <view class="data-edit">
    <!-- 表单内容 -->
    <scroll-view class="form-container" scroll-y="true">
      <!-- Location表单 -->
      <view v-if="type === 'location'" class="form-content">
        <view class="form-item">
          <text class="form-label">地址名称 <text class="required">*</text></text>
          <input 
            v-model="formData.addressName" 
            class="form-input" 
            placeholder="请输入地址名称"
            maxlength="50"
            @input="onAddressNameInput"
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">详细地址 <text class="required">*</text></text>
          <input 
            v-model="formData.addressExt" 
            class="form-input" 
            placeholder="请输入详细地址"
            maxlength="200"
            @input="onAddressExtInput"
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">位置类型 <text class="required">*</text></text>
          <picker 
            :value="formData.type - 1" 
            :range="locationTypeOptions" 
            range-key="label"
            @change="onLocationTypeChange"
            class="form-picker"
          >
            <view class="picker-display">
              <text>{{ getLocationTypeText(formData.type) }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
        </view>
        
        <view class="form-item">
          <text class="form-label">安全等级</text>
          <picker 
            :value="formData.safeLevelId - 1" 
            :range="safetyLevelOptions" 
            range-key="label"
            @change="onSafetyLevelChange"
            class="form-picker"
          >
            <view class="picker-display">
              <text>{{ getSafetyLevelText(formData.safeLevelId) }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
        </view>
        
        <view class="form-item">
          <text class="form-label">描述</text>
          <textarea 
            v-model="formData.description" 
            class="form-textarea" 
            placeholder="请输入描述信息"
            maxlength="500"
          />
        </view>
      </view>

      <!-- Safety表单 -->
      <view v-if="type === 'safety'" class="form-content">
        <view class="form-item">
          <text class="form-label">名称 <text class="required">*</text></text>
          <input 
            v-model="formData.name" 
            class="form-input" 
            placeholder="请输入名称"
            maxlength="50"
            @input="onNameInput"
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">描述</text>
          <textarea 
            v-model="formData.description" 
            class="form-textarea" 
            placeholder="请输入描述信息"
            maxlength="500"
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">权重 <text class="required">*</text></text>
          <input 
            v-model="formData.weight" 
            class="form-input" 
            type="number"
            placeholder="请输入权重"
            @input="onWeightInput"
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">状态</text>
          <picker 
            :value="formData.status - 1" 
            :range="statusOptions" 
            range-key="label"
            @change="onStatusChange"
            class="form-picker"
          >
            <view class="picker-display">
              <text>{{ getStatusText(formData.status) }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
        </view>
        
        <!-- 安全评分配置 -->
        <view class="safety-config-section">
          <view class="section-header">
            <text class="section-title">安全评分配置</text>
          </view>
          
          <!-- 评分项列表 -->
          <view class="score-items-list">
            <view class="score-item" v-for="(item, index) in formData.scoreItems" :key="index">
              <view class="item-header">
                <text class="item-name">{{ item.name }}</text>
                <view class="item-actions">
                  <image :src="serverUrl + '/static/icons/common/edit.png'" class="action-icon" @tap="editScoreItem(index)" />
                  <image :src="serverUrl + '/static/icons/common/delete.png'" class="action-icon delete-icon" @tap="deleteScoreItem(index)" />
                </view>
              </view>
              <view class="item-content">
                <text class="item-description">{{ item.description }}</text>
                <view class="item-weight">
                  <text class="weight-label">权重：</text>
                  <text class="weight-value">{{ item.weight }}分</text>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 添加评分项按钮 -->
          <view class="add-score-item" @tap="addScoreItem">
            <image :src="serverUrl + '/static/icons/common/add.png'" class="add-icon" />
            <text class="add-text">添加评分项</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="footer">
      <button class="footer-btn cancel-btn" @tap="goBack">取消</button>
      <button class="footer-btn confirm-btn" @tap="saveData">保存</button>
    </view>
  </view>
</template>

<script>
import { locationTabList } from '@/commons/mock/index.js'

export default {
  name: 'DataEdit',
  data() {
    return {
      type: 'location', // location 或 safety
      mode: 'add', // add 或 edit
      editId: '', // 编辑时的ID
      formData: {},
      // 错误状态
      errors: {},
      // 选项数据
      locationTypeOptions: [],
      safetyLevelOptions: [
        { value: 1, label: '优秀' },
        { value: 2, label: '良好' },
        { value: 3, label: '一般' },
        { value: 4, label: '危险' }
      ],
      statusOptions: [
        { value: 1, label: '启用' },
        { value: 0, label: '禁用' }
      ]
    }
  },
  computed: {
    isEdit() {
      return this.mode === 'edit';
    }
  },
  onLoad(options) {
    this.type = options.type || 'location';
    this.mode = options.mode || 'add';
    this.editId = options.id || '';
    
    // 初始化位置类型选项
    this.initLocationTypeOptions();
    
    this.initFormData();
    
    if (this.isEdit && this.editId) {
      this.loadEditData();
    }
  },
  methods: {
    // 初始化位置类型选项
    initLocationTypeOptions() {
      this.locationTypeOptions = locationTabList.map(item => ({
        value: item.type,
        label: item.name
      }));
    },
    
    goBack() {
      uni.navigateBack();
    },
    
    initFormData() {
      if (this.type === 'location') {
        this.formData = {
          addressName: '',
          addressExt: '',
          type: 1,
          safeLevelId: 1,
          description: ''
        };
      } else {
        this.formData = {
          name: '',
          description: '',
          weight: '',
          status: 1,
          scoreItems: [] // 安全评分配置项
        };
      }
    },
    
    async loadEditData() {
      uni.showLoading({ title: '加载中...' });
      try {
        const url = this.type === 'location' 
          ? this.serverUrl + '/location/detail'
          : this.serverUrl + '/safety/detail';
        
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url,
            method: 'GET',
            data: { id: this.editId },
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          this.formData = { ...result.data.data };
        } else {
          throw new Error(result.data?.msg || '加载数据失败');
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '加载数据失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    onLocationTypeChange(e) {
      this.formData.type = this.locationTypeOptions[e.detail.value].value;
      this.validateField('type', this.formData.type);
    },
    
    onSafetyLevelChange(e) {
      this.formData.safeLevelId = this.safetyLevelOptions[e.detail.value].value;
    },
    
    onStatusChange(e) {
      this.formData.status = this.statusOptions[e.detail.value].value;
    },
    
    // 输入事件处理
    onAddressNameInput(e) {
      this.validateField('addressName', e.detail.value);
    },
    
    onAddressExtInput(e) {
      this.validateField('addressExt', e.detail.value);
    },
    
    onNameInput(e) {
      this.validateField('name', e.detail.value);
    },
    
    onWeightInput(e) {
      this.validateField('weight', e.detail.value);
    },
    
    async saveData() {
      // 表单验证
      if (!this.validateForm()) {
        // 显示第一个错误
        const firstError = Object.values(this.errors).find(error => error);
        if (firstError) {
          uni.showToast({
            title: firstError,
            icon: 'none',
            duration: 2000
          });
        }
        return;
      }
      
      uni.showLoading({ title: this.isEdit ? '更新中...' : '保存中...' });
      try {
        const url = this.type === 'location' 
          ? this.serverUrl + '/location/save'
          : this.serverUrl + '/safety/save';
        
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url,
            method: 'POST',
            data: this.formData,
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          uni.showToast({
            title: this.isEdit ? '更新成功' : '保存成功',
            icon: 'success',
            duration: 1500
          });
          
          // 返回上一页并刷新数据
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          throw new Error(result.data?.msg || '操作失败');
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '操作失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 工具方法
    getLocationTypeText(type) {
      const option = this.locationTypeOptions.find(item => item.value === type);
      return option ? option.label : '请选择类型';
    },
    
    getSafetyLevelText(levelId) {
      const option = this.safetyLevelOptions.find(item => item.value === levelId);
      return option ? option.label : '请选择等级';
    },
    
    getStatusText(status) {
      const option = this.statusOptions.find(item => item.value === status);
      return option ? option.label : '请选择状态';
    },
    
    // 校验方法
    validateField(fieldName, value) {
      this.errors[fieldName] = '';
      
      if (this.type === 'location') {
        if (fieldName === 'addressName') {
          if (!value || !value.trim()) {
            this.errors[fieldName] = '请输入地址名称';
          }
        } else if (fieldName === 'addressExt') {
          if (!value || !value.trim()) {
            this.errors[fieldName] = '请输入详细地址';
          }
        } else if (fieldName === 'type') {
          if (!value) {
            this.errors[fieldName] = '请选择位置类型';
          }
        }
      } else {
        if (fieldName === 'name') {
          if (!value || !value.trim()) {
            this.errors[fieldName] = '请输入名称';
          }
        } else if (fieldName === 'weight') {
          if (!value || value <= 0) {
            this.errors[fieldName] = '请输入有效权重（大于0）';
          } else if (isNaN(value)) {
            this.errors[fieldName] = '权重必须是数字';
          }
        }
      }
    },
    
    // 校验整个表单
    validateForm() {
      if (this.type === 'location') {
        this.validateField('addressName', this.formData.addressName);
        this.validateField('addressExt', this.formData.addressExt);
        this.validateField('type', this.formData.type);
      } else {
        this.validateField('name', this.formData.name);
        this.validateField('weight', this.formData.weight);
      }
      
      return !Object.values(this.errors).some(error => error);
    },
    
    // 安全评分配置相关方法
    addScoreItem() {
      // 跳转到评分项编辑页面
      uni.navigateTo({
        url: `/pages/personal/userDetail/ScoreItemEdit?mode=add&safetyId=${this.editId}`
      });
    },
    
    editScoreItem(index) {
      const item = this.formData.scoreItems[index];
      uni.navigateTo({
        url: `/pages/personal/userDetail/ScoreItemEdit?mode=edit&safetyId=${this.editId}&itemId=${item.id}`
      });
    },
    
    deleteScoreItem(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个评分项吗？',
        success: (res) => {
          if (res.confirm) {
            this.formData.scoreItems.splice(index, 1);
            uni.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 1500
            });
          }
        }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.data-edit {
  height: 100vh;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
  display: flex;
  flex-direction: column;
}

/* 表单容器 */
.form-container {
  flex: 1;
  padding: 0;
  margin-top: 20rpx;
  padding-bottom: 160rpx;
}

.form-content {
  background: #ffffff;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  border: none;
}

.form-item {
  margin-bottom: 0;
  padding: 0 32rpx;
  border-bottom: 1rpx solid rgba(24, 144, 255, 0.1);
  display: flex;
  align-items: center;
  min-height: 100rpx;
  background: #ffffff;
  
  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }
}

.form-label {
  flex-shrink: 0;
  font-size: 32rpx;
  color: #1890ff;
  font-weight: 600;
  margin-right: 0;
  min-width: 160rpx;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  
  &::after {
    display: none;
  }
}

.required {
  color: #ff4d4f;
  font-weight: 600;
  margin-left: 4rpx;
}

.form-input {
  flex: 1;
  height: 100rpx;
  padding: 0;
  border: none;
  border-radius: 0;
  font-size: 32rpx;
  color: #333333;
  background: transparent;
  box-sizing: border-box;
  text-align: right;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  
  &:focus {
    background: transparent;
  }
  
  &::placeholder {
    color: #bfbfbf;
    font-size: 32rpx;
    font-weight: 300;
  }
}

.form-textarea {
  flex: 1;
  height: 100rpx;
  padding: 0;
  border: none;
  border-radius: 0;
  font-size: 32rpx;
  color: #333333;
  background: transparent;
  box-sizing: border-box;
  text-align: right;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  
  &:focus {
    background: transparent;
  }
  
  &::placeholder {
    color: #bfbfbf;
    font-size: 32rpx;
    font-weight: 300;
  }
}

.form-picker {
  flex: 1;
}

.picker-display {
  width: 100%;
  height: 100rpx;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 32rpx;
  color: #333333;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  
  &:active {
    background: transparent;
  }
}

.picker-arrow {
  width: 32rpx;
  height: 32rpx;
  margin-left: 16rpx;
  opacity: 0.6;
}

/* 底部按钮 */
.footer {
  display: flex;
  padding: 40rpx 32rpx;
  gap: 20rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  border-top: 1rpx solid rgba(24, 144, 255, 0.1);
  box-shadow: 0 -2rpx 8rpx rgba(24, 144, 255, 0.05);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.footer-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  
  &::before {
    display: none;
  }
  
  &:active {
    transform: translateY(1rpx);
  }
}

.cancel-btn {
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  color: #666666;
  border: 1rpx solid rgba(24, 144, 255, 0.2);
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.1);
  
  &:active {
    background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
    box-shadow: 0 1rpx 4rpx rgba(24, 144, 255, 0.1);
  }
}

.confirm-btn {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
  
  &:active {
    background: linear-gradient(135deg, #096dd9 0%, #1890ff 100%);
    box-shadow: 0 1rpx 4rpx rgba(24, 144, 255, 0.3);
  }
}

/* 移动端优化 */
@media (max-width: 750rpx) {
  .form-item {
    padding: 0 24rpx;
    min-height: 88rpx;
  }
  
  .form-label {
    font-size: 30rpx;
    min-width: 140rpx;
    font-weight: 600;
  }
  
  .form-input,
  .form-textarea,
  .picker-display {
    font-size: 30rpx;
    font-weight: 400;
  }
  
  .form-input {
    height: 88rpx;
  }
  
  .form-textarea {
    height: 88rpx;
  }
  
  .picker-display {
    height: 88rpx;
  }
  
  .footer {
    padding: 32rpx 24rpx;
    gap: 16rpx;
  }
  
  .footer-btn {
    height: 80rpx;
    font-size: 30rpx;
    font-weight: 600;
  }
  
  .picker-arrow {
    width: 28rpx;
    height: 28rpx;
  }
  
  .form-container {
    padding-bottom: 140rpx;
  }
}

/* 超小屏幕优化 */
@media (max-width: 600rpx) {
  .form-item {
    padding: 0 20rpx;
    min-height: 80rpx;
  }
  
  .form-label {
    font-size: 28rpx;
    min-width: 120rpx;
    font-weight: 600;
  }
  
  .form-input,
  .form-textarea,
  .picker-display {
    font-size: 28rpx;
    font-weight: 400;
  }
  
  .form-input {
    height: 80rpx;
  }
  
  .form-textarea {
    height: 80rpx;
  }
  
  .picker-display {
    height: 80rpx;
  }
  
  .footer-btn {
    height: 76rpx;
    font-size: 28rpx;
    font-weight: 600;
  }
  
  .picker-arrow {
    width: 24rpx;
    height: 24rpx;
  }
  
  .form-container {
    padding-bottom: 120rpx;
  }
}

/* 安全评分配置样式 */
.safety-config-section {
  margin-top: 20rpx;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  padding: 20rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1890ff;
}

.score-items-list {
  padding: 0 32rpx;
}

.score-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.item-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.item-actions {
  display: flex;
  gap: 12rpx;
}

.action-icon {
  width: 32rpx;
  height: 32rpx;
  padding: 8rpx;
  border-radius: 6rpx;
  background: #f5f5f5;
  transition: all 0.2s ease;
  
  &:active {
    background: #e6e6e6;
    transform: scale(0.95);
  }
}

.delete-icon {
  background: #ff4d4f;
  
  &:active {
    background: #ff7875;
  }
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.item-description {
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
}

.item-weight {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.weight-label {
  font-size: 24rpx;
  color: #999;
}

.weight-value {
  font-size: 24rpx;
  color: #1890ff;
  font-weight: 500;
}

.add-score-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 24rpx 32rpx;
  background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
  border-top: 1rpx solid #f0f0f0;
  transition: all 0.3s ease;
  
  &:active {
    background: linear-gradient(135deg, #e6f7ff 0%, #d6f4ff 100%);
    transform: scale(0.98);
  }
}

.add-icon {
  width: 32rpx;
  height: 32rpx;
  opacity: 0.7;
}

.add-text {
  font-size: 26rpx;
  color: #1890ff;
  font-weight: 500;
}
</style> 