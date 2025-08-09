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
                <text>{{ getLocationTypeText(formData.type) }}</text>
                <image src="/static/icons/common/down.png" class="picker-arrow" />
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
                src="/static/icons/common/add.png" 
                class="action-icon add-icon" 
                @tap="addSafetyScore" 
              />
              <image 
                v-else 
                src="/static/icons/common/edit.png" 
                class="action-icon edit-icon" 
                @tap="editSafetyScore" 
              />
            </view>
          </view>
          
          <view v-if="formData.fireSafetyScore" class="safety-content">
            <view class="form-item safety-score-item">
              <text class="form-label">安全评分</text>
              <view class="safety-score-display">
                <text class="score-value">{{ calculateTotalScore() }}分</text>
              </view>
            </view>
            
            <view class="form-item safety-level-item">
              <view class="form-label">
                <text>安全等级</text>
                <view class="info-icon-container" 
                      @mouseenter="showScoreStandard" 
                      @mouseleave="hideScoreStandard"
                      @touchstart="toggleScoreStandard">
                  <image :src="serverUrl + '/static/icons/common/info.png'" class="info-icon" />
                </view>
              </view>
              <view class="safety-level-display">
                <text class="safety-level-text" :class="getSafetyLevelClass(getSafetyLevelByScore(calculateTotalScore()))">
                  {{ getSafetyLevelText(getSafetyLevelByScore(calculateTotalScore())) }}
                </text>
              </view>
            </view>
            
            <!-- 评分标准提示框 -->
            <view v-if="showScoreTooltip" class="score-tooltip">
              <view class="tooltip-title">评分标准</view>
              <view class="tooltip-content">
                <view class="tooltip-item">
                  <text class="tooltip-label">优秀：</text>
                  <text class="tooltip-text">90分及以上</text>
                </view>
                <view class="tooltip-item">
                  <text class="tooltip-label">一般：</text>
                  <text class="tooltip-text">70-89分</text>
                </view>
                <view class="tooltip-item">
                  <text class="tooltip-label">较差：</text>
                  <text class="tooltip-text">70分以下</text>
                </view>
              </view>
            </view>
            
            <!-- 安全信息组件 -->
            <SafetyScoreDetail 
              :safetyScoreData="formData.fireSafetyScore"
              :addressId="editId"
            />
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
            <view class="header-actions">
              <image :src="serverUrl + '/static/icons/common/add-white.png'" class="action-icon add-icon" @tap="showContactModal" />
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
                <image :src="serverUrl + '/static/icons/common/edit.png'" class="action-icon edit-icon" @tap="editPhoneContact(index)" />
                <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="action-icon delete-icon" @tap="deletePhoneContact(index)" />
              </view>
            </view>
          </view>
          
          <view v-else class="empty-state">
            <text class="empty-text">暂无联系人，点击上方"+"添加</text>
          </view>
        </view>
        
        <!-- 消防地图配置 -->
        <view class="config-section">
          <view class="section-header">
            <text class="section-title">消防地图</text>
            <view class="header-actions">
              <image :src="serverUrl + '/static/icons/common/add-white.png'" class="action-icon add-icon" @tap="addImage" v-if="formData.imgList.length < 3" />
            </view>
          </view>
          
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
          
          <view v-else class="empty-state">
            <text class="empty-text">暂无消防地图，点击上方"+"添加</text>
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
      // 评分标准提示框显示状态
      showScoreTooltip: false,

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
  
  onShow() {
    // 页面显示时，如果是编辑模式且有地址ID，且安全信息为空时才刷新
    if (this.type === 'location' && this.editId && this.mode === 'edit' && !this.formData.fireSafetyScore) {
      this.refreshSafetyInfo();
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
          imgList: [], // 消防地图图片列表
          createTime: '', // 创建时间
          updateTime: '', // 更新时间
          status: 1, // 数据状态，默认启用
          recordId: '' // 记录编号
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
              imgList: responseData.imgList || [],
              createTime: responseData.createTime || '',
              updateTime: responseData.updateTime || '',
              status: responseData.status || 1,
              recordId: responseData.recordId || ''
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
            duration: 2000
          });
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
    },
    
    // 显示评分标准提示框
    showScoreStandard() {
      this.showScoreTooltip = true;
    },
    
    // 隐藏评分标准提示框
    hideScoreStandard() {
      this.showScoreTooltip = false;
    },
    
    // 触摸切换评分标准提示框（移动端支持）
    toggleScoreStandard() {
      this.showScoreTooltip = !this.showScoreTooltip;
    },
    
    // 获取安全等级的CSS类名
    getSafetyLevelClass(levelId) {
      if (levelId === 1) {
        return 'safety-level-excellent'; // 优秀 - 绿色
      } else if (levelId === 2) {
        return 'safety-level-general'; // 一般 - 蓝色
      } else {
        return 'safety-level-poor'; // 较差 - 橙色
      }
    },

         // 新增方法：添加安全评分
     addSafetyScore() {
       uni.navigateTo({
         url: `/pages/personal/userDetail/SafetyScoreEdit?mode=add&addressId=${this.editId || this.formData.addressId}`
       });
     },

         // 新增方法：编辑安全评分
     editSafetyScore() {
       uni.navigateTo({
         url: `/pages/personal/userDetail/SafetyScoreEdit?mode=edit&addressId=${this.editId || this.formData.addressId}`
       });
     },

    // 新增方法：格式化日期时间
    formatDateTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
     
    // 新增方法：刷新安全信息
    async refreshSafetyInfo() {
      try {
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/location/detail',
            method: 'GET',
            data: { addressId: this.editId },
            success: resolve,
            fail: reject
          });
        });
         
        if (result.data && result.data.code === 200) {
          const responseData = result.data.data;
          // 只更新安全信息相关字段
          if (responseData.fireSafetyScore) {
            this.formData.fireSafetyScore = responseData.fireSafetyScore;
          }
        }
      } catch (error) {
        console.log('刷新安全信息失败:', error);
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
  padding-bottom: 120rpx;
  height: calc(100vh - 100rpx);
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
  margin-bottom: 16rpx;
  
  .section-header {
    padding: 20rpx 24rpx;
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
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 16rpx;
  
  .section-header {
    padding: 20rpx 24rpx;
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
    .form-item {
      padding: 16rpx 20rpx;
      border-bottom: 1rpx solid #f5f5f5;
      display: flex;
      align-items: center;
      min-height: 72rpx;
      
      &:last-child {
        border-bottom: none;
      }
    }
  }
}

/* 配置区域 */
.config-section {
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 16rpx;
  
  .section-header {
    padding: 16rpx 20rpx;
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

/* 表单项样式 */
.form-item {
  margin: 0;
  padding: 10rpx 10rpx;
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
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: 500;
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
  font-size: 32rpx;
  color: #34495e;
  background: #f8f9fa;
  box-sizing: border-box;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  letter-spacing: 0.3rpx;
  transition: all 0.3s ease;
  
  &:focus {
    background: #ffffff;
    box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
    outline: none;
  }
  
  &::placeholder {
    color: #95a5a6;
    font-size: 32rpx;
    font-weight: 400;
  }
}

.form-textarea {
  flex: 1;
  min-height: 64rpx;
  padding: 16rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  color: #333333;
  background: #f8f9fa;
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
  min-height: 80rpx;
  
  .form-label {
    display: flex;
    align-items: center;
    margin-top: 8rpx;
  }
  
  .form-textarea {
    min-height: 48rpx;
    max-height: 120rpx;
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
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 32rpx;
  color: #333333;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  transition: all 0.3s ease;
  
  &:active {
    background: #ffffff;
    box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
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

.info-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 8rpx;
}

.info-icon {
  width: 32rpx;
  height: 32rpx;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
}

/* 评分标准提示框 */
.score-tooltip {
  position: absolute;
  top: 100%;
  right: 0;
  width: 320rpx;
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 16rpx;
  overflow: hidden;
  
  @media (max-width: 750rpx) {
    width: 300rpx;
    right: -20rpx;
  }
  
  @media (max-width: 600rpx) {
    width: 280rpx;
    right: -40rpx;
  }
}

.tooltip-title {
  padding: 24rpx;
  background: linear-gradient(135deg, #f8faff 0%, #e6f7ff 100%);
  border-bottom: 1rpx solid #e5e5e5;
  font-size: 28rpx;
  font-weight: 600;
  color: #1890ff;
  letter-spacing: 0.3rpx;
}

.tooltip-content {
  padding: 24rpx;
}

.tooltip-item {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.tooltip-label {
  font-size: 26rpx;
  color: #2c3e50;
  font-weight: 600;
  min-width: 60rpx;
  letter-spacing: 0.3rpx;
}

.tooltip-text {
  font-size: 26rpx;
  color: #34495e;
  font-weight: 500;
  letter-spacing: 0.3rpx;
}

/* 大门配置样式 */
.gate-name {
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: 600;
  letter-spacing: 0.3rpx;
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
  font-size: 30rpx;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  letter-spacing: 0.3rpx;
}

.contact-type {
  font-size: 26rpx;
  color: #1890ff;
  background: linear-gradient(135deg, #e6f7ff 0%, #cceeff 100%);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  margin-left: 16rpx;
  font-weight: 500;
}

.contact-phone {
  font-size: 26rpx;
  color: #34495e;
  font-weight: 400;
}

/* 图片列表样式 */
.image-list {
  padding: 24rpx;
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
  background: linear-gradient(135deg, #e6f7ff 0%, #cceeff 100%);
  
  &:active {
    background: linear-gradient(135deg, #cceeff 0%, #b3e0ff 100%);
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
  margin: 24rpx;
  border: 2rpx dashed #d9d9d9;
}

.empty-text {
  color: #95a5a6;
  font-size: 28rpx;
  font-weight: 400;
}

/* 底部按钮 */
.footer {
  display: flex;
  padding: 24rpx 32rpx;
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
  height: 96rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: 0.5rpx;
  
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
  box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.3);
  
  &:active {
    background: linear-gradient(135deg, #096dd9 0%, #0050b3 100%);
    box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.4);
  }
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
    padding: 10rpx 10rpx;
    min-height: 88rpx;
  }
  
  .form-label {
    font-size: 30rpx;
    min-width: 140rpx;
    margin-right: 24rpx;
  }
  
  .form-input,
  .form-textarea,
  .picker-display {
    font-size: 30rpx;
  }
  
  .form-input {
    height: 88rpx;
    padding: 0 20rpx;
  }
  
  .form-textarea {
    min-height: 88rpx;
    padding: 20rpx;
  }
  
  .picker-display {
    height: 88rpx;
    padding: 0 20rpx;
  }
  
  .footer {
    padding: 20rpx 24rpx;
    gap: 20rpx;
  }
  
  .footer-btn {
    height: 88rpx;
    font-size: 30rpx;
  }
  
  .score-value {
    font-size: 36rpx;
    padding: 12rpx 20rpx;
  }
  
  .safety-level-text {
    font-size: 32rpx;
    padding: 12rpx 20rpx;
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
    padding: 16rpx 20rpx;
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
    height: 80rpx;
    padding: 0 16rpx;
  }
  
  .form-textarea {
    min-height: 80rpx;
    padding: 16rpx;
  }
  
  .picker-display {
    height: 80rpx;
    padding: 0 16rpx;
  }
  
  .footer-btn {
    height: 80rpx;
    font-size: 28rpx;
  }
  
  .score-value {
    font-size: 32rpx;
    padding: 10rpx 16rpx;
  }
  
  .safety-level-text {
    font-size: 28rpx;
    padding: 10rpx 16rpx;
  }
}
</style> 