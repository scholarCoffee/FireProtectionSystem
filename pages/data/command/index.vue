<template>
    <view class="content">
        <view class="page-content">
            <!-- 四个功能按钮 -->
            <view class="command-grid">
                <view class="command-item" @click="goToWebview('data-analysis', '数据分析')">
                    <view class="command-icon">
                        <image src="/static/icons/data/analysis.png" class="icon-img" />
                    </view>
                    <text class="command-title">数据分析</text>
                    <text class="command-desc">实时数据监控与分析</text>
                </view>
                
                <view class="command-item" @click="goToWebview('alarm-management', '报警管理')">
                    <view class="command-icon">
                        <image src="/static/icons/data/alarm.png" class="icon-img" />
                    </view>
                    <text class="command-title">报警管理</text>
                    <text class="command-desc">报警信息处理与统计</text>
                </view>
                
                <view class="command-item" @click="goToWebview('device-monitor', '设备监控')">
                    <view class="command-icon">
                        <image src="/static/icons/data/device.png" class="icon-img" />
                    </view>
                    <text class="command-title">设备监控</text>
                    <text class="command-desc">设备状态实时监控</text>
                </view>
                
                <view class="command-item" @click="goToWebview('report-system', '报表系统')">
                    <view class="command-icon">
                        <image src="/static/icons/data/report.png" class="icon-img" />
                    </view>
                    <text class="command-title">报表系统</text>
                    <text class="command-desc">数据报表生成与导出</text>
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
        }
    },
    methods: {
        goToWebview(type, title) {
            // 根据类型构建不同的URL
            let url = '';
            switch(type) {
                case 'data-analysis':
                    url = 'https://example.com/data-analysis';
                    break;
                case 'alarm-management':
                    url = 'https://example.com/alarm-management';
                    break;
                case 'device-monitor':
                    url = 'https://example.com/device-monitor';
                    break;
                case 'report-system':
                    url = 'https://example.com/report-system';
                    break;
                default:
                    url = 'https://example.com';
            }
            
            // 跳转到webview页面
            uni.navigateTo({
                url: `/subPackages/common/webview/index?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
            });
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