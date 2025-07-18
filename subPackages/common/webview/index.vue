<template>
  <view class="webview-page">
    <!-- Webview 容器 -->
    <view class="webview-container">
      <!-- 微信小程序 webview 组件 -->
      <web-view 
        v-if="isWechatMiniProgram"
        :src="webviewUrl" 
        @message="handleMessage"
        @load="handleLoad"
        @error="handleError"
      />
      
      <!-- 其他平台使用 iframe 或浏览器打开 -->
      <view v-else class="fallback-container">
        <view class="fallback-content">
          <text class="fallback-text">请在微信小程序中打开此页面</text>
          <button class="open-btn" @click="openInBrowser">在浏览器中打开</button>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 错误状态 -->
      <view v-if="error" class="error-container">
        <text class="error-text">{{ errorMessage }}</text>
        <button class="retry-btn" @click="retryLoad">重新加载</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CommonWebview',
  data() {
    return {
      webviewUrl: '',
      pageTitle: '详情页面',
      loading: true,
      error: false,
      errorMessage: '',
      isWechatMiniProgram: false
    }
  },
  
  onLoad(options) {
    // 检测是否在微信小程序环境中
    this.detectEnvironment()
    
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
  
  },
  
  onShow() {
    // 页面显示时的处理
    console.log('Webview page shown')
  },
  
  onHide() {
    // 页面隐藏时的处理
    console.log('Webview page hidden')
  },
  
  onUnload() {
    // 页面卸载时的处理
    console.log('Webview page unloaded')
  },
  
  methods: {
    /**
     * 检测运行环境
     */
    detectEnvironment() {
      // #ifdef MP-WEIXIN
      this.isWechatMiniProgram = true
      // #endif
      
      // #ifndef MP-WEIXIN
      this.isWechatMiniProgram = false
      // #endif
    },
    
    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack({
        delta: 1
      })
    },
    
    /**
     * 刷新webview
     */
    refreshWebview() {
      this.loading = true
      this.error = false
      this.errorMessage = ''
    },
    
    /**
     * 处理webview消息
     */
    handleMessage(event) {
      console.log('Webview message received:', event.detail)
      
      // 可以在这里处理来自webview的消息
      const { data } = event.detail
      
      // 示例：处理特定类型的消息
      if (data && data.type === 'navigation') {
        this.handleNavigation(data)
      }
      
      // 向父页面传递消息
      this.$emit('webview-message', event.detail)
    },
    
    /**
     * 处理导航消息
     */
    handleNavigation(data) {
      if (data.action === 'back') {
        this.goBack()
      } else if (data.action === 'redirect') {
        uni.redirectTo({
          url: data.url
        })
      }
    },
    
    /**
     * 处理webview加载完成
     */
    handleLoad(event) {
      console.log('Webview loaded:', event.detail)
      this.loading = false
      this.error = false
      this.$emit('webview-loaded', event.detail)
    },
    
    /**
     * 处理webview加载错误
     */
    handleError(event) {
      console.error('Webview error:', event.detail)
      this.loading = false
      this.error = true
      this.errorMessage = event.detail.errMsg || '加载失败，请检查网络连接'
      this.$emit('webview-error', event.detail)
    },
    
    /**
     * 重新加载
     */
    retryLoad() {
      this.loading = true
      this.error = false
      this.errorMessage = ''
    },
    
    /**
     * 在浏览器中打开
     */
    openInBrowser() {
      // #ifdef H5
      window.open(this.webviewUrl, '_blank')
      // #endif
      
      // #ifdef APP-PLUS
      plus.runtime.openURL(this.webviewUrl)
      // #endif
      
      // #ifdef MP
      uni.showModal({
        title: '提示',
        content: '请复制链接在浏览器中打开：' + this.webviewUrl,
        showCancel: false
      })
      // #endif
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

.custom-navbar {
  width: 100%;
  height: 88rpx;
  background-color: #ffffff;
  border-bottom: 1rpx solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  position: relative;
  z-index: 1000;
}
.back-btn {
  display: flex;
  align-items: center;
  padding: 10rpx 20rpx;
  border-radius: 6rpx;
  background-color: #f8f8f8;
}

.back-icon {
  font-size: 36rpx;
  color: #333;
  margin-right: 8rpx;
}

.back-text {
  font-size: 28rpx;
  color: #333;
}

.navbar-title {
  flex: 2;
  text-align: center;
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.navbar-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.refresh-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f8f8f8;
}

.refresh-icon {
  font-size: 32rpx;
  color: #333;
}

.webview-container {
  flex: 1;
  position: relative;
  background-color: #ffffff;
}

.fallback-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.fallback-content {
  text-align: center;
  padding: 40rpx;
}

.fallback-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 40rpx;
  display: block;
}

.open-btn {
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}

.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 999;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

.error-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 999;
  padding: 40rpx;
}

.error-text {
  font-size: 28rpx;
  color: #ff3b30;
  text-align: center;
  margin-bottom: 40rpx;
  line-height: 1.5;
}

.retry-btn {
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}
</style> 