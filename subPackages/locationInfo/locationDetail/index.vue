<template>
  <scroll-view class="detail-container" scroll-y="true" :scroll-top="scrollTop" :scroll-with-animation="false" :enhanced="true" :bounces="false">
    <!-- 顶部导航栏下方内容 -->
    <view class="page-content">
      <view>
        <!-- 头部图片区域 -->
        <view class="header-image" v-if="isShowHeaderImage">
          <image v-show="locationObj.defaultImg" :src="locationObj.defaultImg ? (serverUrl + locationObj.defaultImg) : ''" class="detail-img" mode="aspectFit" />
        </view>

        <!-- 信息卡片 -->
        <view class="info-card">
          <!-- 地址名称 -->
          <view class="address-name">
            <text class="address-name-text">{{ locationObj.addressName }}</text>
            <image :src="serverUrl + '/static/icons/location/copy.png'" class="location-icon" @tap="copyAddressName" />
          </view>
          
          <!-- 地址详情 -->
          <view class="address-detail">
            <view class="address-detail-left">
              <image :src="serverUrl + '/static/icons/location/showLocation.png'" class="location-icon" />
              <text class="address-name-text address-ext">{{ locationObj.addressExt }}</text>
            </view>
            <view class="address-detail-right">
              <image :src="showImgUrl(locationObj.type)" class="type-icon" />
              <text>{{ getLocationTypeName() }}</text>
            </view>
          </view>
                    
          <!-- 单位类型和720全云景 -->
          <view class="type-panorama-row">
            <!-- 单位类型卡片 -->
            <view class="type-card">
              <view class="type-header">
                <view class="type-info">
                  <text class="type-description" @tap="showFullDescription">{{ locationObj.description || '暂无描述' }}</text>
                </view>
              </view>
            </view>
            
            <!-- 单位图纸轮播图 -->
            <view class="drawing-card" @click="showDrawingGallery">
              <view class="drawing-content">
                <view class="drawing-preview" v-if="locationObj.imgList && locationObj.imgList.length > 0">
                  <swiper class="drawing-swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="500" indicator-color="rgba(255, 255, 255, 0.3)" indicator-active-color="#FFFFFF">
                    <swiper-item v-for="(img, index) in locationObj.imgList" :key="index">
                      <image :src="img ? `${serverUrl}${img}` : ''" class="drawing-img" mode="aspectFit" />
                    </swiper-item>
                  </swiper>
                </view>
                <view class="drawing-empty" v-else>
                  <text class="drawing-empty-text">暂无图纸</text>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 安全等级卡片 -->
          <view class="safety-card-full" :class="safeLevelClass" @tap="goToSafetyDetail" v-if="locationObj.fireSafetyScore">
            <view class="safety-header">
                <view class="safety-info">
                  <view class="score-display">
                    <text class="score-number">{{ locationObj.fireSafetyScore.totalScore }}</text>
                    <text class="score-unit">分</text>
                  </view>
                </view>
                <view class="safety-badge" :class="['safety-tag',  locationObj.fireSafetyScore.safeLevelId === 1 ? 'safety-excellent' : locationObj.fireSafetyScore.safeLevelId === 2 ? 'safety-normal' : 'safety-danger']">
                  <text class="badge-text">{{ locationObj.fireSafetyScore.safeLevelName }}</text>
                </view>
              </view>
            <view class="score-progress">
              <view class="progress-track">
                <view class="progress-fill" :style="{ width: (locationObj.fireSafetyScore.totalScore) + '%' }"></view>
              </view>
            </view>
          </view>
          
          <!-- 显示电话号码 -->
          <view class="info-row" v-for="phoneItem in locationObj.phoneList" :key="phoneItem.phone">
            <view class="phone-content">
              <view class="phone-name">
                <image :src="serverUrl + '/static/icons/location/userPhone.png'" class="user-phone-icon" />
                <text class="phone-text">{{ phoneItem.name }}</text>
                <view class="phone-tag" :class="phoneItem.type === 1 ? 'tag-responsible' : 'tag-fire'">
                  <text class="tag-text">{{ phoneItem.type === 1 ? '单位负责人' : '消防负责人' }}</text>
                </view>
              </view>
              <view class="phone-number">
                <text>{{ phoneItem.phone }}</text>
                <image :src="serverUrl + '/static/icons/common/phone.png'" class="phone-icon" @tap="callPhone(phoneItem.phone)"/>
              </view>
            </view>
          </view>
          
          <!-- 户主信息（仅：高层小区 type === 1） -->
          <view class="owner-info-card" v-if="locationObj.type === 1">
            <view class="card-header">
              <text class="card-title">户主信息</text>
              <view class="header-actions">
                <text class="query-btn" @tap="goToOwnerInfo">一键查询</text>
              </view>
            </view>
            <view class="owner-info-content">
              <view class="owner-count-display">
                <text class="count-label">当前住户总数</text>
                <view class="owner-badge">
                  <text class="badge-num">{{ (locationObj.ownerInfo && locationObj.ownerInfo.total) || (locationObj.ownerInfo && locationObj.ownerInfo.count) || 0 }}</text>
                  <text class="badge-suffix">人</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 作战实景部署（仅重点单位；统一使用 battleDeploymentMaterials） -->
          <view class="deployment-card" v-if="locationObj.type === 2 && locationObj.battleDeploymentMaterials && locationObj.battleDeploymentMaterials.length">
            <view class="card-header">
              <text class="card-title">作战实景部署</text>
            </view>
            <view class="deployment-section">
              <view class="material-list">
                <view class="material-item" v-for="(m, mi) in locationObj.battleDeploymentMaterials" :key="mi" v-if="m">
                  <template v-if="isVideoPath(m)">
                    <video
                      :src="resolveMediaUrl(m)"
                      class="deploy-video"
                      controls
                      preload="metadata"
                      webkit-playsinline
                      playsinline
                      x5-video-player-type="h5"
                      x5-video-player-fullscreen="true"
                      @fullscreenchange="onVideoFullscreenChange"
                      @error="handleVideoError(m)"
                    ></video>
                  </template>
                  <template v-else>
                    <image :src="resolveMediaUrl(m)" class="anim-thumb" mode="aspectFill" />
                  </template>
                </view>
              </view>
            </view>
          </view>

          
          
          <!-- 作战实景部署（仅重点单位且有配置时显示） -->
          <view class="deployment-card" v-if="locationObj.type === 2 && locationObj.fireUnitDeploymentMap && locationObj.fireUnitDeploymentMap.length > 0">
            <view class="card-header">
              <text class="card-title">作战实景部署</text>
              <view class="deployment-selector">
                <picker 
                  :value="selectedFireUnitIndex" 
                  :range="fireUnitOptions" 
                  range-key="label"
                  @change="onFireUnitChange"
                  class="fire-unit-picker"
                >
                  <view class="picker-display">
                    <text class="picker-text">{{ getCurrentFireUnitText() }}</text>
                    <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
                  </view>
                </picker>
              </view>
            </view>
            <view class="deployment-section">
              <view class="material-list">
                <view class="material-item" v-for="(m, mi) in currentDeploymentMaterials" :key="mi" v-if="m">
                  <template v-if="isVideoPath(m)">
                    <video
                      :src="resolveMediaUrl(m)"
                      class="deploy-video"
                      controls
                      preload="metadata"
                      webkit-playsinline
                      playsinline
                      x5-video-player-type="h5"
                      x5-video-player-fullscreen="true"
                      @fullscreenchange="onVideoFullscreenChange"
                      @error="handleVideoError(m)"
                    ></video>
                  </template>
                  <template v-else>
                    <image :src="resolveMediaUrl(m)" class="anim-thumb" mode="aspectFill" />
                  </template>
                </view>
              </view>
            </view>
          </view>

          <!-- 出行大门 -->
          <view class="info-row gate-list">
            <view class="gate-items">
              <text class="label">可出行大门</text>
              <view class="gate-item" v-for="(gate, index) in locationObj.enterGateList" :key="index">
                <!-- 勾选框 -->
                <image :src="serverUrl + '/static/icons/common/checked.png'" class="check-icon"/>
                <!-- 大门名称 -->
                <text class="gate-name">{{ gate.name }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 图纸画廊弹窗 -->
    <view class="drawing-gallery" v-if="showGallery" @click="hideDrawingGallery">
      <view class="gallery-content" @click.stop>
        <view class="gallery-header">
          <text class="gallery-title">单位图纸</text>
          <text class="gallery-close" @click="hideDrawingGallery">×</text>
        </view>
        <view class="gallery-body">
          <swiper class="gallery-swiper" :current="currentImageIndex" @change="onSwiperChange">
            <swiper-item v-for="(img, index) in locationObj.imgList" :key="index">
              <image :src="img ? `${serverUrl}${img}` : ''" class="gallery-img" mode="aspectFit" />
            </swiper-item>
          </swiper>
          <view class="gallery-indicator">
            <text class="indicator-text">{{ currentImageIndex + 1 }}/{{ locationObj.imgList.length }}</text>
          </view>
        </view>
        <view class="gallery-controls">
          <view class="control-btn" @click="prevImage" :class="{ disabled: currentImageIndex === 0 }">
            <image :src="serverUrl + '/static/icons/common/left.png'" class="control-icon" />
          </view>
          <view class="control-btn" @click="nextImage" :class="{ disabled: currentImageIndex === locationObj.imgList.length - 1 }">
            <image :src="serverUrl + '/static/icons/common/right.png'" class="control-icon" />
          </view>
        </view>
      </view>
    </view>
    
    <!-- 自定义描述弹窗 -->
    <view class="custom-modal" v-if="showCustomModal" @click="hideCustomModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">单位描述</text>
          <text class="modal-close" @click="hideCustomModal">×</text>
        </view>
        <view class="modal-body">
          <text class="modal-text">{{ modalContent }}</text>
        </view>
      </view>
    </view>
  </scroll-view>
</template>
<script>
import { getSafetyLevelClass } from '@/pages/personal/userDetail/components/safetyScoreData.js';
import { locationTabList } from '@/commons/mock/index.js';
export default {
  data() {
    return {
      locationObj: {}, // 接收接口返回的详情数据
      addressId: null, // 用于接收传入的 addressId
      showGallery: false, // 控制图纸画廊显示
      currentImageIndex: 0, // 当前图片索引
      showCustomModal: false, // 控制自定义弹窗显示
      modalContent: '', // 弹窗内容
      serverUrl: 'http://172.17.121.65:3000',
      isShowHeaderImage: true,
      scrollTop: 0, // 滚动位置
      isAnyVideoFullscreen: false,
      // 消防单位相关
      fireUnitOptions: [],
      selectedFireUnitIndex: 0,
    };
  },
  onLoad(data) {
    const { addressId } = data || {}; // 获取传入的 addressId
    this.addressId = addressId; // 保存 addressId
    // 根据 addressId 获取位置详情（接口调用）
    this.fetchLocationDetail();
    // 预加载消防单位数据
    this.fetchFireUnits();
  },
  computed: {
    safeLevelClass() {
      return getSafetyLevelClass(this.locationObj?.fireSafetyScore?.safeLevelId) || '';
    },
    showImgUrl() {
      return (type) => {
        return type === 1 ? this.serverUrl + '/static/icons/location/community-white.png' : type === 2 ? this.serverUrl + '/static/icons/location/factory-white.png' : this.serverUrl + '/static/icons/location/shop-white.png';
      }
    },
    // 当前选中消防单位对应的部署素材
    currentDeploymentMaterials() {
      if (!this.locationObj.fireUnitDeploymentMap || this.fireUnitOptions.length === 0) return []
      const selectedUnit = this.fireUnitOptions[this.selectedFireUnitIndex]
      if (!selectedUnit) return []
      
      const deployment = this.locationObj.fireUnitDeploymentMap.find(item => String(item.key) === String(selectedUnit.value))
      return deployment && deployment.data ? [deployment.data] : []
    }
  },
  methods: {
    fetchLocationDetail() {
      uni.request({
        url: this.serverUrl + '/location/detail', // 需在data或全局配置serverUrl
        method: 'GET',
        data: { addressId: this.addressId },
        success: (res) => {
          if (res.data && res.data.code === 200) {
            this.locationObj = res.data.data || {};
          } else {
            this.locationObj = {};
            uni.showToast({ title: '获取详情失败', icon: 'none' });
          }
        },
        fail: () => {
          this.locationObj = {};
          uni.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    },
    isVideoPath(path) {
      if (!path || typeof path !== 'string') return false;
      const lower = path.toLowerCase();
      return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.avi') || lower.endsWith('.mkv') || lower.endsWith('.webm');
    },
    resolveMediaUrl(path) {
      if (!path) return '';
      // 已是绝对地址则直接返回
      if (/^https?:\/\//i.test(path)) return path;
      // 兼容以 '//' 开头的相对协议路径
      if (/^\/\//.test(path)) return this.serverUrl + path.replace(/^\/+/, '/');
      // 普通相对路径
      return this.serverUrl + (path.startsWith('/') ? path : '/' + path);
    },
    handleVideoError(path) {
      console.warn('视频播放失败：', path);
      uni.showToast({ title: '视频加载失败', icon: 'none' });
    },
    onVideoFullscreenChange(e) {
      // 兼容 H5 与小程序：进入全屏时隐藏头图避免遮挡，退出时恢复
      const full = !!(e && (e.detail?.fullScreen !== undefined ? e.detail.fullScreen : e.detail));
      this.isShowHeaderImage = !full;
    },
    // 兼容保留（不再主动全屏）
    getLocationTypeName() {
      return locationTabList.find(item => item.type === this.locationObj.type)?.name || '未知类型';
    },
    
    // 消防单位相关方法
    async fetchFireUnits() {
      try {
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/static/data',
            method: 'GET',
            data: { type: 'fireUnits', key: 'unitList' },
            success: resolve,
            fail: reject
          })
        })
        const list = res?.data?.data || []
        // 后端静态数据：data1 为展示名称(value)，data2 为唯一key
        this.fireUnitOptions = list.map((it, idx) => ({ label: it.data1, value: String(it.data2), index: idx }))
        // 默认选中第一个
        if (this.fireUnitOptions.length > 0) {
          this.selectedFireUnitIndex = 0
        }
      } catch (e) {
        this.fireUnitOptions = []
      }
    },
    onFireUnitChange(e) {
      const idx = e.detail.value
      this.selectedFireUnitIndex = idx
    },
    getCurrentFireUnitText() {
      if (this.fireUnitOptions.length === 0) return '请选择消防单位'
      const opt = this.fireUnitOptions[this.selectedFireUnitIndex]
      return opt ? opt.label : '请选择消防单位'
    },
    callPhone(phone) {
      uni.makePhoneCall({
        phoneNumber: phone
      });
    },
    goToExternalLink(link) {
      uni.navigateTo({ url: '/subPackages/common/webview/index?url=' + link });
    },
    goToSafetyDetail() {
      if (this.locationObj.fireSafetyScore) {
        uni.navigateTo({ 
          url: '/subPackages/locationInfo/safetyDetail/index?safeId=' + this.locationObj.safeId                          
        });
      } else {
        uni.showToast({
          title: '暂无安全评分',
          icon: 'none',
          duration: 1500
        });
      }

    },
    copyAddressName() {
      if (this.locationObj.addressName) {
        uni.setClipboardData({
          data: this.locationObj.addressName,
          success: () => {
            uni.showToast({
              title: '已复制地址',
              icon: 'success',
              duration: 1500
            });
          },
          fail: () => {
            uni.showToast({
              title: '复制失败',
              icon: 'none',
              duration: 1500
            });
          }
        });
      } else {
        uni.showToast({
          title: '暂无地址名称',
          icon: 'none',
          duration: 1500
        });
      }
    },
    showDrawingGallery() {
      if (this.locationObj.imgList && this.locationObj.imgList.length > 0) {
        this.showGallery = true;
        this.currentImageIndex = 0;
      } else {
        uni.showToast({
          title: '暂无图纸',
          icon: 'none',
          duration: 1500
        });
      }
    },
    hideDrawingGallery() {
      this.showGallery = false;
    },
    onSwiperChange(e) {
      this.currentImageIndex = e.detail.current;
    },
    prevImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
      }
    },
    nextImage() {
      if (this.currentImageIndex < this.locationObj.imgList.length - 1) {
        this.currentImageIndex++;
      }
    },
    showFullDescription() {
      if (this.locationObj.description) {
        // 使用自定义弹窗替代 uni.showModal
        this.showCustomModal = true;
        this.modalContent = this.locationObj.description;
      } else {
        uni.showToast({
          title: '暂无描述',
          icon: 'none',
          duration: 1500
        });
      }
    },
    hideCustomModal() {
      this.showCustomModal = false;
      this.modalContent = '';
    },
    goToOwnerInfo() {
      if (!this.addressId) {
        uni.showToast({ title: '缺少地址ID', icon: 'none' });
        return;
      }
      uni.navigateTo({
        url: `/pages/personal/userDetail/OwnerInfo?mode=location&addressId=${encodeURIComponent(this.addressId)}`
      });
    },
  }
};
</script>

