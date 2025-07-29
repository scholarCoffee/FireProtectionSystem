<template>
  <view class="container">
    <view class="page-content">
      <view v-if="!showWebview">
        <!-- 搜索栏 -->
        <view class="search-bar">
          <view class="search-input-container">
            <image src="/static/icons/location/search.png" class="search-icon" />
            <input 
              type="text" 
              placeholder="输入地址名称查询" 
              class="search-input" 
              @input="handleInput" 
              v-model="searchKeyword"
            />
          </view>
        </view>
        <!-- Tab 分类 -->
        <view class="tabs">
          <view 
            v-for="(tab, index) in tabs" 
            :key="index" 
            :class="['tab-item', activeTab === index ? 'active' : '']" 
            @click="changeTab(index)"
          >
            <image :src="activeTab === index ? tab.activeIcon : tab.icon" class="tab-icon" />
            <text :style="{ color: activeTab === index ? '#1296db' : '#707070' }">{{ tab.name }}</text>
          </view>
        </view>
        <!-- 内容展示 -->
        <scroll-view 
          class="content" 
          scroll-y 
          :lower-threshold="30"
          @scrolltolower="loadMore"
        >
          <template v-if="showList.length > 0">
            <view 
              v-for="(item, index) in showList" 
              :key="index" 
              class="card"
            >
              <!-- 左侧图片 + 标签区域 -->
              <view class="card-left">
                <view class="img-container">
                  <image :src="showImgUrl(item.type)" class="card-img" @click="goToDetail(item)"/>
                  <!-- 安全等级标签 -->
                  <text :class="['safety-tag', getSafeLevelClass(item.safeLevelId)]">
                    {{ item.safeLevelName }}
                  </text>
                </view>
              </view>
              <!-- 右侧信息区域 -->
              <view class="card-info">
                <view class="card-title" >
                  <text @click="goToDetail(item)">{{ item.addressName.length > 10 ? item.addressName.slice(0, 11) + '…' : item.addressName }}</text>
                  <image src="/static/icons/common/phone.png" class="phone-icon" @click="onClickShowPhone(item)" />
                </view>
                <view class="card-desc">
                  <text class="card-desc-score">{{ item.safeLevelScore || 0 }}</text>
                  <text>分</text>
                </view>
                <button class="card-btn" @click="goToExternalLink(item.allSenceLink)">一键查看</button>
              </view>
            </view>
            <view class="load-more">{{ loadingText }}</view>
            <view style="height: 140px;"></view> 
          </template>
          <template v-else>
            <view class="empty-data">
              <image src="https://img.alicdn.com/imgextra/i1/O1CN01pTsPjv1IUryHnSH8F_!!6000000000897-55-tps-313-289.svg" class="empty-img" />
              <text class="empty-text">暂无数据</text>
            </view>
          </template>
        </scroll-view>
      </view>
      <!-- 新增：web-view 返回按钮 -->
      <view class="webview-header" v-if="showWebview">
        <cover-view class="cover-back-btn" @click="goBackToList" v-if="showWebview">
          <cover-image src="/static/icons/common/left.png" class="cover-back-icon"></cover-image>
        </cover-view>
        <web-view :src="webviewUrl"></web-view>
      </view>
    </view>
    
    <!-- 自定义电话选择器模板 -->
    <view class="custom-phone-selector" v-if="showCustomPhoneSelector" @click="hideCustomPhoneSelector">
      <view class="phone-selector-content" @click.stop>
        <view class="phone-selector-header">
          <text class="phone-selector-title">选择联系人</text>
          <text class="phone-selector-close" @click="hideCustomPhoneSelector">×</text>
        </view>
        <view class="phone-selector-list">
          <view 
            v-for="(phoneItem, index) in currentPhoneList" 
            :key="index"
            class="phone-selector-item"
            @click="selectCustomPhone(phoneItem)"
          >
            <view class="phone-item-left">
              <image src="/static/icons/location/userPhone.png" class="phone-user-icon" />
              <view class="phone-item-info">
                <text class="phone-item-name">{{ phoneItem.name }}</text>
                <text class="phone-item-type">{{ phoneItem.type === 1 ? '单位负责人' : '消防负责人' }}</text>
              </view>
            </view>
            <view class="phone-item-right">
              <text class="phone-item-number">{{ phoneItem.phone }}</text>
              <image src="/static/icons/common/phone.png" class="phone-call-icon" />
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { locationTabList } from '@/commons/mock/index.js';
export default {
  data() {
    return {
      showBack: false, // 是否显示返回按钮，适配小程序
      searchKeyword: '',
      debounceTimer: null,
      tabs: locationTabList,
      activeTab: 0, 
      iniDataList: [],
      showList: [],
      page: 1,
      pageSize: 10,
      loadingText: '向下拉取更多',
      finished: false,
      showWebview: false,
      webviewUrl: '',
      showPhoneSelector: false, // 控制电话选择器显示
      currentPhoneList: [], // 当前电话列表
      phonePickerList: [], // uni.picker 的 range 数据
      showCustomPhoneSelector: false // 控制自定义电话选择器显示
    };
  },
  computed: {
    showImgUrl() {
      return type => {
        return type === 1 ? '/static/icons/location/showCommunity.png' : 
               type === 2 ? '/static/icons/location/showFactory.png' : 
               '/static/icons/location/showShop.png';
      }
    }
  },
  onShow() {
    // #ifdef MP
    const pages = getCurrentPages();
    this.showBack = pages.length > 1;
    // #endif
    uni.stopPullDownRefresh();
  },
  mounted() {
    this.changeTab(0); 
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    fetchLocationList({ page = 1, pageSize = 10, keyword = '', type = '' } = {}) {
      uni.showLoading({ 
        title: '加载中...',
        mask: true,
        duration: 10000
      });
      uni.request({
        url: this.serverUrl + '/location/list', // 替换为你的server实际地址
        method: 'GET',
        data: {
          page,
          pageSize,
          keyword,
          type
        },
        success: (res) => {
          if (res.data.code === 200) {
            const { list, pagination } = res.data.data;
            if (page === 1) {
              this.showList = list;
            } else {
              this.showList = this.showList.concat(list);
            }
            this.page = pagination.current;
            this.finished = !pagination.hasNext;
            this.loadingText = this.finished ? '没有更多了' : '向下拉取更多';
            this.iniDataList = this.showList; // 兼容原有逻辑
          } else {
            this.showList = [];
          }
        },
        fail: () => {
          this.showList = [];
          this.finished = true;
        },
        complete: () => {
          uni.hideLoading();
        }
      });
    },
    handleInput() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(this.searchData, 300);
    },
    searchData() {
      this.page = 1;
      this.finished = false;
      this.fetchLocationList({ page: 1, pageSize: this.pageSize, keyword: this.searchKeyword.trim(), type: this.activeTab + 1 });
    },
    loadMore() {
      if (this.finished) return;
      this.fetchLocationList({ page: this.page + 1, pageSize: this.pageSize, keyword: this.searchKeyword.trim(), type: this.activeTab + 1 });
    },
    changeTab(index) {
      this.activeTab = index;
      this.page = 1;
      this.finished = false;
      this.searchKeyword = '';
      this.fetchLocationList({ page: 1, pageSize: this.pageSize, type: index + 1 });
    },
    getSafeLevelClass(safeLevelId) {
      const map = { 1: 'excellent', 2: 'good', 3: 'danger' };
      return map[safeLevelId] || '';
    },
    callPhone(phone) {
      uni.makePhoneCall({
        phoneNumber: phone
      });
    },
    goToDetail(item) {
      uni.navigateTo({ url: '/subPackages/locationInfo/locationDetail/index?addressId=' + item.addressId });
    },
    goToExternalLink(link) {
      this.showWebview = true;
      this.webviewUrl = link;
    },
    goBackToList() {
      this.showWebview = false;
      this.webviewUrl = '';
    },
    onClickShowPhone(item) {
      this.currentPhoneList = item.phoneList;
      this.showCustomPhoneSelector = true;
    },

    selectCustomPhone(phoneItem) {
      this.callPhone(phoneItem.phone);
      this.hideCustomPhoneSelector();
    },
    hideCustomPhoneSelector() {
      this.showCustomPhoneSelector = false;
    }
  }
};
</script>

