<template>
    <view class="container">
      <!-- 搜索栏 -->
      <view class="search-bar">
        <input 
          type="text" 
          placeholder="请输入名称查询" 
          class="search-input" 
          v-model="searchQuery" 
          @input="searchData" 
        />
      </view>
  
      <!-- 搜索结果 -->
      <view class="content">
        <view v-for="(item, index) in filteredData" :key="index" class="card">
          <image :src="item.imgUrl" class="card-img" @click="viewDetails(item)" />
          <view class="card-info">
            <text class="card-title">{{ item.name }}</text>
            <text class="card-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>
    </view>
  </template>
  
  <script>
  export default {
    data() {
      return {
        searchQuery: '',
        data: [
          { name: '狮子山', desc: '金山大道3009号', imgUrl: '/static/img1.jpg' },
          { name: '凤凰山', desc: '金山大道3010号', imgUrl: '/static/img2.jpg' },
          // ...更多数据
        ]
      };
    },
    computed: {
      filteredData() {
        if (!this.searchQuery) return this.data;
        return this.data.filter(item => item.name.includes(this.searchQuery));
      }
    },
    methods: {
      searchData() {
        // 搜索逻辑已在 computed 中处理
      },
      viewDetails(item) {
        uni.navigateTo({ url: `/pages/details/details?name=${item.name}` });
      }
    }
  };
  </script>
  
  <style>
  .container { display: flex; flex-direction: column; }
  .search-bar { padding: 10px; background-color: #f5f5f5; }
  .search-input { width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 5px; }
  .content { padding: 10px; }
  .card { display: flex; margin-bottom: 10px; background-color: #fff; border-radius: 5px; overflow: hidden; }
  .card-img { width: 100px; height: 100px; }
  .card-info { flex: 1; padding: 10px; }
  .card-title { font-size: 16px; font-weight: bold; }
  .card-desc { font-size: 14px; color: #666; }
  </style>