<style scoped>
@import '@/commons/css/safety-score.css';
/* 容器样式 */
.detail-container {
  height: 100vh;
  background-color: #f5f5f5;
  -webkit-overflow-scrolling: touch;
}

/* 头部图片区域 */
.header-image {
  position: relative;
  height: 220px;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  padding: 2px;
  background-color: #f8fafc;
}

.detail-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 信息卡片 */
.info-card {
  background-color: #FFF;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 50px;
}

.address-name {
  padding: 15px 15px 10px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.address-ext {
  font-size: 12px;
  max-width: 240px;
  color: #666;
}

.address-name-text {
  flex: 1;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  margin-right: 10px;
  scrollbar-width: none;
}

.address-name-text::-webkit-scrollbar {
  display: none;
}

.address-detail {
  display: flex;
  align-items: center;
  padding: 0 15px 0 15px;
  font-size: 12px;
  color: #666;
  justify-content: space-between;
}

.address-detail-left {
  display: flex;
  align-items: center;
  max-width: 250px;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  margin-right: 10px;
  scrollbar-width: none;
}

.address-detail-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 6px;
  border-radius: 12px;
  background: #40a9ff;
  color: #ffffff;
  font-size: 12px;
}

.location-icon {
  width: 14px;
  height: 14px;
  margin-right: 3px;
}

