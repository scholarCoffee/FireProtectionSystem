<template>
  <view class="fire-detail-page">
    <scroll-view class="content-scroll" scroll-y>
      <!-- 头部信息卡片 -->
      <view class="header-card">
        <view class="header-content">
          <view class="title-section">
            <text class="title" @tap="goToLocationDetail">{{ detail.addressName || '—' }}</text>
          </view>
          <view class="status-badge" :class="detail.taskStatus == 1 ? 'status-completed' : (detail.taskStatus == 2 ? 'status-progress' : (detail.taskStatus == 3 ? 'status-rescue' : (detail.taskStatus == 4 ? 'status-supporting' : 'status-unknown')))">
            <view class="status-dot"></view>
            {{ getStatusText(detail.taskStatus) }}
            <view class="ripple" v-if="detail.taskStatus == 2 || detail.taskStatus == 3 || detail.taskStatus == 4"></view>
          </view>
        </view>
        <!-- 人员和时间信息 -->
        <view class="info-section">
          <view class="info-row" v-if="detail.issuePersonName">
            <view class="info-item">
              <view class="info-icon">👤</view>
              <text class="info-label">下达人员</text>
              <text class="info-value">{{ detail.issuePersonName }}</text>
            </view>
          </view>
          <view class="info-row" v-if="detail.issueTime">
            <view class="info-item" >
              <view class="info-icon">📅</view>
              <text class="info-label">下达时间</text>
              <text class="info-value">{{ formatTime(detail.issueTime) }}</text>
            </view>
          </view>
          <view class="info-row" v-if="detail.updateTime">
            <view class="info-item" >
              <view class="info-icon">🕒</view>
              <text class="info-label">更新时间</text>
              <text class="info-value">{{ formatTime(detail.updateTime) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 主要救援单位 -->
      <view class="section-card main-units" v-if="getMainUnits().length > 0">
        <view class="section-header">
          <view class="section-icon">🚨</view>
          <text class="section-title">救援单位</text>
          <view class="unit-count">{{ getMainUnits().length }}个单位</view>
        </view>
        <view class="units-grid">
          <view class="unit-card modern-card" v-for="(u, i) in getMainUnits()" :key="i">
            <view class="unit-header">
              <view class="unit-icon">🏢</view>
              <text class="unit-name">{{ u.unitName }}</text>
            </view>
            <view class="unit-details">
              <view class="detail-item" v-if="u.rescueFloor">
                <view class="detail-icon">🏢</view>
                <text class="detail-label">楼层</text>
                <text class="detail-value">{{ u.rescueFloor }}层</text>
              </view>
              <view class="detail-item" v-if="u.direction">
                <view class="detail-icon">🧭</view>
                <text class="detail-label">方向</text>
                <text class="detail-value">{{ getDirectionName(u.direction) }}</text>
              </view>
              <view class="detail-item">
                <view class="detail-icon">📋</view>
                <text class="detail-label">任务类型</text>
                <text class="detail-value">{{ getTaskTypeName(u.taskType) }}</text>
              </view>
              <!-- 任务类型具体内容 -->
              <view class="detail-item" v-if="getTaskContent(u)">
                <view class="detail-icon">🎯</view>
                <text class="detail-label">任务内容</text>
                <text class="detail-value">{{ getTaskContent(u) }}</text>
              </view>
              <view class="detail-item">
                <view class="detail-icon">🚗</view>
                <text class="detail-label">车辆</text>
                <text class="detail-value">{{ (u.carInfo||[]).map(c=>c.label).join('、') || '—' }}</text>
              </view>
              <view class="detail-item" v-if="u.rescueTime">
                <view class="detail-icon">⏰</view>
                <text class="detail-label">救援时间</text>
                <text class="detail-value">{{ formatTime(u.rescueTime) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 支援单位 -->
      <view class="section-card support-units" v-if="getSupportUnits().length > 0">
        <view class="section-header">
          <view class="section-icon">🤝</view>
          <text class="section-title">支援单位</text>
          <view class="unit-count">{{ getSupportUnits().length }}个单位</view>
        </view>
        <view class="units-grid">
          <view class="unit-card modern-card" v-for="(u, i) in getSupportUnits()" :key="i">
            <view class="unit-header">
              <view class="unit-icon">🏢</view>
              <text class="unit-name">{{ u.unitName }}</text>
            </view>
            <view class="unit-details">
              <view class="detail-item" v-if="u.rescueFloor">
                <view class="detail-icon">🏢</view>
                <text class="detail-label">楼层</text>
                <text class="detail-value">{{ u.rescueFloor }}层</text>
              </view>
              <view class="detail-item" v-if="u.direction">
                <view class="detail-icon">🧭</view>
                <text class="detail-label">方向</text>
                <text class="detail-value">{{ getDirectionName(u.direction) }}</text>
              </view>
              <view class="detail-item">
                <view class="detail-icon">📋</view>
                <text class="detail-label">任务类型</text>
                <text class="detail-value">{{ getTaskTypeName(u.taskType) }}</text>
              </view>
              <!-- 任务类型具体内容 -->
              <view class="detail-item" v-if="getTaskContent(u)">
                <view class="detail-icon">🎯</view>
                <text class="detail-label">任务内容</text>
                <text class="detail-value">{{ getTaskContent(u) }}</text>
              </view>
              <view class="detail-item">
                <view class="detail-icon">🚗</view>
                <text class="detail-label">车辆</text>
                <text class="detail-value">{{ (u.carInfo||[]).map(c=>c.label).join('、') || '—' }}</text>
              </view>
              <view class="detail-item" v-if="u.rescueTime">
                <view class="detail-icon">⏰</view>
                <text class="detail-label">救援时间</text>
                <text class="detail-value">{{ formatTime(u.rescueTime) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 备注信息 -->
      <view class="section-card remark-section" v-if="detail.remark">
        <view class="section-header">
          <view class="section-icon">📝</view>
          <text class="section-title">备注信息</text>
        </view>
        <view class="remark-content">
          <text class="remark-text">{{ detail.remark }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="bottom-actions" v-if="detail.taskStatus != 1">
      <!-- 救援中状态：完成救援 + 需要支援 -->
      <template v-if="detail.taskStatus == 2 || detail.taskStatus == 4">
        <button class="action-btn finish-btn" @tap="finishRescue">
          完成救援
        </button>
        <button class="action-btn support-btn" @tap="requestSupport">
          需要支援
        </button>
      </template>
      
      <!-- 需要支援状态：任务下达 -->
      <template v-if="detail.taskStatus == 3">
        <button class="action-btn deliver-btn" @tap="deliverTask">
          任务下达
        </button>
      </template>
    </view>

    <!-- 已完成状态的删除按钮 -->
    <view class="bottom-actions" v-if="detail.taskStatus == 1">
      <button class="action-btn delete-btn" @tap="deleteFireSituation">
        <text class="delete-text">删除</text>
      </button>
    </view>
  </view>
</template>

<script>
import { directionOptions } from '@/commons/js/fireStatus.js'

export default {
  data() {
    return {
      serverUrl: 'http://192.168.1.4:3000',
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
    // 获取任务类型的具体内容
    getTaskContent(unit) {
      if (!unit || !unit.taskExtra) return ''
      
      const taskExtra = unit.taskExtra || {}
      
      // 字段中文映射
      const fieldMap = {
        'blockPower': '堵截力量',
        'blockArea': '堵截区域',
        'blockMethod': '堵截方法',
        'searchRoom': '搜救房间',
        'searchArea': '搜救区域',
        'searchMethod': '搜救方法',
        'searchTarget': '搜救目标',
        'waterTarget': '供水目标',
        'targetUnit': '目标单位',
        'supplyTarget': '供水目标',
        'smokeMethod': '排烟方法',
        'firePower': '灭火力量'
      }
      
      // 只显示taskExtra中的具体配置，不显示任务类型和方向
      const extraDetails = Object.keys(taskExtra).map(key => {
        const value = taskExtra[key]
        if (value && value !== '') {
          const chineseKey = fieldMap[key] || key
          return `${chineseKey}：${value}`
        }
        return null
      }).filter(Boolean)
      
      return extraDetails.join('，')
    },
    stringifyTaskExtra(u) {
      const pairs = Object.keys(u.taskExtra || {}).map(k => `${k}:${u.taskExtra[k]}`)
      return pairs.join('；')
    },
    // 跳转到位置详情
    goToLocationDetail() {
      if (this.detail.addressId) {
        uni.navigateTo({
          url: `/subPackages/locationInfo/locationDetail/index?addressId=${encodeURIComponent(this.detail.addressId)}`
        })
      }
    },
    // 获取状态样式类
    getStatusClass(status) {
      if (status == 1) return 'status-completed'
      if (status == 2) return 'status-progress'
      if (status == 3) return 'status-rescue'
      if (status == 4) return 'status-supporting'
      return 'status-unknown'
    },
    // 获取状态文本
    getStatusText(status) {
      if (status == 1) return '已完成'
      if (status == 2) return '救援中'
      if (status == 3) return '需要支援'
      if (status == 4) return '正在支援'
      return '未知状态'
    },
    // 获取主要救援单位（unitStatus为rescue）
    getMainUnits() {
      return (this.detail.assignedUnits || []).filter(unit => unit.unitStatus === 'rescue')
    },
    // 获取支援单位（unitStatus为support）
    getSupportUnits() {
      return (this.detail.assignedUnits || []).filter(unit => unit.unitStatus === 'support')
    },
    // 完成救援
    async finishRescue() {
      try {
        await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/fire/situations/${this.detail.situationId}`,
            method: 'PUT',
            data: { taskStatus: 1 },
            success: resolve,
            fail: reject
          })
        })
        uni.showToast({ title: '已完成救援', icon: 'success' })
        // 操作成功后返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch(e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    // 任务下达
    deliverTask() {
      uni.navigateTo({
        url: `/pages/data/fireUpload/index?situationId=${encodeURIComponent(this.detail.situationId)}`
      })
    },
    // 需要支援
    async requestSupport() {
      try {
        await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/fire/situations/${this.detail.situationId}`,
            method: 'PUT',
            data: { taskStatus: 3 },
            success: resolve,
            fail: reject
          })
        })
        uni.showToast({ title: '已申请支援', icon: 'success' })
        // 操作成功后返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch(e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    // 删除火灾情况
    async deleteFireSituation() {
      try {
        const confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认删除',
            content: '确定要删除这个火灾情况吗？删除后无法恢复。',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
          })
        })
        
        if (!confirmResult) return
        
        await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + `/fire/situations/${this.detail.situationId}`,
            method: 'DELETE',
            success: resolve,
            fail: reject
          })
        })
        uni.showToast({ title: '删除成功', icon: 'success' })
        // 删除成功后返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch(e) {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
/* 简洁背景 */
.fire-detail-page {
  height: 100vh;
  background: #f5f9ff;
  display: flex;
  flex-direction: column;
}

.content-scroll {
  flex: 1;
  box-sizing: border-box;
  padding: 20rpx;
  height: calc(100vh - 120rpx);
  padding-bottom: 170rpx;
}

/* 头部卡片 */
.header-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid #e6f4ff;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.title-section {
  display: flex;
  align-items: center;
  flex: 1;
}

.location-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.title {
  font-size: 32rpx;
  color: #1f2d3d;
  font-weight: 700;
  cursor: pointer;
}

.title:active {
  color: #1890ff;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 600;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.status-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
}

.status-badge.status-completed {
  background: linear-gradient(135deg, #52c41a, #73d13d);
}

.status-badge.status-progress {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
}

.status-badge.status-rescue {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
}

.status-badge.status-supporting {
  background: linear-gradient(135deg, #fa8c16, #ffa940);
}

.status-badge.status-unknown {
  background: linear-gradient(135deg, #8c8c8c, #a6a6a6);
}

/* 波纹动画 */
.ripple {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 20rpx;
  height: 20rpx;
  margin-left: -10rpx;
  margin-top: -10rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.6);
  animation: rippleAnim 1.8s infinite;
}

.status-badge.status-progress .ripple {
  border-color: rgba(255, 255, 255, 0.6);
}

.status-badge.status-rescue .ripple {
  border-color: rgba(255, 255, 255, 0.6);
}

.status-badge.status-supporting .ripple {
  border-color: rgba(255, 255, 255, 0.6);
}

@keyframes rippleAnim {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  70% {
    transform: scale(2.5);
    opacity: 0.2;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}

.time-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 12rpx;
  background: #f8faff;
  border-radius: 8rpx;
  border: 1rpx solid #e6f4ff;
}

.time-icon {
  font-size: 20rpx;
}

.time-text {
  font-size: 22rpx;
  color: #666;
  font-weight: 500;
}

/* 人员和时间信息样式 */
.info-section {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.info-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: 1;
  padding: 8rpx 12rpx;
  background: #f8faff;
  border-radius: 8rpx;
  border: 1rpx solid #e6f4ff;
}

.info-icon {
  font-size: 20rpx;
  flex-shrink: 0;
}

.info-label {
  font-size: 22rpx;
  color: #666;
  font-weight: 500;
  min-width: 80rpx;
}

.info-value {
  font-size: 22rpx;
  color: #333;
  flex: 1;
  text-align: right;
}

/* 板块卡片 */
.section-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid #e6f4ff;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding-bottom: 12rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.section-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.unit-count {
  background: #f0f8ff;
  color: #1890ff;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  font-weight: 500;
  border: 1rpx solid #d6e4ff;
}

/* 单位网格布局 */
.units-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20rpx;
}

/* 单位卡片 */
.unit-card.modern-card {
  background: #f8faff;
  border-radius: 12rpx;
  padding: 20rpx;
  border: 1rpx solid #e6f4ff;
  margin-bottom: 16rpx;
}

.unit-card.modern-card:last-child {
  margin-bottom: 0;
}

.unit-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.unit-icon {
  font-size: 20rpx;
  margin-right: 10rpx;
}

.unit-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
}

