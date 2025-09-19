<template>
  <view class="owner-info-page">

    <!-- 筛选区 -->
    <view class="filter-card">
      <view class="filter-row">
        <view class="filter-item">
          <text class="filter-label">栋</text>
          <picker :value="buildingPickerIndex" :range="numberPickerOptions" @change="onBuildingChange">
            <view class="picker-box" :class="{ 'has-value': filters.building }">{{ buildingLabel }}</view>
          </picker>
        </view>
        <view class="filter-item">
          <text class="filter-label">单元</text>
          <picker :value="unitPickerIndex" :range="numberPickerOptions" @change="onUnitChange">
            <view class="picker-box" :class="{ 'has-value': filters.unit }">{{ unitLabel }}</view>
          </picker>
        </view>
        <view class="filter-item">
          <text class="filter-label">楼层</text>
          <picker :value="floorPickerIndex" :range="numberPickerOptions" @change="onFloorChange">
            <view class="picker-box" :class="{ 'has-value': filters.floor }">{{ floorLabel }}</view>
          </picker>
        </view>
      </view>
      <view class="filter-row">
        <view class="filter-item">
          <text class="filter-label">房间号</text>
          <input class="filter-input" v-model="filters.roomNo" placeholder="请填写房间号查询" :class="{ 'has-value': filters.roomNo }" />
        </view>
        <view class="filter-item">
          <text class="filter-label">住户情况</text>
          <picker :value="statusIndex" :range="statusOptions" range-key="label" @change="onStatusChange">
            <view class="picker-box" :class="{ 'has-value': filters.status }">{{ currentStatusLabel }}</view>
          </picker>
        </view>
      </view>
      <view class="filter-actions">
        <view class="actions-left">
          <button class="btn primary" @tap="fetchOwnerList">查询</button>
          <button class="btn secondary" @tap="resetFilters">重置</button>
        </view>
        <view class="actions-right">
          <button class="btn secondary" @tap="refreshPage">刷新</button>
          <button class="btn primary add-btn-inline" v-if="canCreate" @tap="goToAddOwnerPage">新增户主信息</button>
        </view>
      </view>
    </view>

    <!-- 操作区（保留，已移至筛选栏右侧） -->
    <!-- 列表区 -->
    <view class="list-card">
      <view v-if="ownerList.length === 0" class="empty">
        <text class="empty-text">暂无数据</text>
      </view>
      <view v-else class="owner-list">
         <view class="owner-item" :class="item.cardClassName" v-for="(item, idx) in ownerList" :key="idx">
           <!-- 顶部信息区域 -->
           <view class="owner-top">
             <!-- 地址信息 -->
             <view class="address-info">
               <text class="address-name">{{ item.location.addressName || '-' }}</text>
               <text class="address-detail">{{ item.location.addressExt || '-' }}</text>
             </view>
             
             <!-- 状态位置行：状态 + 栋单元楼层 + 房间号 + 房间人数 -->
             <view class="status-location-row">
               <view class="left-info">
                 <text class="owner-status-badge" :class="item.statusClassName">{{ statusLabel(item.status) }}</text>
                 <text class="owner-building">{{ formatBuilding(item) }}</text>
                 <text class="room-no">{{ item.roomNo || '-' }}</text>
               </view>
               <view class="people-count" v-if="item.status === 1">
                 <text class="people-count-text">{{ item.peopleCount || '-' }}人</text>
               </view>
             </view>
             
             <!-- 户主姓名和电话行 -->
             <view class="name-phone-row">
               <text class="owner-name">{{ item.name || '-' }}</text>
               <view class="phone-section">
                 <text class="phone-number" @tap="copyPhone(item.phone)">{{ item.phone || '-' }}</text>
                 <image :src="serverUrl + '/static/icons/common/phone.png'" class="phone-icon" @tap="callPhone(item.phone)" />
               </view>
             </view>
             
             <!-- 右上角操作按钮 -->
             <view class="owner-actions">
               <view class="icon-btn edit" v-if="canEditItem" @tap="goToEditPage(item)" aria-label="编辑">
                 <image class="icon-img" :src="serverUrl + '/static/icons/common/edit-white.png'" mode="aspectFit" />
               </view>
               <view class="icon-btn delete" v-if="canDelete" @tap="deleteOwner(item)" aria-label="删除">
                 <image class="icon-img" :src="serverUrl + '/static/icons/common/delete-white.png'" mode="aspectFit" />
               </view>
             </view>
           </view>
          <!-- 底部详细信息 -->
          <view class="owner-body">
            <view class="field"><text class="f-label">房间大小</text><text class="f-text">{{ formatArea(item.area) }}</text></view>
            <view class="field field-2col field-remark"><text class="f-label">备注</text><text class="f-text">{{ item.remark || '-' }}</text></view>
          </view>
          
          <!-- 底部更新时间 -->
          <view class="owner-bottom">
            <text class="update-time-text">更新时间：{{ formatUpdateTime(item.updateTime) || '-' }}</text>
          </view>
        </view>
      </view>
    </view>
    <view class="page-bottom-spacer"></view>
    <!-- 编辑/新增弹窗 -->
    <view class="modal-mask" v-if="showModal" @tap="closeModal">
      <view class="modal-panel" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ modalMode === 'add' ? '新增住户' : canEditItem ? '编辑住户' : '查看住户' }}</text>
          <view class="close-x" @tap="closeModal">×</view>
        </view>
        <view class="modal-body">
          <view class="row3">
            <view class="col">
              <text class="label">栋</text>
              <input class="input" type="number" v-model="modalForm.building" :disabled="!canEditItem" />
            </view>
            <view class="col">
              <text class="label">单元</text>
              <input class="input" type="number" v-model="modalForm.unit" :disabled="!canEditItem" />
            </view>
            <view class="col">
              <text class="label">楼层</text>
              <input class="input" type="number" v-model="modalForm.floor" :disabled="!canEditItem" />
            </view>
          </view>
          <view class="row1">
            <text class="label">房间号</text>
            <input class="input" v-model="modalForm.roomNo" :disabled="!canEditItem" />
          </view>
          <view class="row2">
            <view class="col">
              <text class="label">住户姓名</text>
              <input class="input" v-model="modalForm.name" :disabled="!canEditItem && modalMode==='edit'" />
            </view>
            <view class="col">
              <text class="label">住户电话</text>
              <input class="input" v-model="modalForm.phone" type="number" :disabled="!canEditItem && modalMode==='edit'" />
            </view>
          </view>
          <view class="row1">
            <text class="label">住户情况</text>
            <picker :value="modalStatusIndex" :range="statusOptions" range-key="label" @change="onModalStatusChange" :disabled="!canChangeStatus">
              <view class="picker-box">{{ (statusOptions[modalStatusIndex] && statusOptions[modalStatusIndex].label) || '全部' }}</view>
            </picker>
          </view>
          <view class="row1" v-if="modalForm.status === 1">
            <text class="label">房间人数</text>
            <input class="input" v-model="modalForm.peopleCount" type="number" :disabled="!canChangeStatus" placeholder="1~100" />
          </view>
          <view class="row1">
            <text class="label">房间大小(㎡)</text>
            <input class="input" v-model="modalForm.area" type="digit" :disabled="!canEditItem" placeholder="支持小数点后两位" />
          </view>
          <view class="row1">
            <text class="label">备注</text>
            <input class="input" v-model="modalForm.remark" :disabled="!canEditItem && modalMode==='edit'" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn secondary" @tap="closeModal">取消</button>
          <button class="btn primary" v-if="canSubmit" @tap="submitModal">确定</button>
        </view>
      </view>
    </view>
  </view>
  
