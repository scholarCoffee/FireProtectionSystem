<template>
  <view class="detail-container">
    <!-- 顶部标题栏（可选，保持和列表页一致） -->
    <view class="detail-header">
      <image 
        src="/static/icons/common/back.png" 
        class="back-icon" 
        @click="goBack" 
      />
      <text class="detail-title">位置详情</text>
    </view>

    <!-- 时尚卡片布局 -->
    <view class="detail-card">
      <!-- 封面图（模拟，可替换为真实图片逻辑） -->
      <image 
        :src="item.type === 1 ? '/static/icons/location/showCommunity.png' 
          : item.type === 2 ? '/static/icons/location/showFactory.png' 
          : '/static/icons/location/showShop.png'" 
        class="detail-img" 
      />
      <!-- 内容区 -->
      <view class="detail-info">
        <text class="detail-name">{{ item.name }}</text>
        <text class="detail-address">{{ item.address }}</text>
        <text class="detail-type">
          类型：{{ item.type === 1 ? '小区' : item.type === 2 ? '厂房' : '商铺' }}
        </text>
        <!-- 更多字段可继续扩展 -->
        <text class="detail-desc">
          这里可以放更多详情内容，比如介绍、特色、联系方式等...
        </text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      item: {} // 接收列表页传的 item 数据
    };
  },
  onLoad() {
    // 监听列表页传的 item
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('sendItem', (item) => {
      this.item = item;
    });
  },
  methods: {
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
.detail-container {
  background-color: #f5f5f5;
  min-height: 100vh;
}
/* 标题栏 */
.detail-header {
  display: flex;
  align-items: center;
  height: 44px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.detail-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  span {
    padding-right: 20px;
  }
}
.back-icon {
  width: 20px;
  height: 20px;
  left: 10px;
}

/* 时尚卡片 */
.detail-card {
  margin: 16px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  overflow: hidden;
}
.detail-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.detail-info {
  padding: 16px;
}
.detail-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}
.detail-address {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}
.detail-type {
  font-size: 14px;
  color: #999;
  margin-bottom: 12px;
}
.detail-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}
</style>