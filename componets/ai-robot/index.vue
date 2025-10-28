<template>
  <view class="ai-robot-container" v-if="showAIRobot" :style="{ left: ball.x + 'px', top: ball.y + 'px' }">
    <!-- AI机器人图片 -->
    <image 
      :src="getRobotImage()" 
      class="robot-image"
      :class="{ 'waving': isWaving }"
      mode="widthFix"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @click="openChatPage"
    />
    <!-- 拖拽尾气效果（右侧显示） -->
    <view class="drag-trail" v-if="showDragTrail">
      <view class="trail-particle" v-for="i in 3" :key="i"></view>
    </view>

  </view>
</template>

<script>
export default {
  name: 'AIRobot',
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space',
      showAIRobot: true,
      isWaving: false,
      isDragging: false,
      showDragTrail: false,
      dragTimer: null,
      resetImageTimer: null,
      // 悬浮球核心参数（优化计算逻辑）
      ball: {
        x: 0,
        y: 0,
        startX: 0,
        startY: 0,
        touchStartX: 0,
        touchStartY: 0,
        dragging: false,
        moved: false,
        vw: 375,       // 屏幕宽度
        vh: 667,       // 屏幕高度
        fullWidth: 60, // 完整显示宽度(px)
      }
    };
  },
  mounted() {
    this.checkPermission();
    this.initRobotPosition();
  },
  onHide() {
    this.clearTimers();
  },
  onUnload() {
    this.clearTimers();
  },
  methods: {
    clearTimers() {
      if (this.dragTimer) clearTimeout(this.dragTimer);
      if (this.resetImageTimer) clearTimeout(this.resetImageTimer);
      this.dragTimer = null;
      this.resetImageTimer = null;
    },

    checkPermission() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        if (userInfo && userInfo.permissionStatus !== undefined) {
          const hasPermission = userInfo.permissionStatus === 1 || userInfo.permissionStatus === 2;
          this.showAIRobot = hasPermission;
        } else {
          this.showAIRobot = false;
        }
      } catch (error) {
        console.error('检查权限失败:', error);
        this.showAIRobot = false;
      }
    },

    // 初始化位置：默认右侧隐藏状态
    initRobotPosition() {
      uni.getSystemInfo({
        success: (sys) => {
          this.ball.vw = sys.windowWidth;
          this.ball.vh = sys.windowHeight;
          const margin = 16;
          
          // 初始位置：右下角完整显示
          this.ball.x = this.ball.vw - this.ball.fullWidth - margin;
          this.ball.y = this.ball.vh - this.ball.fullWidth - margin;
        }
      });
    },

    onTouchStart(e) {
      e.stopPropagation();
      const t = e.touches && e.touches[0] || e.changedTouches[0];
      if (!t) return;
      
      this.clearTimers();
      
      this.ball.dragging = true;
      this.ball.moved = false;
      this.ball.touchStartX = t.clientX || t.pageX;
      this.ball.touchStartY = t.clientY || t.pageY;
      this.ball.startX = this.ball.x;
      this.ball.startY = this.ball.y;
    },

    onTouchMove(e) {
      if (!this.ball.dragging) return;
      e.stopPropagation();
      e.preventDefault();
      
      const t = e.touches && e.touches[0] || e.changedTouches[0];
      if (!t) return;
      
      const dx = (t.clientX || t.pageX) - this.ball.touchStartX;
      const dy = (t.clientY || t.pageY) - this.ball.touchStartY;
      
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        this.ball.moved = true;
        this.isDragging = true;
        
        if (!this.showDragTrail) {
          this.dragTimer = setTimeout(() => {
            this.showDragTrail = true;
          }, 500);
        }
      }
      
      // 计算新位置（限制在屏幕内）
      let nx = this.ball.startX + dx;
      let ny = this.ball.startY + dy;
      const minX = 0;
      const minY = 0;
      const maxX = this.ball.vw - this.ball.fullWidth; // 最右侧完整显示位置
      const maxY = this.ball.vh - this.ball.fullWidth;
      
      nx = Math.max(minX, Math.min(maxX, nx));
      ny = Math.max(minY, Math.min(maxY, ny));
      
      this.ball.x = nx;
      this.ball.y = ny;
    },

    onTouchEnd(e) {
      if (!this.ball.dragging) return;
      e.stopPropagation();
      
      this.showDragTrail = false;
      if (this.dragTimer) clearTimeout(this.dragTimer);
      
      const wasDragging = this.isDragging;
      this.ball.dragging = false;
      this.isDragging = false;
      
      if (!this.ball.moved) {
        // 点击事件
        this.triggerWaveAnimation();
        this.openChatPage();
      } else {
        // 拖拽结束后延迟切换图片状态
        if (wasDragging) {
          this.resetImageTimer = setTimeout(() => {
            this.$forceUpdate();
          }, 500);
        }
      }
    },


    // 动画移动到目标位置
    animateToPosition(targetX, targetY) {
      const startX = this.ball.x;
      const startY = this.ball.y;
      const duration = 300;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
          this.ball.x = targetX;
          this.ball.y = targetY;
          // 动画结束后强制更新状态
          this.$forceUpdate();
          return;
        }
        
        const progress = elapsed / duration;
        const easeOut = 1 - Math.pow(1 - progress, 3); // 缓动效果
        this.ball.x = startX + (targetX - startX) * easeOut;
        this.ball.y = startY + (targetY - startY) * easeOut;
        
        // 使用setTimeout替代requestAnimationFrame
        setTimeout(animate, 16); // 约60fps
      };
      
      animate();
    },

    // 获取机器人图片
    getRobotImage() {
      if (this.isDragging && this.showDragTrail) {
        return this.serverUrl + '/static/icons/ai/fireSystemRun.png';
      } else if (this.isWaving) {
        return this.serverUrl + '/static/icons/ai/fireSystemClick.png';
      } else {
        return this.serverUrl + '/static/icons/ai/fireSystemClick.png';
      }
    },

    // 其他方法保持不变
    triggerWaveAnimation() {
      this.isWaving = true;
      setTimeout(() => {
        this.isWaving = false;
      }, 1000);
    },

    openChatPage() {
      uni.navigateTo({
        url: '/pages/ai-chat/index'
      });
    },
  }
};
</script>

