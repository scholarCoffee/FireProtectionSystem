<template>
  <view class="owner-edit-page">
    <view class="card">
      <!-- 栋、单元、楼层 - 选填，平铺显示 -->
      <view class="row-optional">
        <view class="col-optional">
          <text class="label-optional">栋</text>
          <picker :value="buildingIndex" :range="buildingOptions" @change="onBuildingChange" :disabled="!canEditAll">
            <view class="picker-box-optional" :class="{ 'has-value': form.building }">{{ buildingOptions[buildingIndex] || '请选择' }}</view>
          </picker>
        </view>
        <view class="col-optional">
          <text class="label-optional">单元</text>
          <picker :value="unitIndex" :range="unitOptions" @change="onUnitChange" :disabled="!canEditAll">
            <view class="picker-box-optional" :class="{ 'has-value': form.unit }">{{ unitOptions[unitIndex] || '请选择' }}</view>
          </picker>
        </view>
        <view class="col-optional">
          <text class="label-optional">楼层</text>
          <picker :value="floorIndex" :range="floorOptions" @change="onFloorChange" :disabled="!canEditAll">
            <view class="picker-box-optional" :class="{ 'has-value': form.floor }">{{ floorOptions[floorIndex] || '请选择' }}</view>
          </picker>
        </view>
      </view>
      
      <!-- 房间号 - 必填 -->
      <view class="row1">
        <text class="label required">房间号</text>
        <input class="input" v-model="form.roomNo" :disabled="!canEditAll" placeholder="例如 301 或 A-301" />
      </view>
      
      <!-- 住户姓名 - 必填，单独一行 -->
      <view class="row1">
        <text class="label required">住户姓名</text>
        <input class="input" v-model="form.name" :disabled="!canEditAll && mode==='edit'" placeholder="请输入住户姓名" />
      </view>
      
      <!-- 住户电话 - 必填，单独一行 -->
      <view class="row1">
        <text class="label required">住户电话</text>
        <input class="input" v-model="form.phone" type="number" :disabled="!canEditAll && mode==='edit'" placeholder="请输入住户电话" />
      </view>
      
      <!-- 住户情况 - 平铺显示 -->
      <view class="row-status">
        <text class="label">住户情况</text>
        <view class="status-options">
          <view 
            v-for="(option, index) in statusOptions" 
            :key="index"
            class="status-option"
            :class="{ active: statusIndex === index }"
            @tap="selectStatus(index)"
          >
            {{ option.label }}
          </view>
        </view>
      </view>
      
      <!-- 房间人数 - 1-100可滚动选择，当住户情况为房间有人时必填，平铺显示 -->
      <view class="row-people-count" v-if="form.status === 1">
        <text class="label" :class="{ required: form.status === 1 }">房间人数</text>
        <view class="people-count-options">
          <picker :value="peopleCountIndex" :range="peopleCountOptions" @change="onPeopleCountChange" :disabled="!canChangeStatus">
            <view class="people-count-picker">
              <text class="people-count-text" :class="{ 'has-value': form.peopleCount }">{{ peopleCountOptions[peopleCountIndex] || '请选择' }}</text>
              <text class="people-count-arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>
      
      <view class="row1">
        <text class="label">房间大小(㎡)</text>
        <input class="input" v-model="form.area" type="digit" :disabled="!canEditAll" placeholder="支持小数点后两位" @input="onAreaInput" />
      </view>
      <view class="row1">
        <text class="label">备注</text>
        <input class="input" v-model="form.remark" :disabled="!canEditAll && mode==='edit'" />
      </view>
    </view>

    <view class="actions">
      <button class="btn secondary" @tap="goBack">取消</button>
      <button class="btn primary" @tap="submit">保存</button>
    </view>
  </view>
</template>

<script>
import { statusOptions, numberPickerOptionsWithEmpty, peopleCountOptions } from '@/commons/js/ownerConstants.js'

