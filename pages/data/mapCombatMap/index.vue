<template>
  <view class="map-combat-map-page">
    <map
      id="combatMap"
      class="combat-map"
      :latitude="mapCenter.latitude"
      :longitude="mapCenter.longitude"
      :scale="mapScale"
      :markers="markers"
      :include-points="includePoints"
      :show-location="true"
      :enable-3D="true"
      :enable-zoom="true"
      :enable-scroll="true"
      @markertap="onMarkerTap"
      @callouttap="onMarkerTap"
    />

    <view class="info-panel">
      <view class="info-row">
        <text class="label">地址编号：</text>
        <text class="value">{{ addressId || '—' }}</text>
      </view>
      <view class="info-row">
        <text class="label">地址名称：</text>
        <text class="value">{{ addressName || '—' }}</text>
      </view>
      <view class="info-row">
        <text class="label">救援位置：</text>
        <text class="value">{{ rescueLocations.length }}个</text>
      </view>
      <view class="info-row" v-if="rescueLocations.length">
        <text class="label">位置地址：</text>
        <text class="value">{{ getRescueAddressSummary() }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space',
      situationId: '',
      mapCenter: { latitude: 39.9042, longitude: 116.4074 },
      mapScale: 15,
      addressId: '',
      addressName: '',
      rescueLocations: [],
      markers: [],
      includePoints: []
    }
  },
  onLoad(query) {
    this.situationId = (query && query.situationId) || ''
    this.initData()
  },
  methods: {
    async initData() {
      if (!this.situationId) {
        uni.showToast({ title: '缺少任务ID', icon: 'none' })
        return
      }
      try {
        uni.showLoading({ title: '加载中...' })
        const detail = await this.fetchSituationDetail()
        this.addressId = detail.addressId || ''
        this.addressName = detail.addressName || ''
        this.rescueLocations = this.extractRescueLocations(detail)
        this.buildMarkers()
        this.focusTargetFirst()
      } catch (e) {
        uni.showToast({ title: '加载地图失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
    fetchSituationDetail() {
      return new Promise((resolve, reject) => {
        uni.request({
          url: this.serverUrl + '/fire/detail',
          method: 'GET',
          data: { situationId: this.situationId },
          success: (res) => {
            if (res?.data?.code === 200 && res.data.data) {
              resolve(res.data.data)
            } else {
              reject(new Error(res?.data?.msg || '详情加载失败'))
            }
          },
          fail: reject
        })
      })
    },
    extractRescueLocations(detail) {
      const locations = []
      const units = detail?.assignedUnits || []
      units.forEach((unit) => {
        const groups = unit?.taskGroups || []
        groups.forEach((group) => {
          const taskLocation = group?.taskLocation
          if (this.isValidCoordinate(taskLocation?.latitude, taskLocation?.longitude)) {
            locations.push({
              unitName: unit.unitName,
              carNames: Array.isArray(group?.carNames) ? group.carNames.filter(Boolean).join('、') : '',
              taskType: String(group?.taskType || ''),
              taskExtra: group?.taskExtra || {},
              searchPower: group?.searchPower || '',
              smokePower: group?.smokePower || '',
              description: group?.description || '',
              latitude: Number(taskLocation.latitude),
              longitude: Number(taskLocation.longitude),
              addressName: taskLocation.addressName || '',
              address: taskLocation.address || ''
            })
          }
        })
      })
      return locations
    },
    buildMarkers() {
      const markers = []
      let idx = 0
      const includePoints = []

      // 目标地址标记（使用首个任务位置作为锚点）
      if (this.rescueLocations.length > 0 && (this.addressId || this.addressName)) {
        const anchor = this.rescueLocations[0]
        const targetPosition = this.getTargetMarkerPosition(anchor)
        markers.push({
          id: -1,
          latitude: targetPosition.latitude,
          longitude: targetPosition.longitude,
          width: 32,
          height: 32,
          zIndex: 999,
          iconPath: this.serverUrl + '/static/icons/location/location-active.png',
          callout: {
            content: `${this.addressName || ''}`.trim(),
            color: '#fff',
            fontSize: 12,
            bgColor: '#ff4d4f',
            borderWidth: 2,
            borderColor: '#fff',
            borderRadius: 8,
            padding: 6,
            display: 'ALWAYS'
          }
        })
        includePoints.push({ latitude: anchor.latitude, longitude: anchor.longitude })
      }

      this.rescueLocations.forEach((loc) => {
        const isFirst = idx === 0
        markers.push({
          id: idx,
          latitude: loc.latitude,
          longitude: loc.longitude,
          width: isFirst ? 26 : 24,
          height: isFirst ? 26 : 24,
          iconPath: this.serverUrl + '/static/icons/location/factory-active.png',
          callout: {
            content: `${loc.addressName || ''} | ${loc.unitName || ''} | ${loc.carNames || ''} | ${this.getTaskTypeName(loc.taskType)}\n救援力量：${this.getTaskPowerText(loc)}\n描述：${loc.description || '—'}`,
            color: '#333',
            fontSize: 11,
            bgColor: '#fff',
            borderWidth: 1,
            borderColor: '#1890ff',
            borderRadius: 6,
            padding: 5,
            display: 'ALWAYS'
          }
        })
        includePoints.push({ latitude: loc.latitude, longitude: loc.longitude })
        idx += 1
      })

      if (this.rescueLocations.length > 0) {
        this.mapCenter = {
          latitude: this.rescueLocations[0].latitude,
          longitude: this.rescueLocations[0].longitude
        }
        this.mapScale = 18
      }
      this.markers = markers
      this.includePoints = includePoints
    },
    getTargetMarkerPosition(anchor) {
      const baseLat = Number(anchor.latitude)
      const baseLng = Number(anchor.longitude)
      const others = this.rescueLocations.slice(1)
      if (!others.length) {
        return { latitude: baseLat, longitude: baseLng + 0.00035, side: 'right' }
      }
      const avgLng = others.reduce((sum, it) => sum + Number(it.longitude || 0), 0) / others.length
      const side = avgLng >= baseLng ? 'left' : 'right'
      const offset = 0.00035
      return {
        latitude: baseLat,
        longitude: side === 'left' ? baseLng - offset : baseLng + offset,
        side
      }
    },
    focusTargetFirst() {
      if (!this.rescueLocations.length) {
        return
      }
      const latitude = Number(this.rescueLocations[0].latitude)
      const longitude = Number(this.rescueLocations[0].longitude)
      this.mapCenter = { latitude, longitude }
      this.mapScale = 18
    },
    isValidCoordinate(latitude, longitude) {
      if (latitude == null || longitude == null) return false
      const lat = Number(latitude)
      const lng = Number(longitude)
      if (Number.isNaN(lat) || Number.isNaN(lng)) return false
      if (lat < -90 || lat > 90) return false
      if (lng < -180 || lng > 180) return false
      return true
    },
    formatCoord(loc) {
      return `经度:${loc.longitude} 纬度:${loc.latitude}`
    },
    getTaskTypeName(taskType) {
      const map = {
        '1': '灭火',
        '2': '堵截',
        '3': '搜救',
        '4': '排烟',
        '5': '供水'
      }
      return map[String(taskType || '')] || '未知类型'
    },
    getTaskPowerText(loc) {
      if (!loc) return '—'
      const taskType = String(loc.taskType || '')
      const extra = loc.taskExtra || {}
      if (taskType === '1') return extra.firePower || '—'
      if (taskType === '2') return extra.blockPower || '—'
      if (taskType === '3') return loc.searchPower || extra.searchPower || '—'
      if (taskType === '4') return loc.smokePower || extra.smokePower || '—'
      if (taskType === '5') return extra.targetUnit || '—'
      return '—'
    },
    getRescueAddressSummary() {
      const names = this.rescueLocations
        .map(loc => loc.addressName || loc.address || '')
        .filter(Boolean)
      if (!names.length) return '—'
      return Array.from(new Set(names)).join('、')
    },
    onMarkerTap(e) {
      const markerId = e?.detail?.markerId
      if (markerId === -1) {
        uni.showToast({ title: `${this.addressId || ''} ${this.addressName || '目标地址'}`.trim(), icon: 'none' })
        return
      }
      const loc = this.rescueLocations[markerId]
      if (loc) {
        uni.showToast({ title: loc.addressName || loc.unitName || '任务位置', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.map-combat-map-page {
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.combat-map {
  flex: 1;
  min-height: 55vh;
  width: 100%;
  display: block;
}

.info-panel {
  max-height: 45vh;
  background: #fff;
  border-top-left-radius: 16rpx;
  border-top-right-radius: 16rpx;
  padding: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.info-row {
  display: flex;
  margin-bottom: 12rpx;
}

.label {
  color: #666;
  font-size: 24rpx;
  width: 140rpx;
  flex-shrink: 0;
}

.value {
  color: #333;
  font-size: 24rpx;
  flex: 1;
}

.rescue-list {
  max-height: 28vh;
}

.rescue-item {
  padding: 12rpx;
  border-radius: 10rpx;
  background: #f8faff;
  margin-bottom: 10rpx;
}

.split-line {
  height: 1rpx;
  background: #d9d9d9;
  margin: 8rpx 0;
}

.split-line-warn {
  background: #ffd666;
}

.rescue-title {
  display: block;
  font-size: 24rpx;
  color: #1890ff;
  font-weight: 600;
}

.rescue-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #333;
}
</style>
