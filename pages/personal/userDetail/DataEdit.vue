<template>
  <view class="data-edit">
    <!-- 表单内容 -->
    <scroll-view class="form-container" scroll-y="true">
      <!-- Location表单 -->
      <view v-if="type === 'location'" class="form-content">
        <!-- 位置信息区域 -->
        <view class="location-info-section">
          <view class="section-header">
            <text class="section-title">位置信息</text>
          </view>
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
                <text class="picker-text">{{ getLocationTypeText(formData.type) }}</text>
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
        </view>

        <!-- 安全信息区域 -->
        <view class="safety-section">
          <view class="section-header">
            <text class="section-title">安全信息</text>
            <view class="header-actions">
              <image 
                v-if="!formData.fireSafetyScore" 
                :src="serverUrl + '/static/icons/common/add-sec-white.png'" 
                class="action-icon add-icon" 
                @tap="addSafetyScore" 
              />
              <image 
                v-else 
                :src="serverUrl + '/static/icons/common/edit-white.png'" 
                class="action-icon edit-icon" 
                @tap="editSafetyScore" 
              />
            </view>
          </view>
            
          <view v-if="formData.fireSafetyScore" class="safety-content">
            <view class="safety-summary">
              <view class="safety-score-display">
                <view class="score-display-content">
                  <text class="score-label">总分:</text>
                  <text class="score-value">{{ calculateTotalScore() }}分</text>
                  <text class="level-value" :class="getSafetyLevelClass(getSafetyLevelByScore(calculateTotalScore()))">
                    ({{ getSafetyLevelText(getSafetyLevelByScore(calculateTotalScore())) }})
                  </text>
                </view>
                <!-- 分数进度条 -->
                <view class="score-progress-section">
                  <view class="progress-bar-container">
                    <view class="progress-bar">
                      <view 
                        class="progress-fill" 
                        :style="{ width: calculateTotalScore() + '%' }"
                        :class="getProgressBarClass(getSafetyLevelByScore(calculateTotalScore()))"
                      ></view>
                    </view>
                    <view class="progress-markers">
                      <view class="marker">
                        <text class="marker-text">0分</text>
                      </view>
                      <view class="marker">
                        <text class="marker-text">50分</text>
                      </view>
                      <view class="marker">
                        <text class="marker-text">100分</text>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view v-else class="empty-state">
            <text class="empty-text">暂无安全评分信息，点击上方"+"添加</text>
          </view>
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
                class="gate-switch"
                :checked="isGateSelected(gate.name)" 
                @change="toggleGate(gate.name)"
                color="#1890ff"
              />
            </view>
          </view>
            
          <!-- 错误提示 -->
          <view v-if="errors.enterGateList" class="error-message">
            <text class="error-text">{{ errors.enterGateList }}</text>
          </view>
        </view>
          
        <!-- 联系人配置 -->
        <view class="config-section">
          <view class="section-header">
            <text class="section-title">联系人配置</text>
            <view class="header-actions">
              <image :src="serverUrl + '/static/icons/common/add-sec-white.png'" class="action-icon add-icon" @tap="showContactModal('add')" />
            </view>
          </view>
            
          <view class="contact-list" v-if="formData.phoneList && formData.phoneList.length > 0">
            <view class="contact-item" v-for="(contact, index) in formData.phoneList" :key="index">
              <view class="contact-info">
                <view class="contact-header">
                  <text class="contact-name">{{ contact.name }}</text>
                  <text class="contact-type">{{ getContactTypeText(contact.type) }}</text>
                </view>
                <text class="contact-phone">{{ contact.phone }}</text>
              </view>
              <view class="contact-actions">
                <image :src="serverUrl + '/static/icons/common/edit-white.png'" class="action-icon edit-icon" @tap="showContactModal('edit', index)" />
                <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="action-icon delete-icon" @tap="deletePhoneContact(index)" />
              </view>
            </view>
          </view>
          <view v-else class="empty-state">
            <text class="empty-text">暂无联系人，点击上方"+"添加</text>
          </view>
          
          <!-- 错误提示 -->
          <view v-if="errors.phoneList" class="error-message">
            <text class="error-text">{{ errors.phoneList }}</text>
          </view>
        </view>

        <!-- 联系人弹窗 -->
        <view class="contact-modal" v-if="showContactModalFlag" @tap="hideContactModal">
          <view class="modal-content" @tap.stop>
            <view class="modal-header">
              <text class="modal-title">{{ contactModalMode === 'add' ? '添加联系人' : '编辑联系人' }}</text>
              <view class="close-btn" @tap="hideContactModal">
                <text class="close-icon">×</text>
              </view>
            </view>  
            <view class="modal-body">
              <view class="form-group">
                <text class="form-label">联系人姓名 <text class="required">*</text></text>
              <input 
                v-model="contactForm.name" 
                class="form-modal-input" 
                placeholder="请输入联系人姓名"
                maxlength="20"
              />
            </view>
            <view class="form-group">
              <text class="form-label">联系电话 <text class="required">*</text></text>
              <input 
                v-model="contactForm.phone" 
                class="form-modal-input" 
                placeholder="请输入联系电话"
                maxlength="15"
                type="number" 
              />
            </view>
          
            <view class="form-group">
              <text class="form-label">联系人类型 <text class="required">*</text></text>
              <view class="contact-type-options">
                <view 
                  v-for="option in contactTypeOptions" 
                  :key="option.value"
                  class="type-option"
                  :class="{ 
                    'active': contactForm.type === option.value,
                    'disabled': (option.value === 1 && contactTypeLimits.unitFull && contactModalMode === 'add') || 
                              (option.value === 2 && contactTypeLimits.fireFull && contactModalMode === 'add')
                  }"
                  @tap="selectContactType(option.value)"
                >
                  <view class="checkbox">
                    <view class="checkbox-inner" v-if="contactForm.type === option.value"></view>
                  </view>
                  <text class="type-label">{{ option.label }}</text>
                </view>
              </view>
              </view>
            </view>
            <view class="modal-footer">
              <button class="footer-btn cancel-btn" @tap="hideContactModal">取消</button>
              <button class="footer-btn confirm-btn" @tap="saveContact">确定</button>
            </view>
          </view>
        </view>
          
                <!-- 消防地图配置 -->
        <view class="config-section">
          <view class="section-header">
            <text class="section-title">消防地图</text>
          </view>
          
          <view class="image-upload-area">
            <!-- 已上传的图片 -->
            <view class="image-list" v-if="formData.imgList && formData.imgList.length > 0">
              <view class="image-item" v-for="(img, index) in formData.imgList" :key="index">
                <image :src="serverUrl + img" class="map-image" mode="aspectFill" />
                <view class="image-overlay">
                  <view class="image-actions">
                    <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="action-icon delete-icon" @tap="deleteImage(index)" />
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 上传按钮 -->
            <view class="upload-btn" v-if="formData.imgList.length < 3" @tap="addImage">
              <image :src="serverUrl + '/static/icons/common/add-third-grey.png'" class="upload-icon" />
              <text class="upload-text">上传图片</text>
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
      ],
      // 联系人弹窗相关
      showContactModalFlag: false,
      contactModalMode: 'add', // 'add' 或 'edit'
      contactForm: {
        name: '',
        phone: '',
        type: 1,
        index: -1
      }
    }
  },
  computed: {
    isEdit() {
      return this.mode === 'edit';
    },
    
    // 检查联系人类型是否已满
    contactTypeLimits() {
      const unitContacts = this.formData.phoneList.filter(contact => contact.type === 1);
      const fireContacts = this.formData.phoneList.filter(contact => contact.type === 2);
      
      return {
        unitFull: unitContacts.length >= 1,
        fireFull: fireContacts.length >= 1
      };
    },
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
          safeId: '',
          safeLevelName: '',
          safeLevelScore: '',
          fireSafetyScore: null, // 安全信息字段，初始化为null
          enterGateList: [], // 可出行大门列表
          phoneList: [], // 联系人列表
          imgList: [], // 消防地图图片列表
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
              safeLevelName: responseData.safeLevelName || '',
              safeLevelScore: responseData.safeLevelScore || '',
              safeId: responseData.safeId || '',
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
            duration: 3000
          });
          // 滚动到第一个错误位置
          this.scrollToFirstError();
        }
        return;
      }
      
      // 自动设置安全等级（根据评分计算）
      if (this.type === 'location') {
        const totalScore = this.calculateTotalScore();
        this.formData.safeLevelId = this.getSafetyLevelByScore(totalScore);
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
        
        // 验证可出行大门配置：至少选择一个
        if (!this.formData.enterGateList || this.formData.enterGateList.length === 0) {
          this.errors['enterGateList'] = '至少需要选择一个可出行大门';
          return false;
        }
        
        // 验证联系人配置：至少配置一个负责人
        if (!this.formData.phoneList || this.formData.phoneList.length === 0) {
          this.errors['phoneList'] = '至少需要配置一个联系人';
          return false;
        }

        // 验证消防地图配置：至少配置一张消防地图
        if (!this.formData.imgList || this.formData.imgList.length === 0) {
          this.errors['imgList'] = '至少需要配置一张消防地图';
          return false;
        }
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
      
      // 清除大门配置错误
      if (this.errors.enterGateList) {
        this.errors.enterGateList = '';
      }
    },
    
    // 联系人管理方法
    showContactModal(mode = 'add', index = -1) {
      // 如果是添加模式，检查是否还能添加联系人
      if (mode === 'add' && !this.formData.phoneList.length >= 2) {
        uni.showToast({
          title: '最多只能配置2个联系人',
          icon: 'none'
        });
        return;
      }
      
      this.contactModalMode = mode;
      this.contactForm.name = '';
      this.contactForm.phone = '';
      this.contactForm.type = 1;
      this.contactForm.index = index; // 用于编辑时传递索引
      
      // 如果是编辑模式，填充现有数据
      if (mode === 'edit' && index >= 0 && this.formData.phoneList[index]) {
        const contact = this.formData.phoneList[index];
        this.contactForm.name = contact.name;
        this.contactForm.phone = contact.phone;
        this.contactForm.type = contact.type;
      }
      
      this.showContactModalFlag = true;
    },
    
    hideContactModal() {
      this.showContactModalFlag = false;
    },

    selectContactType(type) {
      this.contactForm.type = type;
    },

    async saveContact() {
      this.hideContactModal();
      if (!this.contactForm.name || !this.contactForm.phone || !this.contactForm.type) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        });
        return;
      }

      // 检查联系人类型限制
      if (this.contactModalMode === 'add') {
        // 添加模式：检查该类型是否已满
        if (this.contactForm.type === 1 && this.contactTypeLimits.unitFull) {
          uni.showToast({
            title: '单位负责人已配置，不能重复添加',
            icon: 'none'
          });
          return;
        }
        if (this.contactForm.type === 2 && this.contactTypeLimits.fireFull) {
          uni.showToast({
            title: '消防负责人已配置，不能重复添加',
            icon: 'none'
          });
          return;
        }
        
        this.formData.phoneList.push({
          name: this.contactForm.name,
          phone: this.contactForm.phone,
          type: this.contactForm.type
        });
      } else if (this.contactModalMode === 'edit') {
        // 编辑模式：检查类型变更是否违反限制
        const oldContact = this.formData.phoneList[this.contactForm.index];
        if (oldContact.type !== this.contactForm.type) {
          // 类型发生变更，需要检查新类型是否已满
          if (this.contactForm.type === 1 && this.contactTypeLimits.unitFull) {
            uni.showToast({
              title: '单位负责人已配置，不能重复添加',
              icon: 'none'
            });
            return;
          }
          if (this.contactForm.type === 2 && this.contactTypeLimits.fireFull) {
            uni.showToast({
              title: '消防负责人已配置，不能重复添加',
              icon: 'none'
            });
            return;
          }
        }
        
        this.formData.phoneList[this.contactForm.index] = {
          name: this.contactForm.name,
          phone: this.contactForm.phone,
          type: this.contactForm.type
        };
      }
            
      // 清除联系人配置错误
      if (this.errors.phoneList) {
        this.errors.phoneList = '';
      }
      
      uni.showToast({
        title: this.contactModalMode === 'add' ? '联系人添加成功' : '联系人更新成功',
        icon: 'success'
      });
    },
    
    deletePhoneContact(index) {
      // 检查是否至少保留一个联系人
      if (this.formData.phoneList.length <= 1) {
        uni.showToast({
          title: '至少需要配置一个联系人',
          icon: 'none'
        });
        return;
      }
      
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个联系人吗？',
        success: (res) => {
          if (res.confirm) {
            this.formData.phoneList.splice(index, 1);
            
            // 清除联系人配置错误
            if (this.errors.phoneList) {
              this.errors.phoneList = '';
            }
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
          const filePath = (res.tempFilePaths && res.tempFilePaths[0]) || (res.tempFiles && res.tempFiles[0]?.path) || '';
          if (!filePath) {
            uni.showToast({ title: '未选择有效图片', icon: 'none' });
            return;
          }
          uni.showLoading({ title: '上传中...' });
          uni.uploadFile({
            url: this.serverUrl + '/files/upload',
            filePath,
            name: 'file',
            fileType: 'image',
            formData: {
              addressId: this.formData.addressId || this.editId || '',
              url: '/uploadImg/locationEdit',
              name: new Date().getTime() + this.editId + Math.ceil(Math.random()*10),
            },
            success: (uploadRes) => {
              try {
                const parsed = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data;
                const backImg = parsed?.data || '';
                if (!backImg) {
                  throw new Error('上传返回为空');
                }
                // 将返回的图片路径加入列表（页面渲染使用 serverUrl + img）
                this.formData.imgList.push(backImg);
                uni.showToast({ title: '图片上传成功', icon: 'success' });
              } catch (e) {
                uni.showToast({ title: '图片解析失败', icon: 'none' });
              }
            },
            fail: (err) => {
              uni.showToast({ title: '上传失败: ' + (err?.errMsg || ''), icon: 'none' });
            },
            complete: () => {
              uni.hideLoading();
            }
          });
        },
        fail: () => {
          uni.showToast({ title: '取消选择', icon: 'none' });
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
    },
    
    // 根据安全等级获取CSS类名
    getSafetyLevelClass(level) {
      switch (level) {
        case 1:
          return 'excellent';
        case 2:
          return 'good';
        case 3:
          return 'poor';
        default:
          return '';
      }
    },
    
    // 根据安全等级获取进度条CSS类名
    getProgressBarClass(level) {
      switch (level) {
        case 1:
          return 'progress-excellent';
        case 2:
          return 'progress-good';
        case 3:
          return 'progress-poor';
        default:
          return '';
      }
    },
    
    // 获取安全等级文本
    getSafetyLevelText(levelId) {
      if (levelId === 1) {
        return '优秀';
      } else if (levelId === 2) {
        return '一般';
      } else {
        return '较差';
      }
    },

    // 新增方法：添加安全评分
    addSafetyScore() {
      uni.navigateTo({
        url: `/pages/personal/userDetail/SafetyScoreEdit?mode=add&safeId=${this.formData.safeId}&addressId=${this.formData.addressId}`,
        events: {
          // 监听安全评分更新事件
          safetyScoreUpdated: (data) => {
            // 更新本地数据
            if (data.addressId === this.formData.addressId) {
              this.formData.fireSafetyScore = {
                scoreItems: data.scoreItems,
                safeId: data.safeId
              };
              
              // 显示更新成功提示
              uni.showToast({
                title: '安全评分已添加',
                icon: 'success',
                duration: 2000
              });
            }
          }
        }
      });
    },

    // 新增方法：编辑安全评分
    editSafetyScore() {
      uni.navigateTo({
        url: `/pages/personal/userDetail/SafetyScoreEdit?mode=edit&safeId=${this.formData.safeId}&addressId=${this.formData.addressId}`,
        events: {
          // 监听安全评分更新事件
          safetyScoreUpdated: (data) => {
            // 更新本地数据
            if (data.addressId === this.formData.addressId) {
              this.formData.fireSafetyScore = {
                ...this.formData.fireSafetyScore,
                scoreItems: data.scoreItems,
                safeId: data.safeId
              };
              
              // 显示更新成功提示
              uni.showToast({
                title: '安全评分已更新',
                icon: 'success',
                duration: 2000
              });
            }
          }
        }
      });
    },
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
  padding-bottom: 220rpx;
  height: calc(100vh - 80rpx);
  overflow-y: auto;
}

.form-content {
  background: transparent;
  padding: 0;
  margin: 0;
}

/* 位置信息区域 */
.location-info-section {
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  border-radius: 16rpx;
  box-sizing: border-box;
  
  .section-header {
    padding: 12rpx 24rpx;
    border-bottom: 1rpx solid #f0f0f0;
    background: #f8f9fa;
    
    .section-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #333333;
    }
  }
}

