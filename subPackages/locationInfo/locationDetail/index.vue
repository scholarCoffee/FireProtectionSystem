<template>
  <scroll-view class="detail-container" scroll-y="true" :scroll-top="scrollTop" :scroll-with-animation="false" :enhanced="true" :bounces="false">
    <!-- 顶部导航栏下方内容 -->
    <view class="page-content">
      <view>
        <!-- 头部图片区域 -->
        <view class="header-image">
          <image 
            :src="locationObj.type === 1 ? serverUrl + '/static/icons/location/showCommunity.png' 
              : locationObj.type === 2 ? serverUrl + '/static/icons/location/showFactory.png' 
              : serverUrl + '/static/icons/location/showShop.png'" 
            class="detail-img" 
          />
        </view>

        <!-- 信息卡片 -->
        <view class="info-card">
          <!-- 地址名称 -->
          <view class="address-name">
            <text class="address-name-text">{{ locationObj.addressName }}</text>
            <view class="type-value">
              <image :src="showImgUrl(locationObj.type)" class="type-icon" />
              <text>{{ getLocationTypeName() }}</text>
            </view>
            <image :src="serverUrl + '/static/icons/location/copy.png'" class="location-icon" @tap="copyAddressName" />
          </view>
          
          <!-- 地址详情 -->
          <view class="address-detail">
            <image :src="serverUrl + '/static/icons/location/showLocation.png'" class="location-icon" />
            <text>{{ locationObj.addressExt }}</text>
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
                      <image :src="`${serverUrl}${img}`" class="drawing-img" mode="aspectFit" />
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
          <view class="safety-card-full" @tap="goToSafetyDetail">
            <view class="safety-header">
                <view class="safety-info">
                  <view class="score-display">
                    <text class="score-number">{{ locationObj.safeLevelScore || 0 }}</text>
                    <text class="score-unit">分</text>
                  </view>
                </view>
                <view class="safety-badge" :class="safeLevelClass">
                  <text class="badge-text">{{ locationObj.safeLevelName }}</text>
                </view>
              </view>
            <view class="score-progress">
              <view class="progress-track">
                <view class="progress-fill" :style="{ width: (locationObj.safeLevelScore || 0) + '%' }"></view>
              </view>
              <text class="progress-text">安全评分</text>
            </view>
          </view>
          
          <!-- 显示电话号码 -->
          <view class="info-row" v-for="phoneItem in locationObj.phoneList" :key="phoneItem.phone">
            <view class="phone-content">
              <view class="phone-name">
                <image :src="serverUrl + '/static/icons/location/userPhone.png'" class="user-phone-icon" />
                <text class="label">{{ phoneItem.type === 1 ? '单位负责人：' : '消防负责人：' }}</text>
                <text class="phone-text">{{ phoneItem.name }}</text>
              </view>
              <view class="phone-number">
                <text>{{ phoneItem.phone }}</text>
                <image :src="serverUrl + '/static/icons/common/phone.png'" class="phone-icon" @tap="callPhone(phoneItem.phone)"/>
              </view>
            </view>
          </view>

          <!-- 分割线 -->
          <view class="divider" />

          <!-- 出行大门 -->
          <view class="info-row gate-list">
            <view class="gate-items">
              <text class="label">可出行大门：</text>
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
              <image :src="`${serverUrl}${img}`" class="gallery-img" mode="aspectFit" />
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
export default {
  data() {
    return {
      locationObj: {}, // 接收接口返回的详情数据
      addressId: null, // 用于接收传入的 addressId
      showGallery: false, // 控制图纸画廊显示
      currentImageIndex: 0, // 当前图片索引
      showCustomModal: false, // 控制自定义弹窗显示
      modalContent: '', // 弹窗内容
      scrollTop: 0, // 滚动位置
    };
  },
  onLoad(data) {
    const { addressId } = data || {}; // 获取传入的 addressId
    this.addressId = addressId; // 保存 addressId
    // 根据 addressId 获取位置详情（接口调用）
    this.fetchLocationDetail();
  },
  computed: {
    safeLevelClass() {
      const map = { 1: 'safety-excellent', 2: 'safety-good', 3: 'safety-normal', 4: 'safety-danger' };
      return map[this.locationObj.safeLevelId] || '';
    },
    showImgUrl() {
      return (type) => {
        return type === 1 ? this.serverUrl + '/static/icons/location/community-white.png' : type === 2 ? this.serverUrl + '/static/icons/location/factory-white.png' : this.serverUrl + '/static/icons/location/shop-white.png';
      }
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
    getLocationTypeName() {
      // 直接用locationObj.type判断
      const typeMap = { 1: '高层小区', 2: '重点单位', 3: '沿街商铺' };
      return typeMap[this.locationObj.type] || '未知类型';
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
  }
};
</script>

<style scoped>
/* 容器样式 - 添加滚动功能 */
.detail-container {
  height: 100vh;
  background-color: #f5f5f5;
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;
  transform: translateZ(0);
}

/* 头部图片区域 */
.header-image {
  position: relative;
  height: 220px;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transform: translateZ(0);
  will-change: transform;
}
.detail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: translateZ(0);
  will-change: transform;
}
.safety-tag {
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #FFF;
}
.safety-excellent { 
  background: linear-gradient(135deg, #00B42A, #52C41A);
  box-shadow: 0 2px 8px rgba(0, 180, 42, 0.3);
}
.safety-good { 
  background: linear-gradient(135deg, #1890FF, #40A9FF);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}
.safety-normal { 
  background: linear-gradient(135deg, #FF7D00, #FFA940);
  box-shadow: 0 2px 8px rgba(255, 125, 0, 0.3);
}
.safety-danger { 
  background: linear-gradient(135deg, #F53F3F, #FF4D4F);
  box-shadow: 0 2px 8px rgba(245, 63, 63, 0.3);
}

/* 信息卡片 */
.info-card {
  background-color: #FFF;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 50px;
  transform: translateZ(0);
  will-change: transform;
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

.address-name-text {
  flex: 1;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  margin-right: 10px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.address-name-text::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}
.address-detail {
  display: flex;
  align-items: center;
  padding: 0 15px 0 15px;
  font-size: 12px;
  color: #666;
}
.location-icon {
  width: 16px;
  height: 16px;
  margin-right: 5px;
}

/* 复制图标特殊样式 */
.address-name .location-icon {
  margin-right: 0;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.address-name .location-icon:active {
  background-color: rgba(0, 0, 0, 0.1);
}

.arrow-icon {
  width: 16px;
  height: 16px;
  margin-left: auto;
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
.phone-text {
  font-size: 12px;
}
.value {
  color: #333;
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
  top: 2px;
  width: 16px;
  height: 16px;
  margin-right: 5px;
}
.phone-icon {
  top: 1px;
  width: 16px;
  height: 16px;
  margin-left: 5px;
} 

/* 单位类型和720全云景样式 - 美团风格 */
.type-panorama-row {
  display: flex;
  gap: 12px;
  padding: 15px;
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
  transform: translateZ(0);
  will-change: transform;
}

.type-card::before {
  content: '';
  position: absolute;
  top: -10px;
  right: -10px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 50%;
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
  overflow: hidden;
  cursor: pointer;
  transition: color 0.2s ease;
}

.type-description:active {
  color: #1890FF;
}

.type-icon {
  margin-right: 2px;
  width: 20px;
  height: 20px;
  opacity: 0.7;
}

.type-title {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.type-content {
  display: flex;
  align-items: center;
}

.type-value {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 16px;
  background: #07c160;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(20px);
  color: #ffffff;
  font-size: 12px;
}

/* 单位图纸卡片 */
.drawing-card {
  flex: 1;
  background: linear-gradient(135deg, #1890FF, #40A9FF);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: translateZ(0);
  will-change: transform;
}

.drawing-card::before {
  content: '';
  position: absolute;
  top: -10px;
  right: -10px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.drawing-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.drawing-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.drawing-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

.drawing-title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
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

/* 自定义指示点样式 */
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
  transform: translateZ(0);
  will-change: transform;
}

.drawing-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
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

/* 安全等级卡片 - 全宽 */
.safety-card-full {
  background: linear-gradient(135deg, #FF8A65, #FFAB91);
  border-radius: 12px;
  padding: 16px;
  margin: 0 15px 15px 15px;
  box-shadow: 0 6px 20px rgba(255, 138, 101, 0.25);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: translateZ(0);
  will-change: transform;
}

.safety-card-full::before {
  content: '';
  position: absolute;
  top: -10px;
  right: -10px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
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
  padding: 6px 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-right: 8px;
}

.badge-text {
  font-size: 14px;
  color: #fff;
  font-weight: bold;
}

.arrow-icon {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
  opacity: 0.8;
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
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFFFFF, rgba(255, 255, 255, 0.9));
  border-radius: 5px;
  transition: width 0.5s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 2px;
}

.progress-text {
  font-size: 12px;
  color: #fff;
  font-weight: 500;
}

/* 出行大门样式 */
.gate-list {
  flex-wrap: wrap;
  padding-top: 15px;
  padding-bottom: 15px;
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
  top: 1px;
  width: 16px;
  height: 16px;
  object-fit: contain;
  margin-right: 5px;
}

.gate-name {
  color: #333;
  font-size: 14px;
}
.page-content {
  padding-top: 0;
  padding-bottom: 20px; /* 添加底部间距，确保内容可以完全滚动 */
  transform: translateZ(0);
  will-change: scroll-position;
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
  border-radius: 16px;
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
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
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

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #f8f9fa;
  display: flex;
  justify-content: center;
}

.modal-btn {
  padding: 10px 24px;
  background: #1890FF;
  color: #fff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.modal-btn:active {
  background: #096DD9;
}
</style>