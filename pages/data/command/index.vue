<template>
    <view class="content">
        <view class="page-content">
            
            <!-- 功能按钮（从本地存储动态渲染） -->
            <view class="command-grid">
                <view 
                    v-for="(item, key) in commndList" 
                    :key="key" 
                    class="command-item" 
                    @click="goToWebviewByUrl(item.url, item.title)"
                >
                    <view class="command-icon" :data-icon="item.icon || 'analysis'">
                        <image :src="serverUrl + '/static/icons/data/' + (item.icon || 'analysis') + '.png'" class="icon-img" />
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
            commndList: []
        }
    },
    onShow() {
        this.loadCommandConfig()
    },
    methods: {
        loadCommandConfig() {
            // 若本地无数据，则从接口获取
            this.fetchCommandConfigFromServer()
        },

        // 从服务器获取数据指挥配置
        fetchCommandConfigFromServer() {
            uni.request({
                url: this.serverUrl + '/command/config',
                method: 'GET',
                header: {
                    'Content-Type': 'application/json'
                },
                success: (res) => {
                    if (res.data && res.data.code === 200) {
                        try {
                            // 根据新的数据结构，直接使用 res.data.data
                            this.commndList = res.data.data || []
                        } catch (e) {
                            console.error('保存到本地存储失败:', e)
                        }
                    } else {
                        console.error('获取数据指挥配置失败:', res.data?.msg || '未知错误')
                        this.commndList = []
                    }
                },
                fail: (err) => {
                    uni.showToast({ 
                        title: '获取配置失败', 
                        icon: 'none',
                        duration: 2000
                    })
                }
            })
        },
        goToWebviewByUrl(url, title) {
            if (!url) {
                uni.showToast({ title: '未配置访问地址', icon: 'none' })
                return
            }
            uni.navigateTo({
                url: `/subPackages/common/webview/index?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || '数据指挥')}`
            })
        },

        // 刷新数据指挥配置
        refreshCommandConfig() {
            uni.showLoading({ title: '刷新中...' })
            this.fetchCommandConfigFromServer()
            setTimeout(() => {
                uni.hideLoading()
                uni.showToast({ 
                    title: '已刷新', 
                    icon: 'success', 
                    duration: 1000 
                })
            }, 1000)
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

/* 为不同图标类型设置不同的渐变色 */
.command-icon[data-icon="analysis"] {
    background: linear-gradient(135deg, #667eea 0%, #a24b74 100%);
}

.command-icon[data-icon="device"] {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.command-icon[data-icon="report"] {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

/* 默认渐变色 */
.command-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>