<style>
/* 内容区下移，避免被导航栏遮挡 */
.page-content {
  padding-top: 0;
}
.search-bar, .tabs, .content {
  margin-top: 0;
}
.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #FFFFFF;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.search-bar {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.search-input-container {
  display: flex;
  align-items: center;
  width: 90%;
  height: 36px;
  padding: 0 15px;
  border: 1px solid #E0E0E0;
  border-radius: 18px;
  background-color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}
.search-icon {
  width: 16px;
  height: 16px;
  margin-right: 10px;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  height: 100%;
  padding: 0;
  border: none;
  background: none;
  font-size: 14px;
  color: #707070;
  outline: none;
  box-shadow: none;
}
.search-input-container:focus-within {
  border-color: #1296db;
  box-shadow: 0 2px 12px rgba(18, 150, 219, 0.15);
}
.location-icon {
  width: 16px;
  height: 16px;
  margin-right: 5px;
  top: 1px;
}
.tabs {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #FFFFFF;
  padding: 4px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #f0f0f0;
}
.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #707070;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}
.tab-icon {
  width: 20px;
  height: 20px;
  margin-bottom: 4px;
  transition: transform 0.2s ease;
}
.tab-item.active .tab-icon {
  transform: scale(1.1);
}
.content {
  height: calc(100vh - 80px);
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #f8f9fa;
}
body, html {
  overflow: hidden !important;
}
.card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  margin: 12px 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  overflow: hidden;
  min-width: 0;
  min-height: 140px;
  border: 1px solid #f0f0f0;
}

