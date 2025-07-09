<template>
  <view class="container">
    <view v-if="!showWebview">
      <!-- 固定顶部和搜索栏 -->
      <view class="fixed-header">
        <view class="search-bar">
          <input type="text" placeholder="搜索" class="search-input" @focus="goToSearchPage" />
        </view>
      </view>
      <!-- Tab 分类 -->
      <view class="tabs">
        <view 
          v-for="(tab, index) in tabs" 
          :key="index" 
          :class="['tab-item', activeTab === index ? 'active' : '']" 
          @click="changeTab(index)">
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
          <view v-for="(item, index) in showList" :key="index" class="card">
            <image :src="showImgUrl(item.type)" class="card-img" @click="goToDetail(item)" />
            <view class="card-info">
              <view class="card-row">
                <text class="card-title" @click="goToDetail(item)">
                  <image src="/static/icons/location/showLocationImg.png" class="title-icon" />
                  {{ item.name.length > 20 ? item.name.slice(0, 20) + '…' : item.name }}
                </text>
              </view>
              <text class="card-desc">
                {{ item.address.length > 25 ? item.address.slice(0, 25) + '…' : item.address }}
              </text>
              <button class="card-btn" @click="goToExternalLink(item.link)">一键查看</button>
            </view>
          </view>
          <view class="load-more">{{ loadingText }}</view>
          <view style="height: 140px;"></view> <!-- 底部留白 -->
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
      <image src="/static/icons/location/back.png" class="back-icon" @click="goBackToList" />
      <text class="webview-title">720全景云</text>
      <web-view :src="webviewUrl"></web-view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      tabs: [
        { name: '全部', type: 0, icon: '/static/icons/location/all.png', activeIcon: '/static/icons/location/all-active.png' },
        { name: '小区', type: 1, icon: '/static/icons/location/community.png', activeIcon: '/static/icons/location/community-active.png' },
        { name: '厂房', type: 2, icon: '/static/icons/location/factory.png', activeIcon: '/static/icons/location/factory-active.png' },
        { name: '商铺', type: 3, icon: '/static/icons/location/shop.png', activeIcon: '/static/icons/location/shop-active.png' }
      ],
      activeTab: 0,
      allData: [
        { name: '江苏省苏州市工业园区东方之门', address: '金山大道009号222222222222222222222222222222222',  link: 'https://www.720yun.com/vr/471j5gmwvu2', type: 1 },
        { name: '江苏省常熟市虞山消防', address: '金山大道009号',  link: 'https://www.720yun.com/vr/471j5gmwvu2', type: 1 },
        { name: '江苏省昆山市立讯精密', address: '昆山市立讯精密',  link: 'https://www.720yun.com/vr/471j5gmwvu2', type: 2 },
        { name: '江苏省虎丘区电区', address: '金山大道009号',  link: 'https://www.720yun.com/vr/471j5gmwvu2', type: 2 },
        { name: '江苏省苏州市姑苏区小商品聚集', address: '金山大道009号',  link: 'https://www.720yun.com/vr/471j5gmwvu2', type: 3 },
        { name: '江苏省苏州市姑苏区', address: '金山大道009号',  link: 'https://www.720yun.com/vr/471j5gmwvu2', type: 3 },
        // ...可继续补充更多数据...
      ],
      iniDataList: [], // 当前tab下全部数据
      showList: [], // 当前已加载数据
      page: 1,
      pageSize: 10,
      loadingText: '向下拉取更多',
      loading: false,
      finished: false,
      contentHeight: 0, // 内容区高度
      cardHeight: 130,  // 单个card高度（可根据实际调整）
      showWebview: false, // 控制 web-view 显示/隐藏
      webviewUrl: ''      // 外部链接地址
    };
  },
  computed: {
    showImgUrl() {
      // 根据type显示
      return type => {
        return type === 1 ? '/static/icons/location/showCommunity.png' : type === 2 ? '/static/icons/location/showFactory.png' : '/static/icons/location/showShop.png';
      }
    }
  },
  onShow() {
    // 同样也可以在页面显示时关闭下拉刷新
    uni.stopPullDownRefresh();
  },
  mounted() {
    this.changeTab(0); // 默认显示全部
    this.$nextTick(() => {
      const query = uni.createSelectorQuery().in(this);
      query.select('.content').boundingClientRect(rect => {
        this.contentHeight = rect.height;
        this.initShowList();
      }).exec();
    });
  },
  methods: {
    initShowList() {
      // 计算可展示条数
      const maxCount = Math.max(Math.floor(this.contentHeight / this.cardHeight), 1);
      const count = Math.min(this.pageSize, maxCount, this.iniDataList.length);
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
      if (index === 0) {
        this.iniDataList = this.allData;
      } else {
        this.iniDataList = this.allData.filter(item => item.type === index);
      }
      this.$nextTick(() => {
        this.initShowList();
      });
    },
    goToSearchPage() {
      // 填写关键字查询具体内容

    },
    goToExternalLink(link) {
      this.webviewUrl = decodeURIComponent(link);
      this.showWebview = true; // 显示 web-view，隐藏原有列表
    },
    // 可选：加返回按钮，隐藏 web-view 回到列表
    goBackToList() {
      this.showWebview = false;
      this.webviewUrl = '';
    },
    goToDetail(item) {
      uni.navigateTo({ url: '/pages-location/locationDetail/index?id=' + item.id });
    }
  }
};
</script>

<style>
.container {
  height: 100vh;
  overflow: hidden; /* 只让内容区滚动 */
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
  padding: 5px 0;
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
  height: calc(100vh - 80px); /* 顶部高度根据实际调整 */
  overflow-y: auto;
  overflow-x: hidden;
}
body, html {
  overflow: hidden !important; /* 防止外部滚动条 */
}
.card {
  display: flex;
  background: #fff;
  border-radius: 8px;
  margin: 10px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
  min-height: 120px;
}
.card-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  margin: 10px;
  border-radius: 6px;
  cursor: pointer;
}
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
.tag {
  font-size: 13px;
  color: #fff;
  border-radius: 4px;
  padding: 2px 8px;
  margin-right: 8px;
}
.tag.excellent { background: #e57373; } /* 优秀-红 */
.tag.good { background: #ffd54f; color: #333; } /* 良好-黄 */
.tag.normal { background: #81c784; } /* 一般-绿 */
.tag.danger { background: #e53935; } /* 危险-深红 */
.status {
  font-size: 13px;
  border-radius: 4px;
  padding: 2px 8px;
  margin-left: auto;
}
.status.checked { background: #43c97c; color: #fff; } /* 已验收-绿 */
.status.unchecked { background: #ff5252; color: #fff; } /* 未验收-红 */
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
  margin-bottom: 4px;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
}
.card-detail {
  display: flex;
  font-size: 13px;
  color: #555;
  margin-bottom: 2px;
}
.card-detail text {
  margin-right: 16px;
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
</style>