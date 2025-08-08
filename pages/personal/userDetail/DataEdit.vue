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
          <text class="form-label">地址代号 <text class="required">*</text></text>
          <input 
            v-model="formData.addressId" 
            class="form-input" 
            placeholder="请输入地址代号"
            maxlength="20"
            @input="onAddressIdInput"
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">全云景地址 <text class="required">*</text></text>
          <input 
            v-model="formData.allSenceLink" 
            class="form-input" 
            placeholder="请输入全云景链接"
            maxlength="500"
            @input="onAllSenceLinkInput"
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
        
        <view class="form-item description-item">
          <text class="form-label">描述</text>
          <textarea 
            v-model="formData.description" 
            class="form-textarea" 
            placeholder="请输入描述信息"
            maxlength="500"
            auto-height
            show-confirm-bar="false"
          />
        </view>
        
        <!-- 可出行大门配置 -->
        <view class="config-section">
          <view class="section-header">
            <text class="section-title">可出行大门配置</text>
          </view>
          
          <view class="gate-list">
            <view class="gate-item" v-for="(gate, index) in gateOptions" :key="index">
              <text class="gate-name">{{ gate.name }}</text>
              <switch 
                :checked="isGateSelected(gate.name)" 
                @change="toggleGate(gate.name)"
                color="#1890ff"
              />
            </view>
          </view>
        </view>
        
        <!-- 联系人配置 -->
        <view class="config-section">
          <view class="section-header">
            <text class="section-title">联系人配置</text>
            <image :src="serverUrl + '/static/icons/common/add.png'" class="action-icon" @tap="showContactModal" />
          </view>
          
          <view class="config-list">
            <view class="config-item" v-for="(contact, index) in formData.phoneList" :key="index">
              <view class="item-header">
                <text class="item-name">{{ contact.name }}</text>
                <text class="item-type">{{ getContactTypeText(contact.type) }}</text>
              </view>
              <view class="item-content">
                <text class="item-phone">{{ contact.phone }}</text>
              </view>
              <view class="item-actions">
                <image :src="serverUrl + '/static/icons/common/edit.png'" class="action-icon" @tap="editPhoneContact(index)" />
                <image :src="serverUrl + '/static/icons/common/delete.png'" class="action-icon delete-icon" @tap="deletePhoneContact(index)" />
              </view>
            </view>
          </view>
        </view>
        
        <!-- 消防地图配置 -->
        <view class="config-section">
          <view class="section-header">
            <text class="section-title">消防地图</text>
            <image :src="serverUrl + '/static/icons/common/add.png'" class="action-icon" @tap="addImage" v-if="formData.imgList.length < 3" />
          </view>
          
          <view class="image-list">
            <view class="image-item" v-for="(img, index) in formData.imgList" :key="index">
              <image :src="serverUrl + img" class="map-image" mode="aspectFill" />
              <view class="image-actions">
                <image :src="serverUrl + '/static/icons/common/delete.png'" class="action-icon delete-icon" @tap="deleteImage(index)" />
              </view>
            </view>
          </view>
        </view>
        
        <!-- 安全评分详情组件 -->
        <SafetyScoreDetail 
          :safetyScoreData="formData.fireSafetyScore"
          :addressId="editId"
        />
        
        <!-- 评分标准和总分显示 -->
        <view class="score-summary-section">
          <view class="total-score-display">
            <text class="total-score-label">安全评分总分：</text>
            <text class="total-score-value">{{ calculateTotalScore() }}分</text>
            <text class="total-score-level">({{ getSafetyLevelText(getSafetyLevelByScore(calculateTotalScore())) }})</text>
          </view>
          
          <view class="score-standard">
            <view class="standard-header">
              <text class="standard-title">评分标准</text>
            </view>
            <view class="standard-content">
              <view class="standard-item">
                <text class="standard-label">优秀：</text>
                <text class="standard-text">90分及以上</text>
              </view>
              <view class="standard-item">
                <text class="standard-label">一般：</text>
                <text class="standard-text">70-90分</text>
              </view>
              <view class="standard-item">
                <text class="standard-label">较差：</text>
                <text class="standard-text">70分以下</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Chat表单 -->
      <view v-if="type === 'chat'" class="form-content">
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
              <text>{{ getChatTypeText(formData.chatType) }}</text>
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
              <text>{{ getChatStatusText(formData.chatStatus) }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
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
import SafetyScoreDetail from './components/SafetyScoreDetail.vue'

export default {
  components: {
    SafetyScoreDetail
  },
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
        { value: 2, label: '一般' },
        { value: 3, label: '较差' }
      ],
      statusOptions: [
        { value: 1, label: '启用' },
        { value: 0, label: '禁用' }
      ],
      chatTypeOptions: [
        { value: 1, label: '群聊' },
        { value: 2, label: '私聊' },
        { value: 3, label: '系统通知' }
      ],
      chatStatusOptions: [
        { value: 1, label: '活跃' },
        { value: 0, label: '静默' }
      ],
      contactTypeOptions: [
        { value: 1, label: '单位负责人' },
        { value: 2, label: '消防负责人' }
      ],
      gateOptions: [
        { name: '东门', type: 1 },
        { name: '南门', type: 2 },
        { name: '西门', type: 3 },
        { name: '北门', type: 4 }
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
          addressId: '',
          allSenceLink: '',
          type: 1,
          safeLevelId: 1,
          description: '',
          fireSafetyScore: null, // 安全信息字段，初始化为null
          enterGateList: [], // 可出行大门列表
          phoneList: [], // 联系人列表
          imgList: [] // 消防地图图片列表
        };
      } else if (this.type === 'chat') {
        this.formData = {
          chatName: '',
          chatType: 1,
          chatDescription: '',
          chatStatus: 1
        };
      }
    },
    
    async loadEditData() {
      uni.showLoading({ title: '加载中...' });
      try {
        const url = this.type === 'location' 
          ? this.serverUrl + '/location/detail'
          : this.serverUrl + '/chat/detail';
        let data = {
          id: this.editId
        }
        if (this.type === 'location') {
          delete data.id;
          data.addressId = this.editId;
        }
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url,
            method: 'GET',
            data: data,
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          const responseData = result.data.data;
          
          // 处理位置数据
          if (this.type === 'location') {
            this.formData = {
              addressName: responseData.addressName || '',
              addressExt: responseData.addressExt || '',
              addressId: responseData.addressId || '',
              allSenceLink: responseData.allSenceLink || '',
              type: responseData.type || 1,
              safeLevelId: responseData.safeLevelId || 1,
              description: responseData.description || '',
              // 处理安全信息，null时显示为空对象
              fireSafetyScore: responseData.fireSafetyScore || null,
              enterGateList: responseData.enterGateList || [],
              phoneList: responseData.phoneList || [],
              imgList: responseData.imgList || []
            };
          } else if (this.type === 'chat') {
            // 处理聊天数据
            this.formData = {
              chatName: responseData.chatName || '',
              chatType: responseData.chatType || 1,
              chatDescription: responseData.chatDescription || '',
              chatStatus: responseData.chatStatus || 1
            };
          }
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
    
    // 聊天相关方法
    onChatTypeChange(e) {
      this.formData.chatType = this.chatTypeOptions[e.detail.value].value;
    },
    
    onChatStatusChange(e) {
      this.formData.chatStatus = this.chatStatusOptions[e.detail.value].value;
    },
    
    // 输入事件处理
    onAddressNameInput(e) {
      this.validateField('addressName', e.detail.value);
    },
    
    onAddressExtInput(e) {
      this.validateField('addressExt', e.detail.value);
    },
    
    onAddressIdInput(e) {
      this.validateField('addressId', e.detail.value);
    },
    
    onAllSenceLinkInput(e) {
      this.validateField('allSenceLink', e.detail.value);
    },
    
    onChatNameInput(e) {
      this.validateField('chatName', e.detail.value);
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
          : this.serverUrl + '/chat/save';
        
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
    
    getChatTypeText(type) {
      const option = this.chatTypeOptions.find(item => item.value === type);
      return option ? option.label : '请选择类型';
    },
    
    getChatStatusText(status) {
      const option = this.chatStatusOptions.find(item => item.value === status);
      return option ? option.label : '请选择状态';
    },
    
    getContactTypeText(type) {
      const option = this.contactTypeOptions.find(item => item.value === type);
      return option ? option.label : '未知类型';
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
        } else if (fieldName === 'addressId') {
          if (!value || !value.trim()) {
            this.errors[fieldName] = '请输入地址代号';
          }
        } else if (fieldName === 'allSenceLink') {
          if (!value || !value.trim()) {
            this.errors[fieldName] = '请输入全云景地址';
          }
        } else if (fieldName === 'type') {
          if (!value) {
            this.errors[fieldName] = '请选择位置类型';
          }
        }
      } else if (this.type === 'chat') {
        if (fieldName === 'chatName') {
          if (!value || !value.trim()) {
            this.errors[fieldName] = '请输入聊天名称';
          }
        }
      }
    },
    
    // 校验整个表单
    validateForm() {
      if (this.type === 'location') {
        this.validateField('addressName', this.formData.addressName);
        this.validateField('addressExt', this.formData.addressExt);
        this.validateField('addressId', this.formData.addressId);
        this.validateField('allSenceLink', this.formData.allSenceLink);
        this.validateField('type', this.formData.type);
      } else if (this.type === 'chat') {
        this.validateField('chatName', this.formData.chatName);
      }
      
      return !Object.values(this.errors).some(error => error);
    },
    
    // 可出行大门管理方法
    isGateSelected(gateName) {
      return this.formData.enterGateList.some(gate => gate.name === gateName);
    },
    
    toggleGate(gateName) {
      const existingIndex = this.formData.enterGateList.findIndex(gate => gate.name === gateName);
      if (existingIndex >= 0) {
        // 如果已存在，则删除
        this.formData.enterGateList.splice(existingIndex, 1);
      } else {
        // 如果不存在，则添加
        const gateOption = this.gateOptions.find(option => option.name === gateName);
        this.formData.enterGateList.push({
          name: gateName,
          type: gateOption ? gateOption.type : this.formData.enterGateList.length + 1
        });
      }
    },
    
    // 联系人管理方法
    showContactModal() {
      uni.showModal({
        title: '添加联系人',
        editable: true,
        placeholderText: '请输入联系人姓名',
        success: (res) => {
          if (res.confirm && res.content.trim()) {
            const name = res.content.trim();
            uni.showModal({
              title: '输入电话号码',
              editable: true,
              placeholderText: '请输入电话号码',
              success: (phoneRes) => {
                if (phoneRes.confirm && phoneRes.content.trim()) {
                  const phone = phoneRes.content.trim();
                  uni.showActionSheet({
                    itemList: ['单位负责人', '消防负责人'],
                    success: (typeRes) => {
                      this.formData.phoneList.push({
                        name: name,
                        phone: phone,
                        type: typeRes.tapIndex + 1
                      });
                    }
                  });
                }
              }
            });
          }
        }
      });
    },
    
    editPhoneContact(index) {
      const contact = this.formData.phoneList[index];
      uni.showModal({
        title: '编辑联系人',
        editable: true,
        content: contact.name,
        success: (res) => {
          if (res.confirm && res.content.trim()) {
            this.formData.phoneList[index].name = res.content.trim();
            uni.showModal({
              title: '输入电话号码',
              editable: true,
              content: contact.phone,
              success: (phoneRes) => {
                if (phoneRes.confirm && phoneRes.content.trim()) {
                  this.formData.phoneList[index].phone = phoneRes.content.trim();
                }
              }
            });
          }
        }
      });
    },
    
    deletePhoneContact(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个联系人吗？',
        success: (res) => {
          if (res.confirm) {
            this.formData.phoneList.splice(index, 1);
          }
        }
      });
    },
    
    // 图片管理方法
    addImage() {
      if (this.formData.imgList.length >= 3) {
        uni.showToast({
          title: '最多只能上传3张图片',
          icon: 'none'
        });
        return;
      }
      
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          // 这里应该上传图片到服务器，然后获取URL
          // 暂时使用本地路径
          this.formData.imgList.push('/static/icons/location/temp.png');
          uni.showToast({
            title: '图片添加成功',
            icon: 'success'
          });
        }
      });
    },
    
    deleteImage(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这张图片吗？',
        success: (res) => {
          if (res.confirm) {
            this.formData.imgList.splice(index, 1);
          }
        }
      });
    },
    
    // 计算安全评分总分
    calculateTotalScore() {
      if (!this.formData.fireSafetyScore || !this.formData.fireSafetyScore.scoreItems) {
        return 0;
      }
      
      let totalScore = 0;
      const scoreItems = this.formData.fireSafetyScore.scoreItems;
      
      for (const key in scoreItems) {
        if (scoreItems[key] && typeof scoreItems[key].score === 'number') {
          totalScore += scoreItems[key].score;
        }
      }
      
      return totalScore;
    },
    
    // 根据总分获取安全等级
    getSafetyLevelByScore(totalScore) {
      if (totalScore >= 90) {
        return 1; // 优秀
      } else if (totalScore >= 70) {
        return 2; // 一般
      } else {
        return 3; // 较差
      }
    }
    

  }
}
</script>

