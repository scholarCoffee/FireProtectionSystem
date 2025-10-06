<template>
  <view class="task-deliver-page">
    <view class="section">
      <text class="title">任务下达</text>
      <view class="row"><text class="label">火灾编号</text><text class="value">{{ situationId }}</text></view>
      <view class="row">
        <text class="label">目标单位</text>
        <picker :value="unitIndex" :range="unitOptions" range-key="label" @change="onUnitChange" class="picker">
          <view class="picker-box">{{ (unitOptions[unitIndex] && unitOptions[unitIndex].label) || '请选择单位' }}</view>
        </picker>
      </view>
      <view class="row">
        <text class="label">任务类型</text>
        <picker :value="typeIndex" :range="taskTypeOptions" range-key="label" @change="onTypeChange" class="picker">
          <view class="picker-box">{{ (taskTypeOptions[typeIndex] && taskTypeOptions[typeIndex].label) || '请选择任务类型' }}</view>
        </picker>
      </view>
      <view class="row">
        <text class="label">备注</text>
        <input class="input" v-model="remark" placeholder="请输入任务说明" />
      </view>
    </view>
    <view class="footer">
      <button class="submit" @tap="submit">提交</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      serverUrl: 'http://192.168.3.87:3000',
      situationId: '',
      unitOptions: [],
      taskTypeOptions: [],
      unitIndex: 0,
      typeIndex: 0,
      remark: ''
    }
  },
  onLoad(query) {
    this.situationId = (query && query.situationId) || ''
    this.loadStatic()
  },
  methods: {
    loadStatic() {
      const units = uni.getStorageSync('static_fireUnits') || []
      const types = uni.getStorageSync('static_taskTypes') || []
      this.unitOptions = [{ label: '请选择单位', value: '', index: 0 }, ...units]
      this.taskTypeOptions = [{ label: '请选择任务类型', value: '', index: 0 }, ...types]
    },
    onUnitChange(e) { this.unitIndex = Number(e.detail.value) },
    onTypeChange(e) { this.typeIndex = Number(e.detail.value) },
    async submit() {
      if (this.unitIndex === 0 || this.typeIndex === 0) {
        uni.showToast({ title: '请选择单位和任务类型', icon: 'none' }); return
      }
      const payload = {
        situationId: this.situationId,
        unitId: this.unitOptions[this.unitIndex].value,
        unitName: this.unitOptions[this.unitIndex].label,
        taskType: this.taskTypeOptions[this.typeIndex].value,
        remark: this.remark
      }
      try {
        const res = await new Promise((resolve, reject) => {
          uni.request({ url: this.serverUrl + '/fire/task/deliver', method: 'POST', data: payload, success: resolve, fail: reject })
        })
        if (res && res.data && res.data.code === 200) {
          uni.showToast({ title: '下达成功', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 800)
        } else {
          throw new Error(res && res.data && res.data.msg || '下达失败')
        }
      } catch(e) {
        uni.showToast({ title: e.message || '下达失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.task-deliver-page{min-height:100vh;background:#f5f9ff;padding:16rpx 16rpx 120rpx}
.section{background:#fff;border-radius:12rpx;padding:16rpx 20rpx;box-shadow:0 2rpx 8rpx rgba(24,144,255,.06)}
.title{font-size:30rpx;color:#1f2d3d;font-weight:700;margin-bottom:12rpx;display:block}
.row{display:flex;align-items:center;justify-content:space-between;padding:12rpx 0}
.label{font-size:22rpx;color:#666}
.value{font-size:24rpx;color:#333}
.picker{width:60%}
.picker-box{height:56rpx;line-height:56rpx;border-radius:8rpx;border:2rpx solid #e6f4ff;background:#f8faff;padding:0 12rpx;font-size:22rpx;color:#333}
.input{flex:1;height:56rpx;border:2rpx solid #e6f4ff;border-radius:8rpx;background:#f8faff;padding:0 12rpx;color:#333;margin-left:12rpx}
.footer{position:fixed;left:0;right:0;bottom:0;background:#fff;padding:12rpx 16rpx;box-shadow:0 -2rpx 8rpx rgba(0,0,0,.06)}
.submit{width:100%;height:80rpx;border:none;border-radius:12rpx;background:linear-gradient(135deg,#1890ff,#40a9ff);color:#fff;font-size:30rpx;font-weight:700}
</style>