export default {
  data() {
    return {
      serverUrl: 'http://172.17.121.65:3000',
      addressId: '',
      mode: 'add', // add | edit
      userInfo: {},
      statusOptions,
      statusIndex: 0,
      // 栋、单元、楼层选项 (空值 + 1-100)
      buildingOptions: numberPickerOptionsWithEmpty,
      unitOptions: numberPickerOptionsWithEmpty,
      floorOptions: numberPickerOptionsWithEmpty,
      // 房间人数选项 (1-100)
      peopleCountOptions,
      // 选择器索引
      buildingIndex: 0,
      unitIndex: 0,
      floorIndex: 0,
      peopleCountIndex: 0,
      form: {
        id: '', building: '', unit: '', floor: '', roomNo: '',
        name: '', phone: '', status: 1, peopleCount: '', area: '', remark: ''
      }
    }
  },
  computed: {
    isAdmin() {
      const p = Number((this.userInfo && this.userInfo.permissionStatus) || 0)
      return p >= 1
    },
    canEditAll() { return this.mode === 'add' || this.mode === 'edit' },
    canChangeStatus() { return this.mode === 'add' || this.mode === 'edit' || (this.mode === 'detail' && this.isAdmin) },
    currentStatusLabel() {
      const o = this.statusOptions[this.statusIndex]
      return (o && o.label) ? o.label : ''
    }
  },
  onLoad(options) {
    this.addressId = options.addressId || ''
    this.mode = options.mode || 'add'
    const local = uni.getStorageSync('userInfo')
    if (local) this.userInfo = local
    // 如果未来支持编辑，读取详情填充
    if (this.mode === 'edit' && options.id) {
      this.form.id = options.id
      this.fetchDetail(options.id)
    }
  },
  methods: {
    // 住户情况选择
    selectStatus(index) {
      this.statusIndex = index
      this.form.status = this.statusOptions[index].value
    },
    onStatusChange(e) {
      this.statusIndex = Number(e.detail.value)
      this.form.status = this.statusOptions[this.statusIndex].value
    },
    // 栋选择
    onBuildingChange(e) {
      this.buildingIndex = Number(e.detail.value)
      const selectedValue = this.buildingOptions[this.buildingIndex]
      this.form.building = selectedValue === '请选择' ? '' : selectedValue
    },
    // 单元选择
    onUnitChange(e) {
      this.unitIndex = Number(e.detail.value)
      const selectedValue = this.unitOptions[this.unitIndex]
      this.form.unit = selectedValue === '请选择' ? '' : selectedValue
    },
    // 楼层选择
    onFloorChange(e) {
      this.floorIndex = Number(e.detail.value)
      const selectedValue = this.floorOptions[this.floorIndex]
      this.form.floor = selectedValue === '请选择' ? '' : selectedValue
    },
    // 房间人数选择
    onPeopleCountChange(e) {
      this.peopleCountIndex = Number(e.detail.value)
      this.form.peopleCount = this.peopleCountOptions[this.peopleCountIndex]
    },
    // 房间大小输入限制
    onAreaInput(e) {
      this.form.area = this.normalizeArea(e.detail.value)
    },
    // 归一化面积：仅数字与一个小数点，小数点后最多两位；示例 12.333 -> 12.33
    normalizeArea(raw) {
      if (raw === null || raw === undefined) return ''
      let value = String(raw)
      // 过滤非法字符
      value = value.replace(/[^\d.]/g, '')
      // 处理多个小数点，只保留第一个
      const firstDot = value.indexOf('.')
      if (firstDot !== -1) {
        const intPart = value.slice(0, firstDot)
        const decPartRaw = value.slice(firstDot + 1).replace(/\./g, '')
        const decPart = decPartRaw.slice(0, 2)
        value = decPart.length > 0 ? `${intPart}.${decPart}` : intPart + '.'
      }
      // 去除整数部分前导零（保留单个0 或 0.xx）
      if (value && value !== '.') {
        if (value.startsWith('0') && !value.startsWith('0.')) {
          // 去除前导零
          value = String(Number(value))
        }
      }
      return value
    },
    fetchDetail(id) {
      uni.request({
        url: this.serverUrl + '/owner/detail',
        method: 'GET',
        data: { id, addressId: this.addressId },
        success: (res) => {
          const data = (res && res.data && res.data.data) || {}
          // 直接使用接口返回的数据，不做逐字段重新赋值
          this.form = { ...this.form, ...data }

          // 状态选择索引
          const sIdx = this.statusOptions.findIndex(op => String(op.value) === String(this.form.status))
          this.statusIndex = sIdx > -1 ? sIdx : 0

          // 选择器索引（通过字符串比较定位，避免改动原始数据）
          this.buildingIndex = this.form.building ? this.buildingOptions.findIndex(v => String(v) === String(this.form.building)) : 0
          this.unitIndex = this.form.unit ? this.unitOptions.findIndex(v => String(v) === String(this.form.unit)) : 0
          this.floorIndex = this.form.floor ? this.floorOptions.findIndex(v => String(v) === String(this.form.floor)) : 0
          this.peopleCountIndex = this.form.peopleCount ? this.peopleCountOptions.findIndex(v => String(v) === String(this.form.peopleCount)) : 0

          // 若未匹配到则回退到0（"请选择"）
          if (this.buildingIndex < 0) this.buildingIndex = 0
          if (this.unitIndex < 0) this.unitIndex = 0
          if (this.floorIndex < 0) this.floorIndex = 0
          if (this.peopleCountIndex < 0) this.peopleCountIndex = 0
        },
        fail: () => {}
      })
    },
    submit() {
      // 必填字段校验
      if (!this.form.roomNo) {
        uni.showToast({ title: '请输入房间号', icon: 'none' })
        return
      }
      
      if (!this.form.name) {
        uni.showToast({ title: '请输入住户姓名', icon: 'none' })
        return
      }
      
      if (!this.form.phone) {
        uni.showToast({ title: '请输入住户电话', icon: 'none' })
        return
      }
      
      // 如果住房情况选择房间有人，房间人数必填
      if (this.form.status === 1) {
        const n = Number(this.form.peopleCount)
        if (!n || n < 1 || n > 100 || !Number.isInteger(n)) {
          uni.showToast({ title: '请输入房间人数（1-100）', icon: 'none' })
          return
        }
      }
      
      // 房间大小矫正与格式验证（自动矫正至两位小数以内）
      if (this.form.area) {
        this.form.area = this.normalizeArea(this.form.area)
        if (this.form.area && !/^\d+(?:\.\d{1,2})?$/.test(String(this.form.area))) {
          uni.showToast({ title: '房间大小格式不正确', icon: 'none' })
          return
        }
      }
      
      const payload = { ...this.form, addressId: this.addressId }
      const url = this.mode === 'edit' ? '/owner/update' : '/owner/save'
      uni.request({
        url: this.serverUrl + url,
        method: 'POST',
        data: payload,
        success: res => {
          if (res.data && res.data.code === 200) {
          uni.showToast({ title: '已保存', icon: 'success' })
            setTimeout(() => { this.goBack(true) }, 300)
          } else {
            uni.showToast({ title: res.data?.msg || '保存失败', icon: 'none' })
          }
        },
        fail: e => uni.showToast({ title: e.msg || '保存失败', icon: 'none' })
      })
    },
    goBack(refresh) {
      const pages = getCurrentPages()
      const prev = pages[pages.length - 2]
      if (refresh && prev && prev.$vm && prev.$vm.fetchOwnerList) {
        prev.$vm.fetchOwnerList()
      }
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss">
.owner-edit-page { 
  padding: 20rpx; 
  background: #f5f9ff; 
  min-height: 100vh; 
}

.card { 
  background: #fff; 
  border-radius: 20rpx; 
  padding: 30rpx; 
  box-shadow: 0 4rpx 16rpx rgba(24,144,255,0.06); 
}

// 基础行样式
.row1 { 
  display: flex; 
  gap: 12rpx; 
  align-items: center; 
  margin-bottom: 24rpx; 
}

// 选填项行样式 - 平铺显示，优化样式
.row-optional {
  display: flex;
  gap: 20rpx;
  margin-bottom: 32rpx;
  padding: 20rpx;
  background: linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%);
  border-radius: 16rpx;
  border: 2rpx solid #e6f4ff;
}

.col-optional {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.label-optional {
  color: #1890ff;
  font-size: 24rpx;
  text-align: center;
  font-weight: 500;
  background: rgba(24, 144, 255, 0.1);
  padding: 8rpx 12rpx;
  border-radius: 12rpx;
  border: 1rpx solid rgba(24, 144, 255, 0.2);
}

.picker-box-optional {
  height: 72rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 0 16rpx;
  font-size: 26rpx;
  border: 2rpx solid #e6f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-weight: 500;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.08);
  transition: all 0.3s ease;
}

.picker-box-optional:active {
  border-color: #1890ff;
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.15);
  transform: translateY(-2rpx);
}

.picker-box-optional.has-value {
  color: #333;
}

// 住户情况平铺样式
.row-status {
  margin-bottom: 24rpx;
}

.status-options {
  display: flex;
  gap: 12rpx;
  margin-top: 12rpx;
}

.status-option {
  flex: 1;
  height: 64rpx;
  background: #f7fbff;
  border-radius: 14rpx;
  border: 2rpx solid #e6f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #666;
  transition: all 0.3s ease;
}

.status-option.active {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: #fff;
  border-color: #1890ff;
  box-shadow: 0 4rpx 12rpx rgba(24,144,255,0.25);
}

// 房间人数平铺样式
.row-people-count {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
  padding: 20rpx;
  background: linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%);
  border-radius: 16rpx;
  border: 2rpx solid #e6f4ff;
}

.people-count-options {
  flex: 1;
  display: flex;
  justify-content: center;
}

.people-count-picker {
  height: 72rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 0 24rpx;
  border: 2rpx solid #e6f4ff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.08);
  transition: all 0.3s ease;
  min-width: 200rpx;
}

.people-count-picker:active {
  border-color: #1890ff;
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.15);
  transform: translateY(-2rpx);
}

