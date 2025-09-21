<template>
  <view class="task-assign-page">
    <view class="form-container">
      <!-- 救援单位 -->
      <view class="form-section">
        <view class="form-row">
          <text class="section-title">救援单位 <text class="required">*</text></text>
          <picker :value="fireUnitIndex" :range="fireUnitOptions" range-key="label" @change="onFireUnitChange" class="form-picker">
            <view class="picker-display">
              <text class="picker-text" :class="{'placeholder':!formData.fireUnit}">{{ getFireUnitText }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
        </view>
      </view>

      <!-- 救灾地址（跳转选择页） -->
      <view class="form-section">
        <view class="form-row">
          <text class="section-title">救灾地址 <text class="required">*</text></text>
          <view class="address-selector" @tap="goToAddressSelector">
            <view class="address-info">
              <text class="address-text" :class="{'placeholder':!selectedAddress.addressName}">{{ selectedAddress.addressName || '请选择救灾地址' }}</text>
              <text class="floor-info" v-if="selectedAddress.rescueFloor">{{ selectedAddress.rescueFloor }}层</text>
            </view>
            <image :src="serverUrl + '/static/icons/common/right.png'" class="arrow-icon" />
          </view>
        </view>
      </view>

      <!-- 位置类型 -->
      <view class="form-section">
        <view class="form-row">
          <text class="section-title">位置类型 <text class="required">*</text></text>
          <picker :value="locationTypeIndex" :range="locationTypeOptions" range-key="name" @change="onLocationTypeChange" class="form-picker">
            <view class="picker-display">
              <text class="picker-text" :class="{'placeholder':!formData.locationType}">{{ getLocationTypeText }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
        </view>
      </view>

      <!-- 高层小区显示"搜救楼层"；其他类型显示"出行方向" -->
      <view class="form-section" v-if="formData.locationType">
        <view class="form-row">
          <text class="section-title">{{ formData.locationType === 1 ? '搜救楼层' : '出行方向' }} <text class="required">*</text></text>
          <view v-if="formData.locationType === 1" class="form-input-row">
            <input 
              v-model="formData.rescueFloor" 
              type="number" 
              class="form-input" 
              placeholder="请输入楼层(1-100)" 
              maxlength="3"
              @input="onFloorInput"
            />
          </view>
          <view v-else class="form-picker-row">
            <picker :value="directionIndex" :range="directionOptions" range-key="label" @change="onDirectionChange" class="form-picker">
              <view class="picker-display">
                <text class="picker-text" :class="{'placeholder':!formData.direction}">{{ getDirectionText }}</text>
                <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
              </view>
            </picker>
          </view>
        </view>
      </view>

      <!-- 任务类型 -->
      <view class="form-section">
        <view class="form-row">
          <text class="section-title">任务类型 <text class="required">*</text></text>
          <picker :value="taskTypeIndex" :range="taskTypeOptions" range-key="label" @change="onTaskTypeChange" class="form-picker">
            <view class="picker-display">
              <text class="picker-text" :class="{'placeholder':!formData.taskType}">{{ getTaskTypeText }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
        </view>
      </view>

      <!-- 不同任务类型的动态内容（基于配置） -->
      <view class="form-section" v-if="formData.taskType && currentTaskConfig">
        <view class="form-row">
          <text class="section-title">{{ taskContentTitleByConfig }} <text class="required">*</text></text>
          
          <!-- 配置：uiType = select（单选） -->
          <view v-if="currentTaskConfig.uiType === 'select'" class="form-picker">
            <view class="force-options">
              <view v-for="(opt, idx) in (currentTaskConfig.options || [])" :key="idx" class="force-option" :class="{ active: formData.taskExtra[currentTaskConfig.actionKey] === opt }" @tap="selectTaskOption(opt)">
                <view class="checkbox"><view class="checkbox-inner" v-if="formData.taskExtra[currentTaskConfig.actionKey] === opt"></view></view>
                <text class="force-label">{{ opt }}</text>
              </view>
            </view>
          </view>

          <!-- 配置：uiType = input -->
          <view v-else-if="currentTaskConfig.uiType === 'input'" class="input-container">
            <input v-model="formData.taskExtra[currentTaskConfig.actionKey]" class="form-input" :placeholder="currentTaskConfig.placeholder || '请输入'" />
          </view>

          <!-- 配置：uiType = select-collection（目前支持从消防单位集合选择） -->
          <view v-else-if="currentTaskConfig.uiType === 'select-collection'" class="form-picker">
            <picker :value="dynamicSelectIndex" :range="fireUnitOptions" range-key="label" @change="onDynamicSelectChange" class="form-picker">
              <view class="picker-display">
                <text class="picker-text" :class="{'placeholder':!formData.taskExtra[currentTaskConfig.actionKey]}">{{ getDynamicSelectText }}</text>
                <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
              </view>
            </picker>
          </view>
        </view>
      </view>

      <!-- 备注 -->
      <view class="form-section">
        <view class="form-row">
          <text class="section-title">备注</text>
        </view>
        <view class="textarea-container">
          <textarea v-model="formData.remark" class="form-textarea" maxlength="500" auto-height show-confirm-bar="false" placeholder="请输入备注信息" />
        </view>
      </view>
      <view class="form-bottom-spacer"></view>
    </view>

    <!-- 提交 -->
    <view class="submit-section">
      <button class="submit-btn" @tap="submitForm">{{ submitting ? '提交中...' : '下达任务' }}</button>
    </view>
  </view>
</template>

<script>
import { directionOptions, taskFeedbackOptions, floorOptions, locationTypeOptions } from '@/commons/js/fireStatus.js'

export default {
  name: 'TaskAssign',
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space',
      formData: {
        fireUnit: '',
        addressId: '',
        addressName: '',
        locationType: 1, // 默认高层小区
        rescueFloor: '',
        direction: '',
        taskType: '', // 将在loadStaticData中设置为内攻灭火
        taskFeedback: 2, // 默认未接收
        remark: '',
        taskExtra: {}
      },
      fireUnitIndex: 0,
      locationTypeIndex: 0,
      floorIndex: 0,
      directionIndex: 0,
      taskTypeIndex: 0,
      taskFeedbackIndex: 0,
      fireUnitOptions: [],
      locationTypeOptions: locationTypeOptions,
      directionOptions: directionOptions,
      taskFeedbackOptions: taskFeedbackOptions,
      floorOptions: floorOptions,
      taskTypeOptions: [],
      submitting: false,
      currentTaskConfig: null,
      dynamicSelectIndex: 0,
      selectedAddress: {}
    }
  },
  computed: {
    getFireUnitText() { return (this.fireUnitOptions[this.fireUnitIndex] && this.fireUnitOptions[this.fireUnitIndex].label) || '请选择下达单位' },
    getLocationTypeText() { return (this.locationTypeOptions[this.locationTypeIndex] && this.locationTypeOptions[this.locationTypeIndex].name) || '请选择位置类型' },
    getFloorText() { return (this.floorOptions[this.floorIndex] && this.floorOptions[this.floorIndex].label) || '请选择楼层' },
    getDirectionText() { return (this.directionOptions[this.directionIndex] && this.directionOptions[this.directionIndex].label) || '请选择出行方向' },
    getTaskTypeText() { return (this.taskTypeOptions[this.taskTypeIndex] && this.taskTypeOptions[this.taskTypeIndex].label) || '请选择任务类型' },
    getTaskFeedbackText() { return (this.taskFeedbackOptions[this.taskFeedbackIndex] && this.taskFeedbackOptions[this.taskFeedbackIndex].label) || '请选择任务反馈' },
    taskContentTitleByConfig() {
      const map = this.taskTypeOptions.find(it => it.value === this.formData.taskType)
      return map ? map.label : '任务内容'
    },
    getDynamicSelectText() {
      const idx = this.dynamicSelectIndex
      return (this.fireUnitOptions[idx] && this.fireUnitOptions[idx].label) || '请选择供水对象'
    }
  },
  onLoad() {
    this.loadStaticData()
  },
  methods: {
    loadStaticData() {
      // 从本地存储获取静态数据
      const fireUnits = uni.getStorageSync('static_fireUnits') || []
      const taskTypes = uni.getStorageSync('static_taskTypes') || []
      
      this.fireUnitOptions = fireUnits
      this.taskTypeOptions = taskTypes
      
      // 设置默认值
      if (fireUnits.length > 0) {
        this.formData.fireUnit = fireUnits[0].value
      }
      // 位置类型默认为高层小区（type=1）
      this.formData.locationType = 1
      this.locationTypeIndex = 0
      
      // 任务类型默认为内攻灭火（假设value为"1"）
      if (taskTypes.length > 0) {
        const attackFireIndex = taskTypes.findIndex(item => item.label === '内攻灭火')
        if (attackFireIndex !== -1) {
          this.formData.taskType = taskTypes[attackFireIndex].value
          this.taskTypeIndex = attackFireIndex
          this.currentTaskConfig = taskTypes[attackFireIndex].config || null
          if (this.currentTaskConfig && this.currentTaskConfig.actionKey) {
            this.$set(this.formData, 'taskExtra', {})
            this.$set(this.formData.taskExtra, this.currentTaskConfig.actionKey, '')
          }
        } else {
          // 如果找不到内攻灭火，使用第一个
          this.formData.taskType = taskTypes[0].value
          this.taskTypeIndex = 0
          this.currentTaskConfig = taskTypes[0].config || null
        }
      }
      
      // 任务反馈默认为未接收
      this.formData.taskFeedback = 2
    },
    onFireUnitChange(e) { 
      this.fireUnitIndex = Number(e.detail.value)
      this.formData.fireUnit = this.fireUnitOptions[this.fireUnitIndex]?.value || '' 
    },
    onLocationTypeChange(e) {
      this.locationTypeIndex = Number(e.detail.value)
      this.formData.locationType = this.locationTypeOptions[this.locationTypeIndex]?.type || ''
      this.formData.rescueFloor = ''
      this.formData.direction = ''
      this.floorIndex = 0
      this.directionIndex = 0
    },
    onFloorChange(e) { 
      this.floorIndex = Number(e.detail.value)
      this.formData.rescueFloor = this.floorOptions[this.floorIndex]?.value || '' 
    },
    onDirectionChange(e) { 
      this.directionIndex = Number(e.detail.value)
      this.formData.direction = this.directionOptions[this.directionIndex]?.value || '' 
    },
    onTaskTypeChange(e) {
      this.taskTypeIndex = Number(e.detail.value)
      const picked = this.taskTypeOptions[this.taskTypeIndex] || {}
      this.formData.taskType = picked.value || ''
      this.currentTaskConfig = picked.config || null
      this.formData.taskExtra = {}
      this.dynamicSelectIndex = 0
      
      // 如果有配置，初始化 formData.taskExtra
      if (this.currentTaskConfig && this.currentTaskConfig.actionKey) {
        this.$set(this.formData, 'taskExtra', {})
        this.$set(this.formData.taskExtra, this.currentTaskConfig.actionKey, '')
      }
    },
    onTaskFeedbackChange(e) { 
      this.taskFeedbackIndex = Number(e.detail.value)
      this.formData.taskFeedback = this.taskFeedbackOptions[this.taskFeedbackIndex]?.value || '' 
    },
    onFloorInput(e) {
      let value = e.detail.value
      // 只允许输入数字
      value = value.replace(/[^\d]/g, '')
      // 限制范围1-100
      if (value && (parseInt(value) < 1 || parseInt(value) > 100)) {
        uni.showToast({ title: '楼层范围1-100', icon: 'none' })
        value = ''
      }
      this.formData.rescueFloor = value
    },
    selectTaskOption(val) {
      if (!this.currentTaskConfig) return
      this.$set(this.formData.taskExtra, this.currentTaskConfig.actionKey, val)
    },
    onDynamicSelectChange(e) {
      this.dynamicSelectIndex = Number(e.detail.value)
      const picked = this.fireUnitOptions[this.dynamicSelectIndex]
      if (this.currentTaskConfig) {
        this.$set(this.formData.taskExtra, this.currentTaskConfig.actionKey, picked ? picked.value : '')
      }
    },
    async submitForm() {
      // 验证必填字段
      const fd = this.formData
      if (!fd.fireUnit) {
        uni.showToast({ title: '请选择救援单位', icon: 'none' })
        return
      }
      if (!fd.addressId) {
        uni.showToast({ title: '请选择救灾地址', icon: 'none' })
        return
      }
      if (!fd.locationType) {
        uni.showToast({ title: '请选择位置类型', icon: 'none' })
        return
      }
      if (fd.locationType === 1) {
        if (!fd.rescueFloor) {
          uni.showToast({ title: '请选择搜救楼层', icon: 'none' })
          return
        }
      } else {
        if (!fd.direction) {
          uni.showToast({ title: '请选择出行方向', icon: 'none' })
          return
        }
      }
      if (!fd.taskType) {
        uni.showToast({ title: '请选择任务类型', icon: 'none' })
        return
      }
      
      // 验证任务类型动态内容
      if (this.currentTaskConfig && this.currentTaskConfig.actionKey) {
        const taskExtraValue = fd.taskExtra[this.currentTaskConfig.actionKey]
        if (!taskExtraValue || taskExtraValue.trim() === '') {
          uni.showToast({ title: `请选择${this.taskContentTitleByConfig}`, icon: 'none' })
          return
        }
      }
      
      // 添加确认提示
      const confirmResult = await new Promise((resolve) => {
        uni.showModal({
          title: '确认下达',
          content: '确定要下达作战任务吗？',
          success: (res) => resolve(res.confirm),
          fail: () => resolve(false)
        })
      })
      
      if (!confirmResult) return
      
      try {
        this.submitting = true
        uni.showLoading({ title: '提交中...' })
        const currentUser = uni.getStorageSync('userInfo') || {}
        const now = new Date()
        
        const payload = { 
          ...this.formData, 
          issuePersonId: currentUser.userId || '', 
          issuePersonName: currentUser.nickName || '',
          issueTime: now.toISOString(), 
          updateTime: now.toISOString() 
        }
        
        const res = await new Promise((resolve, reject) => {
          uni.request({ 
            url: this.serverUrl + '/task/create', 
            method: 'POST', 
            data: payload, 
            success: resolve, 
            fail: reject 
          })
        })
        if (res?.data?.code === 200) {
          uni.showToast({ title: '任务下达成功', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 1200)
        } else {
          throw new Error(res?.data?.msg || '任务下达失败')
        }
      } catch (e) {
        uni.showToast({ title: e.message || '任务下达失败', icon: 'none' })
      } finally {
        this.submitting = false
        uni.hideLoading()
      }
    },
    goToAddressSelector() {
      uni.navigateTo({
        url: '/pages/data/addressSelector/index?mode=select',
        success: (res) => {
          res.eventChannel.on('addressSelected', (data) => {
            this.selectedAddress = data
            this.formData.addressId = data.addressId
            this.formData.addressName = data.addressName
          })
        }
      })
    },
    onAddressSelect(address) {
      this.selectedAddress = address
      this.formData.addre = address
    }
  }
}
</script>

<style lang="scss" scoped>
.task-assign-page { min-height: 100vh; background: #f5f9ff; padding-bottom: constant(safe-area-inset-bottom); padding-bottom: env(safe-area-inset-bottom); display: flex; flex-direction: column; }
.form-container { flex: 1; padding: 24rpx; padding-bottom: 24rpx; overflow-y: auto; -webkit-overflow-scrolling: touch; max-height: calc(100vh - 120rpx); }
.form-section { background: #fff; border-radius: 16rpx; margin-bottom: 24rpx; box-shadow: 0 4rpx 16rpx rgba(24,144,255,0.08); overflow: hidden; }
.form-row { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; }
.form-picker-row { flex: 1; }
.section-header { padding: 16rpx 24rpx 12rpx; border-bottom: 1rpx solid #f0f0f0; background: #fafbfc; }
.section-title { font-size: 28rpx; font-weight: 600; color: #333; }
.required { color: #ff4d4f; margin-left: 4rpx; }
.form-picker { flex: 1; margin-left: 24rpx; }
.picker-display { display: flex; align-items: center; justify-content: space-between; height: 64rpx; padding: 0 16rpx; background: #f8faff; border-radius: 12rpx; border: 2rpx solid #e6f4ff; }
.picker-text { font-size: 26rpx; color: #333; flex: 1; }
.picker-text.placeholder { color: #999; }
.picker-arrow { width: 32rpx; height: 32rpx; opacity: .6; }
.form-input-row { 
  flex: 1; 
  margin-left: 24rpx; 
}

.form-input { 
  width: 100%; 
  height: 64rpx; 
  padding: 0 16rpx; 
  background: #f8faff; 
  border: 2rpx solid #e6f4ff; 
  border-radius: 12rpx; 
  font-size: 26rpx; 
  color: #333; 
  text-align: left; 
  box-sizing: border-box;
  outline: none;
  transition: all 0.3s ease;
}

.form-input:focus { 
  border-color: #1890ff; 
  background: #fff; 
  box-shadow: 0 0 0 2rpx rgba(24, 144, 255, 0.1);
}

.form-input::placeholder {
  color: #999;
  font-size: 24rpx;
}
.form-input { width: 100%; height: 64rpx; padding: 0 16rpx; font-size: 26rpx; color: #333; border: 2rpx solid #e6f4ff; border-radius: 12rpx; background: #f8faff; }
.form-input-row { flex: 1; }
.textarea-container {
  padding: 0 24rpx 24rpx;
}

.form-textarea { 
  width: 100%; 
  min-height: 160rpx; 
  padding: 16rpx; 
  background: #f8faff; 
  border: 2rpx solid #e6f4ff; 
  border-radius: 12rpx; 
  font-size: 26rpx; 
  color: #333; 
  margin: 0; 
  box-sizing: border-box; 
  line-height: 1.6; 
}
.form-bottom-spacer { height: 120rpx; }
.submit-section { position:fixed; bottom:0; left:0; right:0; background:#fff; padding:24rpx; padding-bottom: calc(24rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(24rpx + env(safe-area-inset-bottom)); box-shadow:0 -4rpx 16rpx rgba(0,0,0,.1); z-index:100; }
.submit-btn { width:100%; height:80rpx; background:linear-gradient(135deg,#1890ff,#40a9ff); color:#fff !important; border:none; border-radius:16rpx; font-size:32rpx; font-weight:600; box-shadow:0 4rpx 16rpx rgba(24,144,255,.3); }
.submit-btn:disabled { background:#d9d9d9; box-shadow:none; }
/* 任务类型动态内容样式 */
.force-options { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 8rpx; 
  width: 100%;
}

.force-option { 
  display: flex; 
  align-items: center; 
  padding: 8rpx 12rpx; 
  border: 2rpx solid #e6f4ff; 
  border-radius: 12rpx; 
  background: #f8faff; 
  transition: .3s; 
  flex: 1;
  min-width: 0;
  justify-content: center;
  height: 64rpx;
  box-sizing: border-box;
}

.force-option.active { 
  border-color: #1890ff; 
  background: #e6f7ff; 
}

.checkbox { 
  width: 20rpx; 
  height: 20rpx; 
  border: 2rpx solid #cbd5e0; 
  border-radius: 4rpx; 
  margin-right: 8rpx; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  background: #fff; 
  flex-shrink: 0;
}

.force-option.active .checkbox { 
  border-color: #1890ff; 
  background: #1890ff; 
}

.checkbox-inner { 
  width: 12rpx; 
  height: 12rpx; 
  background: transparent; 
  transform: scale(0); 
  animation: checkmark .3s forwards; 
  background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"white\"><path d=\"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z\"/></svg>'); 
  background-size: contain; 
  background-repeat: no-repeat; 
  background-position: center; 
}

.force-label { 
  font-size: 22rpx; 
  color: #333; 
  font-weight: 500; 
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes checkmark { from{transform:scale(0) rotate(-45deg)} to{transform:scale(1) rotate(0)} }
.address-selector { 
  flex: 1; 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  height: 64rpx; 
  padding: 0 16rpx; 
  background: #f8faff; 
  border-radius: 12rpx; 
  margin-left: 24rpx; 
  border: 2rpx solid #e6f4ff; 
}

.address-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
}

.address-text { 
  font-size: 26rpx; 
  color: #333; 
  flex: 1; 
}

.address-text.placeholder {
  color: #999;
}

.floor-info {
  font-size: 20rpx;
  color: #666;
  background: #f0f8ff;
  padding: 4rpx 8rpx;
  border-radius: 6rpx;
  border: 1rpx solid #d6e4ff;
  flex-shrink: 0;
}

.arrow-icon { 
  width: 32rpx; 
  height: 32rpx; 
  opacity: .6; 
}

.input-container { 
  flex: 1; 
  margin-left: 24rpx; 
}

.input-container .form-input { 
  width: 100%; 
  height: 64rpx; 
  padding: 0 16rpx; 
  background: #f8faff; 
  border: 2rpx solid #e6f4ff; 
  border-radius: 12rpx; 
  font-size: 26rpx; 
  color: #333; 
  text-align: left; 
  box-sizing: border-box;
  outline: none;
  transition: all 0.3s ease;
}

.input-container .form-input:focus { 
  border-color: #1890ff; 
  background: #fff; 
  box-shadow: 0 0 0 2rpx rgba(24, 144, 255, 0.1);
}

.input-container .form-input::placeholder {
  color: #999;
  font-size: 24rpx;
}
</style>