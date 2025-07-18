<template>
  <view class="detail-container">
    <!-- 顶部导航栏下方内容 -->
    <view class="page-content">
      <view>
        <!-- 头部图片区域 -->
        <view class="header-image">
          <image 
            :src="locationObj.type === 1 ? '/static/icons/location/showCommunity.png' 
              : locationObj.type === 2 ? '/static/icons/location/showFactory.png' 
              : '/static/icons/location/showShop.png'" 
            class="detail-img" 
          />
          <!-- 安全等级标签 -->
          <view class="safety-tag" :class="safeLevelClass">
            <text>{{ locationObj.safeLevelName }}</text>
          </view>
        </view>

        <!-- 信息卡片 -->
        <view class="info-card">
          <!-- 地址名称 -->
          <view class="address-name">
            <text>{{ locationObj.addressName }}</text>
          </view>
          
          <!-- 地址详情 -->
          <view class="address-detail">
            <image src="/static/icons/location/location.png" class="location-icon" />
            <text>{{ locationObj.addressExt }}</text>
          </view>
          
          <!-- 720全云景 -->
          <view class="panorama-view" @click="goToExternalLink(locationObj.allSenceLink)">
            <image src="/static/icons/location/panorama.png" class="location-icon"/>
            <text>720全云景</text>
            <image src="/static/icons/common/arrow-right.png" class="arrow-icon" />
          </view>
          
          <!-- 分割线 -->
          <view class="divider" />
          
          <!-- 显示类型 -->
          <view class="info-row">
            <text class="label">单位类型：</text>
            <text class="value">{{ getLocationTypeName() }}</text>
          </view>
          
          <!-- 显示电话号码 -->
          <view class="info-row" v-for="phoneItem in locationObj.phoneList" :key="phoneItem.phone">
            <view class="phone-content">
              <view class="phone-name">
                <text class="label">{{ phoneItem.type === 1 ? '单位负责人：' : '消防负责人：' }}</text>
                <text>{{ phoneItem.name }}</text>
              </view>
              <view class="phone-number">
                <image src="/static/icons/common/phone.png" class="phone-icon" @tap="callPhone(phoneItem.phone)"/>
                <text>{{ phoneItem.phone }}</text>
              </view>
            </view>
          </view>
                
          <!-- 消防安全描述 -->
          <view class="info-row">
            <text class="label">安全描述：</text>
            <text class="value">{{ locationObj.safeLevelDesc || '暂无描述' }}</text>
          </view>

          <!-- 出行大门 -->
          <view class="info-row gate-list">
            <view class="gate-items">
              <text class="label">可出行大门：</text>
              <view class="gate-item" v-for="(gate, index) in locationObj.enterGateList" :key="index">
                <!-- 勾选框 -->
                <image src="/static/icons/common/location-checked.png" class="check-icon"/>
                <!-- 大门名称 -->
                <text class="gate-name">{{ gate.name }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      locationObj: {}, // 接收接口返回的详情数据
      addressId: null, // 用于接收传入的 addressId
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
      const typeMap = { 1: '小区', 2: '厂房', 3: '商铺' };
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
  }
};
</script>

<style scoped>
/* 容器样式 - 添加滚动功能 */
.detail-container {
  height: 100vh;
  overflow-y: auto;
  background-color: #f5f5f5;
}

/* 头部图片区域 */
.header-image {
  position: relative;
  height: 220px;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.detail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
.safety-excellent { background-color: #00B42A; }
.safety-good { background-color: #FF7D00; }
.safety-normal { background-color: #FFB400; }
.safety-danger { background-color: #F53F3F; }

/* 信息卡片 */
.info-card {
  background-color: #FFF;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.address-name {
  padding: 15px 15px 10px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.address-detail {
  display: flex;
  align-items: center;
  padding: 0 15px 0 15px;
  font-size: 14px;
  color: #666;
}
.location-icon {
  width: 16px;
  height: 16px;
  margin-right: 5px;
}
.panorama-view {
  display: flex;
  align-items: center;
  padding: 15px;
  color: #1296DB;
  font-size: 14px;
}
.panorama-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  background-color: #1296DB;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.panorama-icon image {
  width: 14px;
  height: 14px;
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
}
.phone-icon {
  width: 16px;
  height: 16px;
  margin-right: 5px;
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
}
</style>