</template>

<script>
import { statusFilterOptions, numberPickerOptions, getStatusLabel, getStatusClass, formatBuilding, formatArea } from '@/commons/js/ownerConstants.js'

export default {
  data() {
    return {
      serverUrl: 'http://192.168.1.4:3000',
      addressId: '',
      mode: 'query', // edit/detail/query
      basicInfo: {},
      // 过滤
      filters: { building: '', unit: '', floor: '', roomNo: '', status: '' },
      statusOptions: statusFilterOptions,
      statusIndex: 0,
      ownerList: [],
      // 分页
      page: 1,
      pageSize: 20,
      hasMore: true,
      // 数字选择器 1~99，索引0表示未选择
      numberPickerOptions: [ '未选择' ].concat(Array.from({ length: 99 }, (_, i) => String(i + 1))),
      buildingPickerIndex: 0,
      unitPickerIndex: 0,
      floorPickerIndex: 0,
      // 弹窗
      showModal: false,
      modalMode: 'add',
      modalForm: {
        id: '', building: '', unit: '', floor: '', roomNo: '',
        name: '', phone: '', status: '', peopleCount: '', area: '', remark: ''
      },
      modalStatusIndex: 0,
      // 权限
      userInfo: {},
    }
  },
  computed: {
    // 权限：管理员(1) 或 超管(2)
    isAdmin() {
      const p = Number((this.userInfo && this.userInfo.permissionStatus) || 0)
      return p >= 1
    },
    isSuperAdmin() {
      const p = Number((this.userInfo && this.userInfo.permissionStatus) || 0)
      return p === 2
    },
    canCreate() { 
      // edit模式：管理员可以新增；query模式：不能新增；location模式：不能新增
      return this.mode === 'edit' && this.isAdmin 
    },
    canDelete() { 
      // edit模式：管理员可以删除；query模式：不能删除；location模式：不能删除
      return this.mode === 'edit' && this.isAdmin 
    },
    canEditItem() { 
      // edit模式：管理员可以编辑；query模式：不能编辑；location模式：管理员可以编辑
      return (this.mode === 'edit' && this.isAdmin) || (this.mode === 'location' && this.isAdmin)
    },
    // 修改住户情况权限
    canChangeStatus() { 
      // edit模式：管理员可以修改；query模式：不能修改；location模式：管理员可以修改
      return (this.mode === 'edit' && this.isAdmin) || (this.mode === 'location' && this.isAdmin)
    },
    canSubmit() {
      if (this.modalMode === 'add' || this.modalMode === 'edit') {
        if (this.modalForm.status === 1) {
          const pc = Number(this.modalForm.peopleCount)
          if (!pc || pc < 1 || pc > 100 || !Number.isInteger(pc)) return false
        }
        // 面积校验：两位小数
        if (this.modalForm.area && !/^\d+(?:\.\d{1,2})?$/.test(String(this.modalForm.area))) return false
        // 基础字段
        if (!this.modalForm.roomNo) return false
        return true
      }
      return false
    },
    currentStatusLabel() {
      const o = this.statusOptions[this.statusIndex]
      return (o && o.label) ? o.label : '全部'
    },
    buildingLabel() { return this.buildingPickerIndex === 0 ? '未选择' : (this.buildingPickerIndex + '') },
    unitLabel() { return this.unitPickerIndex === 0 ? '未选择' : (this.unitPickerIndex + '') },
    floorLabel() { return this.floorPickerIndex === 0 ? '未选择' : (this.floorPickerIndex + '') }
  },
  onLoad(options) {
    this.addressId = options.addressId || ''
    this.mode = options.mode || 'query'
    // 读取本地权限
    const local = uni.getStorageSync('userInfo')
    if (local) this.userInfo = local
    this.resetAndFetch()
  },
  methods: {
    // 跳转到编辑页
    goToEditPage(item) {
      const _id = encodeURIComponent(item._id)
      const addressId = encodeURIComponent(this.addressId || '')
      uni.navigateTo({ url: `/pages/personal/userDetail/OwnerInfoEdit?mode=edit&addressId=${addressId}&_id=${_id}` })
    },
    // 重置并拉取
    resetAndFetch() {
      this.page = 1
      this.hasMore = true
      this.ownerList = []
      this.fetchOwnerList()
    },
    callPhone(phone) {
      if (!phone) return
      uni.makePhoneCall({ phoneNumber: String(phone) })
    },
    copyPhone(phone) {
      if (!phone) return
      uni.setClipboardData({ data: String(phone), success: () => uni.showToast({ title: '已复制', icon: 'none' }) })
    },
    // 格式化更新时间
    formatUpdateTime(timeStr) {
      if (!timeStr) return ''
      try {
        const date = new Date(timeStr)
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } catch (e) {
        return timeStr
      }
    },
    onStatusChange(e) {
      this.statusIndex = Number(e.detail.value)
      this.filters.status = this.statusOptions[this.statusIndex].value
    },
    onBuildingChange(e) {
      this.buildingPickerIndex = Number(e.detail.value)
      this.filters.building = this.buildingPickerIndex === 0 ? '' : this.numberPickerOptions[this.buildingPickerIndex]
    },
    onUnitChange(e) {
      this.unitPickerIndex = Number(e.detail.value)
      this.filters.unit = this.unitPickerIndex === 0 ? '' : this.numberPickerOptions[this.unitPickerIndex]
    },
    onFloorChange(e) {
      this.floorPickerIndex = Number(e.detail.value)
      this.filters.floor = this.floorPickerIndex === 0 ? '' : this.numberPickerOptions[this.floorPickerIndex]
    },
    resetFilters() {
      this.filters = { building: '', unit: '', floor: '', roomNo: '', status: '' }
      this.statusIndex = 0
      this.buildingPickerIndex = 0
      this.unitPickerIndex = 0
      this.floorPickerIndex = 0
      this.resetAndFetch()
    },
    fetchOwnerList() {
      if (!this.hasMore && this.page !== 1) return
      uni.request({
        url: this.serverUrl + '/owner/list',
        method: 'GET',
        data: {
          addressId: this.addressId,
          building: this.filters.building,
          unit: this.filters.unit,
          floor: this.filters.floor,
          roomNo: this.filters.roomNo,
          status: this.filters.status,
          page: this.page,
          pageSize: this.pageSize
        },
        success: (res) => {
          const body = res && res.data
          if (!body || body.code !== 200) {
            const msg = (body && (body.message || body.msg)) || '查询失败'
            uni.showToast({ title: msg, icon: 'none' })
            return
          }
          // 支持两种返回结构：{data:{list,total}} 或 直接 data 数组
          const list = body.data && Array.isArray(body.data.list) ? body.data.list : (Array.isArray(body.data) ? body.data : [])
          const mapped = list.map((it) => {
            const cls = getStatusClass(it.status)
            return { ...it, statusClassName: cls, cardClassName: cls + '-card' }
          })
          const total = body.data && typeof body.data.total === 'number' ? body.data.total : undefined
          this.ownerList = this.page === 1 ? mapped : this.ownerList.concat(mapped)
          if (typeof total === 'number') {
            this.hasMore = this.ownerList.length < total
          } else {
            this.hasMore = mapped.length >= this.pageSize
          }
        },
        fail: (e) => {
          const msg = (e && (e.message || e.msg)) || '网络异常'
          uni.showToast({ title: msg, icon: 'none' })
        }
      })
    },
    // 加载更多（可在滚动到底部时调用）
    loadMore() {
      if (!this.hasMore) return
      this.page += 1
      this.fetchOwnerList()
    },
    goToAddOwnerPage() {
      uni.navigateTo({
        url: `/pages/personal/userDetail/OwnerInfoEdit?mode=add&addressId=${encodeURIComponent(this.addressId)}`
      })
    },
    refreshPage() {
      this.fetchOwnerList()
    },
    // 移除弹窗逻辑，改为独立页面
    deleteOwner(item) {
      if (!this.canDelete) return
      uni.showModal({
        title: '确认删除',
        content: '确定删除该住户信息吗？',
        success: (r) => {
          if (r.confirm) {
            uni.request({
              url: this.serverUrl + '/owner/delete',
              method: 'POST',
              data: { _id: item._id, addressId: this.addressId },
              success: res => {
                if (res && res.data && res.data.code === 200) {
                  this.fetchOwnerList()
                  uni.showToast({ title: '已删除', icon: 'success' })
                } else {
                  const msg = (res && (res.message || res.msg)) || '删除失败'
                  uni.showToast({ title: msg, icon: 'none' })
                }
              },
              fail: (err) => {
                const msg = (err && (err.message || err.msg)) || '网络异常'
                uni.showToast({ title: msg, icon: 'none' })
              }
            })
          }
        }
      })
    },
    formatBuilding: formatBuilding,
    formatArea: formatArea,
    statusLabel: getStatusLabel,
    statusClass: getStatusClass
  }
}
</script>

