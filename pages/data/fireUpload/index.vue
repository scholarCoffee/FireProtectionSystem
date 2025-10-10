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
          <text class="section-title">指派救援<text class="required">*</text></text>
          <view class="assign-summary">
            <text class="summary-text" :class="{ placeholder: selectedUnits.length === 0 }">
              {{ selectedUnits.length === 0 ? '未指派救援单位' : `已指派${selectedUnits.length}个` }}
            </text>
          </view>
          <view class="add-unit-btn" @tap="showUnitSelector">
            <text class="add-text">添加单位</text>
          </view>
        </view>
        
        <!-- 已选择的救援单位列表（内联配置） -->
        <view class="selected-units" v-if="selectedUnits.length > 0">
          <view v-for="(unit, index) in selectedUnits" :key="index" class="unit-item">
            <!-- 顶部标题 + 操作 -->
            <view class="unit-header">
              <text class="unit-title">{{ unit.label }}</text>
              <view class="unit-actions">
                <view class="remove-btn" @tap="removeUnit(index)">
                  <image :src="serverUrl + '/static/icons/common/close.png'" class="remove-icon" />
                </view>
              </view>
            </view>
            <!-- 内联配置区域 -->
            <view class="unit-config-inline">
              <!-- 楼层/出行方向 -->
              <view class="config-section">
                <text class="config-label">{{ formData.locationType === 1 ? '搜救楼层' : '出行方向' }} <text class="required">*</text></text>
                <view v-if="formData.locationType === 1" class="input-container">
                  <input v-model="unit.rescueFloor" class="form-input" type="number" maxlength="3" placeholder="请输入搜救楼层(1-100，正整数)" @input="onRescueFloorInput(unit, $event)" />
                </view>
                <view v-else class="form-picker-row">
                  <picker :value="unit.directionIndex" :range="directionOptions" range-key="label" @change="onDirectionChange($event, unit)" class="form-picker">
                    <view class="picker-display">
                      <text class="picker-text" :class="{'placeholder':!unit.direction}">{{ getDirectionText(unit) }}</text>
                      <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
                    </view>
                  </picker>
                </view>
              </view>

              <!-- 任务类型 -->
              <view class="config-section">
                <text class="config-label">任务类型 <text class="required">*</text></text>
                <picker :value="unit.taskTypeIndex" :range="taskTypeOptions" range-key="label" @change="onTaskTypeChange($event, unit)" class="form-picker">
                  <view class="picker-display">
                    <text class="picker-text" :class="{'placeholder':!unit.taskType}">{{ getTaskTypeText(unit) }}</text>
                    <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
                  </view>
                </picker>
              </view>

              <!-- 动态内容 -->
              <view class="config-section" v-if="unit.taskType && unit.taskConfig">
                <text class="config-label">{{ getTaskContentTitle(unit) }}</text>
                <view v-if="unit.taskConfig.uiType === 'select'" class="form-picker-section">
                  <view class="force-options">
                    <view v-for="(opt, idx) in (unit.taskConfig.options || [])" :key="idx" class="force-option" :class="{ active: unit.taskExtra[unit.taskConfig.actionKey] === opt }" @tap="selectTaskOption(opt, unit)">
                      <text class="force-label">{{ opt }}</text>
                    </view>
                  </view>
                </view>
                <view v-else-if="unit.taskConfig.uiType === 'input'" class="input-container">
                  <input v-model="unit.taskExtra[unit.taskConfig.actionKey]" class="form-input" :placeholder="unit.taskConfig.placeholder || '请输入'" />
                </view>
                <view v-else-if="unit.taskConfig.uiType === 'select-collection'" class="form-picker-section">
                  <picker :value="unit.dynamicSelectIndex" :range="assignedUnitOptions" range-key="label" @change="onDynamicSelectChange($event, unit)" class="form-picker">
                    <view class="picker-display">
                      <text class="picker-text" :class="{'placeholder':!unit.taskExtra[unit.taskConfig.actionKey]}">{{ getDynamicSelectText(unit) }}</text>
                      <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
                    </view>
                  </picker>
                </view>
              </view>

              <!-- 救援车辆选择 -->
              <view class="config-section">
                <text class="config-label">救援车辆 <text class="required">*</text></text>
                <view class="car-selector" @tap="showCarDrawer(unit, index)">
                  <text class="car-text">{{ getCarNames(unit) || '选择车辆' }}</text>
                  <image :src="serverUrl + '/static/icons/common/right.png'" class="arrow-icon" />
                </view>
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

    <!-- 救援车辆选择抽屉（底部弹出） -->
    <view class="drawer-mask" v-if="carDrawerVisible" @tap="hideCarDrawer">
      <view class="drawer-panel" @tap.stop>
        <view class="drawer-header">
          <text class="drawer-title">选择救援车辆</text>
          <view class="drawer-close" @tap="hideCarDrawer">
            <image :src="serverUrl + '/static/icons/common/close.png'" class="close-icon" />
          </view>
        </view>
        <view class="drawer-body">
          <view v-for="(car, idx) in fireCarOptions" :key="idx" class="drawer-item" :class="{ active: isCarTempSelected(car) }" @tap="toggleCarInDrawer(car)">
            <view class="checkbox">
              <view class="checkbox-inner" v-if="isCarTempSelected(car)"></view>
            </view>
            <view class="drawer-item-info">
              <text class="unit-label">{{ car.label }}</text>
            </view>
            <text class="status-badge" :class="(car.status === 'rescuing' || car.state === 1 || car.status === 1) ? 'rescuing' : 'idle'">{{ getCarStatusText(car) }}</text>
          </view>
        </view>
        <view class="drawer-footer">
          <button class="confirm-btn" @tap="confirmCarDrawer">确定</button>
        </view>
      </view>
    </view>

    <!-- 救援单位选择抽屉（底部弹出） -->
    <view class="drawer-mask" v-if="showUnitDrawer" @tap="hideUnitSelector">
      <view class="drawer-panel" @tap.stop>
        <view class="drawer-header">
          <text class="drawer-title">选择救援单位</text>
          <view class="drawer-close" @tap="hideUnitSelector">
            <image :src="serverUrl + '/static/icons/common/close.png'" class="close-icon" />
          </view>
        </view>
        <view class="drawer-body">
          <view v-for="(unit, index) in fireUnitOptions" :key="index" class="drawer-item" :class="{ disabled: isAlreadyAssigned(unit), active: !isAlreadyAssigned(unit) && isUnitSelected(unit) }" @tap="onPickUnit(unit)">
            <view class="checkbox">
              <view class="checkbox-inner" v-if="isUnitSelected(unit)"></view>
            </view>
            <view class="drawer-item-info">
              <text class="unit-label">{{ unit.label }}</text>
            </view>
            <text class="status-badge" :class="(unit.status === 'rescuing' || unit.state === 1 || unit.status === 1) ? 'rescuing' : 'idle'">{{ getDrawerUnitStatusText(unit) }}</text>
          </view>
        </view>
        <view class="drawer-footer">
          <button class="confirm-btn" @tap="confirmUnits">确定</button>
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
      serverUrl: 'http://192.168.1.4:3000',
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
      showUnitDrawer: false,
      carDrawerVisible: false,
      currentUnitIndex: -1, // 当前单位索引
      tempSelectedUnits: [], // 临时选择的单位
      tempSelectedCars: [] // 车辆抽屉的临时选择
    }
  },
  computed: {
    availableUnits() {
      // 过滤掉已选择的单位
      return this.fireUnitOptions.filter(unit => !this.selectedUnits.some(selected => selected.value === unit.value))
    },
    // 供水选择集合：只能选择已指派的救援单位
    assignedUnitOptions() {
      return (this.selectedUnits || []).map(u => ({ label: u.label, value: u.value }))
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
      if (!this.formData.addressId) {
        uni.showToast({ title: '请先选择救援地址', icon: 'none' })
        return
      }
      this.tempSelectedUnits = [...this.selectedUnits]
      this.showUnitDrawer = true
    },
    hideUnitSelector() {
      this.showUnitDrawer = false
    },
    // 选择救援单位
    onPickUnit(unit) {
      if (this.isAlreadyAssigned(unit)) return
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
    // 打开车辆抽屉
    showCarDrawer(unit, index) {
      this.currentUnitIndex = index
      this.tempSelectedCars = [...((this.selectedUnits[index] && this.selectedUnits[index].selectedCars) || [])]
      this.carDrawerVisible = true
    },
    hideCarDrawer() {
      this.carDrawerVisible = false
    },
    toggleCarInDrawer(car) {
      const i = this.tempSelectedCars.findIndex(c => c.value === car.value)
      if (i > -1) {
        this.tempSelectedCars.splice(i, 1)
      } else {
        this.tempSelectedCars.push(car)
      }
    },
    isCarTempSelected(car) {
      return this.tempSelectedCars.some(c => c.value === car.value)
    },
    getCarStatusClass(car) {
      const st = car.status || car.state || 'idle'
      return st === 'rescuing' || st === 1 ? 'rescuing' : 'idle'
    },
    getCarStatusText(car) {
      const st = car.status || car.state || 'idle'
      return (st === 'rescuing' || st === 1) ? '救援中' : '空闲中'
    },
    confirmCarDrawer() {
      const list = [...this.tempSelectedCars]
      if (this.currentUnitIndex > -1 && this.selectedUnits[this.currentUnitIndex]) {
        this.$set(this.selectedUnits[this.currentUnitIndex], 'selectedCars', list)
      }
      // 同步更新表单数据
      this.updateFormData()
      this.carDrawerVisible = false
    },
    getCarNames(unit) {
      if (!unit || !unit.selectedCars || unit.selectedCars.length === 0) return ''
      return unit.selectedCars.map(c => c.label).join('、')
    },
    isUnitSelected(unit) {
      return this.tempSelectedUnits.some(item => item.value === unit.value)
    },
    isAlreadyAssigned(unit) {
      return this.selectedUnits.some(item => item.value === unit.value)
    },
    getUnitStatusClass(unit) {
      const st = unit.status || unit.state || 'idle'
      return st === 'rescuing' || st === 1 ? 'rescuing' : 'idle'
    },
    getUnitStatusText(unit) {
      const st = unit.status || unit.state || 'idle'
      return (st === 'rescuing' || st === 1) ? '救援中' : '空闲中'
    },
    // 抽屉内单位状态文案：若已指派（禁用），固定显示“正在使用”，否则按原状态显示
    getDrawerUnitStatusText(unit) {
      return this.isAlreadyAssigned(unit) ? '正在使用' : this.getUnitStatusText(unit)
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
    onDirectionChange(e, unit) {
      unit.directionIndex = Number(e.detail.value)
      unit.direction = this.directionOptions[unit.directionIndex]?.value || ''
    },
    onRescueFloorInput(unit, e) {
      let val = String(e.detail.value || '').replace(/\D/g, '')
      if (val === '') { unit.rescueFloor = '' ; return }
      let num = parseInt(val, 10)
      if (isNaN(num) || num < 1) num = 1
      if (num > 100) num = 100
      unit.rescueFloor = String(num)
    },
    getDirectionText(unit) {
      return (this.directionOptions[unit.directionIndex] && this.directionOptions[unit.directionIndex].label) || '请选择出行方向'
    },
    // 任务类型选择
    onTaskTypeChange(e, unit) {
      unit.taskTypeIndex = Number(e.detail.value)
      const picked = this.taskTypeOptions[unit.taskTypeIndex] || {}
      unit.taskType = picked.value || ''
      unit.taskConfig = picked.config || null
      unit.taskExtra = {}
      unit.dynamicSelectIndex = 0
      if (unit.taskConfig && unit.taskConfig.actionKey) {
        this.$set(unit, 'taskExtra', {})
        this.$set(unit.taskExtra, unit.taskConfig.actionKey, '')
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
    selectTaskOption(val, unit) {
      if (!unit.taskConfig) return
      this.$set(unit.taskExtra, unit.taskConfig.actionKey, val)
    },
    // 动态选择变化
    onDynamicSelectChange(e, unit) {
      unit.dynamicSelectIndex = Number(e.detail.value)
      const picked = this.fireUnitOptions[unit.dynamicSelectIndex]
      if (unit.taskConfig) {
        this.$set(unit.taskExtra, unit.taskConfig.actionKey, picked ? picked.value : '')
      }
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
        carInfo: (unit.selectedCars || []).map(car => ({ ...car }))
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
.assign-summary { flex: 1; display: flex; justify-content: flex-start; padding-left: 16rpx; }
.summary-text { font-size: 24rpx; color: #333;}
.summary-text.placeholder { color: #999; }
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
.selected-units { padding: 0 20rpx 8rpx; }
.unit-item { background: #fff; border-radius: 14rpx; margin: 0 4rpx 14rpx 4rpx; box-shadow: 0 4rpx 14rpx rgba(0,0,0,0.06); border: 1rpx solid #f0f0f0; }
.unit-header { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 16rpx 8rpx 16rpx; }
.unit-title { font-size: 28rpx; color: #1f2d3d; font-weight: 700; }
.unit-config-inline { padding: 8rpx 16rpx 14rpx 16rpx; background: #fff; border: 0; border-top: 1rpx solid #f5f5f5; border-bottom-left-radius: 14rpx; border-bottom-right-radius: 14rpx; }
.unit-info { flex: 1; min-width: 0; }
.unit-name { font-size: 26rpx; color: #333; font-weight: 600; display: block; }
.unit-actions { display: flex; align-items: center; gap: 12rpx; }
.unit-config-btn { display: none; }
.config-text { display: none; }
.remove-btn { padding: 8rpx; border-radius: 10rpx; background: #f5f7fa; }
.remove-icon { width: 26rpx; height: 26rpx; opacity: 0.9; }

/* 弹窗样式 */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-content { background: #fff; border-radius: 16rpx; width: 90%; max-height: 80vh; display: flex; flex-direction: column; }
.config-modal { width: 95%; max-height: 85vh; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; border-bottom: 1rpx solid #f0f0f0; }
.modal-title { font-size: 28rpx; font-weight: 600; color: #333; }
.close-btn { padding: 8rpx; }
.close-icon { width: 36rpx; height: 36rpx; }
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
.force-option { display: flex; align-items: center; justify-content: center; padding: 10rpx 16rpx; border: 2rpx solid #e6f4ff; border-radius: 12rpx; background: #f8faff; transition: background .2s, border-color .2s, color .2s; flex: 1; min-width: 0; height: 64rpx; box-sizing: border-box; }
.force-option.active { border-color: #1890ff; background: #1890ff; color: #fff; .force-label { color: #fff; } }
.force-label { font-size: 22rpx; color: #333; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.unit-option, .car-option { display: flex; align-items: center; padding: 16rpx; border-bottom: 1rpx solid #f0f0f0; }
.unit-label, .car-label { font-size: 26rpx; color: #333; margin-left: 12rpx; }
.modal-footer { padding: 24rpx; border-top: 1rpx solid #f0f0f0; }
.confirm-btn { width: 100%; height: 64rpx; background: linear-gradient(135deg, #1890ff, #40a9ff); color: #fff; border: none; border-radius: 12rpx; font-size: 26rpx; font-weight: 600; }

@keyframes checkmark { from{transform:scale(0) rotate(-45deg)} to{transform:scale(1) rotate(0)} }
.submit-section { position:fixed; bottom:0; left:0; right:0; background:#fff; padding:12rpx; padding-bottom: calc(24rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(24rpx + env(safe-area-inset-bottom)); box-shadow:0 -4rpx 16rpx rgba(0,0,0,.1); z-index:100; }
.submit-btn { width:100%; height:80rpx; background:linear-gradient(135deg,#1890ff,#40a9ff); color:#fff !important; border:none; border-radius:16rpx; font-size:32rpx; font-weight:600; box-shadow:0 4rpx 16rpx rgba(24,144,255,.3); }
.submit-btn:disabled { background:#d9d9d9; box-shadow:none; }

/* 底部抽屉样式 */
.drawer-mask { position: fixed; left:0; right:0; top:0; bottom:0; background: rgba(0,0,0,0.45); z-index: 1100; display: flex; align-items: flex-end; }
.drawer-panel { width: 100%; background: #fff; border-top-left-radius: 24rpx; border-top-right-radius: 24rpx; max-height: 88vh; display: flex; flex-direction: column; }
.drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 20rpx; border-bottom: 1rpx solid #f0f0f0; }
.drawer-title { font-size: 26rpx; font-weight: 600; color: #333; }
.drawer-close { padding: 16rpx; }
.drawer-body { padding: 12rpx 28rpx 28rpx; overflow-y: auto; }
.drawer-item { display: flex; align-items: center; padding: 24rpx 0; }
.drawer-item.disabled { opacity: 0.5; pointer-events: none; }
.drawer-item .checkbox { margin-right: 16rpx; width: 32rpx; height: 32rpx; border-width: 2rpx; border-style: solid; border-color: #cbd5e0; border-radius: 6rpx; background: #fff; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
.drawer-item .checkbox-inner { width: 22rpx; height: 22rpx; }
.drawer-item .checkbox { transition: background .2s ease, border-color .2s ease, transform .1s ease; }
.drawer-item:active .checkbox { transform: scale(0.95); }
.drawer-item.active .checkbox { border-color: #1890ff; background: #1890ff; }
.drawer-item .checkbox-inner { width: 18rpx; height: 18rpx; background: transparent; transform: scale(0); transition: transform .15s ease; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'); background-size: 100% 100%; background-repeat: no-repeat; background-position: center center; }
.drawer-item.active .checkbox-inner { transform: scale(1); }
.drawer-item-info { display: flex; flex-direction: column; gap: 4rpx; flex: 1; }
.drawer-item .unit-label { font-size: 28rpx; }
.status-badge { font-size: 24rpx; padding: 8rpx 12rpx; border-radius: 12rpx; border: 2rpx solid #e6f4ff; background: #f6fbff; color: #1890ff; white-space: nowrap; }
.status-badge.rescuing { background: #fff1f0; border-color: #ffd6d6; color: #ff4d4f; }
.status-badge.idle { background: #f6ffed; border-color: #b7eb8f; color: #52c41a; }
.drawer-footer { padding: 16rpx 24rpx 24rpx; border-top: 1rpx solid #f0f0f0; }
</style>