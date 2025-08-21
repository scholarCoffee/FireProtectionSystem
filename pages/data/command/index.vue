<template>
    <view class="content">
        <view class="page-content">
            <!-- 功能按钮（从本地存储动态渲染） -->
            <view class="command-grid">
                <view 
                    v-for="(item, key) in commandList" 
                    :key="key" 
                    class="command-item" 
                    @click="goToWebviewByUrl(item.url, item.title)"
                >
                    <view class="command-icon">
                        <image :src="serverUrl + '/static/icons/data/' + (item.icon || 'manage') + '.png'" class="icon-img" />
                    </view>
                    <text class="command-title">{{ item.title }}</text>
                    <text class="command-desc">{{ item.desc }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            // 可以添加数据
            serverUrl: 'https://www.xiaobei.space',
            commandStorageKey: 'COMMAND_CONFIG_V1',
            commandConfig: {}
        }
    },
    computed: {
        commandList() {
            // 将对象按插入顺序转为数组
            if (!this.commandConfig) return []
            return Object.values(this.commandConfig)
        }
    },
    onShow() {
        this.loadCommandConfig()
    },
    methods: {
        loadCommandConfig() {
            try {
                const local = uni.getStorageSync(this.commandStorageKey)
                if (local && typeof local === 'object') {
                    this.commandConfig = local
                } else {
                    // 若本地无数据，则回退为空（由管理页负责初始化默认）
                    this.commandConfig = {}
                }
            } catch (e) {
                this.commandConfig = {}
            }
        },
        goToWebviewByUrl(url, title) {
            if (!url) {
                uni.showToast({ title: '未配置访问地址', icon: 'none' })
                return
            }
            uni.navigateTo({
                url: `/subPackages/common/webview/index?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || '数据指挥')}`
            })
        }
    }
}
</script>

<style lang="scss">
.content {
    min-height: 100vh;
    background-color: #f7f8fc;
}

.page-content {
    padding: 40rpx 30rpx;
}

.page-title {
    font-size: 48rpx;
    font-weight: bold;
    color: #333;
    text-align: center;
    margin-bottom: 60rpx;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.command-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30rpx;
    padding: 20rpx 0;
}

.command-item {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20rpx;
    padding: 40rpx 30rpx;
    text-align: center;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    backdrop-filter: blur(10rpx);
    border: 1rpx solid rgba(255, 255, 255, 0.2);
    
    &:active {
        transform: translateY(4rpx);
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
    }
}

.command-icon {
    width: 120rpx;
    height: 120rpx;
    margin: 0 auto 20rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6rpx 20rpx rgba(102, 126, 234, 0.3);
}

.icon-img {
    width: 60rpx;
    height: 60rpx;
    filter: brightness(0) invert(1);
}

.command-title {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 10rpx;
}

.command-desc {
    display: block;
    font-size: 24rpx;
    color: #666;
    line-height: 1.4;
}

/* 为不同按钮设置不同的渐变色 */
.command-item:nth-child(1) .command-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.command-item:nth-child(2) .command-icon {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.command-item:nth-child(3) .command-icon {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.command-item:nth-child(4) .command-icon {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}
</style>