/* 安全信息区域 */
.safety-section {      
  margin-top: 20rpx;
  background: #ffffff;
  overflow: hidden;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  
  .section-header {
    padding: 12rpx 24rpx;
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
  
  .safety-content {
    padding: 12rpx 20rpx;
    width: 100%;
    box-sizing: border-box;
    .safety-summary {
      display: flex;
      box-sizing: border-box;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
    }
    
    .safety-score-display {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      gap: 6rpx;
      background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
      border: 1rpx solid #e6f4ff;
      border-radius: 12rpx;
      padding: 12rpx 16rpx;
      transition: all 0.3s ease;
      flex: 1;
      min-width: 0;
      .score-display-content {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
      }
      
      &:hover {
        transform: translateY(-2rpx);
        box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.15);
      }
    }
    
    .score-label {
      font-size: 26rpx;
      color: #333333;
      font-weight: 500;
      white-space: nowrap;
    }
    
    .score-value {
      font-size: 32rpx;
      color: #007aff;
      font-weight: 700;
      white-space: nowrap;
    }
    
    .level-value {
      font-size: 26rpx;
      font-weight: 500;
      white-space: nowrap;
      
      &.excellent {
        color: #34c759;
      }
      
      &.good {
        color: #007aff;
      }
      
      &.poor {
        color: #ff9500;
      }
    }
    
    /* 分数进度条样式 */
    .score-progress-section {
      width: 100%;
    }
    
    .progress-bar-container {
      position: relative;
      width: 100%;
    }
    
    .progress-bar {
      height: 14rpx;
      background: #e8f4ff;
      border-radius: 8rpx;
      overflow: hidden;
      position: relative;
      width: 100%;
    }
    
    .progress-fill {
      height: 100%;
      border-radius: 8rpx;
      transition: width 0.6s ease;
      
      &.progress-excellent {
        background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
      }
      
      &.progress-good {
        background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
      }
      
      &.progress-poor {
        background: linear-gradient(90deg, #fa8c16 0%, #ffa940 100%);
      }
    }
    
    .progress-markers {
      display: flex;
      justify-content: space-between;
      position: relative;
      width: 100%;
    }
    
    .marker {
      position: relative;
      width: 60rpx;
      text-align: center;
      
      &::before {
        content: '';
        position: absolute;
        top: -6rpx;
        left: 50%;
        transform: translateX(-50%);
        width: 2rpx;
        height: 10rpx;
        background: #d9d9d9;
      }
    }
    
    .marker-text {
      font-size: 20rpx;
      color: #666666;
      font-weight: 500;
    }
  }
}

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
    
    .header-actions {
      display: flex;
      align-items: center;
    }
  }
  
  .gate-list,
  .contact-list {
    padding: 0 24rpx;
  }
  
  .gate-item,
  .contact-item {
    padding: 16rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background: #fafbfc;
    }
  }
}

