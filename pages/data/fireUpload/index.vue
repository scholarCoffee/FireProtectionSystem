<template>
    <view class="fire-upload-page">
      <view class="form-container">
        <!-- 消防单位 -->
        <view class="form-section">
          <view class="section-header">
            <text class="section-title">消防单位 <text class="required">*</text></text>
          </view>
          <picker :value="fireUnitIndex" :range="fireUnitOptions" range-key="label" @change="onFireUnitChange" class="form-picker">
            <view class="picker-display">
              <text class="picker-text">{{ getFireUnitText }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
        </view>
  
        <!-- 消防车辆（静态：carList） -->
        <view class="form-section">
          <view class="section-header">
            <text class="section-title">消防车辆 <text class="required">*</text></text>
          </view>
          <picker :value="fireCarIndex" :range="fireCarOptions" range-key="label" @change="onFireCarChange" class="form-picker">
            <view class="picker-display">
              <text class="picker-text">{{ getFireCarText }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
        </view>
  
        <!-- 救灾地址（跳转选择页） -->
        <view class="form-section">
          <view class="section-header">
            <text class="section-title">救灾地址 <text class="required">*</text></text>
          </view>
          <view class="address-selector" @tap="goToAddressSelector">
            <text class="address-text">{{ selectedAddress.addressName || '请选择救灾地址' }}</text>
            <image :src="serverUrl + '/static/icons/common/right.png'" class="arrow-icon" />
          </view>
        </view>
  
        <!-- 位置类型（locationTabList） -->
        <view class="form-section">
          <view class="section-header">
            <text class="section-title">位置类型 <text class="required">*</text></text>
          </view>
          <picker :value="locationTypeIndex" :range="locationTypeOptions" range-key="name" @change="onLocationTypeChange" class="form-picker">
            <view class="picker-display">
              <text class="picker-text">{{ getLocationTypeText }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
        </view>
  
        <!-- 高层小区显示“搜救楼层”；其他类型显示“出行方向” -->
        <view class="form-section" v-if="formData.locationType">
          <view class="section-header">
            <text class="section-title">{{ formData.locationType === 1 ? '搜救楼层' : '出行方向' }} <text class="required">*</text></text>
          </view>
  
          <view v-if="formData.locationType === 1">
            <input v-model="formData.rescueFloor" class="form-input" type="number" maxlength="3" placeholder="请输入搜救楼层(1-100，正整数)" />
          </view>
          <view v-else>
            <picker :value="directionIndex" :range="directionOptions" range-key="label" @change="onDirectionChange" class="form-picker">
              <view class="picker-display">
                <text class="picker-text">{{ getDirectionText }}</text>
                <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
              </view>
            </picker>
          </view>
        </view>
  
        <!-- 任务类型（静态：taskList） -->
        <view class="form-section">
          <view class="section-header">
            <text class="section-title">任务类型 <text class="required">*</text></text>
          </view>
          <picker :value="taskTypeIndex" :range="taskTypeOptions" range-key="label" @change="onTaskTypeChange" class="form-picker">
            <view class="picker-display">
              <text class="picker-text">{{ getTaskTypeText }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
        </view>

        <!-- 不同任务类型的动态内容（基于配置） -->
        <view class="form-section" v-if="formData.taskType && currentTaskConfig">
          <view class="section-header">
            <text class="section-title">{{ taskContentTitleByConfig }}</text>
          </view>

          <!-- 配置：uiType = select（单选） -->
          <view v-if="currentTaskConfig.uiType === 'select'">
            <view class="force-options">
              <view v-for="(opt, idx) in (currentTaskConfig.options || [])" :key="idx" class="force-option" :class="{ active: taskExtra[currentTaskConfig.actionKey] === opt }" @tap="selectTaskOption(opt)">
                <view class="checkbox"><view class="checkbox-inner" v-if="taskExtra[currentTaskConfig.actionKey] === opt"></view></view>
                <text class="force-label">{{ opt }}</text>
              </view>
            </view>
          </view>

          <!-- 配置：uiType = input -->
          <view v-else-if="currentTaskConfig.uiType === 'input'">
            <input v-model="taskExtra[currentTaskConfig.actionKey]" class="form-input" :placeholder="currentTaskConfig.placeholder || '请输入'" />
          </view>

          <!-- 配置：uiType = select-collection（目前支持从消防单位集合选择） -->
          <view v-else-if="currentTaskConfig.uiType === 'select-collection'">
            <picker :value="dynamicSelectIndex" :range="fireUnitOptions" range-key="label" @change="onDynamicSelectChange" class="form-picker">
              <view class="picker-display">
                <text class="picker-text">{{ getDynamicSelectText }}</text>
                <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
              </view>
            </picker>
          </view>
        </view>
  
        <!-- 任务状态（静态：statusList） -->
        <view class="form-section">
          <view class="section-header">
            <text class="section-title">任务状态 <text class="required">*</text></text>
          </view>
          <picker :value="taskStatusIndex" :range="taskStatusOptions" range-key="label" @change="onTaskStatusChange" class="form-picker">
            <view class="picker-display">
              <text class="picker-text">{{ getTaskStatusText }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
        </view>
  
        <!-- 备注 -->
        <view class="form-section">
          <view class="section-header"><text class="section-title">备注</text></view>
          <textarea v-model="formData.remark" class="form-textarea" maxlength="500" auto-height show-confirm-bar="false" placeholder="请输入备注信息" />
        </view>
        <view class="form-bottom-spacer"></view>
      </view>
  
      <!-- 提交 -->
      <view class="submit-section">
        <button class="submit-btn" @tap="submitForm" :disabled="!canSubmit">{{ submitting ? '提交中...' : '提交' }}</button>
      </view>
    </view>
  </template>
  
  <script>
  import { locationTabList } from '@/commons/mock/index.js'
  
  export default {
    name: 'FireUpload',
    data() {
      return {
        serverUrl: 'http://192.168.1.4:3000',
        formData: {
          fireUnit: '',
          fireCar: '',
          addressId: '',
          addressName: '',
          locationType: '',
          rescueFloor: '',
          direction: '',
          taskType: '',
          fireForces: [],
          rescueRoom: '',
          smokeMethod: '',
          waterSupply: '',
          taskStatus: '',
          remark: ''
        },
        fireUnitIndex: 0,
        fireCarIndex: 0,
        locationTypeIndex: 0,
        directionIndex: 0,
        taskTypeIndex: 0,
        taskStatusIndex: 0,
        smokeMethodIndex: 0,
        waterSupplyIndex: 0,
        fireUnitOptions: [],
        fireCarOptions: [],
        locationTypeOptions: locationTabList,
        directionOptions: [
          { value: 1, label: '东' }, { value: 2, label: '西' }, { value: 3, label: '南' }, { value: 4, label: '北' },
          { value: 5, label: '东南' }, { value: 6, label: '东北' }, { value: 7, label: '西南' }, { value: 8, label: '西北' }
        ],
        taskTypeOptions: [],
        taskStatusOptions: [],
        forceOptions: [
          { value: 1, label: '1枪' }, { value: 2, label: '2枪' }, { value: 3, label: '1炮' }, { value: 4, label: '2炮' }
        ],
        smokeMethodOptions: [
          { value: 1, label: '自然排烟' }, { value: 2, label: '排烟机排烟' }, { value: 3, label: '水雾排烟' }
        ],
        selectedAddress: {},
        submitting: false,
        // 基于任务类型配置的动态状态
        currentTaskConfig: null,
        taskExtra: {},
        dynamicSelectIndex: 0
      }
    },
    computed: {
      getFireUnitText() { return (this.fireUnitOptions[this.fireUnitIndex] && this.fireUnitOptions[this.fireUnitIndex].label) || '请选择消防单位' },
      getFireCarText() { return (this.fireCarOptions[this.fireCarIndex] && this.fireCarOptions[this.fireCarIndex].label) || '请选择消防车辆' },
      getLocationTypeText() { return (this.locationTypeOptions[this.locationTypeIndex] && this.locationTypeOptions[this.locationTypeIndex].name) || '请选择位置类型' },
      getDirectionText() { return (this.directionOptions[this.directionIndex] && this.directionOptions[this.directionIndex].label) || '请选择出行方向' },
      getTaskTypeText() { return (this.taskTypeOptions[this.taskTypeIndex] && this.taskTypeOptions[this.taskTypeIndex].label) || '请选择任务类型' },
      getTaskStatusText() { return (this.taskStatusOptions[this.taskStatusIndex] && this.taskStatusOptions[this.taskStatusIndex].label) || '请选择任务状态' },
      getSmokeMethodText() { return (this.smokeMethodOptions[this.smokeMethodIndex] && this.smokeMethodOptions[this.smokeMethodIndex].label) || '请选择排烟方式' },
      getWaterSupplyText() { return (this.fireUnitOptions[this.waterSupplyIndex] && this.fireUnitOptions[this.waterSupplyIndex].label) || '请选择供水对象' },
      taskContentTitle() {
        return { 1: '灭火力量', 2: '堵截力量', 3: '搜救房间', 4: '排烟方式', 5: '供水对象' }[this.formData.taskType] || '任务内容'
      },
      taskContentTitleByConfig() {
        const c = this.currentTaskConfig || {}
        const map = { firePower: '灭火力量', blockPower: '堵截力量', searchRoom: '搜救房间', smokeMethod: '排烟方式', supplyTarget: '供水对象' }
        return map[c.actionKey] || '任务内容'
      },
      getDynamicSelectText() {
        const idx = this.dynamicSelectIndex
        return (this.fireUnitOptions[idx] && this.fireUnitOptions[idx].label) || '请选择供水对象'
      },
      canSubmit() {
        const fd = this.formData
        if (fd.locationType === 1 && (!/^[1-9]\d{0,1}$|^100$/.test(String(fd.rescueFloor)))) return false
        if (fd.locationType !== 1 && !fd.direction) return false
        return fd.fireUnit && fd.fireCar && fd.addressId && fd.locationType && fd.taskType && fd.taskStatus && !this.submitting
      }
    },
    onLoad() {
      this.loadStaticData()
    },
    methods: {
      async loadStaticData() {
        try {
          uni.showLoading({ title: '加载中...' })
          const [fireUnits, fireCars, taskTypes, taskStatuses] = await Promise.all([
            this.fetchStaticData('fireUnits', 'unitList'),
            this.fetchStaticData('fireUnits', 'carList'),
            this.fetchStaticData('fireUnits', 'taskList'),
            this.fetchStaticData('fireUnits', 'statusList')
          ])
          this.fireUnitOptions = fireUnits
          this.fireCarOptions = fireCars
          // 任务类型带上后端下发的 config
          this.taskTypeOptions = taskTypes.map(it => ({ ...it }))
          this.taskStatusOptions = taskStatuses
        } catch (e) {
          uni.showToast({ title: '加载数据失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      },
      async fetchStaticData(type, key) {
        try {
          const res = await new Promise((resolve, reject) => {
            uni.request({
              url: this.serverUrl + '/static/data',
              method: 'GET',
              data: { type, key },
              success: resolve,
              fail: reject
            })
          })
          const list = res?.data?.data || []
          // 保留 config 以支持动态 UI
          return list.map((it, idx) => ({ label: it.data1, value: String(it.data2), index: idx, config: it.config }))
        } catch (e) {
          return []
        }
      },
      onFireUnitChange(e) { this.fireUnitIndex = Number(e.detail.value); this.formData.fireUnit = this.fireUnitOptions[this.fireUnitIndex]?.value || '' },
      onFireCarChange(e) { this.fireCarIndex = Number(e.detail.value); this.formData.fireCar = this.fireCarOptions[this.fireCarIndex]?.value || '' },
      onLocationTypeChange(e) {
        this.locationTypeIndex = Number(e.detail.value)
        this.formData.locationType = this.locationTypeOptions[this.locationTypeIndex]?.type || ''
        this.formData.rescueFloor = ''
        this.formData.direction = ''
        this.directionIndex = 0
      },
      onDirectionChange(e) { this.directionIndex = Number(e.detail.value); this.formData.direction = this.directionOptions[this.directionIndex]?.value || '' },
      onTaskTypeChange(e) {
        this.taskTypeIndex = Number(e.detail.value)
        const picked = this.taskTypeOptions[this.taskTypeIndex] || {}
        this.formData.taskType = picked.value || ''
        // 基于配置重置动态数据
        this.currentTaskConfig = picked.config || null
        this.taskExtra = {}
        this.dynamicSelectIndex = 0
      },
      onTaskStatusChange(e) { this.taskStatusIndex = Number(e.detail.value); this.formData.taskStatus = this.taskStatusOptions[this.taskStatusIndex]?.value || '' },
      onSmokeMethodChange(e) { this.smokeMethodIndex = Number(e.detail.value); this.formData.smokeMethod = this.smokeMethodOptions[this.smokeMethodIndex]?.value || '' },
      onWaterSupplyChange(e) { this.waterSupplyIndex = Number(e.detail.value); this.formData.waterSupply = this.fireUnitOptions[this.waterSupplyIndex]?.value || '' },
      toggleForce(val) {
        const i = this.formData.fireForces.indexOf(val)
        i > -1 ? this.formData.fireForces.splice(i, 1) : this.formData.fireForces.push(val)
      },
      selectTaskOption(val) {
        if (!this.currentTaskConfig) return
        this.$set(this.taskExtra, this.currentTaskConfig.actionKey, val)
      },
      onDynamicSelectChange(e) {
        this.dynamicSelectIndex = Number(e.detail.value)
        const picked = this.fireUnitOptions[this.dynamicSelectIndex]
        if (this.currentTaskConfig) {
          this.$set(this.taskExtra, this.currentTaskConfig.actionKey, picked ? picked.value : '')
        }
      },
      goToAddressSelector() {
        uni.navigateTo({
          url: '/pages/data/addressSelector/index?mode=select',
          success: (res) => {
            // 监听地址选择回传
            res.eventChannel.on('addressSelected', (data) => {
              this.selectedAddress = data
              this.formData.addressId = data.addressId
              this.formData.addressName = data.addressName
            })
          }
        })
      },
      async submitForm() {
        if (!this.canSubmit) {
          uni.showToast({ title: '请完善必填信息', icon: 'none' })
          return
        }
        try {
          this.submitting = true
          uni.showLoading({ title: '提交中...' })
          const currentUser = uni.getStorageSync('userInfo') || {}
          const now = new Date()
          const payload = { ...this.formData, taskExtra: this.taskExtra, issuePerson: currentUser.nickname || '未知用户', issuePersonId: currentUser.id || '', issueTime: now.toISOString(), updateTime: now.toISOString() }
          const res = await new Promise((resolve, reject) => {
            uni.request({ url: this.serverUrl + '/fire/upload', method: 'POST', data: payload, success: resolve, fail: reject })
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
  .section-header { padding: 16rpx 24rpx 12rpx; border-bottom: 1rpx solid #f0f0f0; background: #fafbfc; }
  .section-title { font-size: 28rpx; font-weight: 600; color: #333; }
  .required { color: #ff4d4f; margin-left: 4rpx; }
  .form-picker { padding: 16rpx 24rpx 24rpx; }
  .picker-display { display: flex; align-items: center; justify-content: space-between; height: 64rpx; padding: 0 16rpx; background: #f8faff; border-radius: 12rpx; border: 2rpx solid #e6f4ff; }
  .picker-text { font-size: 26rpx; color: #333; flex: 1; }
  .picker-arrow { width: 32rpx; height: 32rpx; opacity: .6; }
  .address-selector { display: flex; align-items: center; justify-content: space-between; min-height: 80rpx; padding: 0 16rpx; background: #f8faff; border-radius: 12rpx; margin: 24rpx; border: 2rpx solid #e6f4ff; }
  .address-text { font-size: 26rpx; color: #333; flex: 1; }
  .arrow-icon { width: 32rpx; height: 32rpx; opacity: .6; }
  .form-input { width: 100%; height: 64rpx; padding: 0 16rpx; background: #f8faff; border: 2rpx solid #e6f4ff; border-radius: 12rpx; font-size: 26rpx; color: #333; margin: 24rpx; box-sizing: border-box; }
  .form-textarea { width: 100%; min-height: 160rpx; padding: 16rpx; background: #f8faff; border: 2rpx solid #e6f4ff; border-radius: 12rpx; font-size: 26rpx; color: #333; margin: 24rpx; box-sizing: border-box; line-height: 1.6; }
  .form-bottom-spacer { height: 120rpx; }
  .force-options { padding: 24rpx; display: flex; flex-wrap: wrap; gap: 16rpx; }
  .force-option { display:flex; align-items:center; padding:16rpx 20rpx; border:2rpx solid #e1e8ed; border-radius:16rpx; background:#f8f9fa; transition:.3s; }
  .force-option.active { border-color:#1890ff; background:rgba(24,144,255,.08); }
  .checkbox { width:28rpx; height:28rpx; border:2rpx solid #cbd5e0; border-radius:6rpx; margin-right:16rpx; display:flex; justify-content:center; align-items:center; background:#fff; }
  .force-option.active .checkbox { border-color:#1890ff; background:#1890ff; }
  .checkbox-inner { width:20rpx; height:20rpx; background: transparent; transform:scale(0); animation:checkmark .3s forwards; background-image:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"white\"><path d=\"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z\"/></svg>'); background-size:contain; background-repeat:no-repeat; background-position:center; }
  .force-label { font-size: 24rpx; color: #333; font-weight: 500; }
  @keyframes checkmark { from{transform:scale(0) rotate(-45deg)} to{transform:scale(1) rotate(0)} }
  .submit-section { position:fixed; bottom:0; left:0; right:0; background:#fff; padding:24rpx; padding-bottom: calc(24rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(24rpx + env(safe-area-inset-bottom)); box-shadow:0 -4rpx 16rpx rgba(0,0,0,.1); z-index:100; }
  .submit-btn { width:100%; height:80rpx; background:linear-gradient(135deg,#1890ff,#40a9ff); color:#fff !important; border:none; border-radius:16rpx; font-size:32rpx; font-weight:600; box-shadow:0 4rpx 16rpx rgba(24,144,255,.3); }
  .submit-btn:disabled { background:#d9d9d9; box-shadow:none; }
</style>