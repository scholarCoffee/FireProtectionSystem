<template>
  <view class="webview-page">
    <!-- Webview 容器 -->
    <view class="webview-container">
      <!-- 微信小程序 webview 组件 -->
      <web-view :src="webviewUrl" />
    </view>
  </view>
</template>

<script>
export default {
  name: 'CommonWebview',
  data() {
    return {
      webviewUrl: '',
      pageTitle: '720全云景'
    }
  },
  
  onLoad(options) {
    // 获取传入的URL参数
    if (options.url) {
      this.webviewUrl = decodeURIComponent(options.url)
    } else if (options.src) {
      this.webviewUrl = decodeURIComponent(options.src)
    } else {
      // 默认URL，可以根据需要修改
      this.webviewUrl = 'https://example.com'
    }
    
    // 获取页面标题
    if (options.title) {
      this.pageTitle = decodeURIComponent(options.title)
    }
  }
}
</script>

<style lang="scss" scoped>
.webview-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}
</style> 