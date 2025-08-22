<template>
  <view class="data-edit">
    <!-- 表单内容 -->
    <scroll-view class="form-container" scroll-y="true">
      <!-- Location表单 -->
      <LocationForm 
        v-if="type === 'location'"
        :formData="formData"
        :errors="errors"
        :serverUrl="serverUrl"
        :locationTypeOptions="locationTypeOptions"
        :editId="editId"
        @validate-field="validateField"
        @clear-error="clearError"
        @add-safety-score="addSafetyScore"
        @edit-safety-score="editSafetyScore"
      />
      <!-- Chat表单 -->
      <ChatForm 
        v-if="type === 'chat'"
        :formData="formData"
        :errors="errors"
        :serverUrl="serverUrl"
        @validate-field="validateField"
      />
      <!-- Command表单 -->
      <CommandForm 
        v-if="type === 'command'"
        :formData="formData"
        :errors="errors"
        :serverUrl="serverUrl"
        @validate-field="validateField"
      />
      <!-- 底部占位，防止内容被固定按钮遮挡 -->
      <view class="scroll-spacer"></view>
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
import LocationForm from './components/LocationForm.vue'
import ChatForm from './components/ChatForm.vue'
import CommandForm from './components/CommandForm.vue'

export default {
  components: {
    SafetyScoreDetail,
    LocationForm,
    ChatForm,
    CommandForm
  },
  name: 'DataEdit',
  data() {
    return {
      type: 'location', // location 或 safety 或 command
      mode: 'add', // add 或 edit
      editId: '', // 编辑时的ID
      commandKey: '', // 数据指挥的key
      formData: {},
      // 错误状态
      errors: {},
      serverUrl: 'https://www.xiaobei.space',
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
      },
      // 新增：本地安全评分数据
      localSafetyScore: null
    }
  },
  computed: {
    isEdit() {
      return this.mode === 'edit';
    },
    
    // 检查联系人类型是否已满
    contactTypeLimits() {
      const unitContacts = this.formData?.phoneList?.filter(contact => contact.type === 1);
      const fireContacts = this.formData?.phoneList?.filter(contact => contact.type === 2);
      
      return {
         unitFull: unitContacts?.length >= 1,
         fireFull: fireContacts?.length >= 1
       };
     },
     
    // 安全等级相关的计算属性
    safetyLevelClass() {
      const totalScore = this.calculateTotalScore();
      const level = this.getSafetyLevelByScore(totalScore);
      return this.getSafetyLevelClass(level);
    },
    
    safetyLevelText() {
      const totalScore = this.calculateTotalScore();
      const level = this.getSafetyLevelByScore(totalScore);
      return this.getSafetyLevelText(level);
    },
    
    progressBarClass() {
      const totalScore = this.calculateTotalScore();
      const level = this.getSafetyLevelByScore(totalScore);
      return this.getProgressBarClass(level);
    },
  },
  onLoad(options) {
    this.type = options.type || 'location';
    this.mode = options.mode || 'add';
    this.editId = options.id || '';
    
    // 初始化位置类型选项
    this.initLocationTypeOptions();
    this.initFormData();
    
    // 如果是数据指挥编辑模式，设置初始数据
    if (this.type === 'command' && options.key) {
      this.commandKey = options.key;
      this.formData.commandTitle = decodeURIComponent(options.title || '');
      this.formData.commandDesc = decodeURIComponent(options.desc || '');
      this.formData.commandUrl = decodeURIComponent(options.url || '');
    }
    
    // 检查是否有本地保存的安全评分
    this.checkLocalSafetyScore();
    
    if (this.isEdit && this.editId && this.type !== 'command') {
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
          fireSafetyScore: null, // 安全信息字段，初始化为null
          enterGateList: [], // 可出行大门列表
          phoneList: [], // 联系人列表
          imgList: [], // 消防地图图片列表
          defaultImg: '', // 默认图片
        };
      } else if (this.type === 'chat') {
        this.formData = {
          chatName: '',
          chatType: 1,
          chatDescription: '',
          chatStatus: 1
        };
      } else if (this.type === 'command') {
        this.formData = {
          commandTitle: '',
          commandDesc: '',
          commandUrl: ''
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
              safeId: responseData.safeId || '',
              description: responseData.description || '',
              householdOwnerName: responseData.householdOwnerName || '',
              householdOwnerPhone: responseData.householdOwnerPhone || '',
              householdFeedback: responseData.householdFeedback || '',
              rescueRemark: responseData.rescueRemark || '',
              battleDeploymentVideos: responseData.battleDeploymentMaterials || [],
              battleDeploymentMaterials: responseData.battleDeploymentMaterials || [],
              // 处理安全信息，null时显示为空对象
              fireSafetyScore: responseData.fireSafetyScore || null,
              enterGateList: responseData.enterGateList || [],
              phoneList: responseData.phoneList || [],
              imgList: responseData.imgList || [],
              defaultImg: responseData.defaultImg || '' // 默认图片
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
    
    // 数据指挥表单输入验证
    onCommandTitleInput(e) {
      this.validateField('commandTitle', e.detail.value);
    },
    
    onCommandUrlInput(e) {
      this.validateField('commandUrl', e.detail.value);
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
        // 数据指挥直接保存到本地配置
        if (this.type === 'command') {
          // 导入配置文件并更新
          const { updateCommandConfig } = await import('@/commons/js/commandConfig.js');
          const success = updateCommandConfig(this.commandKey, {
            title: this.formData.commandTitle,
            desc: this.formData.commandDesc,
            url: this.formData.commandUrl
          });
          
          if (success) {
            uni.showToast({
              title: '配置已更新',
              icon: 'success',
              duration: 1500
            });
            
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } else {
            throw new Error('配置更新失败');
          }
          return;
        }
        
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
      
      // 先保存安全评分
      async saveSafetyScoreFirst() {
        try {
          const url = this.serverUrl + '/fireSafetyScore/create';
          const data = {
            addressId: this.formData.addressId || 'TEMP_' + Date.now(),
            scoreItems: this.formData.fireSafetyScore.scoreItems
          };
          
          const result = await new Promise((resolve, reject) => {
            uni.request({
              url,
              method: 'POST',
              data: data,
              success: resolve,
              fail: reject
            });
          });
          
          if (result.data && result.data.code === 200) {
            // 更新safeId
            this.formData.safeId = result.data.data?.safeId || '';
            // 标记不再是本地数据
            this.formData.fireSafetyScore.isLocal = false;
          }
        } catch (error) {
          console.error('保存安全评分失败:', error);
          // 即使失败也继续保存地址信息
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
    
    // 清除错误信息
    clearError(fieldName) {
      if (this.errors[fieldName]) {
        this.errors[fieldName] = '';
      }
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
            this.errors[fieldName] = '请输入位置类型';
          }
        } else if (fieldName === 'defaultImg') {
          if (!value || !value.trim()) {
            this.errors[fieldName] = '请上传默认图片';
          }
        }
      } else if (this.type === 'chat') {
        if (fieldName === 'chatName') {
          if (!value || !value.trim()) {
            this.errors[fieldName] = '请输入聊天名称';
          }
        }
      } else if (this.type === 'command') {
        if (fieldName === 'commandTitle') {
          if (!value || !value.trim()) {
            this.errors[fieldName] = '请输入功能名称';
          }
        } else if (fieldName === 'commandUrl') {
          if (!value || !value.trim()) {
            this.errors[fieldName] = '请输入访问地址';
          } else if (!this.isValidUrl(value)) {
            this.errors[fieldName] = '请输入有效的URL地址';
          }
        }
      }
    },
    
    // URL验证方法
    isValidUrl(string) {
      try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch (_) {
        return false;
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
        this.validateField('defaultImg', this.formData.defaultImg);
        
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

        // 验证默认图片配置：必须配置一张默认图片
        if (!this.formData.defaultImg || !this.formData.defaultImg.trim()) {
          this.errors['defaultImg'] = '必须配置一张默认图片';
          return false;
        }
      } else if (this.type === 'chat') {
        this.validateField('chatName', this.formData.chatName);
      } else if (this.type === 'command') {
        this.validateField('commandTitle', this.formData.commandTitle);
        this.validateField('commandUrl', this.formData.commandUrl);
      }
      
      return !Object.values(this.errors).some(error => error);
    },
    
    // 可出行大门管理方法
    isGateSelected(gateName) {
      return this.formData?.enterGateList?.some(gate => gate.name === gateName);
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
              name: 'locationImg_' + this.editId + Math.ceil(Math.random()*10),
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
                // 设置默认图片
                this.formData.defaultImg = backImg;
                // 清除默认图片配置错误
                if (this.errors.defaultImg) {
                  this.errors.defaultImg = '';
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
            // 清除默认图片配置错误
            if (this.errors.defaultImg) {
              this.errors.defaultImg = '';
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
              if (data.isLocal) {
                // 本地保存的安全评分
                this.handleLocalSafetyScore(data);
              } else {
                // 编辑模式的安全评分
                this.handleEditSafetyScore(data);
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
            if (data.isLocal) {
              // 本地保存的安全评分
              this.handleLocalSafetyScore(data);
            } else {
              // 编辑模式的安全评分
              this.handleEditSafetyScore(data);
            }
          }
        }
      });
    },
    
    // 处理本地保存的安全评分
    handleLocalSafetyScore(data) {
      // 更新本地数据
      this.formData.fireSafetyScore = {
        scoreItems: data.scoreItems,
        isLocal: true
      };
      
      // 清除本地存储的安全评分
      uni.removeStorageSync('tempSafetyScore');
      
      // 显示提示
      uni.showToast({
        title: '安全评分已填充，请完善地址信息后保存',
        icon: 'none',
        duration: 3000
      });
    },
    
    // 处理编辑模式的安全评分
    handleEditSafetyScore(data) {
            // 更新本地数据
            if (data.addressId === this.formData.addressId) {
              this.formData.fireSafetyScore = {
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
    },
    
    // 检查本地保存的安全评分
    checkLocalSafetyScore() {
      try {
        const localData = uni.getStorageSync('tempSafetyScore');
        if (localData && localData.isLocal) {
          this.localSafetyScore = localData;
          // 自动填充安全评分到表单
          this.formData.fireSafetyScore = {
            scoreItems: localData.scoreItems,
            isLocal: true
          };
          
          // 显示提示
          uni.showToast({
            title: '检测到本地安全评分，已自动填充',
            icon: 'none',
            duration: 3000
          });
        }
      } catch (error) {
        console.log('检查本地安全评分失败:', error);
      }
    },
    
    // 滚动到第一个错误位置
    scrollToFirstError() {
      // 延迟执行，确保DOM更新完成
      this.$nextTick(() => {
        const errorElements = document.querySelectorAll('.error-message');
        if (errorElements.length > 0) {
          const firstError = errorElements[0];
          firstError.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
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
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom)); /* 适配H5/iOS底部安全区 */
  height: calc(100vh - 80rpx);
  overflow-y: auto;
}

/* 占位，确保最后一块内容不会被底部按钮遮挡（scroll-view 对 padding 支持有限时的兜底） */
.scroll-spacer {
  height: calc(140rpx + env(safe-area-inset-bottom));
}

/* 底部按钮 */
.footer {
  display: flex;
  padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom)) 20rpx;
  gap: 24rpx;
  background: #ffffff;
  border-top: 1rpx solid #e8f4ff;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.footer-btn {
  flex: 1;
  height: 68rpx;
  line-height: 68rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
  border: none;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    display: none;
  }

  &:active {
    transform: scale(0.98);
  }
}

.cancel-btn {
  background: #f5f5f5;
  color: #666666;
  font-weight: 400;
  font-size: 24rpx;
  border: none !important;
  
  &::after {
    border: none !important;
  }
}

.confirm-btn {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 400;
  letter-spacing: 0.5rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

/* 移动端优化 */
@media (max-width: 750rpx) {
  .footer {
    padding: 16rpx 24rpx 30rpx 24rpx;
    gap: 20rpx;
  }
}

/* 超小屏幕优化 */
@media (max-width: 600rpx) {
  .footer {
    padding: 16rpx 20rpx 30rpx 20rpx;
    gap: 16rpx;
  }
}
</style> 