.people-count-text {
  font-size: 28rpx;
  color: #999;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.people-count-arrow {
  font-size: 20rpx;
  color: #1890ff;
  font-weight: bold;
}

.people-count-text.has-value {
  color: #333;
}

// 标签样式
.label { 
  width: 160rpx; 
  color: #666; 
  font-size: 26rpx; 
  font-weight: 500;
}

.label.required::after {
  content: ' *';
  color: #ff4d4f;
}

// 输入框和选择器样式
.input, .picker-box { 
  flex: 1; 
  height: 72rpx; 
  background: #f7fbff; 
  border-radius: 16rpx; 
  padding: 0 20rpx; 
  font-size: 26rpx; 
  border: 2rpx solid #e6f4ff;
  transition: all 0.3s ease;
}

.input:focus, .picker-box:active {
  border-color: #1890ff;
  box-shadow: 0 0 0 4rpx rgba(24,144,255,0.1);
}

// 按钮样式优化
.actions { 
  margin-top: 40rpx; 
  display: flex; 
  justify-content: center; 
  gap: 20rpx; 
  padding: 0 20rpx;
}

.btn { 
  flex: 1;
  height: 80rpx; 
  line-height: 80rpx; 
  border-radius: 20rpx; 
  font-size: 28rpx; 
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
}

.btn.primary { 
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%); 
  color: #fff; 
  box-shadow: 0 6rpx 20rpx rgba(24,144,255,0.3);
}

.btn.primary:active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 16rpx rgba(24,144,255,0.4);
}

.btn.secondary { 
  background: #fff;
  color: #5e6c84; 
}

.btn.secondary:active {
  background: #e6f4ff;
  transform: translateY(2rpx);
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  transform: none !important;
}
</style>