<style lang="scss">
.owner-info-page { 
  padding: 20rpx; 
  background: #f5f9ff; 
  min-height: 100vh; 
  overflow-y: auto;
  /* 避免底部被系统/Tab遮挡 */
  padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}
.list-card { 
  background: #fff; 
  border-radius: 20rpx; 
  margin-bottom: 16rpx; 
  box-shadow: 0 4rpx 16rpx rgba(24,144,255,0.06); 
}
.page-bottom-spacer {
  height: calc(120rpx + constant(safe-area-inset-bottom));
  height: calc(120rpx + env(safe-area-inset-bottom));
}
/* 蓝白调筛选卡片 */
.filter-card {
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  border-radius: 20rpx;
  padding: 16rpx 16rpx 14rpx 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 6rpx 18rpx rgba(24,144,255,0.06);
  border: 1rpx solid #e6f4ff;
}
/* 顶部信息区域 */
.owner-top {
  position: relative;
  margin-bottom: 16rpx;
}

.address-info {
  margin-bottom: 12rpx;
}

.address-name {
  display: block;
  color: #1890ff;
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 6rpx;
}

.address-detail {
  display: block;
  color: #666;
  font-size: 24rpx;
  line-height: 1.4;
}

.status-location-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.left-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}

.people-count {
  flex-shrink: 0;
}

