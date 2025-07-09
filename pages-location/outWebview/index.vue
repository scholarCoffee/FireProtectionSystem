<template>
    <view class="web-view-page">
      <!-- web-view 组件，加载外部链接 -->
      <web-view :src="url"></web-view>
    </view>
  </template>
  
  <script>
  export default {
    data() {
      return {
        url: ''
      }
    },
    onLoad(options) {
      // 解码并设置外部链接地址
      this.url = decodeURIComponent(options.url);
    }
  }
  </script>
  
  <style scoped>
  .web-view-page {
    width: 100%;
    height: 100%;
  }
  /* 如果需要自定义 web-view 样式，可在这里扩展 */
</style>