/* 联系人弹窗样式 */
.contact-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8rpx);
}

.modal-content {
  width: 95%;
  max-width: 600rpx;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 
    0 32rpx 64rpx rgba(0, 0, 0, 0.15),
    0 8rpx 32rpx rgba(0, 0, 0, 0.1),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 8rpx;
  align-items: center;
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  position: relative;
  color: #ffffff;
}
.modal-title {
  font-size: 24rpx;
  font-weight: 600;
  color: #ffffff;
  flex: 1;
  text-align: left;
  padding-left: 20rpx;
  letter-spacing: 0.5rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.close-btn {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10rpx);
  
  &:active {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(0.9) rotate(90deg);
  }
}

.modal-body {
  padding: 20rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  background: #ffffff;
}

.form-group {
  display: flex;
  flex-direction: column;
  position: relative;
}

.form-label {
  font-size: 30rpx;
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 16rpx;
  letter-spacing: 0.5rpx;
  display: flex;
  align-items: center;
  position: relative;
}

.required {
  color: #e74c3c;
  margin-left: 6rpx;
  font-weight: 700;
  font-size: 32rpx;
}

.form-input {
  height: 88rpx;
  padding: 0 28rpx;
  border: 2rpx solid #e1e8ed;
  border-radius: 20rpx;
  font-size: 30rpx;
  color: #2c3e50;
  box-sizing: border-box;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: 0.5rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:focus {
    background: #ffffff;
    border-color: #1890ff;
    box-shadow: 
      0 0 0 6rpx rgba(24, 144, 255, 0.1),
      inset 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
    outline: none;
    transform: translateY(-2rpx);
  }
  
  &::placeholder {
    color: #95a5a6;
    font-size: 30rpx;
    font-weight: 400;
  }
}

