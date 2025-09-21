<template>
  <view class="fire-upload-page">
    <view class="form-container">
      <!-- 救援地址 -->
      <view class="form-section">
        <view class="form-row">
          <text class="section-title">救援地址 <text class="required">*</text></text>
          <view class="address-selector" @tap="goToAddressSelector">
            <view class="address-info">
              <text class="address-text" :class="{'placeholder':!selectedAddress.addressName}">{{ selectedAddress.addressName || '请选择救援地址' }}</text>
              <text class="floor-info" v-if="selectedAddress.rescueFloor">{{ selectedAddress.rescueFloor }}层</text>
            </view>
            <image :src="serverUrl + '/static/icons/common/right.png'" class="arrow-icon" />
          </view>
        </view>
      </view>

      <!-- 指派救援单位 -->
      <view class="form-section">
        <view class="form-row">
          <text class="section-title">指派救援单位 <text class="required">*</text></text>
          <view class="add-unit-btn" @tap="showUnitSelector">
            <image :src="serverUrl + '/static/icons/common/add.png'" class="add-icon" />
            <text class="add-text">添加单位</text>
          </view>
        </view>
        
        <!-- 已选择的救援单位列表 -->
        <view class="selected-units" v-if="selectedUnits.length > 0">
          <view v-for="(unit, index) in selectedUnits" :key="index" class="unit-item">
            <view class="unit-info">
              <text class="unit-name">{{ unit.label }}</text>
              <text class="unit-id">编号：{{ unit.value }}</text>
            </view>
            <view class="unit-actions">
              <view class="unit-config-btn" @tap="showUnitConfig(unit, index)">
                <text class="config-text">配置任务</text>
                <image :src="serverUrl + '/static/icons/common/right.png'" class="arrow-icon" />
              </view>
              <view class="remove-btn" @tap="removeUnit(index)">
                <image :src="serverUrl + '/static/icons/common/close.png'" class="remove-icon" />
              </view>
            </view>
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
      <button class="submit-btn" @tap="submitForm">{{ submitting ? '提交中...' : '提交' }}</button>
    </view>

    <!-- 救援单位选择弹窗 -->
    <view class="modal-overlay" v-if="showUnitModal" @tap="hideUnitSelector">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">选择救援单位</text>
          <view class="close-btn" @tap="hideUnitSelector">
            <image :src="serverUrl + '/static/icons/common/close.png'" class="close-icon" />
          </view>
        </view>
        <view class="modal-body">
          <view v-for="(unit, index) in availableUnits" :key="index" class="unit-option" @tap="selectUnit(unit)">
            <view class="checkbox">
              <view class="checkbox-inner" v-if="isUnitSelected(unit)"></view>
            </view>
            <text class="unit-label">{{ unit.label }}</text>
          </view>
        </view>
        <view class="modal-footer">
          <button class="confirm-btn" @tap="confirmUnits">确定</button>
        </view>
      </view>
    </view>

    <!-- 救援单位配置弹窗 -->
    <view class="modal-overlay" v-if="showConfigModal" @tap="hideUnitConfig">
      <view class="modal-content config-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">配置任务 - {{ currentUnit.label }}</text>
          <view class="close-btn" @tap="hideUnitConfig">
            <image :src="serverUrl + '/static/icons/common/close.png'" class="close-icon" />
          </view>
        </view>
        <view class="modal-body">
          <!-- 搜救楼层/出行方向 -->
          <view class="config-section">
            <text class="config-label">{{ formData.locationType === 1 ? '搜救楼层' : '出行方向' }} <text class="required">*</text></text>
            <view v-if="formData.locationType === 1" class="input-container">
              <input v-model="currentUnit.rescueFloor" class="form-input" type="number" maxlength="3" placeholder="请输入搜救楼层(1-100，正整数)" />
            </view>
            <view v-else class="form-picker-row">
              <picker :value="currentUnit.directionIndex" :range="directionOptions" range-key="label" @change="onDirectionChange" class="form-picker">
                <view class="picker-display">
                  <text class="picker-text" :class="{'placeholder':!currentUnit.direction}">{{ getDirectionText(currentUnit) }}</text>
                  <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
                </view>
              </picker>
            </view>
          </view>

          <!-- 任务类型 -->
          <view class="config-section">
            <text class="config-label">任务类型 <text class="required">*</text></text>
            <picker :value="currentUnit.taskTypeIndex" :range="taskTypeOptions" range-key="label" @change="onTaskTypeChange" class="form-picker">
              <view class="picker-display">
                <text class="picker-text" :class="{'placeholder':!currentUnit.taskType}">{{ getTaskTypeText(currentUnit) }}</text>
                <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
              </view>
            </picker>
          </view>

          <!-- 不同任务类型的动态内容 -->
          <view class="config-section" v-if="currentUnit.taskType && currentUnit.taskConfig">
            <text class="config-label">{{ getTaskContentTitle(currentUnit) }}</text>
            <!-- 配置：uiType = select（单选） -->
            <view v-if="currentUnit.taskConfig.uiType === 'select'" class="form-picker-section">
              <view class="force-options">
                <view v-for="(opt, idx) in (currentUnit.taskConfig.options || [])" :key="idx" class="force-option" :class="{ active: currentUnit.taskExtra[currentUnit.taskConfig.actionKey] === opt }" @tap="selectTaskOption(opt)">
                  <view class="checkbox"><view class="checkbox-inner" v-if="currentUnit.taskExtra[currentUnit.taskConfig.actionKey] === opt"></view></view>
                  <text class="force-label">{{ opt }}</text>
                </view>
              </view>
            </view>

            <!-- 配置：uiType = input -->
            <view v-else-if="currentUnit.taskConfig.uiType === 'input'" class="input-container">
              <input v-model="currentUnit.taskExtra[currentUnit.taskConfig.actionKey]" class="form-input" :placeholder="currentUnit.taskConfig.placeholder || '请输入'" />
            </view>

            <!-- 配置：uiType = select-collection -->
            <view v-else-if="currentUnit.taskConfig.uiType === 'select-collection'" class="form-picker-section">
              <picker :value="currentUnit.dynamicSelectIndex" :range="fireUnitOptions" range-key="label" @change="onDynamicSelectChange" class="form-picker">
                <view class="picker-display">
                  <text class="picker-text" :class="{'placeholder':!currentUnit.taskExtra[currentUnit.taskConfig.actionKey]}">{{ getDynamicSelectText(currentUnit) }}</text>
                  <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
                </view>
              </picker>
            </view>
          </view>

          <!-- 救援车辆选择 -->
          <view class="config-section">
            <text class="config-label">救援车辆 <text class="required">*</text></text>
            <view class="car-selector" @tap="showCarSelector">
              <text class="car-text">{{ currentUnit.selectedCars.length > 0 ? `已选${currentUnit.selectedCars.length}辆车` : '选择车辆' }}</text>
              <image :src="serverUrl + '/static/icons/common/right.png'" class="arrow-icon" />
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="confirm-btn" @tap="confirmConfig">确定</button>
        </view>
      </view>
    </view>

    <!-- 救援车辆选择弹窗 -->
    <view class="modal-overlay" v-if="showCarModal" @tap="hideCarSelector">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">选择救援车辆 - {{ currentUnit.label }}</text>
          <view class="close-btn" @tap="hideCarSelector">
            <image :src="serverUrl + '/static/icons/common/close.png'" class="close-icon" />
          </view>
        </view>
        <view class="modal-body">
          <view v-for="(car, index) in fireCarOptions" :key="index" class="car-option" @tap="toggleCar(car)">
            <view class="checkbox">
              <view class="checkbox-inner" v-if="isCarSelected(car)"></view>
            </view>
            <text class="car-label">{{ car.label }}</text>
          </view>
        </view>
        <view class="modal-footer">
          <button class="confirm-btn" @tap="confirmCars">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { directionOptions } from '@/commons/js/fireStatus.js'

