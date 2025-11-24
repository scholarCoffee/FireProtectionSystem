<template>
  <view class="chat-page">
    <!-- 页面头部 -->
    <view class="chat-header">
      <image :src="serverUrl + '/static/icons/ai/fireSystemClick.png'" class="header-avatar" mode="widthFix" />
      <view class="header-info">
        <text class="robot-name">小贝</text>
        <view class="status-row">
          <text class="robot-status">在线</text>
        </view>
      </view>
      <view class="deepseek-logo">
        <image src="https://cdn.deepseek.com/logo.png?x-image-process=image%2Fresize%2Cw_828" class="logo-img" mode="widthFix" />
        <text class="logo-text">已接入DeepSeek</text>
      </view>
    </view>

    <!-- 对话内容区域 -->
    <scroll-view class="chat-messages" scroll-y :scroll-top="scrollTop" scroll-with-animation>
      <view class="message-list">
        <!-- 欢迎消息 -->
        <view class="message-item robot-message" v-if="messages.length === 0">
          <view class="message-avatar">
            <image :src="serverUrl + '/static/icons/ai/fireSystemClick.png'" class="avatar-img" mode="widthFix" />
          </view>
          <view class="message-content">
            <view class="message-bubble">
              <text class="message-text">您好！我是消防AI助手小贝，专注于消防安全知识普及和应急指导。我可以为您解答火灾预防、逃生技巧、消防设备使用等各类消防安全问题。请问有什么可以帮助您的吗？</text>
            </view>
            <text class="message-time">{{ getCurrentTime() }}</text>
          </view>
        </view>

        <!-- 历史消息 -->
        <view 
          v-for="(message, index) in messages" 
          :key="index"
          class="message-item"
          :class="message.type === 'user' ? 'user-message' : 'robot-message'"
        >
          <view class="message-avatar" v-if="message.type === 'robot'">
            <image :src="serverUrl + '/static/icons/ai/fireSystemClick.png'" class="avatar-img" mode="widthFix" />
          </view>
          <view class="message-content">
            <view class="message-bubble">
              <text class="message-text">{{ message.content }}</text>
            </view>
            <text class="message-time">{{ message.time }}</text>
          </view>
          <view class="message-avatar" v-if="message.type === 'user'">
            <image :src="serverUrl + userInfo.avatarUrl" class="avatar-img" mode="widthFix" />
          </view>
        </view>

        <!-- 正在输入提示 -->
        <view class="message-item robot-message" v-if="isTyping">
          <view class="message-avatar">
            <image :src="serverUrl + '/static/icons/ai/fireSystemClick.png'" class="avatar-img" mode="widthFix" />
          </view>
          <view class="message-content">
            <view class="message-bubble typing-bubble">
              <view class="typing-dots">
                <view class="dot"></view>
                <view class="dot"></view>
                <view class="dot"></view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 输入区域 -->
    <view class="chat-input">
      <view class="input-container">
        <input 
          class="message-input" 
          v-model="inputMessage"
          placeholder="请输入您的问题..."
          @confirm="sendMessage"
          :disabled="isTyping"
          adjust-position="true"
          cursor-spacing="20"
        />
        <view class="send-button" :class="{ 'disabled': !inputMessage.trim() || isTyping }" @click="sendMessage">
          <image :src="serverUrl + '/static/icons/common/right.png'" class="send-icon" mode="widthFix" />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'AIChat',
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space',
      messages: [],
      userInfo: {
            nickName: '', 
            avatarUrl: '',
            permissionStatus: 2,
            id: ''
        },
      inputMessage: '',
      isTyping: false,
      scrollTop: 0,
    };
  },
  mounted() {
    this.userInfo = uni.getStorageSync('userInfo');
  },
  methods: {
    async sendMessage() {
      if (!this.inputMessage.trim() || this.isTyping) return;

      const userMessage = {
        type: 'user',
        content: this.inputMessage.trim(),
        time: this.getCurrentTime()
      };

      this.messages.push(userMessage);
      const currentInput = this.inputMessage.trim();
      this.inputMessage = '';
      this.isTyping = true;

      this.scrollToBottom();

      try {
        await this.simulateAIResponse(currentInput);
      } catch (error) {
        console.error('AI回复失败:', error);
        this.addRobotMessage('抱歉，我现在无法回答您的问题，请稍后再试。');
      } finally {
        this.isTyping = false;
        this.scrollToBottom();
      }
    },

    async simulateAIResponse(userInput) {
      // 调用 AI 聊天接口
      const res = await new Promise((resolve, reject) => {
        uni.request({
          url: this.serverUrl + '/ai/chat',
          method: 'POST',
          data: {
            message: userInput,
            userId: this.userInfo?.id || '',
            // 可选：传递对话历史上下文
            history: this.messages.slice(-10).map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
            }))
          },
          header: {
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        });
      });

      // 处理接口响应
      if (res?.data?.code === 200) {
        // 后端返回格式：{ code: 200, data: { message: 'AI回复内容', ... } }
        const reply = res.data.data?.message || res.data.data?.reply || res.data.data?.content || '抱歉，我现在无法回答您的问题。';
        this.addRobotMessage(reply);
      } else {
        // 接口返回错误
        const errorMsg = res?.data?.msg || res?.data?.message || '服务异常，请稍后再试';
        this.addRobotMessage(errorMsg);
      }
    },
    addRobotMessage(content) {
      const robotMessage = {
        type: 'robot',
        content: content,
        time: this.getCurrentTime()
      };
      this.messages.push(robotMessage);
    },

    getCurrentTime() {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    },

    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollTop = 99999;
      });
    }
  }
};
</script>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 30rpx;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  box-shadow: 0 2rpx 8rpx rgba(59, 130, 246, 0.1);
  margin-top: -2rpx;
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  flex: 1;
}

