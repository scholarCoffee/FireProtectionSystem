<template>
  <view class="container">
    <!-- 顶部导航栏 -->
    <!-- <view class="nav-bar">
      <view class="nav-left" v-if="showBack" @click="goBack">
        <image src="/static/icons/common/back.png" class="nav-back-icon" />
      </view>
      <view class="nav-title">位置查询</view>
      <view class="nav-right"></view>
    </view> -->
    <view class="page-content">
      <view v-if="!showWebview">
        <!-- 搜索栏 -->
        <view class="search-bar">
          <input 
            type="text" 
            placeholder="输入地址名称查询" 
            class="search-input" 
            @input="handleInput" 
            v-model="searchKeyword"
          />
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
                <text class="card-title" @click="goToDetail(item)">
                  {{ item.addressName.length > 15 ? item.addressName.slice(0, 15) + '…' : item.addressName }}
                </text>
                <view class="phone-list">
                  <view 
                    v-for="(phoneItem, phoneIndex) in item.phoneList" 
                    :key="phoneIndex" 
                    class="phone-item"
                    @click="callPhone(phoneItem.phone)"
                  >
                    <text class="phone-label">
                      {{ phoneItem.type === 1 ? '单位负责人：' : '消防负责人：' }}
                    </text>
                    <image src="/static/icons/common/phone.png" class="phone-icon" />
                    <text class="phone-number">{{ phoneItem.phone }}</text>
                  </view>
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
        <web-view :src="webviewUrl"></web-view>
      </view>
      <image src="/static/icons/common/back.png" class="back-icon" @click="goBackToList" v-if="showWebview" />
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
      loading: false,
      finished: false,
      showWebview: false,
      webviewUrl: '',
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
      this.loading = true;
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
            this.finished = true;
            this.loadingText = '加载失败';
          }
        },
        fail: () => {
          this.showList = [];
          this.finished = true;
          this.loadingText = '加载失败';
        },
        complete: () => {
          this.loading = false;
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
      if (this.loading || this.finished) return;
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
      const map = { 1: 'excellent', 2: 'good', 3: 'normal', 4: 'danger' };
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
      // uni.navigateTo({ url: '/subPackages/common/webview/index?url=' + link });
      this.showWebview = true;
      this.webviewUrl = link;
    },
    goBackToList() {
      this.showWebview = false;
      this.webviewUrl = '';
    }
  }
};
</script>

<style>
web-view {
  margin-top: -44px; /* 向上偏移覆盖原导航栏（需根据实际导航高度调整） */
  height: calc(100% + 44px);
}
.container {
  height: 100vh;
  overflow: hidden;
  background: #f8f8f8;
}
/* 顶部导航栏样式 */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 44px; /* 导航栏高度，与小程序默认导航一致 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff; /* 导航栏背景色 */
  padding: 0 15px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  z-index: 99999; /* 确保在web-view上方 */
}
.nav-left, .nav-right {
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: bold;
  color: #222;
}
.nav-back-icon {
  width: 22px;
  height: 22px;
}
/* 内容区下移，避免被导航栏遮挡 */
.page-content {
  margin-top: 44px;
  padding-top: var(--status-bar-height, 0);
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
.search-input {
  width: 90%;
  height: 30px;
  padding: 0 15px;
  border: 1px solid #E0E0E0;
  border-radius: 20px;
  background-color: #FFFFFF;
  font-size: 14px;
  color: #707070;
  outline: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  background-image: url('/static/icons/location/search.png');
  background-repeat: no-repeat;
  background-size: 16px;
  background-position: 10px center;
  text-indent: 30px;
}
.tabs {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #FFFFFF;
  padding: 10px 0 5px 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #707070;
}
.tab-item.active {
  color: #1296db;
}
.tab-icon {
  width: 18px;
  height: 18px;
  margin-bottom: 2px;
}
.content {
  height: calc(100vh - 80px);
  overflow-y: auto;
  overflow-x: hidden;
}
body, html {
  overflow: hidden !important;
}
.card {
  display: flex;
  background: #fff;
  border-radius: 8px;
  margin: 10px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
  min-width: 0;
  min-height: 140px;
}

/* 左侧图片区域（包含左上角标签） */
.card-left {
  flex-shrink: 0; /* 防止图片区域被压缩 */
  margin-right: 10px;
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
  border-radius: 6px;
  cursor: pointer;
}
/* 安全等级标签（左上角） */
.safety-tag {
  position: absolute; /* 绝对定位到图片左上角 */
  top: 0px;
  left: 0px;
  font-size: 12px;
  color: #fff;
  border-radius: 4px;
  padding: 1px 6px;
  z-index: 2; /* 确保在图片上方 */
}
.safety-tag.excellent { background: #4CAF50; } /* 优秀-绿色 */
.safety-tag.good { background: #2196F3; }      /* 良好-蓝色 */
.safety-tag.normal { background: #FF9800; }    /* 一般-橙色 */
.safety-tag.danger { background: #F44336; }    /* 较差-红色 */

/* 右侧信息区域 */
.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 10px 10px 0px;
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
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
}
.title-icon {
  top: 1px;
  width: 16px;
  height: 16px;
  margin-right: 2px;
}
.card-desc {
  color: #888;
  font-size: 13px;
  margin-bottom: 8px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
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
  margin-right: 6px;
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
  margin-top: 6px;
  background: #12c4db;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 0;
  font-size: 14px;
  width: 100%;
  height: 36px;
  line-height: 20px;
  align-self: stretch;
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color 0.3s ease;
  flex-shrink: 0; /* 防止按钮被压缩 */
}

.card-btn:active {
  background: #0ea5b8;
}
.load-more {
  text-align: center;
  color: #b0b0b0;
  font-size: 13px;
  margin: 16px 0 8px 0;
}
.empty-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #b0b0b0;
}
.empty-img {
  width: 300px;
  height: 300px;
  margin-bottom: 12px;
}
.empty-text {
  font-size: 15px;
}
.back-icon {
  position: fixed;
  top: 13px;
  left: 10px;
  width: 20px;
  height: 20px;
  z-index: 1000;
  cursor: pointer;
}
</style>