/* 左侧图片区域（包含左上角标签） */
.card-left {
  flex-shrink: 0; /* 防止图片区域被压缩 */
  margin-right: 6px;
}
.img-container {
  width: 120px;
  height: 120px;
  position: relative; /* 相对定位，用于标签绝对定位 */
  margin: 10px;
}
.card-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.card-img:active {
  transform: scale(0.98);
}
/* 安全等级标签（左上角） */
.safety-tag {
  position: absolute; /* 绝对定位到图片左上角 */
  top: 1px;
  right: 1px;
  font-size: 11px;
  color: #fff;
  border-radius: 6px;
  padding: 2px 6px;
  z-index: 2; /* 确保在图片上方 */
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.safety-tag.excellent { background: linear-gradient(135deg, #4CAF50, #45a049); } /* 优秀-绿色 */
.safety-tag.good { background: linear-gradient(135deg, #2196F3, #1976D2); }      /* 良好-蓝色 */
.safety-tag.normal { background: linear-gradient(135deg, #FF9800, #F57C00); }    /* 一般-橙色 */
.safety-tag.danger { background: linear-gradient(135deg, #F44336, #D32F2F); }    /* 较差-红色 */

/* 右侧信息区域 */
.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 12px 12px 0px;
  justify-content: space-between;
  min-width: 0; /* 允许flex子项收缩 */
}
.card-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.card-title {
  font-weight: bold;
  margin: 0px;
  font-size: 16px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title text {
  flex: 1;
  color: #333;
  font-weight: 600;
}
.card-desc {
  color: #FF6B35;
  font-size: 12px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
  text-shadow: 0 1px 2px rgba(255, 107, 53, 0.1);
}

.card-desc-score {
  font-size: 24px;
  font-weight: bold;
  margin-right: 1px;
}

/* 电话列表样式 */
.phone-list {
  margin: auto 0;
}
.phone-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  margin-bottom: 4px;
  color: #555;
  cursor: pointer; /* 提示可点击 */
  min-width: 0; /* 允许收缩 */
}
.phone-label {
  color: #666;
  margin-right: 4px;
  flex-shrink: 0; /* 防止标签被压缩 */
}
.phone-number {
  color: #2196F3;
  margin-right: 4px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.phone-icon {
  top: 1px;
  margin-right: 4px;
  width: 14px;
  height: 14px;
  opacity: 0.7;
  flex-shrink: 0; /* 防止图标被压缩 */
}

.card-btn {
  margin-top: 8px;
  background: linear-gradient(135deg, #1296db, #0ea5b8);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 0;
  font-size: 14px;
  width: 100%;
  height: 38px;
  line-height: 18px;
  align-self: stretch;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0; /* 防止按钮被压缩 */
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(18, 150, 219, 0.3);
}

.card-btn:active {
  background: linear-gradient(135deg, #0ea5b8, #0d94a7);
  transform: translateY(1px);
  box-shadow: 0 1px 4px rgba(18, 150, 219, 0.4);
}
.load-more {
  text-align: center;
  color: #999;
  font-size: 13px;
  margin: 20px 0 12px 0;
  padding: 8px;
  border-radius: 6px;
  backdrop-filter: blur(10px);
}
.empty-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #999;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  margin: 20px;
  backdrop-filter: blur(10px);
}
.empty-img {
  width: 200px;
  height: 200px;
  margin-bottom: 16px;
  opacity: 0.7;
}
.empty-text {
  font-size: 15px;
  color: #666;
  font-weight: 500;
}
.cover-back-btn {
  position: fixed;
  top: 10px;
  left: 15px;
  width: 30px;
  height: 30px;
  z-index: 99999; 
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-back-icon {
  width: 20px;
  height: 20px;
}



/* 自定义电话选择器样式 */
.custom-phone-selector {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.phone-selector-content {
  background-color: #fff;
  border-radius: 12px;
  width: 90%;
  max-height: 80%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.phone-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.phone-selector-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.phone-selector-close {
  font-size: 24px;
  color: #999;
  font-weight: bold;
}

.phone-selector-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 20px;
}

.phone-selector-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.phone-selector-item:last-child {
  border-bottom: none;
}

.phone-item-left {
  display: flex;
  align-items: center;
}

.phone-user-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
  flex-shrink: 0;
}

.phone-item-info {
  display: flex;
  flex-direction: column;
}

.phone-item-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.phone-item-type {
  font-size: 12px;
  color: #666;
}

.phone-item-right {
  display: flex;
  align-items: center;
}

.phone-item-number {
  font-size: 15px;
  font-weight: 600;
  color: #2196F3;
  margin-right: 10px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phone-call-icon {
  width: 18px;
  height: 18px;
  opacity: 0.7;
  flex-shrink: 0;
}
</style>