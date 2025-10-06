<template>
  <view class="fire-detail-page">
    <view class="header">
      <text class="title">{{ detail.addressName || '—' }}</text>
      <view class="status-tags">
        <view class="status-dot" :class="{ active: detail.taskStatus == 2 }">
          <text class="dot-label">救援中</text>
          <view class="ripple" v-if="detail.taskStatus == 2"></view>
        </view>
        <view class="status-dot" :class="{ active: detail.taskStatus == 3 }">
          <text class="dot-label">需要支援</text>
          <view class="ripple" v-if="detail.taskStatus == 3"></view>
        </view>
        <view class="status-dot" :class="{ active: detail.taskStatus == 1 }">
          <text class="dot-label">已完成</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="row"><text class="label">编号</text><text class="value">{{ detail.situationId }}</text></view>
      <view class="row" v-if="detail.updateTime"><text class="label">更新时间</text><text class="value">{{ formatTime(detail.updateTime) }}</text></view>
    </view>

    <view class="section" v-for="(u, i) in (detail.assignedUnits || [])" :key="i">
      <view class="row"><text class="label">救援单位</text><text class="value">{{ u.unitName }}</text></view>
      <view class="row" v-if="u.rescueFloor"><text class="label">楼层</text><text class="value">{{ u.rescueFloor }}层</text></view>
      <view class="row" v-if="u.direction"><text class="label">方向</text><text class="value">{{ getDirectionName(u.direction) }}</text></view>
      <view class="row"><text class="label">任务类型</text><text class="value">{{ getTaskTypeName(u.taskType) }}</text></view>
      <view class="row" v-if="u.taskExtra && Object.keys(u.taskExtra).length"><text class="label">任务内容</text><text class="value">{{ stringifyTaskExtra(u) }}</text></view>
      <view class="row"><text class="label">车辆</text><text class="value">{{ (u.carInfo||[]).map(c=>c.label).join('、') || '—' }}</text></view>
    </view>
  </view>
</template>

<script>
import { directionOptions } from '@/commons/js/fireStatus.js'

export default {
  data() {
    return {
      serverUrl: 'http://192.168.3.87:3000',
      directionOptions: directionOptions,
      detail: {}
    }
  },
  onLoad(query) {
    this.situationId = (query && query.situationId) || ''
    this.fetchDetail()
  },
  methods: {
    async fetchDetail() {
      try {
        const res = await new Promise((resolve, reject) => {
          uni.request({ url: this.serverUrl + '/fire/detail', method: 'GET', data: { situationId: this.situationId }, success: resolve, fail: reject })
        })
        if (res && res.data && res.data.code === 200) {
          this.detail = res.data.data || {}
        }
      } catch(e) {
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    formatTime(timeStr) {
      if (!timeStr) return ''
      const d = new Date(timeStr)
      const y = d.getFullYear()
      const m = String(d.getMonth()+1).padStart(2,'0')
      const da = String(d.getDate()).padStart(2,'0')
      const h = String(d.getHours()).padStart(2,'0')
      const mi = String(d.getMinutes()).padStart(2,'0')
      return `${y}-${m}-${da} ${h}:${mi}`
    },
    getDirectionName(val) {
      const d = this.directionOptions.find(it => it.value === Number(val))
      return d ? d.label : val
    },
    getTaskTypeName(val) {
      const types = uni.getStorageSync('static_taskTypes') || []
      const t = types.find(it => it.value === String(val))
      return t ? t.label : val
    },
    stringifyTaskExtra(u) {
      const pairs = Object.keys(u.taskExtra || {}).map(k => `${k}:${u.taskExtra[k]}`)
      return pairs.join('；')
    }
  }
}
</script>

<style scoped>
.fire-detail-page{min-height:100vh;background:#f5f9ff;padding:16rpx}
.header{background:#fff;border-radius:12rpx;padding:16rpx 20rpx;box-shadow:0 2rpx 8rpx rgba(24,144,255,.06);margin-bottom:12rpx}
.title{font-size:30rpx;color:#1f2d3d;font-weight:700}
.status-tags{display:flex;align-items:center;gap:12rpx;margin-top:8rpx}
.status-dot{position:relative;display:flex;align-items:center;gap:8rpx}
.status-dot:before{content:'';width:12rpx;height:12rpx;border-radius:50%;background:#d9d9d9;display:inline-block}
.status-dot.active:before{background:#1890ff}
.status-dot .dot-label{font-size:22rpx;color:#666}
.status-dot.active .dot-label{color:#1890ff;font-weight:600}
.ripple{position:absolute;left:-6rpx;top:-6rpx;width:24rpx;height:24rpx;border-radius:50%;border:2rpx solid rgba(24,144,255,.5);animation:rippleAnim 1.8s infinite}
@keyframes rippleAnim{0%{transform:scale(.8);opacity:.8}70%{transform:scale(1.8);opacity:.2}100%{transform:scale(2.2);opacity:0}}
.section{background:#fff;border-radius:12rpx;padding:16rpx 20rpx;box-shadow:0 2rpx 8rpx rgba(24,144,255,.06);margin-bottom:12rpx}
.row{display:flex;align-items:center;justify-content:space-between;padding:8rpx 0}
.label{font-size:22rpx;color:#666}
.value{font-size:24rpx;color:#333}
</style>


