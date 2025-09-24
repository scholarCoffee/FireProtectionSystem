<template>
    <view class="content">
        <view class="page-content">
            
            <!-- 功能按钮（从本地存储动态渲染） -->
            <view class="command-grid">
                <view 
                    v-for="(item, key) in commndList" 
                    :key="key" 
                    class="command-item" 
                    @click="onCommandItemClick(item)"
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
            serverUrl: 'https://www.xiaobei.space',
            commndList: [
                { title: '户主反馈查询', desc: '查询住户信息', icon: 'analysis', url: '' },
                { title: '火灾情况上传', desc: '上报现场火灾情况', icon: 'report', url: '' },
                { title: '火灾情况查询', desc: '查看火灾信息记录', icon: 'device', url: '' },
                { title: '作战任务查询', desc: '查看当前/历史任务', icon: 'analysis', url: '' },
                { title: '作战任务下达', desc: '创建并下发任务', icon: 'report', url: '' }
            ]
        }
    },
    async onLoad() {
        // 检查并加载静态数据
        await this.loadAllStaticData()
    },
    methods: {
        async loadAllStaticData() {
            try {
                // 检查是否已有缓存的静态数据
                const cachedFireUnits = uni.getStorageSync('static_fireUnits')
                const cachedFireCars = uni.getStorageSync('static_fireCars')
                const cachedTaskTypes = uni.getStorageSync('static_taskTypes')
                const cachedTaskStatuses = uni.getStorageSync('static_taskStatuses')
                
                // 如果所有静态数据都已缓存，直接返回
                if (cachedFireUnits && cachedFireUnits.length > 0 &&
                    cachedFireCars && cachedFireCars.length > 0 &&
                    cachedTaskTypes && cachedTaskTypes.length > 0 &&
                    cachedTaskStatuses && cachedTaskStatuses.length > 0) {
                    console.log('静态数据已缓存，跳过请求')
                    return
                }
                
                // 并行加载所有静态数据
                const [fireUnits, fireCars, taskTypes, taskStatuses] = await Promise.all([
                    this.fetchStaticData('fireUnits', 'unitList'),
                    this.fetchStaticData('fireUnits', 'carList'),
                    this.fetchStaticData('fireUnits', 'taskList'),
                    this.fetchStaticData('fireUnits', 'statusList')
                ])
                
                // 存储到本地缓存
                uni.setStorageSync('static_fireUnits', fireUnits)
                uni.setStorageSync('static_fireCars', fireCars)
                uni.setStorageSync('static_taskTypes', taskTypes)
                uni.setStorageSync('static_taskStatuses', taskStatuses)
            
            } catch (e) {
                uni.showToast({ title: '数据加载失败', icon: 'none' })
            } finally {
                uni.hideLoading()
            }
        },
        async fetchStaticData(type, key) {
            try {
                const res = await new Promise((resolve, reject) => {
                    uni.request({
                        url: this.serverUrl + '/static/data',
                        method: 'GET',
                        data: { type, key },
                        success: resolve,
                        fail: reject
                    })
                })
                const list = res?.data?.data || []
                return list.map((it, idx) => ({ label: it.data1, value: String(it.data2), index: idx, config: it.config }))
            } catch (e) {
                return []
            }
        },
        goToWebviewByUrl(url, title) {
            if (!url) {
                uni.showToast({ title: '功能即将接入', icon: 'none' })
                return
            }
            uni.navigateTo({
                url: `/subPackages/common/webview/index?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || '数据指挥')}`
            })
        },
        onCommandItemClick(item) {
            const title = item?.title || ''
            if (title === '火灾情况上传') {
                uni.navigateTo({ url: '/pages/data/fireUpload/index' })
                return
            }
            if (title === '火灾情况查询') {
                uni.navigateTo({ url: '/pages/data/fireQuery/index' })
                return
            }
            if (title === '作战任务下达') {
                uni.navigateTo({ url: '/pages/data/taskAssign/index' })
                return
            }
            if (title === '作战任务查询') {
                uni.navigateTo({ url: '/pages/data/taskQuery/index' })
                return
            }
            if (title === '户主反馈查询') {
                uni.navigateTo({ url: `/pages/personal/userDetail/OwnerInfo?mode=query` })
                return
            }
            this.goToWebviewByUrl(item?.url, item?.title)
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

.command-icon[data-icon="analysis"] {
    background: linear-gradient(135deg, #667eea 0%, #a24b74 100%);
}

.command-icon[data-icon="device"] {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.command-icon[data-icon="report"] {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.command-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>