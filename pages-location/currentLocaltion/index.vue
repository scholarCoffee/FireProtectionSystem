<template>
  <view class="container">
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
      <view v-for="(item, index) in showList" :key="index" class="card">
        <image :src="item.imgUrl" class="card-img" />
        <view class="card-info">
          <view class="card-row">
            <view :class="['tag', item.level]">{{ item.levelText }}</view>
            <text class="card-title">
              <image src="/static/icons/location/location.png" class="title-icon" />
              {{ item.name }}
            </text>
            <view :class="['status', item.status]">{{ item.statusText }}</view>
          </view>
          <text class="card-desc">{{ item.address }}</text>
          <view class="card-detail">
            <text>面积：{{ item.area }}</text>
            <text>消防栓：{{ item.hydrant }}</text>
          </view>
          <view class="card-detail">
            <text>演练：{{ item.drill }}</text>
            <text>人员：{{ item.people }}</text>
          </view>
          <button class="card-btn" @click="goToExternalLink(item.link)">一键查看</button>
        </view>
      </view>
      <view class="load-more">{{ loadingText }}</view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      tabs: [
        { name: '全部', icon: '/static/icons/location/all.png', activeIcon: '/static/icons/location/all-active.png' },
        { name: '小区', icon: '/static/icons/location/community.png', activeIcon: '/static/icons/location/community-active.png' },
        { name: '厂房', icon: '/static/icons/location/factory.png', activeIcon: '/static/icons/location/factory-active.png' },
        { name: '商铺', icon: '/static/icons/location/shop.png', activeIcon: '/static/icons/location/shop-active.png' }
      ],
      activeTab: 0,
      data: [], // 所有数据
      showList: [], // 当前展示的数据
      page: 1,
      pageSize: 10,
      loadingText: '向下拉取更多',
      loading: false,
      finished: false
    };
  },
  computed: {
    filteredData() {
      if (this.activeTab === 0) return this.data;
      return this.data.filter(item => item.category === this.activeTab);
    }
  },
  watch: {
    activeTab() {
      this.page = 1;
      this.finished = false;
      this.showList = [];
      this.loadMore();
    }
  },
  mounted() {
    // 模拟初始数据
    this.data = this.mockData(50); // 假设总共50条
    this.loadMore();
  },
  methods: {
    changeTab(index) {
      this.activeTab = index;
    },
    goToSearchPage() {
      uni.navigateTo({ url: '/pages/search/search' });
    },
    goToExternalLink(link) {
      uni.navigateTo({ url: link });
    },
    loadMore() {
      if (this.loading || this.finished) return;
      this.loading = true;
      this.loadingText = '加载中...';
      setTimeout(() => {
        const start = (this.page - 1) * this.pageSize;
        const end = this.page * this.pageSize;
        const list = this.filteredData.slice(start, end);
        if (list.length) {
          this.showList = this.showList.concat(list);
          this.page++;
          this.loadingText = '向下拉取更多';
        } else {
          this.finished = true;
          this.loadingText = '没有更多了';
        }
        this.loading = false;
      }, 500);
    },
    mockData(total) {
      // 生成模拟数据
      const arr = [];
      const levels = [
        { level: 'excellent', levelText: '优秀', status: 'checked', statusText: '已验收' },
        { level: 'good', levelText: '良好', status: 'checked', statusText: '已验收' },
        { level: 'normal', levelText: '一般', status: 'checked', statusText: '已验收' },
        { level: 'danger', levelText: '危险', status: 'unchecked', statusText: '未验收' }
      ];
      for (let i = 0; i < total; i++) {
        const lv = levels[i % 4];
        arr.push({
          name: '狮子山',
          address: '金山大道009号',
          imgUrl: '/static/img1.jpg',
          area: '400㎡',
          hydrant: '20个',
          drill: '2次',
          people: '4人',
          link: '/pages/detail?id=' + i,
          ...lv,
          category: i % 4 // 模拟分类
        });
      }
      return arr;
    }
  }
};
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  background-color: #F8F8F8;
  height: 100vh;
  overflow: hidden;
}
.content {
  flex: 1;
  overflow: hidden;
  height: 0;
}
scroll-view.content {
  height: calc(100vh - 120px); /* 60+60顶部高度 */
  padding: 10px 0;
}
.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #F8F8F8;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  height: 60px;
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
  height: 40px;
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
  padding: 10px 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 14px;
  color: #707070;
}
.tab-item.active {
  color: #1296db;
}
.tab-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 5px;
}
.content {
  flex: 1;
  overflow: hidden;
  height: 0;
}
scroll-view.content {
  height: calc(100vh - 120px); /* 60+60顶部高度 */
  padding: 10px 0;
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
}
.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 0 10px 0;
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
  margin: 0 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
}
.title-icon {
  width: 16px;
  height: 16px;
  margin-right: 2px;
}
.card-desc {
  color: #888;
  font-size: 13px;
  margin-bottom: 4px;
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
  background: #1296db;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 0;
  font-size: 14px;
  width: 90px;
  align-self: flex-end;
}
.load-more {
  text-align: center;
  color: #b0b0b0;
  font-size: 13px;
  margin: 16px 0 8px 0;
}
</style>