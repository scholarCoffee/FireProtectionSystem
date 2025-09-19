<template>
  <view class="owner-edit-page">
    <view class="card">
      <!-- 栋、单元、楼层 - 选填，平铺显示，支持手动输入 -->
      <view class="row-optional">
        <view class="col-optional">
          <text class="label-optional">栋</text>
          <input 
            class="input-optional" 
            v-model="form.building" 
            type="number" 
            :disabled="!canEditAll" 
            placeholder="请输入栋号" 
            @input="onBuildingInput"
          />
        </view>
        <view class="col-optional">
          <text class="label-optional">单元</text>
          <input 
            class="input-optional" 
            v-model="form.unit" 
            type="number" 
            :disabled="!canEditAll" 
            placeholder="请输入单元号" 
            @input="onUnitInput"
          />
        </view>
        <view class="col-optional">
          <text class="label-optional">楼层</text>
          <input 
            class="input-optional" 
            v-model="form.floor" 
            type="number" 
            :disabled="!canEditAll" 
            placeholder="请输入楼层" 
            @input="onFloorInput"
          />
        </view>
      </view>
      
      <!-- 房间号 - 必填 -->
      <view class="row1">
        <text class="label required">房间号</text>
        <input class="input normal-input" v-model="form.roomNo" :disabled="!canEditAll" placeholder="例如 301 或 A-301" />
      </view>
      
      <!-- 住户姓名 - 必填，单独一行 -->
      <view class="row1">
        <text class="label required">住户姓名</text>
        <input class="input normal-input" v-model="form.name" :disabled="!canEditAll && mode==='edit'" placeholder="请输入住户姓名" />
      </view>
      
      <!-- 住户电话 - 必填，单独一行 -->
      <view class="row1">
        <text class="label required">住户电话</text>
        <view class="input-container">
          <input class="input" v-model="form.phone" type="number" :disabled="!canEditAll && mode==='edit'" placeholder="请输入手机号码" @input="onPhoneInput" />
          <text class="phone-error" v-if="phoneError">{{ phoneError }}</text>
        </view>
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
        <input class="input normal-input" v-model="form.area" type="digit" :disabled="!canEditAll" placeholder="支持小数点后两位" @input="onAreaInput" />
      </view>
      <view class="row1">
        <text class="label">备注</text>
        <input class="input normal-input" v-model="form.remark" :disabled="!canEditAll && mode==='edit'" />
      </view>
    </view>

    <view class="actions">
      <button class="btn secondary" @tap="goBack">取消</button>
      <button class="btn primary" @tap="submit">保存</button>
    </view>
  </view>
</template>

<script>
import { statusOptions, peopleCountOptions } from '@/commons/js/ownerConstants.js'
import { validatePhone } from '@/commons/js/utils.js'