.unit-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx;
  background: #fff;
  border-radius: 8rpx;
  border: 1rpx solid #e6f4ff;
}

.detail-icon {
  font-size: 16rpx;
  flex-shrink: 0;
}

.detail-label {
  font-size: 22rpx;
  color: #666;
  min-width: 80rpx;
}

.detail-value {
  font-size: 22rpx;
  color: #333;
  flex: 1;
  text-align: right;
  margin-left: auto;
}

/* 备注信息样式 */
.remark-section {
  margin-bottom: 20rpx;
}

.remark-content {
  padding: 16rpx 0;
}

.remark-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
}

/* 底部操作按钮 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12rpx 20rpx;
  box-shadow: 0 -2rpx 8rpx rgba(0,0,0,.1);
  display: flex;
  gap: 12rpx;
  z-index: 100;
}

.action-btn {
  flex: 1;
  border-radius: 8rpx;
  font-size: 26rpx;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
}

.finish-btn {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: #fff;
}

.finish-btn:disabled {
  background: #d9d9d9;
  color: #999;
}

.deliver-btn {
  background: linear-gradient(135deg, #fa8c16, #ffa940);
  color: #fff;
}

.deliver-btn:disabled {
  background: #d9d9d9;
  color: #999;
}

.support-btn {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: #fff;
}

.delete-btn {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.delete-icon {
  width: 24rpx;
  height: 24rpx;
  flex-shrink: 0;
}

.delete-text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 500;
}

.action-btn:active:not(:disabled) {
  transform: scale(0.95);
}

/* 响应式设计 */
@media (max-width: 750rpx) {
  .unit-details {
    grid-template-columns: 1fr;
  }
  
  .detail-item {
    justify-content: space-between;
  }
  
  .detail-label {
    min-width: auto;
  }
  
  .detail-value {
    text-align: right;
  }
}

</style>