.form-modal-input {
  height: 64rpx;
  padding: 0 16rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #333333;
  box-sizing: border-box;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: 0.5rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

.contact-type-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.type-option {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  border: 2rpx solid #e1e8ed;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  
  &:active {
    transform: scale(0.98) translateY(2rpx);
  }
  
  &.active {
    border-color: #1890ff;
    background: linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(24, 144, 255, 0.03) 100%);
    box-shadow: 
      0 0 0 6rpx rgba(24, 144, 255, 0.1),
      0 4rpx 16rpx rgba(24, 144, 255, 0.15);
    transform: translateY(-2rpx);
  }
}

.checkbox {
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid #cbd5e0;
  border-radius: 6rpx;
  margin-right: 16rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  
  .type-option.active & {
    border-color: #1890ff;
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
    box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
  }
}

.checkbox-inner {
  width: 20rpx;
  height: 20rpx;
  background: transparent;
  border-radius: 0;
  transform: scale(0);
  animation: checkmark 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  position: relative;
  
  /* 使用图片 */
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.type-label {
  font-size: 24rpx;
  color: #2c3e50;
  font-weight: 500;
  flex: 1;
  
  .type-option.active & {
    color: #1890ff;
    font-weight: 600;
  }
}

@keyframes checkmark {
  from {
    transform: scale(0) rotate(-45deg);
  }
  to {
    transform: scale(1) rotate(0deg);
  }
}

.modal-footer {
  display: flex;
  padding: 10rpx;
  border-top: 1rpx solid #e1e8ed;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  gap: 20rpx;
}

.footer-btn {
  flex: 1;
  height: 68rpx;
  line-height: 68rpx;
  border: none;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
  letter-spacing: 0.5rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &:active {
    transform: translateY(3rpx);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:active::before {
    left: 100%;
  }
}

.cancel-btn {
  color: #636e72;
}

.confirm-btn {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: #ffffff; 
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
  letter-spacing: 0.5rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

/* 弹窗动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(80rpx) scale(0.85);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
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

/* 安全评分显示样式 */
.safety-score-item {
  .safety-score-display {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  
  .score-value {
    font-size: 40rpx;
    color: #1890ff;
    font-weight: 700;
    letter-spacing: 0.5rpx;
    background: linear-gradient(135deg, #e6f7ff 0%, #f0f8ff 100%);
    padding: 16rpx 24rpx;
    border-radius: 12rpx;
    border: 2rpx solid #bae7ff;
  }
}

/* 安全等级显示样式 */
.safety-level-item {
  position: relative;
  
  .safety-level-display {
  flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16rpx;
  }
  
  .safety-level-text {
    font-size: 36rpx;
    font-weight: 700;
    letter-spacing: 0.5rpx;
    padding: 16rpx 24rpx;
  border-radius: 12rpx;
    
    &.safety-level-excellent {
      color: #52c41a;
      background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
      border: 2rpx solid #b7eb8f;
    }
    
    &.safety-level-general {
      color: #1890ff;
      background: linear-gradient(135deg, #e6f7ff 0%, #cceeff 100%);
      border: 2rpx solid #91d5ff;
    }
    
    &.safety-level-poor {
      color: #fa8c16;
      background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
      border: 2rpx solid #ffd591;
    }
  }
}





/* 大门配置样式 */
.gate-name {
  font-size: 24rpx;
  color: #2c3e50;
  font-weight: 600;
  letter-spacing: 0.3rpx;
}

.gate-switch {
  transform: scale(0.8);
}

/* 联系人样式 */
.contact-info {
  flex: 1;
  margin-right: 16rpx;
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.contact-name {
  font-size: 24rpx;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  letter-spacing: 0.3rpx;
}

.contact-type {
  font-size: 24rpx;
  color: #1890ff;
  background: linear-gradient(135deg, #e6f7ff 0%, #cceeff 100%);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  margin-left: 16rpx;
  font-weight: 500;
}

.contact-phone {
  font-size: 24rpx;
  color: #34495e;
  font-weight: 400;
}

/* 图片上传区域样式 */
.image-upload-area {
  padding: 24rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  align-items: flex-start;
}

/* 图片列表样式 */
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 150rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: #f5f5f5;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  }
}

.map-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 16rpx;
}

/* 上传按钮样式 */
.upload-btn {
  width: 200rpx;
  height: 150rpx;
  border: 2rpx dashed #d9d9d9;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fafbfc;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #1890ff;
    background: #f0f8ff;
    transform: translateY(-2rpx);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.upload-icon {
  width: 68rpx;
  height: 68rpx;
  margin-bottom: 12rpx;
  opacity: 0.6;
}

.upload-text {
  font-size: 24rpx;
  color: #666666;
  font-weight: 500;
}

/* 空状态样式调整 */
.empty-upload-state {
  width: 100%;
  padding: 48rpx 24rpx;
  text-align: center;
  color: #95a5a6;
  font-size: 28rpx;
  background: #fafbfc;
  border-radius: 12rpx;
  border: 2rpx dashed #d9d9d9;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-actions {
  display: flex;
  gap: 16rpx;
}

/* 操作图标样式 */
.action-icon {
  width: 32rpx;
  height: 32rpx;
  padding: 6rpx;
  border-radius: 12rpx;
  background: #f5f5f5;
  transition: all 0.3s ease;
  
  &:active {
    background: #e6e6e6;
    transform: scale(0.95);
  }
}

.add-icon {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  
  &:active {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  }
}

.edit-icon {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  margin-right: 16rpx;
  
  &:active {
    background: linear-gradient(135deg, #096dd9 0%, #0050b3 100%);
  }
}

.delete-icon {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  
  &:active {
    background: linear-gradient(135deg, #ff7875 0%, #ffa39e 100%);
  }
}



/* 空状态样式 */
.empty-state {
  padding: 48rpx 24rpx;
  text-align: center;
  color: #95a5a6;
  font-size: 28rpx;
  background: #fafbfc;
  border-radius: 12rpx;
  margin: 10rpx 24rpx;
  border: 2rpx dashed #d9d9d9;
}

.empty-text {
  color: #95a5a6;
  font-size: 28rpx;
    font-weight: 400;
  }
  
/* 错误提示样式 */
.error-message {
  padding: 16rpx 24rpx;
  margin: 0 24rpx 16rpx 24rpx;
  background: linear-gradient(135deg, #fff2f0 0%, #ffebee 100%);
  border: 1rpx solid #ffccc7;
  border-radius: 12rpx;
  animation: shake 0.5s ease-in-out;
}

.error-text {
  color: #ff4d4f;
  font-size: 24rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  
  &::before {
    content: '⚠';
    margin-right: 8rpx;
    font-size: 28rpx;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4rpx); }
  75% { transform: translateX(4rpx); }
}

/* 底部按钮 */
  .footer {
    display: flex;
    padding: 16rpx 32rpx;
    gap: 24rpx;
    background: #ffffff;
    border-top: 1rpx solid #e8f4ff;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
  }
  
  .footer-btn {
    flex: 1;
    border-radius: 16rpx;
    font-size: 24rpx;
    font-weight: 600;
    border: none;
    position: relative;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;  
    &:active {
      transform: scale(0.98);
    }
}

.cancel-btn {
  background: #ffffff;
  color: #666666;
  border: 2rpx solid #e8f4ff;
  font-weight: 600;
  
  &:active {
    background: #f8f9fa;
    border-color: #d9d9d9;
  }
}

.confirm-btn {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
  letter-spacing: 0.5rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

/* 移动端优化 */
@media (max-width: 750rpx) {
  .section-container {
    margin: 20rpx 24rpx;
  }
  
  .section-header {
    padding: 16rpx 20rpx;
  }
  
  .form-item {
    padding: 0rpx 20rpx;
    min-height: 88rpx;
  }
  
  .form-label {
    font-size: 24rpx;
    min-width: 140rpx;
    margin-right: 24rpx;
  }
  
  .form-input,
  .form-textarea,
  .picker-display {
    font-size: 24rpx;
  }
  
  .form-input {
    height: 68rpx;
    padding: 0 20rpx;
  }
  
  .form-textarea {
    min-height: 68rpx;
    padding: 0 20rpx;
  }
  
  .picker-display {
    height: 68rpx;
    padding: 0 20rpx;
  }
  
  .footer {
    padding: 20rpx 24rpx;
    gap: 20rpx;
  }
  
  .footer-btn {
    height: 68rpx;
    line-height: 68rpx;
    font-size: 24rpx;
  }
  
  .safety-content {
    padding: 10rpx 16rpx;
    
    .safety-summary {
      flex-direction: column ;
      gap: 10rpx ;
    }
    
    .safety-score-display {
      padding: 12rpx ;
      flex-direction: column ;
      gap: 6rpx ;
      width: 100% ;
    }
    
    .score-label {
      font-size: 24rpx ;
    }
    
    .score-value {
      font-size: 30rpx ;
    }
    
    .level-value {
      font-size: 26rpx ;
    }
    
    .score-progress-section {
      margin: 10rpx 0 ;
    }
    
    .progress-bar {
      height: 12rpx ;
    }
    
    .marker {
      width: 50rpx ;
    }
    
    .marker-text {
      font-size: 18rpx ;
    }
  }
}

/* 超小屏幕优化 */
@media (max-width: 600rpx) {
  .section-container {
    margin: 16rpx 20rpx;
  }
  
  .section-header {
    padding: 16rpx 20rpx;
  }
  
  .form-item {
    padding: 0rpx 20rpx;
    min-height: 80rpx;
  }
  
  .form-label {
    font-size: 28rpx;
    min-width: 120rpx;
    margin-right: 20rpx;
  }
  
  .form-input,
  .form-textarea,
  .picker-display {
    font-size: 28rpx;
  }
  
  .form-input {
    height: 60rpx;
    padding: 0 16rpx;
  }
  
  .form-textarea {
    min-height: 60rpx;
    padding: 0 20rpx;
  }
  
  .picker-display {
    height: 60rpx;
    padding: 0 16rpx;
  }
  
  .footer-btn {
    height: 68rpx;
    line-height: 68rpx;
    font-size: 24rpx;
  }
  

}
</style> 
<style lang="scss">
/* 提升 uni 提示层层级，确保在联系人弹窗 (.contact-modal, z-index: 1000) 之上显示 */
:deep(.uni-toast),
:deep(.uni-toast__box) {
  z-index: 3000 !important;
}

:deep(.uni-mask) {
  z-index: 2999 !important;
}
</style>