.address-name .location-icon {
  margin-right: 0;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.address-name .location-icon:active {
  background-color: rgba(0, 0, 0, 0.1);
}

.divider {
  height: 1px;
  background-color: #F5F5F5;
  margin: 0 15px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  font-size: 14px;
}

.label {
  color: #999;
  min-width: 70px;
}

.value {
  color: #333;
}

.top-align {
  align-items: flex-start;
}

.value-multiline {
  white-space: pre-wrap;
  line-height: 1.6;
}

.phone-content {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: space-between;
}

.phone-number {
  display: flex;
  align-items: center;
  color: #2196F3;
}

.user-phone-icon {
  width: 16px;
  height: 16px;
  margin-right: 5px;
}

.phone-icon {
  width: 16px;
  height: 16px;
  margin-left: 5px;
}

/* 单位类型和图纸样式 */
.type-panorama-row {
  display: flex;
  gap: 12px;
  padding: 15px;
  height: 120px;
}

.type-card {
  flex: 1;
  background: linear-gradient(135deg, #F8F9FA, #FFFFFF);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.type-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.type-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.type-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  overflow: hidden;
  cursor: pointer;
  transition: color 0.2s ease;
}

.type-description:active {
  color: #1890FF;
}

.type-icon {
  margin-right: 2px;
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

/* 图纸卡片 */
.drawing-card {
  flex: 1;
  background: linear-gradient(135deg, #ffffff, #e6f7ff);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.drawing-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.drawing-content {
  display: flex;
  height: 100%;
  position: relative;
}

.drawing-preview {
  flex: 1;
  height: 100%;
}

.drawing-swiper {
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.drawing-swiper .uni-swiper-dots {
  bottom: 8px !important;
}

.drawing-swiper .uni-swiper-dot {
  width: 8px !important;
  height: 8px !important;
  border-radius: 4px !important;
  background-color: rgba(255, 255, 255, 0.3) !important;
  margin: 0 3px !important;
}

.drawing-swiper .uni-swiper-dot-active {
  background-color: #FFFFFF !important;
}

.drawing-img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: contain;
}

.drawing-empty {
  flex: 1;
  margin-right: 12px;
}

.drawing-empty-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

/* 安全等级卡片 */
.safety-card-full {
  background: linear-gradient(135deg, #40caff, #667eea);
  border-radius: 12px;
  padding: 16px;
  margin: 0 15px 15px 15px;
  box-shadow: 0 4px 12px rgba(255, 138, 101, 0.2);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.safety-card-full:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(255, 138, 101, 0.4);
}

.safety-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.safety-info {
  display: flex;
  align-items: center;
}

.safety-badge {
  padding: 4px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.25);
  margin-right: 8px;
}

.safety-tag.safety-excellent { background: linear-gradient(135deg, #4CAF50, #45a049); } /* 优秀-绿色 */
.safety-tag.safety-normal { background: linear-gradient(135deg, #FF9800, #F57C00); }    /* 一般-橙色 */
.safety-tag.safety-danger { background: linear-gradient(135deg, #F44336, #D32F2F); }    /* 较差-红色 */

.badge-text {
  font-size: 14px;
  color: #fff;
  font-weight: bold;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.score-number {
  font-size: 32px;
  color: #FFFFFF;
  font-weight: bold;
  line-height: 1;
}

.score-unit {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.score-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-track {
  height: 10px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFFFFF, rgba(255, 255, 255, 0.9));
  border-radius: 5px;
  transition: width 0.3s ease;
  position: relative;
}

/* 出行大门样式 */
.gate-list {
  flex-wrap: wrap;
}

.gate-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.gate-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
  margin-bottom: 5px;
}

.check-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  margin-right: 5px;
}

.gate-name {
  color: #333;
  font-size: 14px;
}

/* 户主信息卡片样式 */
.owner-info-card {
  background-color: #FFF;
  margin: 10px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.owner-info-card .card-header {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.owner-info-card .card-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.query-btn {
  font-size: 12px;
  color: #1890ff;
  background: #e6f7ff;
  border: 1px solid #bae7ff;
  border-radius: 8px;
  padding: 3px 10px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.query-btn:active {
  background: #bae7ff;
  transform: scale(0.95);
}

.owner-info-content {
  padding: 8px 12px;
}

.owner-count-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.count-label {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.owner-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: #f0f8ff;
  border: 1px solid #d6e4ff;
  border-radius: 12px;
  padding: 3px 8px;
}

.badge-num {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
  line-height: 1;
}

.badge-suffix {
  font-size: 12px;
  color: #1890ff;
  opacity: 0.8;
}

 

/* 作战部署卡片样式 */
.deployment-card {
  background-color: #FFF;
  margin: 10px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #f8f9fa;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.deployment-selector {
  flex-shrink: 0;
}

.fire-unit-picker {
  min-width: 120px;
}

.picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  min-height: 32px;
}

.picker-text {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.picker-arrow {
  width: 16px;
  height: 16px;
  opacity: 0.6;
}

.deployment-section {
  padding: 10px 15px;
}

.material-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.material-item {
  width: 100%;
  position: relative;
}

.deploy-video {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  background: #000;
}

.anim-thumb {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
}

.page-content {
  padding-top: 0;
  padding-bottom: 20px;
}

/* 图纸画廊弹窗 */
.drawing-gallery {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-content {
  width: 90%;
  height: 80%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.gallery-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.gallery-close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.gallery-body {
  flex: 1;
  position: relative;
}

.gallery-swiper {
  width: 100%;
  height: 100%;
}

.gallery-img {
  width: 100%;
  height: 100%;
}

.gallery-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
}

.gallery-controls {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8f9fa;
}

.control-btn {
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:active {
  transform: scale(0.95);
}

.control-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-icon {
  width: 20px;
  height: 20px;
  opacity: 0.7;
}

/* 自定义弹窗样式 */
.custom-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 85%;
  max-height: 70%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #f8f9fa;
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.modal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  max-height: 300px;
}

.modal-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  text-align: left;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.phone-name {
  display: flex;
  align-items: center;
}

.phone-text {
  flex: 1;
  margin-left: 12rpx;
}

/* 电话号码标签样式 */
.phone-tag {
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: 8px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.tag-responsible {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: #ffffff;
}

.tag-fire {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: #ffffff;
}

.tag-text {
  font-size: 11px;
  font-weight: 500;
  color: inherit;
}
</style>