export default {
  name: 'FireUpload',
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space',
      formData: {
        addressId: '',
        addressName: '',
        locationType: '',
        remark: '',
        assignedUnits: [] // 指派的救援单位列表
      },
      fireUnitOptions: [],
      fireCarOptions: [],
      directionOptions: directionOptions,
      taskTypeOptions: [],
      selectedAddress: {},
      submitting: false,
      selectedUnits: [], // 已选择的救援单位
      showUnitModal: false,
      showConfigModal: false,
      showCarModal: false,
      currentUnit: null, // 当前正在配置的单位
      currentUnitIndex: -1, // 当前单位的索引
      tempSelectedUnits: [], // 临时选择的单位
      tempSelectedCars: [] // 临时选择的车辆
    }
  },
  computed: {
    availableUnits() {
      // 过滤掉已选择的单位
      return this.fireUnitOptions.filter(unit => !this.selectedUnits.some(selected => selected.value === unit.value))
    }
  },
  onLoad() {
    this.loadStaticData()
  },
  methods: {
    loadStaticData() {
      try {
        // 直接从本地存储读取静态数据
        const fireUnits = uni.getStorageSync('static_fireUnits') || []
        const fireCars = uni.getStorageSync('static_fireCars') || []
        const taskTypes = uni.getStorageSync('static_taskTypes') || []
        
        this.fireUnitOptions = fireUnits
        this.fireCarOptions = fireCars
        this.taskTypeOptions = taskTypes.map(it => ({ ...it }))
      } catch (e) {
        uni.showToast({ title: '加载数据失败', icon: 'none' })
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
            this.formData.locationType = data.locationType
          })
        }
      })
    },
    // 显示救援单位选择器
    showUnitSelector() {
      this.tempSelectedUnits = [...this.selectedUnits]
      this.showUnitModal = true
    },
    hideUnitSelector() {
      this.showUnitModal = false
    },
    // 选择救援单位
    selectUnit(unit) {
      const index = this.tempSelectedUnits.findIndex(item => item.value === unit.value)
      if (index > -1) {
        this.tempSelectedUnits.splice(index, 1)
      } else {
        this.tempSelectedUnits.push({
          ...unit,
          selectedCars: [],
          rescueFloor: '',
          direction: '',
          directionIndex: 0,
          taskType: '',
          taskTypeIndex: 0,
          taskConfig: null,
          taskExtra: {},
          dynamicSelectIndex: 0
        })
      }
    },
    isUnitSelected(unit) {
      return this.tempSelectedUnits.some(item => item.value === unit.value)
    },
    confirmUnits() {
      this.selectedUnits = [...this.tempSelectedUnits]
      this.updateFormData()
      this.hideUnitSelector()
    },
    // 显示救援单位配置
    showUnitConfig(unit, index) {
      this.currentUnit = { ...unit }
      this.currentUnitIndex = index
      this.showConfigModal = true
    },
    hideUnitConfig() {
      this.showConfigModal = false
    },
    // 方向选择
    onDirectionChange(e) {
      this.currentUnit.directionIndex = Number(e.detail.value)
      this.currentUnit.direction = this.directionOptions[this.currentUnit.directionIndex]?.value || ''
    },
    getDirectionText(unit) {
      return (this.directionOptions[unit.directionIndex] && this.directionOptions[unit.directionIndex].label) || '请选择出行方向'
    },
    // 任务类型选择
    onTaskTypeChange(e) {
      this.currentUnit.taskTypeIndex = Number(e.detail.value)
      const picked = this.taskTypeOptions[this.currentUnit.taskTypeIndex] || {}
      this.currentUnit.taskType = picked.value || ''
      this.currentUnit.taskConfig = picked.config || null
      this.currentUnit.taskExtra = {}
      this.currentUnit.dynamicSelectIndex = 0
      
      // 如果有配置，初始化 taskExtra
      if (this.currentUnit.taskConfig && this.currentUnit.taskConfig.actionKey) {
        this.$set(this.currentUnit, 'taskExtra', {})
        this.$set(this.currentUnit.taskExtra, this.currentUnit.taskConfig.actionKey, '')
      }
    },
    getTaskTypeText(unit) {
      return (this.taskTypeOptions[unit.taskTypeIndex] && this.taskTypeOptions[unit.taskTypeIndex].label) || '请选择任务类型'
    },
    getTaskContentTitle(unit) {
      const map = this.taskTypeOptions.find(it => it.value === unit.taskType)
      return map ? map.label : '任务内容'
    },
    getDynamicSelectText(unit) {
      const idx = unit.dynamicSelectIndex
      return (this.fireUnitOptions[idx] && this.fireUnitOptions[idx].label) || '请选择供水对象'
    },
    // 任务选项选择
    selectTaskOption(val) {
      if (!this.currentUnit.taskConfig) return
      this.$set(this.currentUnit.taskExtra, this.currentUnit.taskConfig.actionKey, val)
    },
    // 动态选择变化
    onDynamicSelectChange(e) {
      this.currentUnit.dynamicSelectIndex = Number(e.detail.value)
      const picked = this.fireUnitOptions[this.currentUnit.dynamicSelectIndex]
      if (this.currentUnit.taskConfig) {
        this.$set(this.currentUnit.taskExtra, this.currentUnit.taskConfig.actionKey, picked ? picked.value : '')
      }
    },
    // 显示救援车辆选择器
    showCarSelector() {
      this.tempSelectedCars = [...this.currentUnit.selectedCars]
      this.showCarModal = true
    },
    hideCarSelector() {
      this.showCarModal = false
    },
    // 选择救援车辆
    toggleCar(car) {
      const index = this.tempSelectedCars.findIndex(item => item.value === car.value)
      if (index > -1) {
        this.tempSelectedCars.splice(index, 1)
      } else {
        this.tempSelectedCars.push(car)
      }
    },
    isCarSelected(car) {
      return this.tempSelectedCars.some(item => item.value === car.value)
    },
    confirmCars() {
      this.currentUnit.selectedCars = [...this.tempSelectedCars]
      this.hideCarSelector()
    },
    // 确认配置
    confirmConfig() {
      this.selectedUnits[this.currentUnitIndex] = { ...this.currentUnit }
      this.updateFormData()
      this.hideUnitConfig()
    },
    // 更新表单数据
    updateFormData() {
      this.formData.assignedUnits = this.selectedUnits.map(unit => ({
        unitId: unit.value,
        unitName: unit.label,
        rescueFloor: unit.rescueFloor,
        direction: unit.direction,
        taskType: unit.taskType,
        taskExtra: unit.taskExtra,
        carIds: unit.selectedCars.map(car => car.value),
        carNames: unit.selectedCars.map(car => car.label)
      }))
    },
    // 移除救援单位
    removeUnit(index) {
      this.selectedUnits.splice(index, 1)
      this.updateFormData()
    },
    async submitForm() {
      // 验证必填字段
      const fd = this.formData
      if (!fd.addressId) {
        uni.showToast({ title: '请选择救援地址', icon: 'none' })
        return
      }
      if (this.selectedUnits.length === 0) {
        uni.showToast({ title: '请至少选择一个救援单位', icon: 'none' })
        return
      }
      
      // 验证每个单位的配置
      for (let i = 0; i < this.selectedUnits.length; i++) {
        const unit = this.selectedUnits[i]
        if (this.formData.locationType === 1) {
          if (!unit.rescueFloor || !/^[1-9]\d{0,1}$|^100$/.test(String(unit.rescueFloor))) {
            uni.showToast({ title: `请为${unit.label}输入正确的搜救楼层(1-100)`, icon: 'none' })
            return
          }
        } else {
          if (!unit.direction) {
            uni.showToast({ title: `请为${unit.label}选择出行方向`, icon: 'none' })
            return
          }
        }
        if (!unit.taskType) {
          uni.showToast({ title: `请为${unit.label}选择任务类型`, icon: 'none' })
          return
        }
        if (unit.selectedCars.length === 0) {
          uni.showToast({ title: `请为${unit.label}选择救援车辆`, icon: 'none' })
          return
        }
        // 验证任务类型动态内容
        if (unit.taskConfig && unit.taskConfig.actionKey) {
          const taskExtraValue = unit.taskExtra[unit.taskConfig.actionKey]
          if (!taskExtraValue || taskExtraValue.trim() === '') {
            uni.showToast({ title: `请为${unit.label}选择${this.getTaskContentTitle(unit)}`, icon: 'none' })
            return
          }
        }
      }
      
      // 确认提交
      const confirmResult = await new Promise((resolve) => {
        uni.showModal({
          title: '确认提交',
          content: '确定要提交火灾情况信息吗？',
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
            url: this.serverUrl + '/fire/upload', 
            method: 'POST', 
            data: payload, 
            success: resolve, 
            fail: reject 
          })
        })
        if (res?.data?.code === 200) {
          uni.showToast({ title: '提交成功', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 1200)
        } else {
          throw new Error(res?.data?.msg || '提交失败')
        }
      } catch (e) {
        uni.showToast({ title: e.message || '提交失败', icon: 'none' })
      } finally {
        this.submitting = false
        uni.hideLoading()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.fire-upload-page { min-height: 100vh; background: #f5f9ff; padding-bottom: constant(safe-area-inset-bottom); padding-bottom: env(safe-area-inset-bottom); display: flex; flex-direction: column; }
.form-container { flex: 1; padding: 24rpx; padding-bottom: 24rpx; overflow-y: auto; -webkit-overflow-scrolling: touch; max-height: calc(100vh - 120rpx); }
.form-section { background: #fff; border-radius: 16rpx; margin-bottom: 24rpx; box-shadow: 0 4rpx 16rpx rgba(24,144,255,0.08); overflow: hidden; }
.form-row { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; }
.section-title { font-size: 28rpx; font-weight: 600; color: #333; }
.required { color: #ff4d4f; margin-left: 4rpx; }
.address-selector { flex: 1; display: flex; align-items: center; justify-content: space-between; height: 64rpx; padding: 0 16rpx; background: #f8faff; border-radius: 12rpx; margin-left: 24rpx; border: 2rpx solid #e6f4ff; }
.address-info { display: flex; align-items: center; gap: 12rpx; flex: 1; }
.address-text { font-size: 26rpx; color: #333; flex: 1; }
.address-text.placeholder { color: #999; }
.floor-info { font-size: 20rpx; color: #666; background: #f0f8ff; padding: 4rpx 8rpx; border-radius: 6rpx; border: 1rpx solid #d6e4ff; flex-shrink: 0; }
.arrow-icon { width: 32rpx; height: 32rpx; opacity: .6; }
.form-textarea { width: 100%; min-height: 160rpx; padding: 16rpx; background: #f8faff; border: 2rpx solid #e6f4ff; border-radius: 12rpx; font-size: 26rpx; color: #333; margin: 0; box-sizing: border-box; line-height: 1.6; }
.textarea-container { padding: 0 24rpx 24rpx; }
.form-bottom-spacer { height: 120rpx; }

/* 救援单位相关样式 */
.add-unit-btn { display: flex; align-items: center; gap: 8rpx; padding: 12rpx 20rpx; background: #e6f7ff; border: 2rpx solid #91d5ff; border-radius: 8rpx; }
.add-icon { width: 24rpx; height: 24rpx; }
.add-text { font-size: 24rpx; color: #1890ff; font-weight: 500; }
.selected-units { padding: 0 24rpx 24rpx; }
.unit-item { display: flex; align-items: center; justify-content: space-between; padding: 16rpx; background: #f8faff; border: 2rpx solid #e6f4ff; border-radius: 12rpx; margin-bottom: 12rpx; }
.unit-info { flex: 1; }
.unit-name { font-size: 26rpx; color: #333; font-weight: 600; display: block; margin-bottom: 4rpx; }
.unit-id { font-size: 20rpx; color: #666; }
.unit-actions { display: flex; align-items: center; gap: 12rpx; }
.unit-config-btn { display: flex; align-items: center; gap: 8rpx; padding: 8rpx 12rpx; background: #fff; border: 2rpx solid #d9d9d9; border-radius: 8rpx; }
.config-text { font-size: 22rpx; color: #666; }
.remove-btn { padding: 8rpx; }
.remove-icon { width: 24rpx; height: 24rpx; opacity: 0.6; }

/* 弹窗样式 */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-content { background: #fff; border-radius: 16rpx; width: 90%; max-height: 80vh; display: flex; flex-direction: column; }
.config-modal { width: 95%; max-height: 85vh; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; border-bottom: 1rpx solid #f0f0f0; }
.modal-title { font-size: 28rpx; font-weight: 600; color: #333; }
.close-btn { padding: 8rpx; }
.close-icon { width: 24rpx; height: 24rpx; }
.modal-body { flex: 1; padding: 24rpx; overflow-y: auto; }
.config-section { margin-bottom: 24rpx; }
.config-label { font-size: 24rpx; color: #333; font-weight: 500; margin-bottom: 12rpx; display: block; }
.input-container { margin-top: 12rpx; }
.form-input { width: 100%; height: 64rpx; padding: 0 16rpx; background: #f8faff; border: 2rpx solid #e6f4ff; border-radius: 12rpx; font-size: 26rpx; color: #333; box-sizing: border-box; }
.form-picker-row { margin-top: 12rpx; }
.form-picker { width: 100%; }
.picker-display { display: flex; align-items: center; justify-content: space-between; height: 64rpx; padding: 0 16rpx; background: #f8faff; border-radius: 12rpx; border: 2rpx solid #e6f4ff; }
.picker-text { font-size: 26rpx; color: #333; flex: 1; }
.picker-text.placeholder { color: #999; }
.picker-arrow { width: 32rpx; height: 32rpx; opacity: .6; }
.car-selector { display: flex; align-items: center; justify-content: space-between; height: 64rpx; padding: 0 16rpx; background: #f8faff; border-radius: 12rpx; border: 2rpx solid #e6f4ff; margin-top: 12rpx; }
.car-text { font-size: 26rpx; color: #333; }
.force-options { display: flex; flex-wrap: wrap; gap: 8rpx; width: 100%; margin-top: 12rpx; }
.force-option { display: flex; align-items: center; padding: 8rpx 12rpx; border: 2rpx solid #e6f4ff; border-radius: 12rpx; background: #f8faff; transition: .3s; flex: 1; min-width: 0; justify-content: center; height: 64rpx; box-sizing: border-box; }
.force-option.active { border-color: #1890ff; background: #e6f7ff; }
.checkbox { width: 20rpx; height: 20rpx; border: 2rpx solid #cbd5e0; border-radius: 4rpx; margin-right: 8rpx; display: flex; justify-content: center; align-items: center; background: #fff; flex-shrink: 0; }
.force-option.active .checkbox { border-color: #1890ff; background: #1890ff; }
.checkbox-inner { width: 12rpx; height: 12rpx; background: transparent; transform: scale(0); animation: checkmark .3s forwards; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"white\"><path d=\"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z\"/></svg>'); background-size: contain; background-repeat: no-repeat; background-position: center; }
.force-label { font-size: 22rpx; color: #333; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.unit-option, .car-option { display: flex; align-items: center; padding: 16rpx; border-bottom: 1rpx solid #f0f0f0; }
.unit-label, .car-label { font-size: 26rpx; color: #333; margin-left: 12rpx; }
.modal-footer { padding: 24rpx; border-top: 1rpx solid #f0f0f0; }
.confirm-btn { width: 100%; height: 64rpx; background: linear-gradient(135deg, #1890ff, #40a9ff); color: #fff; border: none; border-radius: 12rpx; font-size: 26rpx; font-weight: 600; }

@keyframes checkmark { from{transform:scale(0) rotate(-45deg)} to{transform:scale(1) rotate(0)} }
.submit-section { position:fixed; bottom:0; left:0; right:0; background:#fff; padding:24rpx; padding-bottom: calc(24rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(24rpx + env(safe-area-inset-bottom)); box-shadow:0 -4rpx 16rpx rgba(0,0,0,.1); z-index:100; }
.submit-btn { width:100%; height:80rpx; background:linear-gradient(135deg,#1890ff,#40a9ff); color:#fff !important; border:none; border-radius:16rpx; font-size:32rpx; font-weight:600; box-shadow:0 4rpx 16rpx rgba(24,144,255,.3); }
.submit-btn:disabled { background:#d9d9d9; box-shadow:none; }
</style>