<style scoped>
/* 样式保持不变 */
.ai-robot-container {
  position: fixed;
  z-index: 999;
  width: 60rpx;
  height: 60rpx;
  overflow: visible;
}

.robot-image {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  transition: all 0.3s ease;
  image-rendering: -webkit-optimize-contrast;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.robot-image.waving {
  animation: robotWave 1s ease-in-out;
}

@keyframes robotWave {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(10deg) scale(1.1); }
  50% { transform: rotate(-10deg) scale(1.2); }
  75% { transform: rotate(10deg) scale(1.1); }
}

.drag-trail {
  position: absolute;
  right: -40rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  pointer-events: none;
  z-index: 1;
}

.trail-particle {
  width: 12rpx;
  height: 12rpx;
  background: linear-gradient(45deg, #ff6b6b, #ffa500, #ffeb3b);
  border-radius: 50%;
  animation: trailMove 0.8s ease-out infinite;
  box-shadow: 0 0 12rpx rgba(255, 107, 107, 0.8);
}

.trail-particle:nth-child(1) { animation-delay: 0s; }
.trail-particle:nth-child(2) { animation-delay: 0.15s; }
.trail-particle:nth-child(3) { animation-delay: 0.3s; }

@keyframes trailMove {
  0% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  20% {
    opacity: 0.9;
    transform: translateX(8rpx) scale(0.95);
  }
  50% {
    opacity: 0.6;
    transform: translateX(20rpx) scale(0.7);
  }
  80% {
    opacity: 0.3;
    transform: translateX(35rpx) scale(0.4);
  }
  100% {
    opacity: 0;
    transform: translateX(50rpx) scale(0.1);
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10rpx);
    opacity: 1;
  }
}
</style>