export default {
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space',
      addressId: '',
      mode: 'add', // add | edit
      userInfo: {},
      statusOptions,
      statusIndex: 0,
      // 房间人数选项 (1-100)
      peopleCountOptions,
      // 选择器索引
      peopleCountIndex: 0,
      form: {
        _id: '', building: '', unit: '', floor: '', roomNo: '',
        name: '', phone: '', status: 1, peopleCount: 1, area: '', remark: ''
      },
      phoneError: '' // 手机号码错误提示
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
    // 编辑模式：根据id查询详情并回填
    if (this.mode === 'edit' && options._id) {
      this.form._id = options._id
      this.fetchDetail(options._id)
    }
  },
  methods: {
    // 住户情况选择
    selectStatus(index) {
      this.statusIndex = index
      this.form.status = this.statusOptions[index].value
      
      // 新增模式下，如果选择"房间有人"，默认设置房间人数为1
      if (this.mode === 'add' && this.form.status === 1 && !this.form.peopleCount) {
        this.form.peopleCount = 1
        this.peopleCountIndex = this.peopleCountOptions.findIndex(v => String(v) === '1')
        if (this.peopleCountIndex < 0) this.peopleCountIndex = 0
      }
    },
    onStatusChange(e) {
      this.statusIndex = Number(e.detail.value)
      this.form.status = this.statusOptions[this.statusIndex].value
      
      // 新增模式下，如果选择"房间有人"，默认设置房间人数为1
      if (this.mode === 'add' && this.form.status === 1 && !this.form.peopleCount) {
        this.form.peopleCount = 1
        this.peopleCountIndex = this.peopleCountOptions.findIndex(v => String(v) === '1')
        if (this.peopleCountIndex < 0) this.peopleCountIndex = 0
      }
    },
    // 栋输入 - 限制1-100正整数
    onBuildingInput(e) {
      this.form.building = this.normalizeNumber(e.detail.value, 1, 100)
    },
    // 单元输入 - 限制1-100正整数
    onUnitInput(e) {
      this.form.unit = this.normalizeNumber(e.detail.value, 1, 100)
    },
    // 楼层输入 - 限制1-100正整数
    onFloorInput(e) {
      this.form.floor = this.normalizeNumber(e.detail.value, 1, 100)
    },
    // 数字规范化：限制在指定范围内的正整数
    normalizeNumber(value, min, max) {
      if (!value) return ''
      
      // 只保留数字
      let numStr = String(value).replace(/\D/g, '')
      
      // 如果为空，返回空字符串
      if (!numStr) return ''
      
      // 转换为数字
      let num = parseInt(numStr, 10)
      
      // 限制范围
      if (num < min) num = min
      if (num > max) num = max
      
      return String(num)
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
    // 手机号码输入校验
    onPhoneInput(e) {
      this.form.phone = e.detail.value
      this.phoneError = ''
      
      // 如果输入不为空，进行实时校验
      if (this.form.phone) {
        const phoneValidation = validatePhone(this.form.phone)
        if (!phoneValidation.valid) {
          this.phoneError = phoneValidation.message
        } else {
          // 校验通过，使用清理后的手机号码
          this.form.phone = phoneValidation.cleanPhone
        }
      }
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
    fetchDetail(_id) {
      uni.showLoading({ title: '加载中...' })
      uni.request({
        url: this.serverUrl + '/owner/detail',
        method: 'GET',
        data: { _id: _id, addressId: this.addressId },
        success: (res) => {
          uni.hideLoading()
          if (res.data && res.data.code === 200) {
            const data = res.data.data || {}
            // 直接使用接口返回的数据，不做逐字段重新赋值
            this.form = { ...this.form, ...data }

            // 状态选择索引
            const sIdx = this.statusOptions.findIndex(op => String(op.value) === String(this.form.status))
            this.statusIndex = sIdx > -1 ? sIdx : 0

            // 房间人数选择器索引
            this.peopleCountIndex = this.form.peopleCount ? this.peopleCountOptions.findIndex(v => String(v) === String(this.form.peopleCount)) : 0
            if (this.peopleCountIndex < 0) this.peopleCountIndex = 0
          } else {
            uni.showToast({ title: res.data?.msg || '获取详情失败', icon: 'none' })
          }
        },
        fail: (err) => {
          uni.hideLoading()
          uni.showToast({ title: err.errMsg || '网络错误', icon: 'none' })
        }
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
      
      // 手机号码格式校验
      const phoneValidation = validatePhone(this.form.phone)
      if (!phoneValidation.valid) {
        uni.showToast({ title: phoneValidation.message, icon: 'none' })
        return
      }
      // 使用清理后的手机号码
      this.form.phone = phoneValidation.cleanPhone
      
      // 如果住房情况选择房间有人，房间人数必填
      if (this.form.status === 1) {
        const n = Number(this.form.peopleCount)
        if (!n || n < 1 || n > 100 || !Number.isInteger(n)) {
          uni.showToast({ title: '请输入房间人数（1-100）', icon: 'none' })
          return
        }
      }
      
      // 栋、单元、楼层验证（1-100正整数）
      if (this.form.building) {
        const building = Number(this.form.building)
        if (!Number.isInteger(building) || building < 1 || building > 100) {
          uni.showToast({ title: '栋号必须是1-100的正整数', icon: 'none' })
          return
        }
      }
      if (this.form.unit) {
        const unit = Number(this.form.unit)
        if (!Number.isInteger(unit) || unit < 1 || unit > 100) {
          uni.showToast({ title: '单元号必须是1-100的正整数', icon: 'none' })
          return
        }
      }
      if (this.form.floor) {
        const floor = Number(this.form.floor)
        if (!Number.isInteger(floor) || floor < 1 || floor > 100) {
          uni.showToast({ title: '楼层必须是1-100的正整数', icon: 'none' })
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
      if (this.mode === 'add') {
        delete payload._id
      }
      if (this.form.status !== 1 ) {
        delete payload.peopleCount
      }
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
  .normal-input {
    flex: 1;
  }
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

// 选填项输入框样式
.input-optional {
  height: 72rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 0 16rpx;
  font-size: 26rpx;
  border: 2rpx solid #e6f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-weight: 500;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.08);
  transition: all 0.3s ease;
  text-align: center;
}

.input-optional:focus {
  border-color: #1890ff;
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.15);
  transform: translateY(-2rpx);
}

.input-optional::placeholder {
  color: #999;
  font-weight: 500;
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

// 输入框容器
.input-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

// 输入框和选择器样式
.input, .picker-box { 
  height: 72rpx; 
  background: #f7fbff; 
  border-radius: 16rpx; 
  padding: 0 20rpx; 
  font-size: 26rpx; 
  border: 2rpx solid #e6f4ff;
  transition: all 0.3s ease;
}

// 手机号码错误提示
.phone-error {
  color: #ff4d4f;
  font-size: 22rpx;
  margin-top: 8rpx;
  padding-left: 4rpx;
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

.btn.secondary::after { border: none !important; }

.btn:disabled {
  opacity: 0.5;
  transform: none !important;
}
</style>

