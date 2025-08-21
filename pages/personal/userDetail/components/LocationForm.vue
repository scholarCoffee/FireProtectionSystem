<template>
    <view class="location-form">
      <!-- 默认图片配置 -->
      <view class="location-info-section">
        <view class="section-header">
          <text class="section-title">展示图片<text class="required">*</text></text>
        </view>
        
        <view class="default-image-upload-area">
          <!-- 已设置的默认图片 -->
          <view class="default-image-preview" v-if="formData.defaultImg">
            <image :src="serverUrl + formData.defaultImg" class="default-image" mode="aspectFill" />
            <view class="delete-btn-overlay">
              <button class="delete-btn-small" @tap="deleteDefaultImage">
                <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="delete-icon-small" />
              </button>
            </view>
          </view>
          
          <!-- 上传默认图片按钮 -->
          <view class="upload-default-btn" v-if="!formData.defaultImg" @tap="addDefaultImage">
            <image :src="serverUrl + '/static/icons/common/add-third-grey.png'" class="upload-icon" />
            <text class="upload-text">上传展示图片</text>
          </view>
          
          <!-- 错误提示 -->
          <view v-if="errors.defaultImg" class="error-message">
            <text class="error-text">{{ errors.defaultImg }}</text>
          </view>
        </view>
      </view>
  
      <!-- 位置信息区域 -->
      <view class="config-section">
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
                <text class="level-value" :class="safetyLevelClass">
                  ({{ safetyLevelText }})
                </text>
              </view>
              <!-- 分数进度条 -->
              <view class="score-progress-section">
                <view class="progress-bar-container">
                  <view class="progress-bar">
                  <view 
                     class="progress-fill" 
                     :style="{ width: Math.min(calculateTotalScore(), 100) + '%' }"
                     :class="progressBarClass"
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
          <view class="upload-btn" v-if="formData.imgList && formData.imgList.length < 3" @tap="addImage">
            <image :src="serverUrl + '/static/icons/common/add-third-grey.png'" class="upload-icon" />
            <text class="upload-text">上传图片</text>
          </view>
        </view>
      </view>

      <!-- 作战实景部署（仅：重点单位 type === 2） -->
      <view class="config-section" v-if="formData.type === 2">
        <view class="section-header">
          <text class="section-title">作战实景部署</text>
        </view>
        <view class="deployment-section">
          <!-- 已上传：视频或动画（图片），仅 1 个 -->
          <view v-if="formData.battleDeploymentVideos && formData.battleDeploymentVideos.length > 0" class="video-wrapper">
            <video v-if="isVideoPath(formData.battleDeploymentVideos[0])" :src="serverUrl + formData.battleDeploymentVideos[0]" class="deploy-video" controls></video>
            <image v-else :src="serverUrl + formData.battleDeploymentVideos[0]" class="deploy-image" mode="aspectFill" />
            <!-- 删除按钮放在右上角 -->
            <view class="delete-btn-overlay">
              <button class="delete-btn-small" @tap="deleteDeploymentMedia">
                <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="delete-icon-small" />
              </button>
            </view>
          </view>
          <!-- 未上传：统一上传入口（视频/动画 二选一） -->
          <view class="upload-btn" v-else @tap="chooseDeploymentMedia">
            <image :src="serverUrl + '/static/icons/common/add-third-grey.png'" class="upload-icon" />
            <text class="upload-text">上传视频或动画</text>
          </view>
          
          <!-- 上传loading状态 -->
          <view v-if="uploadingDeployment" class="upload-loading">
            <view class="loading-spinner"></view>
            <text class="loading-text">上传中...</text>
          </view>
        </view>
      </view>

      <!-- 自定义底部选择器（替代系统 actionSheet，保证纯白底无阴影） -->
      <view class="sheet-mask" v-if="showMediaSheet" @tap="closeSheet">
        <view class="sheet-panel" @tap.stop>
          <view class="sheet-item" @tap="onSelectSheet('video')">上传视频</view>
          <view class="sheet-item" @tap="onSelectSheet('image')">上传动画</view>
          <view class="sheet-cancel" @tap="closeSheet">取消</view>
        </view>
      </view>

      <!-- 户主信息与反馈（仅：高层小区 type === 1） -->
      <view class="config-section" v-if="formData.type === 1">
        <view class="section-header">
          <text class="section-title">户主信息</text>
        </view>
        <view class="form-item">
          <text class="form-label">户主姓名</text>
          <input v-model="formData.householdOwnerName" class="form-input" placeholder="请输入户主姓名" maxlength="20" />
        </view>
        <view class="form-item">
          <text class="form-label">联系电话</text>
          <input v-model="formData.householdOwnerPhone" class="form-input" placeholder="请输入联系电话" maxlength="20" />
        </view>
        <view class="form-item description-item">
          <text class="form-label">户主反馈</text>
          <textarea v-model="formData.householdFeedback" class="form-textarea" placeholder="请输入反馈信息" maxlength="500" auto-height show-confirm-bar="false" />
        </view>
      </view>

      <view class="config-section" v-if="formData.type === 1">
        <view class="section-header">
          <text class="section-title">搜救情况</text>
        </view>
        <view class="form-item description-item">
          <text class="form-label">描述</text>
          <textarea v-model="formData.rescueRemark" class="form-textarea" placeholder="请输入搜救情况描述" maxlength="500" auto-height show-confirm-bar="false" />
        </view>
      </view>
    </view>
  </template>
  
  <script>
  import { 
    getSafetyLevelByScore, 
    getSafetyLevelText, 
    getSafetyLevelClass, 
    getProgressBarClass 
  } from './safetyScoreData.js';

  export default {
    name: 'LocationForm',
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
      },
      locationTypeOptions: {
        type: Array,
        required: true
      },
      editId: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        gateOptions: [
          { name: '东门', type: 1 },
          { name: '南门', type: 2 },
          { name: '西门', type: 3 },
          { name: '北门', type: 4 }
        ],
        contactTypeOptions: [
          { value: 1, label: '单位负责人' },
          { value: 2, label: '消防负责人' }
        ],
        showContactModalFlag: false,
        contactModalMode: 'add',
        contactForm: {
          name: '',
          phone: '',
          type: 1,
          index: -1
        },
        showMediaSheet: false,
        uploadingDeployment: false
      }
    },
    created() {
      // 初始化扩展字段，确保响应式
      if (!this.formData.battleDeploymentVideos) this.$set(this.formData, 'battleDeploymentVideos', [])
      if (!this.formData.battleDeploymentAnimations) this.$set(this.formData, 'battleDeploymentAnimations', [])
      if (this.formData.householdOwnerName === undefined) this.$set(this.formData, 'householdOwnerName', '')
      if (this.formData.householdOwnerPhone === undefined) this.$set(this.formData, 'householdOwnerPhone', '')
      if (this.formData.householdFeedback === undefined) this.$set(this.formData, 'householdFeedback', '')
      if (this.formData.rescueRemark === undefined) this.$set(this.formData, 'rescueRemark', '')
    },
    
    mounted() {
      // 处理数据回显，确保字段正确映射
      this.handleDataMapping();
    },
    computed: {
      contactTypeLimits() {
        const unitContacts = this.formData?.phoneList?.filter(contact => contact.type === 1);
        const fireContacts = this.formData?.phoneList?.filter(contact => contact.type === 2);
        
        return {
          unitFull: unitContacts?.length >= 1,
          fireFull: fireContacts?.length >= 1
        };
      },
      
      safetyLevelClass() {
        const totalScore = this.calculateTotalScore();
        const level = getSafetyLevelByScore(totalScore);
        return getSafetyLevelClass(level);
      },
      
      safetyLevelText() {
        const totalScore = this.calculateTotalScore();
        const level = getSafetyLevelByScore(totalScore);
        return getSafetyLevelText(level);
      },
      
      progressBarClass() {
        const totalScore = this.calculateTotalScore();
        const level = getSafetyLevelByScore(totalScore);
        return getProgressBarClass(level);
      }
    },
    methods: {
      // 处理数据回显和字段映射
      handleDataMapping() {
        // 处理作战实景部署字段映射（兼容新旧字段名）
        if (this.formData.battleDeploymentMaterials && this.formData.battleDeploymentMaterials.length > 0) {
          // 如果存在 battleDeploymentMaterials，将其映射到 battleDeploymentVideos
          this.formData.battleDeploymentVideos = [...this.formData.battleDeploymentMaterials];
        }
        
        // 确保户主信息字段存在且不为 undefined
        if (this.formData.householdOwnerName === undefined) this.formData.householdOwnerName = '';
        if (this.formData.householdOwnerPhone === undefined) this.formData.householdOwnerPhone = '';
        if (this.formData.householdFeedback === undefined) this.formData.householdFeedback = '';
        if (this.formData.rescueRemark === undefined) this.formData.rescueRemark = '';
        
        // 确保作战实景部署字段存在
        if (!this.formData.battleDeploymentVideos) this.formData.battleDeploymentVideos = [];
      },
      
      // 输入事件处理
      onAddressNameInput(e) {
        this.$emit('validate-field', 'addressName', e.detail.value);
      },
      
      onAddressExtInput(e) {
        this.$emit('validate-field', 'addressExt', e.detail.value);
      },
      
      onAddressIdInput(e) {
        this.$emit('validate-field', 'addressId', e.detail.value);
      },
      
      onAllSenceLinkInput(e) {
        this.$emit('validate-field', 'allSenceLink', e.detail.value);
      },
      
      onLocationTypeChange(e) {
        const newType = this.locationTypeOptions[e.detail.value].value;
        const oldType = this.formData.type;
        
        // 如果类型发生变化，处理相关字段
        if (newType !== oldType) {
          // 保存原有信息，用于后续反填
          const originalHouseholdInfo = {
            householdOwnerName: this.formData.householdOwnerName || '',
            householdOwnerPhone: this.formData.householdOwnerPhone || '',
            householdFeedback: this.formData.householdFeedback || '',
            rescueRemark: this.formData.rescueRemark || ''
          };
          
          const originalBattleDeployment = this.formData.battleDeploymentVideos || [];
          
          // 清空相关字段
          if (oldType === 1) {
            this.formData.householdOwnerName = '';
            this.formData.householdOwnerPhone = '';
            this.formData.householdFeedback = '';
            this.formData.rescueRemark = '';
          }
          
          if (oldType === 2) {
            this.formData.battleDeploymentVideos = [];
          }
          
          // 如果切换到高层小区（type=1），反填户主信息
          if (newType === 1 && (originalHouseholdInfo.householdOwnerName || originalHouseholdInfo.householdOwnerPhone || originalHouseholdInfo.householdFeedback || originalHouseholdInfo.rescueRemark)) {
            this.formData.householdOwnerName = originalHouseholdInfo.householdOwnerName;
            this.formData.householdOwnerPhone = originalHouseholdInfo.householdOwnerPhone;
            this.formData.householdFeedback = originalHouseholdInfo.householdFeedback;
            this.formData.rescueRemark = originalHouseholdInfo.rescueRemark;
          }
          
          // 如果切换到重点单位（type=2），反填作战实景部署
          if (newType === 2 && originalBattleDeployment.length > 0) {
            this.formData.battleDeploymentVideos = [...originalBattleDeployment];
            // 同时更新 battleDeploymentMaterials 字段以保持一致性
            this.formData.battleDeploymentMaterials = [...originalBattleDeployment];
          }
        }
        
        this.formData.type = newType;
        this.$emit('validate-field', 'type', this.formData.type);
      },
      
      getLocationTypeText(type) {
        const option = this.locationTypeOptions.find(item => item.value === type);
        return option ? option.label : '请选择类型';
      },
      
      getContactTypeText(type) {
        const option = this.contactTypeOptions.find(item => item.value === type);
        return option ? option.label : '未知类型';
      },
      
      // 可出行大门管理方法
      isGateSelected(gateName) {
        return this.formData?.enterGateList?.some(gate => gate.name === gateName);
      },
      
      toggleGate(gateName) {
        const existingIndex = this.formData.enterGateList.findIndex(gate => gate.name === gateName);
        if (existingIndex >= 0) {
          this.formData.enterGateList.splice(existingIndex, 1);
        } else {
          const gateOption = this.gateOptions.find(option => option.name === gateName);
          this.formData.enterGateList.push({
            name: gateName,
            type: gateOption ? gateOption.type : this.formData.enterGateList.length + 1
          });
        }
        
        if (this.errors.enterGateList) {
          this.$emit('clear-error', 'enterGateList');
        }
      },
      
      // 联系人管理方法
      showContactModal(mode = 'add', index = -1) {
        if (mode === 'add' && this.formData.phoneList.length >= 2) {
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
        this.contactForm.index = index;
        
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
  
      saveContact() {
        this.hideContactModal();
        if (!this.contactForm.name || !this.contactForm.phone || !this.contactForm.type) {
          uni.showToast({
            title: '请填写完整信息',
            icon: 'none'
          });
          return;
        }
  
        if (this.contactModalMode === 'add') {
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
          const oldContact = this.formData.phoneList[this.contactForm.index];
          if (oldContact.type !== this.contactForm.type) {
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
              
        if (this.errors.phoneList) {
          this.$emit('clear-error', 'phoneList');
        }
        
        uni.showToast({
          title: this.contactModalMode === 'add' ? '联系人添加成功' : '联系人更新成功',
          icon: 'success'
        });
      },
      
      deletePhoneContact(index) {
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
              
              if (this.errors.phoneList) {
                this.$emit('clear-error', 'phoneList');
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
                name: 'locationImg_' + this.editId + Math.ceil(Math.random()*10),
              },
              success: (uploadRes) => {
                try {
                  const parsed = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data;
                  const backImg = parsed?.data || '';
                  if (!backImg) {
                    throw new Error('上传返回为空');
                  }
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
      
      // 判断路径是否为视频
      isVideoPath(path) {
        if (!path) return false
        const p = String(path).toLowerCase()
        return p.endsWith('.mp4') || p.endsWith('.mov') || p.endsWith('.m4v') || p.endsWith('.webm') || p.endsWith('.ogg')
      },

      // 作战实景部署：统一选择器
      chooseDeploymentMedia() {
        this.showMediaSheet = true
      },

      // 作战实景部署：上传视频（仅 1 个）
      addDeploymentVideo() {
        uni.chooseVideo({
          sourceType: ['album','camera'],
          compressed: true,
          success: (res) => {
            const filePath = res.tempFilePath
            if (!filePath) {
              uni.showToast({ title: '未选择有效视频', icon: 'none' });
              return
            }
            this.uploadingDeployment = true
            uni.uploadFile({
              url: this.serverUrl + '/files/upload',
              filePath,
              name: 'file',
              fileType: 'video',
              formData: {
                addressId: this.formData.addressId || this.editId || '',
                url: '/uploadVideo/locationEdit',
                name: 'battleVideo_' + (this.editId || 'temp') + '_' + Date.now()
              },
              success: (uploadRes) => {
                try {
                  const parsed = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
                  const backPath = parsed?.data || ''
                  if (!backPath) throw new Error('上传返回为空')
                  // 强制刷新：先清空再赋值，触发响应式更新
                  this.formData.battleDeploymentVideos = []
                  this.$nextTick(() => {
                    this.formData.battleDeploymentVideos = [backPath]
                    // 同时更新 battleDeploymentMaterials 字段以保持一致性
                    this.formData.battleDeploymentMaterials = [backPath]
                  })
                  uni.showToast({ title: '视频上传成功', icon: 'success' })
                } catch (e) {
                  uni.showToast({ title: '视频解析失败', icon: 'none' })
                }
              },
              fail: (err) => {
                uni.showToast({ title: '上传失败: ' + (err?.errMsg || ''), icon: 'none' })
              },
              complete: () => {
                this.uploadingDeployment = false
              }
            })
          },
          fail: () => uni.showToast({ title: '取消选择', icon: 'none' })
        })
      },
      // 自定义选择器
      closeSheet() { this.showMediaSheet = false },
      onSelectSheet(type) {
        this.showMediaSheet = false
        if (type === 'video') this.addDeploymentVideo()
        else this.addDeploymentAnimation()
      },
      deleteDeploymentVideo(index) {
        uni.showModal({
          title: '确认删除',
          content: '确定删除该视频吗？',
          success: (res) => {
            if (res.confirm) this.formData.battleDeploymentVideos.splice(index, 1)
          }
        })
      },
      // 作战实景部署：上传动画（图片，亦仅 1 个）
      addDeploymentAnimation() {
        uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album','camera'],
          success: (res) => {
            const filePath = (res.tempFilePaths && res.tempFilePaths[0]) || (res.tempFiles && res.tempFiles[0]?.path) || ''
            if (!filePath) { uni.showToast({ title: '未选择有效文件', icon: 'none' }); return }
            this.uploadingDeployment = true
            uni.uploadFile({
              url: this.serverUrl + '/files/upload',
              filePath,
              name: 'file',
              fileType: 'image',
              formData: {
                addressId: this.formData.addressId || this.editId || '',
                url: '/uploadImg/locationEdit',
                name: 'battleAnim_' + (this.editId || 'temp') + '_' + Date.now()
              },
              success: (uploadRes) => {
                try {
                  const parsed = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
                  const backPath = parsed?.data || ''
                  if (!backPath) throw new Error('上传返回为空')
                  // 强制刷新：先清空再赋值，触发响应式更新
                  this.formData.battleDeploymentVideos = []
                  this.$nextTick(() => {
                    this.formData.battleDeploymentVideos = [backPath]
                    // 同时更新 battleDeploymentMaterials 字段以保持一致性
                    this.formData.battleDeploymentMaterials = [backPath]
                  })
                  uni.showToast({ title: '动画上传成功', icon: 'success' })
                } catch (e) {
                  uni.showToast({ title: '文件解析失败', icon: 'none' })
                }
              },
              fail: (err) => uni.showToast({ title: '上传失败: ' + (err?.errMsg || ''), icon: 'none' }),
              complete: () => {
                this.uploadingDeployment = false
              }
            })
          },
          fail: () => uni.showToast({ title: '取消选择', icon: 'none' })
        })
      },
      deleteDeploymentMedia() {
        uni.showModal({
          title: '确认删除',
          content: '确定删除该作战素材吗？',
          success: (res) => {
                         if (res.confirm) {
               // 强制刷新：先清空再赋值，触发响应式更新
               this.formData.battleDeploymentVideos = []
               // 同时清空 battleDeploymentMaterials 字段以保持一致性
               this.formData.battleDeploymentMaterials = []
               this.$nextTick(() => {
                 // 确保数组被清空后，页面重新渲染
                 this.$forceUpdate()
               })
               uni.showToast({ title: '删除成功', icon: 'success' })
             }
          }
        })
      },

      // 搜救备注已改为单一描述，无需选择器
      // 默认图片管理方法
      addDefaultImage() {
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
                name: 'locationDefaultImg_' + this.editId + Math.ceil(Math.random()*10),
              },
              success: (uploadRes) => {
                try {
                  const parsed = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data;
                  const backImg = parsed?.data || '';
                  if (!backImg) {
                    throw new Error('上传返回为空');
                  }
                  this.formData.defaultImg = backImg;
                  if (this.errors.defaultImg) {
                    this.$emit('clear-error', 'defaultImg');
                  }
                  uni.showToast({ title: '默认图片上传成功', icon: 'success' });
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
      
      deleteDefaultImage() {
        uni.showModal({
          title: '确认删除',
          content: '确定要删除默认图片吗？',
          success: (res) => {
            if (res.confirm) {
              this.formData.defaultImg = '';
              if (this.errors.defaultImg) {
                this.$emit('clear-error', 'defaultImg');
              }
              uni.showToast({ title: '默认图片已删除', icon: 'success' });
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

      // 添加安全评分
      addSafetyScore() {
        this.$emit('add-safety-score');
      },

      // 编辑安全评分
      editSafetyScore() {
        this.$emit('edit-safety-score');
      }
    }
  }
  </script>

<style lang="scss" scoped>
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
  
  .safety-content {
    padding: 12rpx 20rpx;
    width: 100%;
    box-sizing: border-box;
    
    .safety-summary {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      justify-content: flex-start;
      align-items: flex-start;
      width: 100%;
      gap: 16rpx;
    }
    
    .safety-score-display {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      box-sizing: border-box;
      gap: 12rpx;
      background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
      border: 1rpx solid #e6f4ff;
      border-radius: 12rpx;
      padding: 16rpx 20rpx;
      transition: all 0.3s ease;
      width: 100%;
      min-width: 0;
      
      .score-display-content {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
        gap: 8rpx;
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

.header-actions {
  display: flex;
  align-items: center;
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
  background: #fff;
  gap: 20rpx;
}

.footer-btn {
  flex: 1;
  height: 68rpx;
  line-height: 68rpx;
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
  padding: 12rpx 20rpx; /* 增加上下间距 */
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
  min-height: 120rpx; /* 提升基础高度 */
  padding: 16rpx; /* 增加内边距，提升可读性 */
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
    color: #95a5a6; /* 与输入框placeholder保持一致 */
    font-size: 24rpx;
    font-weight: 400;
    opacity: 0.8;
  }
}

/* 描述字段特殊样式 */
.description-item {
  align-items: flex-start;
  margin-bottom: 20rpx;
  min-height: 120rpx; /* 区块整体最小高度 */
  
  .form-label {
    display: flex;
    align-items: center;
  }
  
  .form-textarea {
    min-height: 120rpx; /* 两处 textarea 高度统一 */
    max-height: 300rpx;
    overflow-y: auto;
    padding: 0rpx 10rpx; /* 与输入框视觉对齐（微信小程序） */
    display: block;
    width: 100%;
    background: #ffffff;
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

/* 默认图片上传区域样式 */
.default-image-upload-area {
  padding: 24rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.default-image-preview {
  position: relative;
  width: 300rpx;
  height: 200rpx;
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

.default-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-default-btn {
  width: 300rpx;
  height: 200rpx;
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

/* 删除按钮覆盖层样式 */
.delete-btn-overlay {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  z-index: 10;
}

.delete-btn-small {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  color: #ffffff;
  border: none;
  padding: 8rpx 8rpx;
  font-size: 20rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.4);
  
  &:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.6);
  }
  
  &:active {
    transform: scale(0.95);
    box-shadow: 0 1rpx 4rpx rgba(255, 77, 79, 0.8);
  }
}

.delete-icon-small {
  width: 24rpx;
  height: 24rpx;
  filter: brightness(0) invert(1);
}

/* 图片列表样式 */
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.video-wrapper {
  position: relative;
  width: 100%;
  border-radius: 16rpx;
  overflow: hidden;
  background: #000;
  margin-bottom: 16rpx;
}

.deploy-video {
  width: 100%;
  height: 300rpx;
  background: #000;
}

/* 与消防地图保持相同的外边距与内部留白 */
.deployment-section {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  position: relative;
}

/* 上传loading状态样式 */
.upload-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  z-index: 10;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.anim-gap {
  margin-top: 16rpx;
}

/* 自定义底部选择器样式：纯白底、无阴影 */
.sheet-mask {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}
.sheet-panel {
  width: 100%;
  background: #ffffff;
  border-top-left-radius: 24rpx;
  border-top-right-radius: 24rpx;
  padding-bottom: env(safe-area-inset-bottom);
}
.sheet-item {
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  font-size: 30rpx;
  color: #333;
}
.sheet-item:last-child { }
.sheet-cancel {
  margin-top: 12rpx;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  font-size: 30rpx;
  color: #1890ff;
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
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
  
  &:active {
    background: linear-gradient(135deg, #096dd9 0%, #0050b3 100%);
  }
}

.delete-icon {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  margin-left: 16rpx;
  
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
</style>