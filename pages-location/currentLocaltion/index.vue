<template>
  <view class="container">
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
                  @click="copyPhone(phoneItem.phone)"
                >
                  <text class="phone-label">
                    {{ phoneItem.type === 1 ? '单位负责人：' : '消防负责人：' }}
                  </text>
                  <text class="phone-number">{{ phoneItem.phone }}</text>
                  <image src="/static/icons/common/copy.png" class="copy-icon" />
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
</template>

<script>
import { locationInfo, locationTabList } from '@/commons/mock/index.js';
export default {
  data() {
    return {
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
    uni.stopPullDownRefresh();
  },
  mounted() {
    this.changeTab(0); 
  },
  methods: {
    handleInput() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.searchData();
      }, 300);
    },
    searchData() {
      const keyword = this.searchKeyword.trim().toLowerCase();
      if (keyword) {
        this.iniDataList = locationInfo.filter(item => {
          const nameMatch = item.addressName.toLowerCase().includes(keyword);
          return nameMatch;
        });
      } else {
        this.iniDataList = locationInfo.filter(item => item.type === this.activeTab + 1);
      }
      this.page = 1;
      this.initShowList();
    },
    initShowList() {
      const count = Math.min(this.pageSize, this.iniDataList.length);
      this.showList = this.iniDataList.slice(0, count);
      this.page = 1;
      this.finished = this.iniDataList.length <= count;
      this.loadingText = this.finished ? '没有更多了' : '向下拉取更多';
    },
    loadMore() {
      if (this.loading || this.finished) return;
      this.loading = true;
      this.loadingText = '加载中...';
      setTimeout(() => {
        const start = this.showList.length;
        const end = start + this.pageSize;
        const more = this.iniDataList.slice(start, end);
        if (more.length) {
          this.showList = this.showList.concat(more);
          this.page++;
          if (this.showList.length >= this.iniDataList.length) {
            this.finished = true;
            this.loadingText = '没有更多了';
          } else {
            this.loadingText = '向下拉取更多';
          }
        } else {
          this.finished = true;
          this.loadingText = '没有更多了';
        }
        this.loading = false;
      }, 300);
    },
    changeTab(index) {
      this.activeTab = index;
      // 选中tab后，内容展示滚动到顶部
      uni.showToast({
        title: '正在加载中...',
        icon: 'none',
        duration: 1500
      })
      this.iniDataList = locationInfo.filter(item => item.type === index + 1);
      this.initShowList();
      // uni.hideToast();
    },
    getSafeLevelClass(safeLevelId) {
      switch (safeLevelId) {
        case 1: return 'excellent'; 
        case 2: return 'good';      
        case 3: return 'normal';    
        case 4: return 'danger';    
        default: return '';
      }
    },
    copyPhone(phone) {
      uni.setClipboardData({
        data: phone,
        success() {
          uni.showToast({
            title: '已复制',
            icon: 'none',
            duration: 1500
          });
        }
      });
    },
    goToDetail(item) {
      uni.navigateTo({ url: '/pages-location/locationDetail/index?addressId=' + item.addressId });
    },
    goToExternalLink(link) {
      this.webviewUrl = decodeURIComponent(link);
      this.showWebview = true; // 显示 web-view，隐藏原有列表
    },
    // 可选：加返回按钮，隐藏 web-view 回到列表
    goBackToList() {
      this.showWebview = false;
      this.webviewUrl = '';
    }
  }
};
</script>

<style>
.container {
  height: 100vh;
  overflow: hidden;
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
  height: 140px;
}

/* 左侧图片区域（包含左上角标签） */
.card-left {
  margin-right: 10px;
}
.img-container {
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
  padding: 10px 5px 10px 0px;
  justify-content: space-between;
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
  max-width: 230px;
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
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
}

/* 电话列表样式 */
.phone-list {
  margin-bottom: 8px;
}
.phone-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  margin-bottom: 4px;
  color: #555;
  cursor: pointer; /* 提示可点击 */
}
.phone-label {
  color: #666;
  margin-right: 4px;
}
.phone-number {
  color: #2196F3;
  margin-right: 6px;
}
.copy-icon {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.card-btn {
  margin-top: 6px;
  background: #12c4db;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0px;
  font-size: 12px;
  width: 100%;
  align-self: stretch;
  box-sizing: border-box;
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