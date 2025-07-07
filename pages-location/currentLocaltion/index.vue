<template>
    <view class="container">
      <!-- 搜索栏 -->
      <view class="search-bar">
        <input 
          type="text" 
          placeholder="搜索" 
          class="search-input" 
          @focus="goToSearchPage" 
        />
      </view>
  
      <!-- Tab 分类 -->
      <view class="tabs">
        <view 
          v-for="(tab, index) in tabs" 
          :key="index" 
          :class="['tab-item', activeTab === index ? 'active' : '']" 
          @click="changeTab(index)">
          <image :src="tab.icon" class="tab-icon" />
          <text>{{ tab.name }}</text>
        </view>
      </view>
  
      <!-- 内容展示 -->
      <view class="content">
        <view v-for="(item, index) in filteredData" :key="index" class="card">
          <image :src="item.imgUrl" class="card-img" />
          <view class="card-info">
            <text class="card-title">{{ item.name }}</text>
            <text class="card-desc">{{ item.desc }}</text>
            <button class="card-btn" @click="goToExternalLink(item.link)">一键查看</button>
          </view>
        </view>
      </view>
  
      <!-- 底部导航 -->
      <view class="footer">
        <view 
          v-for="(nav, index) in navs" 
          :key="index" 
          :class="['nav-item', activeNav === index ? 'active' : '']" 
          @click="changeNav(index)">
          <image :src="nav.icon" class="nav-icon" />
          <text>{{ nav.name }}</text>
        </view>
      </view>
    </view>
  </template>
  
  <script>
  export default {
    data() {
      return {
        tabs: [
          { name: '全部', icon: '/static/all.png' },
          { name: '小区', icon: '/static/community.png' },
          { name: '厂房', icon: '/static/factory.png' },
          { name: '商铺', icon: '/static/shop.png' }
        ],
        navs: [
          { name: '位置', icon: '/static/location.png' },
          { name: '聊天', icon: '/static/chat.png' },
          { name: '个人', icon: '/static/profile.png' }
        ],
        activeTab: 0,
        activeNav: 0,
        data: [
          { name: '狮子山', desc: '金山大道3009号', imgUrl: '/static/img1.jpg', link: 'https://example.com' },
          { name: '凤凰山', desc: '金山大道3010号', imgUrl: '/static/img2.jpg', link: 'https://example.com' },
          // ...更多数据
        ]
      };
    },
    computed: {
      filteredData() {
        if (this.activeTab === 0) return this.data;
        // 根据 Tab 分类过滤数据
        return this.data.filter(item => item.category === this.activeTab);
      }
    },
    methods: {
      changeTab(index) {
        this.activeTab = index;
      },
      changeNav(index) {
        this.activeNav = index;
        // 可根据导航跳转到其他页面
      },
      goToSearchPage() {
        uni.navigateTo({ url: '/pages/search/search' });
      },
      goToExternalLink(link) {
        uni.navigateTo({ url: link });
      }
    }
  };
  </script>
  
  <style>
  .container { display: flex; flex-direction: column; }
  .search-bar { padding: 10px; background-color: #f5f5f5; }
  .search-input { width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 5px; }
  .tabs { display: flex; justify-content: space-around; background-color: #fff; padding: 10px; }
  .tab-item { display: flex; flex-direction: column; align-items: center; }
  .tab-item.active { color: #007aff; }
  .tab-icon { width: 24px; height: 24px; }
  .content { padding: 10px; }
  .card { display: flex; margin-bottom: 10px; background-color: #fff; border-radius: 5px; overflow: hidden; }
  .card-img { width: 100px; height: 100px; }
  .card-info { flex: 1; padding: 10px; }
  .card-title { font-size: 16px; font-weight: bold; }
  .card-desc { font-size: 14px; color: #666; }
  .card-btn { margin-top: 10px; padding: 5px 10px; background-color: #007aff; color: #fff; border-radius: 5px; }
  .footer { display: flex; justify-content: space-around; background-color: #fff; padding: 10px; }
  .nav-item { display: flex; flex-direction: column; align-items: center; }
  .nav-item.active { color: #007aff; }
  .nav-icon { width: 24px; height: 24px; }
  </style>