<style lang="scss" scoped>
.data-edit {
  height: 100vh;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
}

/* 表单容器 */
.form-container {
  flex: 1;
  padding: 0;
  padding-bottom: 160rpx;
  height: calc(100vh - 160rpx);
  overflow-y: auto;
}

.form-content {
  background: #ffffff;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  border: none;
  margin-top: 20rpx;
  margin-bottom: 20rpx;
}

.form-item {
  margin-bottom: 0;
  padding: 0 32rpx;
  border-bottom: 1rpx solid #e5e5e5;
  display: flex;
  align-items: center;
  min-height: 100rpx;
  background: #ffffff;
  position: relative;
  
  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }
  
  &:active {
    background: #f8f8f8;
  }
}

.form-label {
  flex-shrink: 0;
  font-size: 32rpx;
  color: #333333;
  font-weight: 400;
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
    color: #999999;
    font-size: 32rpx;
    font-weight: 300;
  }
}

.form-textarea {
  flex: 1;
  min-height: 100rpx;
  padding: 0;
  border: none;
  border-radius: 0;
  font-size: 32rpx;
  color: #333333;
  background: transparent;
  box-sizing: border-box;
  text-align: left;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  line-height: 1.5;
  
  &:focus {
    background: transparent;
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
  min-height: 120rpx;
  padding: 20rpx 32rpx;
  
  .form-label {
    margin-top: 8rpx;
  }
  
  .form-textarea {
    min-height: 80rpx;
    max-height: 200rpx;
    overflow-y: auto;
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
  padding: 20rpx 32rpx;
  gap: 20rpx;
  background: #ffffff;
  border-top: 1rpx solid #e5e5e5;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.footer-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 8rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  
  &::before {
    display: none;
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.cancel-btn {
  background: #ffffff;
  color: #666666;
  border: 1rpx solid #e5e5e5;
  
  &:active {
    background: #f8f8f8;
  }
}

.confirm-btn {
  background: #1890ff;
  color: #ffffff;
  
  &:active {
    background: #096dd9;
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
    min-height: 88rpx;
  }
  
  .description-item {
    min-height: 100rpx;
    padding: 16rpx 24rpx;
    
    .form-textarea {
      min-height: 70rpx;
      max-height: 160rpx;
    }
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
    padding-bottom: 160rpx;
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
    padding-bottom: 160rpx;
  }
}

/* 配置项样式 */
.config-section {
  margin: 20rpx 0;
  background: #ffffff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.config-section .section-header {
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-section .section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1890ff;
}

.config-list {
  padding: 20rpx 32rpx;
}

.config-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.config-item .item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.config-item .item-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.config-item .item-type {
  font-size: 24rpx;
  color: #1890ff;
  background: #e6f7ff;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
  margin-left: 12rpx;
}

.config-item .item-content {
  margin-bottom: 12rpx;
}

.config-item .item-phone {
  font-size: 24rpx;
  color: #666;
}

.config-item .item-actions {
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

/* 图片列表样式 */
.image-list {
  padding: 24rpx 32rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 150rpx;
  border-radius: 8rpx;
  overflow: hidden;
  background: #f5f5f5;
}

.map-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
}

/* 大门列表样式 */
.gate-list {
  padding: 20rpx 32rpx;
}

.gate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.gate-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

/* 评分汇总样式 */
.score-summary-section {
  margin: 20rpx 0;
  background: #ffffff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.score-summary-section .total-score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 32rpx;
  background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
  border-bottom: 1rpx solid #f0f0f0;
}

.score-summary-section .total-score-label {
  font-size: 30rpx;
  color: #333333;
  font-weight: 500;
}

.score-summary-section .total-score-value {
  font-size: 36rpx;
  color: #1890ff;
  font-weight: 600;
  margin: 0 8rpx;
}

.score-summary-section .total-score-level {
  font-size: 24rpx;
  color: #666666;
  font-weight: 400;
}

.score-standard {
  padding: 24rpx 32rpx;
}

.standard-header {
  margin-bottom: 16rpx;
}

.standard-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1890ff;
}

.standard-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.standard-item {
  display: flex;
  align-items: center;
}

.standard-label {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
  min-width: 80rpx;
}

.standard-text {
  font-size: 26rpx;
  color: #666666;
  font-weight: 400;
}

.tips-header {
  padding: 20rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
}

.tips-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1890ff;
}

.tips-content {
  padding: 20rpx 32rpx;
}

.tip-item {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.tip-label {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
  min-width: 80rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #666666;
  font-weight: 400;
}

/* 总分显示样式 */
.total-score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 32rpx;
  background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
  border-bottom: 1rpx solid #f0f0f0;
}

.total-score-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.total-score-value {
  font-size: 32rpx;
  color: #1890ff;
  font-weight: 600;
  margin: 0 8rpx;
}

.total-score-level {
  font-size: 24rpx;
  color: #666666;
  font-weight: 400;
}
</style> 