.header-avatar {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  border: 2rpx solid rgba(30, 64, 175, 0.2);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.robot-name {
  font-size: 24rpx;
  font-weight: 700;
  margin-bottom: 4rpx;
  color: #1e40af;
  text-shadow: none;
}

.robot-status {
  font-size: 16rpx;
  background: #10b981;
  color: #ffffff;
  padding: 2rpx 6rpx;
  border-radius: 6rpx;
  font-weight: 500;
  display: inline-block;
  margin-right: 8rpx;
}

.status-row {
  display: flex;
  align-items: center;
}

.deepseek-logo {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  align-items: center;
  padding: 6rpx 10rpx;
  border-radius: 10rpx;
  font-weight: 500;
}

.logo-img {
  width: 140rpx;
  height: 140rpx;
  margin-bottom: 2rpx;
}

.logo-text {
  font-size: 18rpx;
  color: #1e40afc7;
  font-weight: 500;
  text-align: center;
}

.chat-messages {
  flex: 1;
  padding: 24rpx;
  padding-bottom: 40rpx;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  box-sizing: border-box;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.user-message {
  flex-direction: row;
  justify-content: flex-end;
  align-self: flex-end;
  max-width: 80%;
  margin-left: auto;
}

.message-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.message-bubble {
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  max-width: 80%;
  word-wrap: break-word;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.robot-message .message-bubble {
  background: #ffffff;
  border: 1rpx solid rgba(59, 130, 246, 0.1);
  border-bottom-left-radius: 8rpx;
}

.user-message .message-bubble {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border-bottom-right-radius: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.15);
}

.message-text {
  font-size: 28rpx;
  line-height: 1.6;
  color: #374151;
  font-weight: 400;
}

.user-message .message-text {
  color: #1e40af;
}

.message-time {
  font-size: 22rpx;
  color: #6b7280;
  align-self: flex-end;
  margin-top: 8rpx;
  font-weight: 400;
}

.user-message .message-time {
  align-self: flex-end;
  color: rgba(30, 64, 175, 0.7);
}

.typing-dots {
  display: flex;
  gap: 8rpx;
}

.typing-bubble {
  background: #ffffff;
  border: 1rpx solid rgba(59, 130, 246, 0.1);
  border-bottom-left-radius: 8rpx;
}

.dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #3b82f6;
  animation: typing 1.4s infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

.chat-input {
  padding: 24rpx;
  background: #ffffff;
  border-top: 1rpx solid rgba(59, 130, 246, 0.1);
}

.input-container {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 20rpx;
  background: #f8fafc;
  border-radius: 32rpx;
  border: 2rpx solid rgba(59, 130, 246, 0.1);
  transition: all 0.2s ease;
}

.input-container:focus-within {
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 0 4rpx rgba(59, 130, 246, 0.1);
}

.message-input {
  flex: 1;
  font-size: 28rpx;
  border: none;
  background: transparent;
  outline: none;
  color: #374151;
  font-weight: 400;
}

.message-input::placeholder {
  color: #9ca3af;
}

.send-button {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.15);
}

.send-button:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(59, 130, 246, 0.2);
}

.send-button.disabled {
  opacity: 0.5;
  background: #d1d5db;
  box-shadow: none;
}

.send-icon {
  width: 32rpx;
  height: 32rpx;
  filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);
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