.people-count-text {
  font-size: 26rpx;
  font-weight: 800;
  color: #fa8c16;
  background: #fff7e6;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  border: 1rpx solid #ffd591;
}

.name-phone-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.owner-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2d3d;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 40rpx;
}

.owner-name .f-label {
  font-size: 24rpx;
  font-weight: 500;
  color: #8a8f99;
  min-width: 120rpx;
  margin-right: 10rpx;
}

.owner-name .f-text {
  color: #1f2d3d;
  font-weight: 700;
}

.room-no {
  color: #1677ff;
  font-size: 26rpx;
  font-weight: 700;
  background: rgba(22,119,255,0.1);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  border: 1rpx solid rgba(22,119,255,0.2);
}

.phone-section {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0; /* 防止压缩 */
}

.phone-number {
  color: #1677ff;
  font-weight: 700;
  font-size: 26rpx;
}

.phone-icon {
  width: 32rpx;
  height: 32rpx;
}

/* 右上角操作按钮 */
.owner-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 8rpx;
}

.filter-row { display: flex; gap: 12rpx; margin-bottom: 12rpx; }
.filter-item { flex: 1; display: flex; align-items: center; gap: 8rpx; }
.filter-label { color: #3a5971; font-size: 24rpx; white-space: nowrap; }
.filter-item picker { flex: 1; width: 100%;}
.filter-input { flex: 1; height: 64rpx; background: #f7fbff; border-radius: 14rpx; padding: 0 16rpx; font-size: 24rpx; border: 2rpx solid #e6f4ff; transition: all .2s ease; color: #999; }
.filter-input:focus { background: #fff; box-shadow: 0 0 0 4rpx rgba(24,144,255,0.08); border-color: #bfe3ff; }
.filter-input.has-value { color: #1f2d3d; }
.picker-box { flex: 1; height: 64rpx; line-height: 64rpx; padding: 0 16rpx; background: #f7fbff; border-radius: 14rpx; color: #999; border: 2rpx solid #e6f4ff; transition: all .2s ease; font-size: 24rpx; }
.picker-box:active { background: #fff; box-shadow: 0 0 0 4rpx rgba(24,144,255,0.08); border-color: #bfe3ff; }
.picker-box.has-value { color: #1f2d3d; }
.filter-actions { display: flex; justify-content: space-between; align-items: center; gap: 12rpx; margin-top: 8rpx; }
.actions-left { display: flex; gap: 12rpx; }
.actions-right { display: flex; gap: 12rpx; }
.add-btn-inline { background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%); box-shadow: 0 2rpx 8rpx rgba(82,196,26,0.18); }

.btn { height: 68rpx; line-height: 68rpx; padding: 0 28rpx; border-radius: 16rpx; font-size: 26rpx; }
.btn::after { border: none; }
.btn.primary { background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%); color: #fff; box-shadow: 0 4rpx 12rpx rgba(24,144,255,0.25); }
.btn.secondary { background: #f7fbff; color: #5e6c84; border: 2rpx solid #e6f4ff; }
.mini-btn { height: 56rpx; line-height: 56rpx; padding: 0 16rpx; border-radius: 12rpx; margin-left: 8rpx; background: #f6f7f9; color: #333; font-size: 24rpx; }
.mini-btn::after { border: none; }
.mini-btn.danger { background: #ffefef; color: #ff4d4f; }

.owner-list { 
  display: flex; 
  flex-direction: column; 
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(24,144,255,0.06);
  padding: 12rpx 0;
  max-height: 80vh;
  overflow-y: auto;
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(24, 144, 255, 0.3) transparent;
}
/* 额外保险：在滚动内容末尾再增加一个占位 */
.owner-list::after {
  content: '';
  display: block;
  height: calc(60rpx + constant(safe-area-inset-bottom));
  height: calc(60rpx + env(safe-area-inset-bottom));
}

/* Webkit 浏览器滚动条样式 */
.owner-list::-webkit-scrollbar {
  width: 6rpx;
}

.owner-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3rpx;
}

.owner-list::-webkit-scrollbar-thumb {
  background: rgba(24, 144, 255, 0.3);
  border-radius: 3rpx;
}

.owner-list::-webkit-scrollbar-thumb:hover {
  background: rgba(24, 144, 255, 0.5);
}
.owner-item { 
  background: #fff; 
  padding: 16rpx 20rpx; 
  position: relative; 
  margin: 12rpx 16rpx;
  border-radius: 12rpx;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.owner-item:last-child {
  margin-bottom: calc(24rpx + constant(safe-area-inset-bottom));
  margin-bottom: calc(24rpx + env(safe-area-inset-bottom));
}
.owner-item:hover {
  background: #fafbfc;
}
.status-yes-card { 
  border-left: 6rpx solid #ff4d4f; 
  background: linear-gradient(90deg, rgba(255,77,79,0.08) 0%, #fff 100%);
  box-shadow: 0 2rpx 12rpx rgba(255,77,79,0.15);
}
.status-no-card { 
  border-left: 6rpx solid #13c2c2; 
  background: linear-gradient(90deg, rgba(19,194,194,0.08) 0%, #fff 100%);
  box-shadow: 0 2rpx 12rpx rgba(19,194,194,0.15);
}
.status-unk-card { 
  border-left: 6rpx solid #faad14; 
  background: linear-gradient(90deg, rgba(250,173,20,0.08) 0%, #fff 100%);
  box-shadow: 0 2rpx 12rpx rgba(250,173,20,0.15);
}
.owner-status-badge { 
  padding: 8rpx 16rpx; 
  border-radius: 16rpx; 
  font-size: 24rpx; 
  font-weight: 700; 
  white-space: nowrap;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}
.owner-building { color: #1f2d3d; font-size: 24rpx; font-weight: 600; }
.icon-btn { width: 50rpx; height: 50rpx; display:flex; align-items:center; justify-content:center; border-radius: 12rpx; }
.icon-btn.edit { background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%); }
.icon-btn.delete { background: linear-gradient(135deg, #ff7875 0%, #ff4d4f 100%); }
.icon-img { width: 28rpx; height: 28rpx; }
.status-yes { background: #fff1f0; color: #ff4d4f; }
.status-no { background: #e6fffb; color: #13c2c2; }
.status-unk { background: #fffbe6; color: #faad14; }
.owner-body {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx 20rpx;
  color: #333;
  font-size: 24rpx;
  margin-bottom: 12rpx;
}
.field {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 6rpx 0;
}
.f-label {
  color: #8a8f99;
  min-width: 120rpx;
}
.f-text { color: #1f2d3d; flex: 1; word-break: break-all; }
.emph .f-label, .f-text.emph { color: #1f2d3d; font-weight: 700; }
.field-remark { grid-column: 1 / span 2; }
.field-2col { grid-column: 1 / span 2; }
.empty { text-align: center; color: #999; padding: 24rpx; }
/* 空状态图片样式 */
.empty-img {
  display: block;
  width: 220rpx;
  max-width: 60%;
  height: auto;
  margin: 24rpx auto 12rpx auto;
  opacity: 0.9;
}

/* 底部更新时间 */
.owner-bottom {
  display: flex;
  justify-content: flex-end;
  padding-top: 12rpx;
  border-top: 1rpx solid #f0f0f0;
}

.update-time-text {
  color: #999;
  font-size: 22rpx;
}

/* 弹窗 */
.modal-mask { position: fixed; left:0; right:0; top:0; bottom:0; background: rgba(0,0,0,0.45); display:flex; justify-content:center; align-items:center; z-index:1000; }
.modal-panel { width: 92%; max-width: 680rpx; background: #fff; border-radius: 20rpx; overflow: hidden; }
.modal-header { padding: 16rpx; display:flex; justify-content: space-between; align-items:center; border-bottom: 1rpx solid #f0f0f0; }
.modal-title { font-size: 28rpx; font-weight: 700; color: #333; }
.close-x { width: 40rpx; height: 40rpx; text-align:center; line-height:40rpx; border-radius:50%; background:#f6f7f9; color:#666; }
.modal-body { padding: 16rpx; display:flex; flex-direction:column; gap: 12rpx; }
.row1, .row2, .row3 { display:flex; gap: 12rpx; align-items:center; }
.row1 .label, .row2 .label, .row3 .label { width: 160rpx; color:#666; font-size:24rpx; }
.row1 .input, .row2 .input, .row3 .input { flex:1; height: 56rpx; background:#f6f7f9; border-radius: 12rpx; padding: 0 12rpx; font-size: 24rpx; }
.row2 .col, .row3 .col { flex:1; display:flex; align-items:center; gap:8rpx; }
.modal-footer { display:flex; gap: 12rpx; padding: 12rpx; border-top: 1rpx solid #f0f0f0; }

</style>


